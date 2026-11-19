import type { IssueCredentialEntry } from "../../lib/ows";
import { WalletQrPanel } from "./walletQr/WalletQrPanel";
import { useIssuance, type IssuanceConfig } from "./useIssuance";

/**
 * Minimal end-to-end issuer demo: issue a credential in time, show the offer
 * QR in the iGrant.io wallet QR panel (vendored from `igrantio-qr-code`), and
 * reflect live status from SSE. Replace the hard-coded payload with your form.
 *
 * Import `./walletQr/walletQr.css` once in your app (or paste its rules into
 * your global stylesheet) so the panel renders at the demonstrator look.
 */
export interface IssuerFlowProps extends IssuanceConfig {
  credentialDefinitionId: string;
  /**
   * The claims of each credential configuration, in the form of its format.
   * One entry for each configuration of the definition; an entry needs
   * `credentialConfigurationId` when the definition has more than one.
   */
  credentials: IssueCredentialEntry[];
  /** The logo on the white disc in the centre of the QR code. */
  logoSrc?: string;
  /** The pre-authorised code flow (default true); false selects the authorisation code flow. */
  preAuthorised?: boolean;
  /**
   * Length of the transaction code (4 to 12), only with `preAuthorised`. The issuer makes the code; the
   * panel shows the code of the issue answer. Leave it out for no code.
   */
  txCodeLength?: number;
}

export function IssuerFlow({
  credentialDefinitionId,
  credentials,
  logoSrc = "/igrant-logo.png",
  preAuthorised = true,
  txCodeLength,
  ...config
}: IssuerFlowProps) {
  const { status, offerUri, transactionCode, error, issueInTime, reset } = useIssuance(config);

  // With a length, the issuer also makes a transaction code; the panel shows it.
  const issue = () =>
    issueInTime({
      credentialDefinitionId,
      credentials,
      preAuthorised,
      ...(preAuthorised && txCodeLength ? { transactionCode: { length: txCodeLength, inputMode: "numeric" as const } } : {}),
    });

  // Refresh makes a NEW offer: the hook closes the old SSE session and opens
  // one on the new credential exchange ids. An expired offer is never re-rendered.
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
        txCode={transactionCode ?? undefined}
        onRefresh={refresh}
      />
    </div>
  );
}
