import { WalletQrPanel } from "./walletQr/WalletQrPanel";
import { useIssuance, type IssuanceConfig } from "./useIssuance";

/**
 * Minimal end-to-end issuer demo: issue a credential in-time, show the offer
 * QR in the iGrant.io wallet QR panel (vendored from `igrantio-qr-code`), and
 * reflect live status from SSE. Replace the hard-coded payload with your form.
 *
 * Import `./walletQr/walletQr.css` once in your app (or paste its rules into
 * your global stylesheet) so the panel renders at the demonstrator look.
 */
export interface IssuerFlowProps extends IssuanceConfig {
  credentialDefinitionId: string;
  /** Claims for the credential being issued. */
  claims: Record<string, unknown>;
  /** The logo on the white disc in the centre of the QR code. */
  logoSrc?: string;
  /** Pre-authorised transaction code, when the definition asks for one. */
  txCode?: string;
}

export function IssuerFlow({
  credentialDefinitionId,
  claims,
  logoSrc = "/igrant-logo.png",
  txCode,
  ...config
}: IssuerFlowProps) {
  const { status, offerUri, error, issueInTime, reset } = useIssuance(config);

  const issue = () =>
    issueInTime({ issuanceMode: "InTime", credentialDefinitionId, credential: { claims } });

  // Refresh mints a NEW exchange: the hook closes the old SSE session and
  // opens one on the new exchange id. An expired offer is never re-rendered.
  const refresh = () => {
    reset();
    issue();
  };

  if (status === "idle") {
    return (
      <button type="button" onClick={issue}>
        Issue credential
      </button>
    );
  }

  if (status === "issued") {
    return (
      <div>
        <p>Credential issued to the wallet.</p>
        <button type="button" onClick={reset}>
          Issue another
        </button>
      </div>
    );
  }

  // offer_ready | scanned | error
  return (
    <div>
      {status === "offer_ready" && <p>Scan to receive your credential</p>}
      <WalletQrPanel
        uri={offerUri ?? undefined}
        logoSrc={logoSrc}
        isScanned={status === "scanned"}
        errorMessage={status === "error" ? `Issuance failed: ${error ?? "unknown error"}` : ""}
        txCode={txCode}
        onRefresh={refresh}
      />
    </div>
  );
}
