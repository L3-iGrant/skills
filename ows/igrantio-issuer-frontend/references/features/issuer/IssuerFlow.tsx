import { QrCode, openInWallet } from "../../lib/ows";
import { useIssuance, type IssuanceConfig } from "./useIssuance";

/**
 * Minimal end-to-end issuer demo: issue a credential in-time, show the offer QR,
 * and reflect live status from SSE. Replace the hard-coded payload with your form.
 */
export interface IssuerFlowProps extends IssuanceConfig {
  credentialDefinitionId: string;
  /** Claims for the credential being issued. */
  claims: Record<string, unknown>;
}

export function IssuerFlow({ credentialDefinitionId, claims, ...config }: IssuerFlowProps) {
  const { status, offerUri, error, issueInTime, reset } = useIssuance(config);

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={() =>
          issueInTime({ issuanceMode: "InTime", credentialDefinitionId, credential: { claims } })
        }
      >
        Issue credential
      </button>
    );
  }

  if (status === "error") {
    return (
      <div role="alert">
        <p>Issuance failed: {error}</p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </div>
    );
  }

  if (status === "issued") {
    return (
      <div>
        <p>✅ Credential issued to the wallet.</p>
        <button type="button" onClick={reset}>
          Issue another
        </button>
      </div>
    );
  }

  // offer_ready | scanned
  return (
    <div>
      <p>{status === "scanned" ? "Wallet connected - finishing…" : "Scan to receive your credential"}</p>
      {offerUri && <QrCode value={offerUri} />}
      {offerUri && (
        <button type="button" onClick={() => openInWallet(offerUri)}>
          Open in wallet (same device)
        </button>
      )}
    </div>
  );
}
