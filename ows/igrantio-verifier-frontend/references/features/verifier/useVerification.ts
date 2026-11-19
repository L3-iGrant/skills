import { useCallback, useState } from "react";
import { useOwsClient, useSSE } from "../../lib/ows";
import type {
  OwsWebhookEvent,
  SendVerificationRequest,
  VerificationEventData,
  VerificationHistoryItem,
} from "../../lib/ows";

export interface VerificationConfig {
  /** Backend proxy base for this tenant, e.g. https://host/ows/acme */
  proxyBaseUrl: string;
  /** Backend webhook base, e.g. https://host/webhook */
  webhookBaseUrl: string;
}

export type VerificationFlowStatus = "idle" | "waiting" | "scanned" | "verified" | "rejected" | "error";

export interface VerificationResult {
  /** The accept/reject decision (`isVerified` of the verification). */
  verified: boolean;
  /** Disclosed claims from the first presented credential (or null). */
  claims: Record<string, unknown> | null;
  /** All disclosed credentials, if more than one. */
  presentations: Record<string, unknown>[];
}

/** The verifier events that the flow uses. */
const REQUEST_RETRIEVED = "ows.verifier.verification.request_retrieved";
const PRESENTATION_RECEIVED = "ows.verifier.verification.presentation_received";
const DECLINED = "ows.verifier.verification.declined";

/**
 * Verifier flow (OpenID4VP + DCQL): send a presentation request, expose the QR
 * (`requestUrl`) or the same-device DC API request, wait for the verifier event
 * over SSE, then read the verification for the disclosed claims (`presentation`)
 * and the `isVerified` decision. The event body holds no presented claims.
 */
export function useVerification({ proxyBaseUrl, webhookBaseUrl }: VerificationConfig) {
  const client = useOwsClient(proxyBaseUrl);
  const { open, close } = useSSE();

  const [status, setStatus] = useState<VerificationFlowStatus>("idle");
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [presentationExchangeId, setPresentationExchangeId] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvent = useCallback(
    (event: OwsWebhookEvent) => {
      const verification = (event.data as VerificationEventData).verification;
      if (!verification) return;

      if (event.type === REQUEST_RETRIEVED) {
        // The wallet fetched the request: show the scanned state.
        setStatus((s) => (s === "waiting" ? "scanned" : s));
        return;
      }
      if (event.type === DECLINED) {
        setResult({ verified: false, claims: null, presentations: [] });
        setStatus("rejected");
        close();
        return;
      }
      // Wait until the wallet has actually responded.
      if (event.type !== PRESENTATION_RECEIVED) return;
      close();

      // The event has the decision only; the verification has the disclosed claims.
      client.verification
        .readHistory(verification.id)
        .then(({ verificationHistory }) => {
          const presentations = verificationHistory.presentation ?? [];
          const verified = verificationHistory.isVerified === true;
          setResult({ verified, claims: presentations[0] ?? null, presentations });
          setStatus(verified ? "verified" : "rejected");
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : String(e));
          setStatus("error");
        });
    },
    [client, close],
  );

  /**
   * Send a verification request. Returns the full verificationHistory so callers
   * can also drive the same-device Digital Credentials API (`dcApiRequest`).
   */
  const requestPresentation = useCallback(
    async (payload: SendVerificationRequest): Promise<VerificationHistoryItem | null> => {
      setError(null);
      setResult(null);
      try {
        const { verificationHistory } = await client.verification.sendRequest(payload);
        // A Digital Credentials API request has a dcApiRequest and an empty requestUrl.
        if (
          !verificationHistory?.presentationExchangeId ||
          (!verificationHistory.requestUrl && !verificationHistory.dcApiRequest)
        ) {
          throw new Error("The send answer has no presentationExchangeId, or no requestUrl and no dcApiRequest");
        }
        setPresentationExchangeId(verificationHistory.presentationExchangeId);
        setQrUri(verificationHistory.requestUrl || null);
        setStatus("waiting");
        open(verificationHistory.presentationExchangeId, webhookBaseUrl, handleEvent);
        return verificationHistory;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
        return null;
      }
    },
    [client, open, webhookBaseUrl, handleEvent],
  );

  const reset = useCallback(() => {
    close();
    setStatus("idle");
    setQrUri(null);
    setPresentationExchangeId(null);
    setResult(null);
    setError(null);
  }, [close]);

  return { status, qrUri, presentationExchangeId, result, error, requestPresentation, reset };
}
