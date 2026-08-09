/**
 * Received credentials: stats row (Total / Active / Archived), search, an
 * Active and an Archived table (both list credential_accepted records; the
 * archived table filters expired=true and shows Revoked/Expired instead of
 * the auto-present toggle), per-row view/refresh/delete actions.
 */

import { useState } from "react";
import type { CredentialRecord } from "../holderClient";
import { useHolderClient, useWalletCredentials } from "../useHolder";
import {
  COLORS,
  credentialListTitle,
  formatDate,
  formatLabel,
} from "../credentialDisplay";
import { TrustBadge } from "./TrustBadge";
import { CredentialDetail } from "./CredentialDetail";
import { Button, SearchInput, StatCard, tableStyle, tdStyle, thStyle } from "./ui";

function CredentialsTable({
  proxyBaseUrl,
  expired,
  onTotal,
}: {
  proxyBaseUrl: string;
  expired: boolean;
  onTotal?: (n: number) => void;
}) {
  const list = useWalletCredentials({ proxyBaseUrl, expired });
  const client = useHolderClient({ proxyBaseUrl });
  const [viewing, setViewing] = useState<CredentialRecord | null>(null);

  onTotal?.(list.total);

  const refreshStatus = async (record: CredentialRecord) => {
    // Revocation check + reissuance request; either may be unsupported - ignore.
    await Promise.allSettled([
      client.credentials.revocationStatus(record.id),
      client.credentials.requestReissuance(record.id),
    ]);
    await list.refresh();
  };

  return (
    <div>
      <div style={{ margin: "10px 0" }}>
        <SearchInput
          value={list.search}
          onChange={list.setSearch}
          placeholder="Search by Credential Type, Issuer"
        />
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Credential Type</th>
            <th style={thStyle}>Issuer</th>
            <th style={thStyle}>Credential Format</th>
            <th style={thStyle}>{expired ? "Status" : "Auto Present"}</th>
            <th style={thStyle}>Date Received</th>
            <th style={thStyle} />
          </tr>
        </thead>
        <tbody>
          {list.records.map((r) => {
            const revoked = r.revocationStatus === "Revoked";
            return (
              <tr key={r.id}>
                <td style={tdStyle}>{credentialListTitle(r)}</td>
                <td style={tdStyle}>
                  {r.issuer?.name ?? "Unknown"}{" "}
                  <TrustBadge verified={r.isVerifiedWithTrustList} provider={r.trustServiceProvider} />
                </td>
                <td style={tdStyle}>{formatLabel(r)}</td>
                <td style={tdStyle}>
                  {expired ? (
                    <span style={{ color: revoked ? COLORS.red : COLORS.secondary }}>
                      {revoked ? "Revoked" : "Expired"}
                    </span>
                  ) : (
                    <label style={{ fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={r.autoPresent === true}
                        disabled={r.credentialStatus === "credential_pending"}
                        onChange={(e) =>
                          void client.credentials
                            .configure(String(r.credentialId ?? r.id), e.target.checked)
                            .then(list.refresh, list.refresh)
                        }
                      />{" "}
                      {r.autoPresent ? "Enabled" : "Disabled"}
                    </label>
                  )}
                </td>
                <td style={tdStyle}>{formatDate(r.createdAt)}</td>
                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                  <Button kind="secondary" onClick={() => setViewing(r)}>View</Button>{" "}
                  {!expired && (
                    <Button
                      kind="secondary"
                      disabled={revoked || r.credentialStatus === "credential_pending"}
                      onClick={() => void refreshStatus(r)}
                    >
                      Refresh
                    </Button>
                  )}{" "}
                  <Button
                    kind="danger"
                    onClick={() => void client.credentials.delete(r.id).then(list.refresh)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            );
          })}
          {!list.records.length && !list.loading && (
            <tr>
              <td colSpan={6} style={{ ...tdStyle, color: COLORS.secondary }}>
                No credentials yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {viewing && (
        <div style={{ marginTop: 12 }}>
          <CredentialDetail record={viewing} onClose={() => setViewing(null)} />
        </div>
      )}
    </div>
  );
}

export function ReceivedCredentialsView({ proxyBaseUrl }: { proxyBaseUrl: string }) {
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [activeTotal, setActiveTotal] = useState(0);
  const [archivedTotal, setArchivedTotal] = useState(0);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <StatCard label="Total" value={activeTotal + archivedTotal} color={COLORS.text} />
        <StatCard label="Active" value={activeTotal} color={COLORS.green} active={tab === "active"} onClick={() => setTab("active")} />
        <StatCard label="Archived" value={archivedTotal} color={COLORS.orange} active={tab === "archived"} onClick={() => setTab("archived")} />
      </div>
      <div style={{ display: tab === "active" ? "block" : "none" }}>
        <CredentialsTable proxyBaseUrl={proxyBaseUrl} expired={false} onTotal={setActiveTotal} />
      </div>
      <div style={{ display: tab === "archived" ? "block" : "none" }}>
        <CredentialsTable proxyBaseUrl={proxyBaseUrl} expired={true} onTotal={setArchivedTotal} />
      </div>
    </div>
  );
}
