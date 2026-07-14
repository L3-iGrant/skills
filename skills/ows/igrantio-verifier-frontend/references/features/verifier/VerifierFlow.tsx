import { QrCode, openInWallet } from "../../lib/ows";
import { useVerification, type VerificationConfig } from "./useVerification";

/**
 * Minimal end-to-end verifier demo: send a DCQL presentation request, show the
 * QR, and display the disclosed claims + verified decision from SSE.
 */
export interface VerifierFlowProps extends VerificationConfig {
  presentationDefinitionId: string;
}

export function VerifierFlow({ presentationDefinitionId, ...config }: VerifierFlowProps) {
  const { status, qrUri, result, error, requestPresentation, reset } = useVerification(config);

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={() =>
          requestPresentation({ requestByReference: true, presentationDefinitionId })
        }
      >
        Request credential
      </button>
    );
  }

  if (status === "error") {
    return (
      <div role="alert">
        <p>Verification failed: {error}</p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </div>
    );
  }

  if (status === "verified" || status === "rejected") {
    return (
      <div>
        <p>{status === "verified" ? "✅ Verified" : "❌ Rejected"}</p>
        {result?.claims && (
          <pre>{JSON.stringify(result.claims, null, 2)}</pre>
        )}
        <button type="button" onClick={reset}>
          Start over
        </button>
      </div>
    );
  }

  // waiting
  return (
    <div>
      <p>Scan to present your credential</p>
      {qrUri && <QrCode value={qrUri} />}
      {qrUri && (
        <button type="button" onClick={() => openInWallet(qrUri)}>
          Open in wallet (same device)
        </button>
      )}
    </div>
  );
}
