/**
 * Shared credentials: the stats row is also the status filter (click
 * "Presentation Shared" or "Presentation Pending" to filter; Total clears
 * it), and a table of the presentations. The view of a shared record shows
 * one card for each disclosed credential. A pending row opens the share
 * wizard again.
 */

import { useState } from "react";
import type { PresentationRecord, PresentedCredential } from "../holderClient";
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
import { LifecycleModal, PRESENTATION_LIFECYCLE } from "./lifecycle";
import { Button, Chip, SearchInput, StatCard, card, tableStyle, tdStyle, thStyle } from "./ui";
import { EXCLUDED_CLAIM_KEYS } from "../credentialDisplay";

/** One shared credential: `claims` (SD-JWT VC, mdoc) or `credentialSubject` (W3C VC). */
function DisclosedCredentialCard({ credential, blur }: { credential: PresentedCredential; blur: boolean }) {
  const source = credential.claims ?? credential.credentialSubject ?? {};
  const claims = Object.fromEntries(
    Object.entries(source).filter(([k]) => !EXCLUDED_CLAIM_KEYS.has(k) && !k.startsWith("vct") && k !== "id"),
  );
  const label = credential.vct ?? credential.doctype ?? credential.type?.[credential.type.length - 1] ?? credential.id;
  return (
    <div style={{ ...card, marginTop: 8 }}>
      <div style={{ fontSize: 12, color: COLORS.secondary, marginBottom: 6 }}>{label}</div>
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
        <TrustBadge check={record.relyingPartyTrustedListCheck} title="Verifier" showText />
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
  const [lifecycleFor, setLifecycleFor] = useState<string | null>(null);

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
                  <TrustBadge check={r.relyingPartyTrustedListCheck} title="Verifier" />
                </td>
                <td style={tdStyle}>{formatDate(r.updatedAt)}</td>
                <td style={tdStyle}>
                  <Chip label={presentationStatusLabel(r.status)} fg={fg} bg={bg} />{" "}
                  <span
                    title="Presentation lifecycle"
                    onClick={() => setLifecycleFor(r.status ?? "")}
                    style={{ cursor: "pointer", color: COLORS.secondary, fontSize: 12 }}
                  >
                    ⓘ
                  </span>
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
      {lifecycleFor !== null && (
        <div style={{ marginTop: 12 }}>
          <LifecycleModal
            title="Presentation Lifecycle"
            stages={PRESENTATION_LIFECYCLE}
            currentKey={lifecycleFor}
            onClose={() => setLifecycleFor(null)}
          />
        </div>
      )}
    </div>
  );
}
