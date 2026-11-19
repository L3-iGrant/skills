/**
 * Base configuration page: the wallet settings card (the credential offer
 * endpoint of the organisation wallet with a copy button, and the holder
 * configuration with its trust settings, read only) and the wallet unit
 * status stepper with its lifecycle modal.
 *
 * The credential offer endpoint of the organisation wallet is on the wallet
 * service host of the environment:
 * `<wallet service>/organisation/<organisationId>/service/credential-offer`
 * (for example https://oid4vc.igrant.io on demo). An issuer can send an
 * offer there. Pass it in from your configuration.
 */

import { useHolderConfiguration, useWalletUnitStatus } from "../useHolder";
import { COLORS } from "../credentialDisplay";
import { WalletUnitStatusBar } from "./lifecycle";
import { Button, card } from "./ui";

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 10, fontSize: 13, padding: "3px 0" }}>
      <span style={{ color: COLORS.secondary, minWidth: 220 }}>{label}</span>
      <span style={{ color: COLORS.text, wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

const onOff = (on: boolean, count?: number) =>
  on ? `On${count !== undefined ? ` (${count} trust source${count === 1 ? "" : "s"})` : ""}` : "Off";

export function BaseConfigurationView({
  proxyBaseUrl,
  credentialOfferEndpoint,
  deployed = true,
}: {
  proxyBaseUrl: string;
  /** The credential offer endpoint of the organisation wallet (see above). */
  credentialOfferEndpoint?: string;
  deployed?: boolean;
}) {
  const status = useWalletUnitStatus({ proxyBaseUrl });
  const { configuration: c, error } = useHolderConfiguration({ proxyBaseUrl });

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={card}>
        <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Wallet Settings</div>
        <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ color: COLORS.secondary }}>Credential offer endpoint</span>
          {credentialOfferEndpoint ? (
            <>
              <span style={{ color: COLORS.blue, wordBreak: "break-all" }}>{credentialOfferEndpoint}</span>
              <Button kind="secondary" onClick={() => void navigator.clipboard.writeText(credentialOfferEndpoint)}>
                Copy
              </Button>
            </>
          ) : (
            <span style={{ color: COLORS.secondary }}>{deployed ? "<Not Available>" : "<Not Deployed>"}</span>
          )}
        </div>
        {error && <div style={{ color: COLORS.red, fontSize: 13 }}>{error}</div>}
        {c && (
          <div>
            <Setting label="Encrypted credential responses" value={onOff(c.isCredentialEncryptionEnabled)} />
            <Setting
              label="Automatic status check"
              value={
                c.credentialStatusRefreshIntervalSeconds > 0
                  ? `Every ${c.credentialStatusRefreshIntervalSeconds} seconds`
                  : "Off"
              }
            />
            <Setting label="Redirect URL" value={c.redirectUrl || "-"} />
            <Setting label="Pushed authorisation requests" value={onOff(c.requiresPushedAuthorisationRequests)} />
            <Setting
              label="Trusted credential signers only"
              value={onOff(c.requiresTrustedCredentialSigner, c.acceptedCredentialSigners?.length)}
            />
            <Setting label="Trusted issuers only" value={onOff(c.requiresTrustedIssuer, c.acceptedIssuers?.length)} />
            <Setting
              label="Trusted status list signers only"
              value={onOff(c.requiresTrustedStatusIssuer, c.acceptedStatusIssuers?.length)}
            />
            <Setting
              label="Trusted verifiers only"
              value={onOff(c.requiresTrustedRelyingParty, c.acceptedRelyingParties?.length)}
            />
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Wallet Unit Status</div>
        <WalletUnitStatusBar status={status} />
      </div>
    </div>
  );
}
