/**
 * Received credentials: a stats row (Total, Active, Archived), search, an
 * Active and an Archived table (both list `credential_accepted` records with
 * one row for each batch; the archived table filters `expired=true` and
 * shows Revoked or Expired), and the view, refresh and delete actions of
 * each row.
 */

import { useEffect, useState } from "react";
import type { CredentialRecord } from "../holderClient";
import { useHolderClient, useWalletCredentials } from "../useHolder";
import {
  COLORS,
  credentialListTitle,
  formatDate,
  formatLabel,
  revocationLabel,
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

  useEffect(() => {
    onTotal?.(list.total);
  }, [onTotal, list.total]);

  const refreshStatus = async (record: CredentialRecord) => {
    // The revocation status check and the re-issuance request; the issuer can
    // support neither, so ignore their errors.
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
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Date Received</th>
            <th style={thStyle} />
          </tr>
        </thead>
        <tbody>
          {list.records.map((r) => {
            const revoked = r.revocationStatus === "Revoked";
            const state = revocationLabel(r.revocationStatus, expired);
            return (
              <tr key={r.id}>
                <td style={tdStyle}>
                  {credentialListTitle(r)}
                  {(r.batchInstanceCount ?? 0) > 1 && (
                    <div style={{ fontSize: 11, color: COLORS.secondary }}>
                      {r.batchAvailableCount ?? 0} of {r.batchInstanceCount} single-use copies left
                    </div>
                  )}
                </td>
                <td style={tdStyle}>
                  {r.issuer?.name ?? "Unknown"}{" "}
                  <TrustBadge check={r.credentialSignerTrustedListCheck} title="Credential signer" />
                </td>
                <td style={tdStyle}>{formatLabel(r)}</td>
                <td style={tdStyle}>
                  <span style={{ color: state.color }}>{state.text}</span>
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
                    // The wallet refuses to delete a Wallet Unit Attestation and a system-managed credential.
                    disabled={r.isWalletUnitAttestation === true || r.isSystemManaged === true}
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
