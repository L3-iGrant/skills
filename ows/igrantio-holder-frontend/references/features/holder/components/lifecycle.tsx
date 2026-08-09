/**
 * Lifecycle UIs: the wallet-unit 4-dot status bar (clickable dots open the
 * lifecycle modal) and the generic stage modal shared with the presentation
 * lifecycle (Pending → Shared). Stage colours match the reference wallet.
 */

import { useState } from "react";
import { canReceive, COLORS } from "../credentialDisplay";
import { Button, card } from "./ui";

export interface LifecycleStage {
  key: string;
  label: string;
  description: string;
  color: string;
}

export const WALLET_UNIT_LIFECYCLE: LifecycleStage[] = [
  {
    key: "not_installed",
    label: "Not Installed",
    description: "The organisation has no wallet deployment.",
    color: COLORS.red,
  },
  {
    key: "installed",
    label: "Installed",
    description: "The wallet is deployed, but it holds no valid Wallet Unit Attestation.",
    color: "#FFF36D",
  },
  {
    key: "operational",
    label: "Operational",
    description: "The wallet holds a valid Wallet Unit Attestation, but no Legal PID credential.",
    color: COLORS.orange,
  },
  {
    key: "valid",
    label: "Valid",
    description: "The wallet holds a valid Wallet Unit Attestation and a Legal PID credential.",
    color: "#2f9e44",
  },
];

export const PRESENTATION_LIFECYCLE: LifecycleStage[] = [
  {
    key: "presentation_pending",
    label: "Presentation Pending",
    description: "The verifier's request arrived; the holder has not shared credentials yet.",
    color: COLORS.orange,
  },
  {
    key: "presentation_acked",
    label: "Presentation Shared",
    description: "The holder shared the selected credentials with the verifier.",
    color: COLORS.green,
  },
];

/** Stage modal: stages before the current render completed, after it pending. */
export function LifecycleModal({
  title,
  stages,
  currentKey,
  onClose,
}: {
  title: string;
  stages: LifecycleStage[];
  currentKey: string;
  onClose: () => void;
}) {
  const currentIndex = stages.findIndex((s) => s.key === currentKey);
  return (
    <div style={{ ...card, maxWidth: 460 }}>
      <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>{title}</div>
      {stages.map((stage, i) => {
        const state = i < currentIndex ? "completed" : i === currentIndex ? "current" : "pending";
        return (
          <div key={stage.key} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <span
              style={{
                width: 14,
                height: 14,
                marginTop: 3,
                borderRadius: "50%",
                background: state === "pending" ? "#D3D3D3" : stage.color,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: state === "current" ? 700 : 500, fontSize: 13, color: COLORS.text }}>
                {stage.label}
                {state === "completed" && <span style={{ color: COLORS.green }}> ✓</span>}
              </div>
              <div style={{ fontSize: 12, color: COLORS.secondary }}>{stage.description}</div>
            </div>
          </div>
        );
      })}
      <Button kind="secondary" onClick={onClose}>Close</Button>
    </div>
  );
}

/** 4-dot stepper: only the current dot is coloured, the rest grey #D3D3D3. */
export function WalletUnitStatusBar({ status }: { status: string }) {
  const [showLifecycle, setShowLifecycle] = useState(false);
  const normalized = status.toLowerCase().replace(" ", "_");
  const index = WALLET_UNIT_LIFECYCLE.findIndex((s) => s.key === normalized);

  return (
    <div>
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        {WALLET_UNIT_LIFECYCLE.map((stage, i) => (
          <span
            key={stage.key}
            onClick={() => setShowLifecycle(true)}
            style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, cursor: "pointer" }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: i === index ? stage.color : "#D3D3D3",
              }}
            />
            <span style={{ color: i === index ? "#000" : "#666", fontWeight: i === index ? 700 : 400 }}>
              {stage.label}
            </span>
          </span>
        ))}
        {!canReceive(status) && (
          <span style={{ fontSize: 12, color: COLORS.red }}>
            Wallet unit not provisioned - contact your wallet provider.
          </span>
        )}
      </div>
      {showLifecycle && (
        <div style={{ marginTop: 10 }}>
          <LifecycleModal
            title="Wallet Unit Lifecycle"
            stages={WALLET_UNIT_LIFECYCLE}
            currentKey={normalized}
            onClose={() => setShowLifecycle(false)}
          />
        </div>
      )}
    </div>
  );
}
