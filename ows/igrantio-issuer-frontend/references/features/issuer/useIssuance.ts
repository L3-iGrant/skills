import { useCallback, useRef, useState } from "react";
import { useOwsClient, useSSE } from "../../lib/ows";
import type {
  IssuanceSSEData,
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

  const fail = useCallback((message: string) => {
    setState((s) => ({ ...s, status: "error", error: message }));
  }, []);

  const handleEvent = useCallback(
    (event: OwsWebhookEvent) => {
      const credential = (event.data as IssuanceSSEData).credential;
      if (!credential) return;

      // Deferred: the wallet has the offer - supply the claims now.
      if (
        credential.status === "offer_received" &&
        deferredClaimsRef.current &&
        credential.CredentialExchangeId
      ) {
        setState((s) => ({ ...s, status: "scanned" }));
        client.issuance
          .completeDeferred(credential.CredentialExchangeId, deferredClaimsRef.current)
          .catch((e) => fail(e instanceof Error ? e.message : String(e)));
        return;
      }

      if (credential.status === "credential_accepted" || credential.status === "token_issued") {
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
      try {
        const { credentialHistory } = await client.issuance.issueInTime(payload);
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
      try {
        const { credentialHistory } = await client.issuance.startDeferred(request);
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

  const reset = useCallback(() => {
    close();
    deferredClaimsRef.current = null;
    setState({ status: "idle", offerUri: null, credentialExchangeId: null, error: null });
  }, [close]);

  return { ...state, issueInTime, issueDeferred, reset };
}
