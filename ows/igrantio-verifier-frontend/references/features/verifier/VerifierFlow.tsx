import { WalletQrPanel } from "./walletQr/WalletQrPanel";
import { useVerification, type VerificationConfig } from "./useVerification";

/**
 * Minimal end-to-end verifier demo: send a DCQL presentation request, show
 * the QR in the iGrant.io wallet QR panel (vendored from `igrantio-qr-code`),
 * and display the disclosed claims + verified decision from SSE.
 *
 * Import `./walletQr/walletQr.css` once in your app (or paste its rules into
 * your global stylesheet) so the panel renders at the demonstrator look.
 */
export interface VerifierFlowProps extends VerificationConfig {
  presentationDefinitionId: string;
  /** The logo on the white disc in the centre of the QR code. */
  logoSrc?: string;
}

export function VerifierFlow({ presentationDefinitionId, logoSrc = "/igrant-logo.png", ...config }: VerifierFlowProps) {
  const { status, qrUri, result, error, requestPresentation, reset } = useVerification(config);

  const request = () => requestPresentation({ requestByReference: true, presentationDefinitionId });

  // Refresh mints a NEW exchange: the hook closes the old SSE session and
  // opens one on the new exchange id. An expired request is never re-rendered.
  const refresh = () => {
    reset();
    request();
  };

  if (status === "idle") {
    return (
      <button type="button" onClick={request}>
        Request credential
      </button>
    );
  }

  if (status === "verified" || status === "rejected") {
    return (
      <div>
        <p>{status === "verified" ? "Verified" : "Rejected"}</p>
        {result?.claims && <pre>{JSON.stringify(result.claims, null, 2)}</pre>}
        <button type="button" onClick={reset}>
          Start over
        </button>
      </div>
    );
  }

  // waiting | error
  return (
    <div>
      {status === "waiting" && <p>Scan to present your credential</p>}
      <WalletQrPanel
        uri={qrUri ?? undefined}
        logoSrc={logoSrc}
        errorMessage={status === "error" ? `Verification failed: ${error ?? "unknown error"}` : ""}
        onRefresh={refresh}
        labels={{ scanned: "Wallet connected. Confirming your presentation." }}
      />
    </div>
  );
}
