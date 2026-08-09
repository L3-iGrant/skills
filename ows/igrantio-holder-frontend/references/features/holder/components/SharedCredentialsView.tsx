/**
 * Shared credentials: the stats row doubles as the status filter (click
 * "Presentation Shared" / "Presentation Pending" to filter; Total clears),
 * plus a table of past/pending presentations. Viewing a shared record renders
 * one collapsible card per disclosed credential (collapsed by default when
 * more than one). Pending rows re-enter the share wizard.
 */

import { useState } from "react";
import type { PresentationRecord } from "../holderClient";
import { useSharedPresentations, useShareFlow } from "../useHolder";
import {
  COLORS,
  formatDate,
  presentationStatusLabel,
  presentationTypeLabel,
  STATUS_CHIP,
  verifierDisplay,
} from "../credentialDisplay";
import { TrustBadge } from "./TrustBadge";
import { ClaimsTable } from "./ClaimsTable";
import { ShareWizard } from "./ShareWizard";
import { Button, Chip, SearchInput, StatCard, card, tableStyle, tdStyle, thStyle } from "./ui";
import { EXCLUDED_CLAIM_KEYS } from "../credentialDisplay";

function DisclosedCredentialCard({ credential, blur }: { credential: Record<string, unknown>; blur: boolean }) {
  const claims = Object.fromEntries(
    Object.entries(credential).filter(
      ([k]) => !EXCLUDED_CLAIM_KEYS.has(k) && !k.startsWith("vct") && k !== "id" && k !== "type" && k !== "doctype",
    ),
  );
  return (
    <div style={{ ...card, marginTop: 8 }}>
      <ClaimsTable claims={claims} blur={blur} />
    </div>
  );
}

function SharedDetail({ record, onClose }: { record: PresentationRecord; onClose: () => void }) {
  const [blur, setBlur] = useState(true);
  const verifier = verifierDisplay(record);
  const disclosed = record.presentation ?? [];
  return (
    <div style={{ ...card, maxWidth: 620, marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 700, color: COLORS.text, flex: 1 }}>{verifier.name}</div>
        <TrustBadge verified={record.isVerifiedWithTrustList} provider={record.trustServiceProvider} showText />
        <Button kind="secondary" onClick={() => setBlur((b) => !b)}>{blur ? "Show" : "Hide"}</Button>
      </div>
      {disclosed.map((c, i) => (
        <DisclosedCredentialCard key={i} credential={c} blur={blur} />
      ))}
      {!disclosed.length && (
        <div style={{ color: COLORS.secondary, fontSize: 13, marginTop: 8 }}>Nothing shared yet.</div>
      )}
      <div style={{ marginTop: 12 }}>
        <Button kind="secondary" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

export function SharedCredentialsView({ proxyBaseUrl }: { proxyBaseUrl: string }) {
  const list = useSharedPresentations({ proxyBaseUrl });
  const flow = useShareFlow({ proxyBaseUrl });
  const [viewing, setViewing] = useState<PresentationRecord | null>(null);

  const toggleFilter = (status: "presentation_acked" | "presentation_pending") =>
    list.setStatusFilter(list.statusFilter === status ? undefined : status);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <StatCard
          label="Total"
          value={list.stats.total ?? list.total}
          color={COLORS.text}
          onClick={() => list.setStatusFilter(undefined)}
        />
        <StatCard
          label="Presentation Shared"
          value={list.stats.presentationShared ?? 0}
          color={COLORS.green}
          active={list.statusFilter === "presentation_acked"}
          onClick={() => toggleFilter("presentation_acked")}
        />
        <StatCard
          label="Presentation Pending"
          value={list.stats.presentationPending ?? 0}
          color={COLORS.orange}
          active={list.statusFilter === "presentation_pending"}
          onClick={() => toggleFilter("presentation_pending")}
        />
      </div>

      <div style={{ margin: "10px 0" }}>
        <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search by Credential Type, Verifier" />
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Credential Type</th>
            <th style={thStyle}>Verifier</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>State</th>
            <th style={thStyle} />
          </tr>
        </thead>
        <tbody>
          {list.records.map((r) => {
            const [fg, bg] = STATUS_CHIP[r.status ?? ""] ?? [COLORS.secondary, "#f5f5f7"];
            const pending = r.status === "presentation_pending";
            return (
              <tr key={r.presentationId}>
                <td style={tdStyle}>{presentationTypeLabel(r)}</td>
                <td style={tdStyle}>
                  {r.clientMetadata?.clientName ?? "Unknown"}{" "}
                  <TrustBadge verified={r.isVerifiedWithTrustList} provider={r.trustServiceProvider} />
                </td>
                <td style={tdStyle}>{formatDate(r.updatedAt)}</td>
                <td style={tdStyle}>
                  <Chip label={presentationStatusLabel(r.status)} fg={fg} bg={bg} />
                </td>
                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                  {pending ? (
                    <Button onClick={() => void flow.start({ presentationId: r.presentationId })}>
                      Respond
                    </Button>
                  ) : (
                    <Button kind="secondary" onClick={() => setViewing(r)}>View</Button>
                  )}
                </td>
              </tr>
            );
          })}
          {!list.records.length && !list.loading && (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, color: COLORS.secondary }}>
                No shared credentials yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {flow.status !== "idle" && (
        <div style={{ marginTop: 12 }}>
          <ShareWizard
            flow={flow}
            onClose={() => {
              flow.reset();
              void list.refresh();
            }}
          />
        </div>
      )}
      {viewing && <SharedDetail record={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
