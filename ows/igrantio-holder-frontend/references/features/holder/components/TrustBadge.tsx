/**
 * Trust badge, shown next to every issuer and verifier name. It reads one
 * `TrustedListCheck` of the record:
 * - a held credential: `credentialSignerTrustedListCheck` (the issuer that
 *   signed it); the detail view also shows `issuerTrustedListCheck` and
 *   `statusIssuerTrustedListCheck`;
 * - a presentation request: `relyingPartyTrustedListCheck` (the verifier).
 *
 * `trusted` is a green shield ("Trusted"); `not_trusted` and `not_found` are
 * a red shield; `not_applicable` (the trust setting is off) and a missing
 * check are a grey shield ("Not checked"); `error` is an orange shield. A
 * click opens the details: the listed name, the trust source, the reason or
 * the warning, and the signer certificate.
 */

import { useState } from "react";
import type { TrustedListCheck } from "../holderClient";
import { COLORS, formatDate, trustCheckView } from "../credentialDisplay";
import { card } from "./ui";

function Shield({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <tr>
      <td style={{ padding: "4px 12px 4px 0", color: COLORS.secondary, whiteSpace: "nowrap", verticalAlign: "top" }}>
        {label}
      </td>
      <td style={{ padding: "4px 0", color: COLORS.text }}>{value}</td>
    </tr>
  );
}

export function TrustBadge({
  check,
  showText = false,
  title = "Trust check",
}: {
  /** The trust check of the record; null or undefined when no check ran. */
  check: TrustedListCheck | null | undefined;
  /** Also print the label next to the shield. */
  showText?: boolean;
  /** The heading of the detail panel, for example "Issuer" or "Verifier". */
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const view = trustCheckView(check);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, position: "relative" }}>
      <span
        role="button"
        tabIndex={0}
        title={view.label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen((o) => !o);
        }}
        style={{ cursor: "pointer", display: "inline-flex" }}
      >
        <Shield color={view.color} />
      </span>
      {showText && <span style={{ fontSize: 12, color: view.color }}>{view.label}</span>}
      {open && (
        <div style={{ ...card, position: "absolute", top: 22, left: 0, zIndex: 10, minWidth: 300, maxWidth: 420 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: COLORS.text }}>
            {title}: {view.label}
          </div>
          <table style={{ fontSize: 13, borderCollapse: "collapse" }}>
            <tbody>
              <Row label="Listed name" value={view.name} />
              <Row label="Trust source" value={view.source} />
              <Row label="Role" value={view.role} />
              <Row label="Reason" value={view.reason} />
              <Row label="Warning" value={view.warning} />
              <Row label="Certificate" value={view.certificateSubject} />
              <Row label="Issued by" value={view.certificateIssuer} />
              <Row
                label="Valid until"
                value={view.certificateValidUntil ? formatDate(view.certificateValidUntil) : undefined}
              />
            </tbody>
          </table>
          {!check && (
            <div style={{ color: COLORS.secondary, fontSize: 13 }}>No trust check is recorded for this signer.</div>
          )}
        </div>
      )}
    </span>
  );
}
