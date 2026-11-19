/**
 * Credential detail view: banner and issuer avatar, title and format chip,
 * eye (blur) toggle, the trust checks of the signers, claims table and
 * validity dates. In review mode (a `credential_acked` credential from a
 * notification or a receive) it shows Accept and Refuse instead of Close.
 */

import { useEffect, useState } from "react";
import type { CredentialRecord } from "../holderClient";
import {
  COLORS,
  copyableClaims,
  credentialDates,
  credentialDetailTitle,
  extractClaims,
  formatDate,
  formatLabel,
  issuerDisplay,
  resolveTitleUrl,
} from "../credentialDisplay";
import { TrustBadge } from "./TrustBadge";
import { ClaimsTable } from "./ClaimsTable";
import { Avatar, Button, Chip, card } from "./ui";

export function CredentialDetail({
  record,
  reviewMode = false,
  onAccept,
  onReject,
  onClose,
}: {
  record: CredentialRecord;
  /** True when the user reviews a received credential (Accept and Refuse footer). */
  reviewMode?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onClose: () => void;
}) {
  // Personal data starts blurred every time the view opens.
  const [blur, setBlur] = useState(true);
  const [title, setTitle] = useState(credentialDetailTitle(record));
  const issuer = issuerDisplay(record);
  const dates = credentialDates(record);
  const claims = extractClaims(record);

  useEffect(() => {
    // Titles can be registry URLs - resolve them to the display name.
    let cancelled = false;
    void resolveTitleUrl(credentialDetailTitle(record)).then((t) => {
      if (!cancelled) setTitle(t);
    });
    return () => {
      cancelled = true;
    };
  }, [record]);

  return (
    <div style={{ ...card, maxWidth: 560 }}>
      {issuer.banner && (
        <img src={issuer.banner} alt="" style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 8 }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: issuer.banner ? -28 : 0 }}>
        <span style={{ border: "3px solid #fff", borderRadius: "50%" }}>
          <Avatar src={issuer.logo} alt={issuer.name} size={64} />
        </span>
        <div>
          <div style={{ fontWeight: 700, color: COLORS.text }}>{issuer.name}</div>
          <TrustBadge check={record.credentialSignerTrustedListCheck} title="Credential signer" showText />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, flex: 1 }}>
          {title.length > 60 ? `${title.slice(0, 50)}...` : title || "Credential"}
        </div>
        {formatLabel(record) !== "Unknown" && (
          <Chip label={formatLabel(record)} fg={COLORS.secondary} bg="#f5f5f7" />
        )}
        <Button kind="secondary" onClick={() => setBlur((b) => !b)}>
          {blur ? "Show" : "Hide"}
        </Button>
        <Button
          kind="secondary"
          onClick={() => void navigator.clipboard.writeText(JSON.stringify(copyableClaims(record), null, 2))}
        >
          Copy
        </Button>
      </div>

      <ClaimsTable claims={claims} blur={blur} />

      <div style={{ fontSize: 12, color: COLORS.secondary, marginTop: 12 }}>
        {dates.issued !== undefined && <div>Issued: {formatDate(dates.issued)}</div>}
        {dates.expires !== undefined && <div>Expiry: {formatDate(dates.expires)}</div>}
      </div>

      {/* The other two signers: show them only when the record has their check. */}
      {(record.issuerTrustedListCheck || record.statusIssuerTrustedListCheck) && (
        <div style={{ fontSize: 12, color: COLORS.secondary, marginTop: 8, display: "grid", gap: 4 }}>
          {record.issuerTrustedListCheck && (
            <div>
              Issuer metadata signer:{" "}
              <TrustBadge check={record.issuerTrustedListCheck} title="Issuer metadata signer" showText />
            </div>
          )}
          {record.statusIssuerTrustedListCheck && (
            <div>
              Status list signer:{" "}
              <TrustBadge check={record.statusIssuerTrustedListCheck} title="Status list signer" showText />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        {reviewMode ? (
          <>
            <Button kind="danger" onClick={onReject}>Refuse</Button>
            <Button onClick={onAccept}>Accept</Button>
          </>
        ) : (
          <Button kind="secondary" onClick={onClose}>Close</Button>
        )}
      </div>
    </div>
  );
}
