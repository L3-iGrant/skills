import { useCallback, useRef, useState } from "react";
import { useOwsClient, useSSE } from "../../lib/ows";
import type {
  IssuanceClaims,
  IssuanceHistoryCreatedItem,
  IssuanceHistoryEventData,
  IssuanceHistoryStatus,
  IssueCredentialEntry,
  IssueCredentialRequest,
  OwsWebhookEvent,
} from "../../lib/ows";

export interface IssuanceConfig {
  /** Backend proxy base for this tenant, e.g. https://host/ows/acme */
  proxyBaseUrl: string;
  /** Backend webhook base, e.g. https://host/webhook */
  webhookBaseUrl: string;
}

export type IssuanceFlowStatus = "idle" | "offer_ready" | "scanned" | "issued" | "error";

export interface IssuanceState {
  status: IssuanceFlowStatus;
  /** `offer.uri` of the issue answer: render as QR or open in wallet. */
  offerUri: string | null;
  /** The transaction code that the issuer made (pre-authorised offers); show it to the holder. */
  transactionCode: string | null;
  /** The id of the credential offer. */
  offerId: string | null;
  /** One issuance history for each credential configuration, with its latest status. */
  issuanceHistory: IssuanceHistoryCreatedItem[];
  error: string | null;
}

/** The wallet has the offer: the flow moves to "scanned". */
const SCANNED = new Set<IssuanceHistoryStatus>([
  "offer_retrieved",
  "token_issued",
  "credential_deferred",
  "claims_supplied",
]);
/** The wallet has the credential (issued) or has confirmed it (accepted). */
const ISSUED = new Set<IssuanceHistoryStatus>(["credential_issued", "credential_accepted"]);
/** Deferred only: the wallet has the offer, so the claims can go now. */
const SUPPLY_CLAIMS = new Set<IssuanceHistoryStatus>(["offer_retrieved", "token_issued", "credential_deferred"]);

const EMPTY: IssuanceState = {
  status: "idle",
  offerUri: null,
  transactionCode: null,
  offerId: null,
  issuanceHistory: [],
  error: null,
};

/** The flow status from the statuses of all issuance histories of the offer. */
function flowStatusOf(statuses: Iterable<IssuanceHistoryStatus>): IssuanceFlowStatus {
  const all = [...statuses];
  if (all.length > 0 && all.every((s) => ISSUED.has(s))) return "issued";
  if (all.some((s) => SCANNED.has(s) || ISSUED.has(s))) return "scanned";
  return "offer_ready";
}

/**
 * The deferred claims of each issuance history: the entry with the same
 * credentialConfigurationId, or the only entry for the only issuance history.
 */
function claimsByExchangeId(
  items: IssuanceHistoryCreatedItem[],
  entries: IssueCredentialEntry[],
): Map<string, IssuanceClaims> {
  const result = new Map<string, IssuanceClaims>();
  for (const item of items) {
    const entry =
      entries.find((e) => e.credentialConfigurationId === item.credentialConfigurationId) ??
      (items.length === 1 && entries.length === 1 ? entries[0] : undefined);
    if (entry?.claims) result.set(item.credentialExchangeId, entry.claims);
  }
  return result;
}

/**
 * Issuer flow (OpenID4VCI): issue a credential, expose the offer QR, and
 * resolve the outcome from the issuer events over SSE.
 *
 * One issue call makes one credential offer and one issuance history for each
 * credential configuration of the definition. The hook follows all of them on
 * one SSE stream, keyed by their credential exchange ids. The flow is "issued"
 * when every issuance history is issued, and "error" when one is denied or
 * expires. Supports in-time issuance (claims known now) and deferred issuance
 * (claims supplied once the wallet picks up the offer).
 */
