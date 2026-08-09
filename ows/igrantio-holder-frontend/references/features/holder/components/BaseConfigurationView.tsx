/**
 * Base configuration page: the wallet solution settings card (the wallet's
 * credential-offer endpoint with a copy button; "<Not Available>" when
 * deployed without one, "<Not Deployed>" when there is no deployment) and
 * the wallet-unit status stepper with its lifecycle modal.
 */

import { useWalletUnitStatus } from "../useHolder";
import { COLORS } from "../credentialDisplay";
import { WalletUnitStatusBar } from "./lifecycle";
import { Button, card } from "./ui";

export function BaseConfigurationView({
  proxyBaseUrl,
  credentialOfferEndpoint,
  deployed = true,
}: {
  proxyBaseUrl: string;
  /** The wallet's credential-offer endpoint, from your wallet deployment configuration. */
  credentialOfferEndpoint?: string;
  deployed?: boolean;
}) {
  const status = useWalletUnitStatus({ proxyBaseUrl });

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={card}>
        <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Wallet Solution Settings</div>
        <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: COLORS.secondary }}>Credential offer endpoint</span>
          {credentialOfferEndpoint ? (
            <>
              <a href={credentialOfferEndpoint} target="_blank" rel="noreferrer" style={{ color: COLORS.blue }}>
                {credentialOfferEndpoint}
              </a>
              <Button
                kind="secondary"
                onClick={() => void navigator.clipboard.writeText(credentialOfferEndpoint)}
              >
                Copy
              </Button>
            </>
          ) : (
            <span style={{ color: COLORS.secondary }}>{deployed ? "<Not Available>" : "<Not Deployed>"}</span>
          )}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Wallet Unit Status</div>
        <WalletUnitStatusBar status={status} />
      </div>
    </div>
  );
}
