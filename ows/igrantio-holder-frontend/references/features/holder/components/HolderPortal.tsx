/**
 * The complete holder portal in one component: wallet-unit status bar,
 * tabs for Received / Shared / Notifications, receive + respond panels.
 * Use it as-is to scaffold, or lift the individual views into your own shell
 * (each view only needs `proxyBaseUrl`).
 */

import { useState } from "react";
import { useHolderNotifications, useShareFlow, useWalletUnitStatus } from "../useHolder";
import { canReceive, COLORS, WALLET_UNIT_STEPS } from "../credentialDisplay";
import { ReceivedCredentialsView } from "./ReceivedCredentialsView";
import { SharedCredentialsView } from "./SharedCredentialsView";
import { NotificationsInbox } from "./NotificationsInbox";
import { ReceivePanel } from "./ReceivePanel";
import { ShareWizard } from "./ShareWizard";
import { Button, card } from "./ui";

const STEP_COLORS: Record<string, string> = {
  not_installed: COLORS.red,
  installed: "#FFF36D",
  operational: COLORS.orange,
  valid: "#2f9e44",
};

function WalletUnitStatusBar({ status }: { status: string }) {
  const index = WALLET_UNIT_STEPS.indexOf(status as (typeof WALLET_UNIT_STEPS)[number]);
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
      {WALLET_UNIT_STEPS.map((step, i) => (
        <span key={step} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: i === index ? STEP_COLORS[step] : "#D3D3D3",
            }}
          />
          <span style={{ color: i === index ? "#000" : "#666", fontWeight: i === index ? 700 : 400 }}>
            {step.replace("_", " ")}
          </span>
        </span>
      ))}
      {!canReceive(status) && (
        <span style={{ fontSize: 12, color: COLORS.red }}>
          Wallet unit not provisioned - contact your wallet provider.
        </span>
      )}
    </div>
  );
}

type Tab = "received" | "shared" | "notifications";

export function HolderPortal({ proxyBaseUrl }: { proxyBaseUrl: string }) {
  const walletUnitStatus = useWalletUnitStatus({ proxyBaseUrl });
  const inbox = useHolderNotifications({ proxyBaseUrl });
  const respondFlow = useShareFlow({ proxyBaseUrl });
  const [tab, setTab] = useState<Tab>("received");
  const [showReceive, setShowReceive] = useState(false);
  const [requestUrl, setRequestUrl] = useState("");
  const [listKey, setListKey] = useState(0);
  const refreshLists = () => setListKey((k) => k + 1);

  const tabs: Array<[Tab, string]> = [
    ["received", "Received Credentials"],
    ["shared", "Shared Credentials"],
    ["notifications", `Notifications${inbox.notifications.length ? ` (${inbox.notifications.length})` : ""}`],
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: COLORS.text, display: "grid", gap: 14 }}>
      <div style={card}>
        <WalletUnitStatusBar status={walletUnitStatus} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {tabs.map(([key, label]) => (
          <Button key={key} kind={tab === key ? "primary" : "secondary"} onClick={() => setTab(key)}>
            {label}
          </Button>
        ))}
        <span style={{ flex: 1 }} />
        <Button kind="secondary" disabled={!canReceive(walletUnitStatus)} onClick={() => setShowReceive((s) => !s)}>
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
        {tab === "notifications" && (
          <NotificationsInbox proxyBaseUrl={proxyBaseUrl} onWalletChanged={refreshLists} />
        )}
      </div>
    </div>
  );
}