export function useIssuance({ proxyBaseUrl, webhookBaseUrl }: IssuanceConfig) {
  const client = useOwsClient(proxyBaseUrl);
  const { open, close } = useSSE();

  const [state, setState] = useState<IssuanceState>(EMPTY);
  /** Credential exchange id -> latest status, for the issuance histories of the current offer. */
  const statusesRef = useRef(new Map<string, IssuanceHistoryStatus>());
  /** Deferred flows only: the claims to give, by credential exchange id. Removed when the PUT starts. */
  const pendingClaimsRef = useRef(new Map<string, IssuanceClaims>());

  const fail = useCallback((message: string) => {
    setState((s) => ({ ...s, status: "error", error: message }));
  }, []);

  const handleEvent = useCallback(
    (event: OwsWebhookEvent) => {
      const summary = (event.data as IssuanceHistoryEventData).issuanceHistory;
      if (!summary) return;
      const id = summary.credentialExchangeId;
      const statuses = statusesRef.current;
      // An event of another offer (for example after a refresh).
      if (!statuses.has(id)) return;
      statuses.set(id, summary.status);

      if (summary.status === "denied" || summary.status === "expired") {
        const reason = (event.data as IssuanceHistoryEventData).reason?.description;
        fail(reason || (summary.status === "expired" ? "The offer expired" : "The issuer refused the issuance"));
        close();
        return;
      }

      // Deferred: the wallet has the offer - give the claims of this issuance history now, once.
      // The backend keeps only the latest event, so any of these statuses can come first.
      const claims = pendingClaimsRef.current.get(id);
      if (claims && SUPPLY_CLAIMS.has(summary.status)) {
        pendingClaimsRef.current.delete(id);
        client.issuanceHistory
          .supplyClaims(id, { claims })
          .catch((e) => fail(e instanceof Error ? e.message : String(e)));
      }

      const next = flowStatusOf(statuses.values());
      setState((s) =>
        s.status === "error"
          ? s
          : {
              ...s,
              status: next,
              issuanceHistory: s.issuanceHistory.map((h) =>
                h.credentialExchangeId === id ? { ...h, status: summary.status } : h,
              ),
            },
      );
      if (next === "issued") close();
    },
    [client, close, fail],
  );

  const issueAndOpen = useCallback(
    async (payload: IssueCredentialRequest, deferredCredentials: IssueCredentialEntry[]) => {
      try {
        const created = await client.issuanceHistory.issue(payload);
        const items = created?.issuanceHistory ?? [];
        if (!created?.offer?.uri || items.length === 0) {
          throw new Error("The issue answer has no offer.uri or no issuance history");
        }
        statusesRef.current = new Map(items.map((i) => [i.credentialExchangeId, i.status]));
        pendingClaimsRef.current = claimsByExchangeId(items, deferredCredentials);
        setState({
          status: "offer_ready",
          offerUri: created.offer.uri,
          transactionCode: created.offer.transactionCode,
          offerId: created.offer.offerId,
          issuanceHistory: items,
          error: null,
        });
        // One stream for all the issuance histories of the offer.
        open(
          items.map((i) => i.credentialExchangeId),
          webhookBaseUrl,
          handleEvent,
        );
      } catch (e) {
        fail(e instanceof Error ? e.message : String(e));
      }
    },
    [client, open, webhookBaseUrl, handleEvent, fail],
  );

  /** The claims are known now: `credentials` holds the claims of each configuration. */
  const issueInTime = useCallback(
    async (payload: Omit<IssueCredentialRequest, "mode">) => {
      await issueAndOpen({ ...payload, mode: "in_time" }, []);
    },
    [issueAndOpen],
  );

  /**
   * Make the offer now; the claims of each configuration (`credentials`) are
   * given once the wallet picks up the offer. Use the credentialConfigurationId
   * values of the definition in `credentials`.
   */
  const issueDeferred = useCallback(
    async (payload: Omit<IssueCredentialRequest, "mode" | "credentials">, credentials: IssueCredentialEntry[]) => {
      await issueAndOpen({ ...payload, mode: "deferred" }, credentials);
    },
    [issueAndOpen],
  );

  const reset = useCallback(() => {
    close();
    statusesRef.current = new Map();
    pendingClaimsRef.current = new Map();
    setState(EMPTY);
  }, [close]);

  return { ...state, issueInTime, issueDeferred, reset };
}
