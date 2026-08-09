/**
 * The complete holder portal in one component: wallet-unit status bar, tabs
 * for Received / Shared / Base configuration, a notifications bell opening
 * the inbox in a right drawer, live snackbars, OpenID4VP deep-link capture
 * (`request_uri` auto-opens the respond flow), and the receive/respond
 * panels. Use it as-is to scaffold, or lift the individual views into your
 * own shell (each view only needs `proxyBaseUrl`).
 */

import { useEffect, useState } from "react";
import { captureVerificationRequestUrl, useHolderNotifications, useShareFlow, useWalletUnitStatus } from "../useHolder";
import { canReceive, COLORS } from "../credentialDisplay";
import { ReceivedCredentialsView } from "./ReceivedCredentialsView";
import { SharedCredentialsView } from "./SharedCredentialsView";
import { BaseConfigurationView } from "./BaseConfigurationView";
import { NotificationsInbox } from "./NotificationsInbox";
import { NotificationSnackbars } from "./NotificationSnackbars";
import { ReceivePanel } from "./ReceivePanel";
import { ShareWizard } from "./ShareWizard";
import { WalletUnitStatusBar } from "./lifecycle";
import { Button, Drawer, NotificationBell, card } from "./ui";

type Tab = "received" | "shared" | "configuration";

export function HolderPortal({
  proxyBaseUrl,
  credentialOfferEndpoint,
}: {
  proxyBaseUrl: string;
  /** Optional: shown on the base-configuration page. */
  credentialOfferEndpoint?: string;
}) {
  const walletUnitStatus = useWalletUnitStatus({ proxyBaseUrl });
  const inbox = useHolderNotifications({ proxyBaseUrl });
  const respondFlow = useShareFlow({ proxyBaseUrl });
  const [tab, setTab] = useState<Tab>("received");
  const [showReceive, setShowReceive] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [requestUrl, setRequestUrl] = useState("");
  const [listKey, setListKey] = useState(0);
  const refreshLists = () => {
    setListKey((k) => k + 1);
    void inbox.refresh();
  };

  // Deep link: an OpenID4VP request_uri in the address bar starts the respond flow.
  useEffect(() => {
    const captured = captureVerificationRequestUrl();
    if (captured) {
      setShowReceive(true);
      setRequestUrl(captured);
      void respondFlow.start({ requestUrl: captured });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs: Array<[Tab, string]> = [
    ["received", "Received Credentials"],
    ["shared", "Shared Credentials"],
    ["configuration", "Base Configuration"],
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: COLORS.text, display: "grid", gap: 14 }}>
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <WalletUnitStatusBar status={walletUnitStatus} />
        </div>
        <NotificationBell count={inbox.notifications.length} onClick={() => setInboxOpen(true)} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tabs.map(([key, label]) => (
          <Button key={key} kind={tab === key ? "primary" : "secondary"} onClick={() => setTab(key)}>
            {label}
          </Button>
        ))}
        <span style={{ flex: 1 }} />
        <Button
          kind="secondary"
          disabled={!canReceive(walletUnitStatus)}
          onClick={() => setShowReceive((s) => !s)}
        >
          + Receive
        </Button>
      </div>

      {showReceive && (
        <div style={{ display: "grid", gap: 12 }}>
          <ReceivePanel proxyBaseUrl={proxyBaseUrl} onDone={refreshLists} />
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Respond to a verification request</div>
            <textarea
              value={requestUrl}
              onChange={(e) => setRequestUrl(e.target.value)}
              placeholder="Enter Verification Request URL"
              style={{ width: "100%", height: 80, padding: 10, fontSize: 13, boxSizing: "border-box" }}
            />
            <div style={{ marginTop: 8 }}>
              <Button
                disabled={!requestUrl.trim()}
                onClick={() => void respondFlow.start({ requestUrl: requestUrl.trim() })}
              >
                Respond
              </Button>
            </div>
            {respondFlow.status !== "idle" && (
              <div style={{ marginTop: 12 }}>
                <ShareWizard
                  flow={respondFlow}
                  onClose={() => {
                    respondFlow.reset();
                    refreshLists();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div key={listKey}>
        {tab === "received" && <ReceivedCredentialsView proxyBaseUrl={proxyBaseUrl} />}
        {tab === "shared" && <SharedCredentialsView proxyBaseUrl={proxyBaseUrl} />}
        {tab === "configuration" && (
          <BaseConfigurationView proxyBaseUrl={proxyBaseUrl} credentialOfferEndpoint={credentialOfferEndpoint} />
        )}
      </div>

      <Drawer open={inboxOpen} onClose={() => setInboxOpen(false)}>
        <NotificationsInbox proxyBaseUrl={proxyBaseUrl} onWalletChanged={refreshLists} />
      </Drawer>

      <NotificationSnackbars notifications={inbox.notifications} />
    </div>
  );
}
