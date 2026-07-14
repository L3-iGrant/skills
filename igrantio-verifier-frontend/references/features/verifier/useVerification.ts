import { useCallback, useState } from "react";
import { useOwsClient, useSSE } from "../../lib/ows";
import type {
  OwsWebhookEvent,
  PresentationSSEData,
  SendVerificationRequest,
  VerificationHistoryItem,
} from "../../lib/ows";

export interface VerificationConfig {
  /** Backend proxy base for this tenant, e.g. https://host/ows/acme */
  proxyBaseUrl: string;
  /** Backend webhook base, e.g. https://host/webhook */
  webhookBaseUrl: string;
}

export type VerificationStatus = "idle" | "waiting" | "verified" | "rejected" | "error";

export interface VerificationResult {
  /** The accept/reject decision. */
  verified: boolean;
  /** Disclosed claims from the first presented credential (or null). */
  claims: Record<string, unknown> | null;
  /** All disclosed credentials, if more than one. */
  presentations: Record<string, unknown>[];
}

/**
 * Verifier flow (OpenID4VP + DCQL): send a presentation request, expose the QR
 * (or same-device DC API request), and resolve the disclosed claims + `verified`
 * decision over SSE.
 */
export function useVerification({ proxyBaseUrl, webhookBaseUrl }: VerificationConfig) {
  const client = useOwsClient(proxyBaseUrl);
  const { open, close } = useSSE();

  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [presentationExchangeId, setPresentationExchangeId] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvent = useCallback(
    (event: OwsWebhookEvent) => {
      const presentation = (event.data as PresentationSSEData).presentation;
      // Wait until the wallet has actually responded.
      if (!presentation?.vpTokenResponse?.length) return;

      const presentations = presentation.presentation ?? [];
      setResult({
        verified: !!presentation.verified,
        claims: presentations[0] ?? null,
        presentations,
      });
      setStatus(presentation.verified ? "verified" : "rejected");
      close();
    },
    [close],
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
        if (!verificationHistory?.presentationExchangeId || !verificationHistory.vpTokenQrCode) {
          throw new Error("Verification response missing presentationExchangeId/vpTokenQrCode");
        }
        setPresentationExchangeId(verificationHistory.presentationExchangeId);
        setQrUri(verificationHistory.vpTokenQrCode);
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
