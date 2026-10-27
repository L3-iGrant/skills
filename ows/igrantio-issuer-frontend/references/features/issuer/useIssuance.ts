import { useCallback, useRef, useState } from "react";
import { useOwsClient, useSSE } from "../../lib/ows";
import type {
  CredentialHistoryItem,
  IssuanceSSEData,
  IssueCredentialResponse,
  IssueInTimeRequest,
  OwsWebhookEvent,
  StartDeferredRequest,
  UpdateCredentialHistoryPayload,
} from "../../lib/ows";

export interface IssuanceConfig {
  /** Backend proxy base for this tenant, e.g. https://host/ows/acme */
  proxyBaseUrl: string;
  /** Backend webhook base, e.g. https://host/webhook */
  webhookBaseUrl: string;
}

export type IssuanceStatus = "idle" | "offer_ready" | "scanned" | "issued" | "error";

export interface IssuanceState {
  status: IssuanceStatus;
  /** credentialOffer URI → render as QR or open in wallet. */
  offerUri: string | null;
  credentialExchangeId: string | null;
  error: string | null;
}

/** The wallet has the offer: the first of these events moves the flow to "scanned". */
const SCANNED = new Set(["offer_received", "token_issued"]);
/** The wallet has the credential (acked) or has confirmed it (accepted). */
const ISSUED = new Set(["credential_acked", "credential_accepted"]);

/**
 * The record of an issue response. A definition with more than one credential
 * configuration answers one record per configuration; this flow follows the first.
 */
function firstRecord(response: IssueCredentialResponse): CredentialHistoryItem | undefined {
  const history = response.credentialHistory;
  return Array.isArray(history) ? history[0] : history;
}

/**
 * Issuer flow (OpenID4VCI): request issuance, expose the offer QR, and resolve
 * the outcome via SSE. Supports in-time issuance (claims known now) and deferred
 * issuance (claims supplied once the wallet picks up the offer).
 */
export function useIssuance({ proxyBaseUrl, webhookBaseUrl }: IssuanceConfig) {
  const client = useOwsClient(proxyBaseUrl);
  const { open, close } = useSSE();

  const [state, setState] = useState<IssuanceState>({
    status: "idle",
    offerUri: null,
    credentialExchangeId: null,
    error: null,
  });
  const deferredClaimsRef = useRef<UpdateCredentialHistoryPayload | null>(null);
  /** Deferred flows only: set when the PUT of completeDeferred starts, so it runs once. */
  const deferredSentRef = useRef(false);

  const fail = useCallback((message: string) => {
    setState((s) => ({ ...s, status: "error", error: message }));
  }, []);

  const handleEvent = useCallback(
    (event: OwsWebhookEvent) => {
      const credential = (event.data as IssuanceSSEData).credential;
      if (!credential) return;

      if (credential.status === "issuance_denied") {
        fail(credential.issuanceDeniedReason || "The issuer refused the issuance");
        close();
        return;
      }

      if (SCANNED.has(credential.status)) {
        setState((s) => (s.status === "offer_ready" ? { ...s, status: "scanned" } : s));
        // Deferred: the wallet has the offer - supply the claims now, once.
        // The backend keeps only the latest event, so either status can come first.
        if (deferredClaimsRef.current && !deferredSentRef.current && credential.CredentialExchangeId) {
          deferredSentRef.current = true;
          client.issuance
            .completeDeferred(credential.CredentialExchangeId, deferredClaimsRef.current)
            .catch((e) => fail(e instanceof Error ? e.message : String(e)));
        }
        return;
      }

      if (ISSUED.has(credential.status)) {
        setState((s) => ({ ...s, status: "issued" }));
        close();
      }
    },
    [client, close, fail],
  );

  const start = useCallback(
    (exchangeId: string, offerUri: string) => {
      setState({ status: "offer_ready", offerUri, credentialExchangeId: exchangeId, error: null });
      open(exchangeId, webhookBaseUrl, handleEvent);
    },
    [open, webhookBaseUrl, handleEvent],
  );

  /** Claims are known now; the wallet receives the finished credential. */
  const issueInTime = useCallback(
    async (payload: IssueInTimeRequest) => {
      deferredClaimsRef.current = null;
      deferredSentRef.current = false;
      try {
        const credentialHistory = firstRecord(await client.issuance.issueInTime(payload));
        if (!credentialHistory?.CredentialExchangeId || !credentialHistory.credentialOffer) {
          throw new Error("Issuance response missing CredentialExchangeId/credentialOffer");
        }
        start(credentialHistory.CredentialExchangeId, credentialHistory.credentialOffer);
      } catch (e) {
        fail(e instanceof Error ? e.message : String(e));
      }
    },
    [client, start, fail],
  );

  /** Create the offer now; `claims` are pushed once the wallet picks it up. */
  const issueDeferred = useCallback(
    async (request: StartDeferredRequest, claims: UpdateCredentialHistoryPayload) => {
      deferredClaimsRef.current = claims;
      deferredSentRef.current = false;
      try {
        const credentialHistory = firstRecord(await client.issuance.startDeferred(request));
        if (!credentialHistory?.CredentialExchangeId || !credentialHistory.credentialOffer) {
          throw new Error("Issuance response missing CredentialExchangeId/credentialOffer");
        }
        // OWS requires the offer's credential id back in the completing PUT (else 400 "Id field is missing in credential").
        const credentialId = credentialHistory.credential?.id as string | undefined;
        if (credentialId) {
          deferredClaimsRef.current = {
            ...claims,
            credential: { ...claims.credential, id: credentialId },
          };
        }
        start(credentialHistory.CredentialExchangeId, credentialHistory.credentialOffer);
      } catch (e) {
        fail(e instanceof Error ? e.message : String(e));
      }
    },
    [client, start, fail],
  );

  const reset = useCallback(() => {
    close();
    deferredClaimsRef.current = null;
    deferredSentRef.current = false;
    setState({ status: "idle", offerUri: null, credentialExchangeId: null, error: null });
  }, [close]);

  return { ...state, issueInTime, issueDeferred, reset };
}
