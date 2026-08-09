/**
 * Trust-list verification badge, shown next to every issuer and verifier
 * name. Rules from the reference wallet:
 * - verified → green (#2e7d32) shield, clickable, opens the trust-service
 *   -provider details; long text "Trusted Service Provider".
 * - unverified → red (#d32f2f) shield, not clickable; long text
 *   "Untrusted Service Provider".
 * Tooltips: "This is a verified organisation" / "This organisation is not verified".
 */

import { useState } from "react";
import { COLORS } from "../credentialDisplay";
import { card } from "./ui";

const VERIFIED_GREEN = "#2e7d32";
const UNVERIFIED_RED = "#d32f2f";

function Shield({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  );
}

/** Generic renderer for the trust-service-provider record (shape varies by trust list). */
function ProviderDetails({ provider }: { provider: unknown }) {
  if (!provider || typeof provider !== "object") {
    return <div style={{ color: COLORS.secondary, fontSize: 13 }}>No provider details available.</div>;
  }
  const entries = Object.entries(provider as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && typeof v !== "object",
  );
  return (
    <table style={{ fontSize: 13, borderCollapse: "collapse" }}>
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k}>
            <td style={{ padding: "4px 12px 4px 0", color: COLORS.secondary, whiteSpace: "nowrap" }}>{k}</td>
            <td style={{ padding: "4px 0", color: COLORS.text }}>{String(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TrustBadge({
  verified,
  provider,
  showText = false,
}: {
  verified: boolean | undefined;
  /** The record's `trustServiceProvider` - rendered when the badge is clicked. */
  provider?: unknown;
  /** Also print "Trusted/Untrusted Service Provider" next to the shield. */
  showText?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isVerified = verified === true;
  const color = isVerified ? VERIFIED_GREEN : UNVERIFIED_RED;
  const title = isVerified ? "This is a verified organisation" : "This organisation is not verified";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, position: "relative" }}>
      <span
        title={title}
        onClick={isVerified ? () => setOpen((o) => !o) : undefined}
        style={{ cursor: isVerified ? "pointer" : "not-allowed", display: "inline-flex" }}
      >
        <Shield color={color} />
      </span>
      {showText && (
        <span style={{ fontSize: 12, color }}>
          {isVerified ? "Trusted Service Provider" : "Untrusted Service Provider"}
        </span>
      )}
      {open && (
        <div style={{ ...card, position: "absolute", top: 22, left: 0, zIndex: 10, minWidth: 280 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: COLORS.text }}>Trust Service Provider</div>
          <ProviderDetails provider={provider} />
        </div>
      )}
    </span>
  );
}
