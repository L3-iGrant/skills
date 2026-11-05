import { useCallback, useRef, useState } from "react";
import { useOwsClient, useSSE } from "../../lib/ows";
import type {
  CreateIssuanceRequest,
  IssuanceClaims,
  IssuanceEventData,
  IssuanceStatus,
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
  /** `offer.uri` of the create answer: render as QR or open in wallet. */
  offerUri: string | null;
  /** The transaction code that the issuer made (pre-authorised offers); show it to the holder. */
  transactionCode: string | null;
  issuanceId: string | null;
  error: string | null;
}

/** The wallet has the offer: the first of these statuses moves the flow to "scanned". */
const SCANNED = new Set<IssuanceStatus>(["offer_retrieved", "token_issued", "credential_deferred", "claims_supplied"]);
/** The wallet has the credential (issued) or has confirmed it (accepted). */
const ISSUED = new Set<IssuanceStatus>(["credential_issued", "credential_accepted"]);
/** Deferred only: the wallet has the offer, so the claims can go now. */
const SUPPLY_CLAIMS = new Set<IssuanceStatus>(["offer_retrieved", "token_issued", "credential_deferred"]);

const EMPTY: IssuanceState = {
  status: "idle",
  offerUri: null,
  transactionCode: null,
  issuanceId: null,
  error: null,
};

/**
 * Issuer flow (OpenID4VCI): make an issuance, expose the offer QR, and resolve
 * the outcome from the issuer events over SSE. Supports in-time issuance
 * (claims known now) and deferred issuance (claims supplied once the wallet
 * picks up the offer).
 */
export function useIssuance({ proxyBaseUrl, webhookBaseUrl }: IssuanceConfig) {
  const client = useOwsClient(proxyBaseUrl);
  const { open, close } = useSSE();

  const [state, setState] = useState<IssuanceState>(EMPTY);
  const deferredClaimsRef = useRef<IssuanceClaims | null>(null);
  /** Deferred flows only: set when the PUT of the claims starts, so it runs once. */
  const deferredSentRef = useRef(false);

  const fail = useCallback((message: string) => {
    setState((s) => ({ ...s, status: "error", error: message }));
  }, []);

  const handleEvent = useCallback(
    (event: OwsWebhookEvent) => {
      const data = event.data as IssuanceEventData;
      const issuance = data.issuance;
      if (!issuance) return;

      if (issuance.status === "denied" || issuance.status === "expired") {
        const reason = data.reason?.description;
        fail(reason || (issuance.status === "expired" ? "The offer expired" : "The issuer refused the issuance"));
        close();
        return;
      }

      if (ISSUED.has(issuance.status)) {
        setState((s) => ({ ...s, status: "issued" }));
        close();
        return;
      }

      if (SCANNED.has(issuance.status)) {
        setState((s) => (s.status === "offer_ready" ? { ...s, status: "scanned" } : s));
        // Deferred: the wallet has the offer - give the claims now, once.
        // The backend keeps only the latest event, so any of these statuses can come first.
        const claims = deferredClaimsRef.current;
        if (claims && SUPPLY_CLAIMS.has(issuance.status) && !deferredSentRef.current) {
          deferredSentRef.current = true;
          client.issuance
            .supplyClaims(issuance.id, { claims })
            .catch((e) => fail(e instanceof Error ? e.message : String(e)));
        }
      }
    },
    [client, close, fail],
  );

  const createAndOpen = useCallback(
    async (payload: CreateIssuanceRequest) => {
      try {
        const created = await client.issuance.create(payload);
        if (!created?.id || !created.offer?.uri) {
          throw new Error("Issuance answer missing id/offer.uri");
        }
        setState({
          status: "offer_ready",
          offerUri: created.offer.uri,
          transactionCode: created.offer.transactionCode,
          issuanceId: created.id,
          error: null,
        });
        open(created.id, webhookBaseUrl, handleEvent);
      } catch (e) {
        fail(e instanceof Error ? e.message : String(e));
      }
    },
    [client, open, webhookBaseUrl, handleEvent, fail],
  );

  /** Claims are known now; the wallet receives the finished credential. */
  const issueInTime = useCallback(
    async (payload: Omit<CreateIssuanceRequest, "mode">) => {
      deferredClaimsRef.current = null;
      deferredSentRef.current = false;
      await createAndOpen({ ...payload, mode: "in_time" });
    },
    [createAndOpen],
  );

  /** Make the offer now; `claims` are given once the wallet picks it up. */
  const issueDeferred = useCallback(
    async (payload: Omit<CreateIssuanceRequest, "mode" | "claims">, claims: IssuanceClaims) => {
      deferredClaimsRef.current = claims;
      deferredSentRef.current = false;
      await createAndOpen({ ...payload, mode: "deferred" });
    },
    [createAndOpen],
  );

  const reset = useCallback(() => {
    close();
    deferredClaimsRef.current = null;
    deferredSentRef.current = false;
    setState(EMPTY);
  }, [close]);

  return { ...state, issueInTime, issueDeferred, reset };
}
