/**
 * Share wizard (OpenID4VP + DCQL): one step for each credential set
 * (required sets first), alternatives as "OPTION 01", "OPTION 02" radios
 * with an optional "None", claim set radios that preview exactly the claims
 * that the wallet will disclose, checkboxes for a `multiple: true` query, the
 * transaction data shown before consent, Next and Confirm gated by the
 * selection rules, and the redirect of the verifier opened after the share.
 */

import { useState } from "react";
import type { useShareFlow } from "../useHolder";
import { claimPreview, claimSetAnswered, type ShareOption, type ShareQuery } from "../shareSelection";
import { COLORS, formatDate, verifierDisplay } from "../credentialDisplay";
import { TrustBadge } from "./TrustBadge";
import { Avatar, Button, card, tableStyle, tdStyle } from "./ui";

type ShareFlow = ReturnType<typeof useShareFlow>;

function ClaimPreviewTable({
  query,
  credentialId,
  claimSetIndex,
  blur,
}: {
  query: ShareQuery;
  credentialId: string;
  claimSetIndex: number;
  blur: boolean;
}) {
  const matched = query.matches.find((m) => m.credentialId === credentialId) ?? query.matches[0];
  if (!matched) return null;
  const entries = claimPreview(query, matched, claimSetIndex);
  if (!entries.length) return null;
  return (
    <table style={{ ...tableStyle, marginTop: 6 }}>
      <tbody>
        {entries.map((e) => (
          <tr key={e.key}>
            <td style={{ ...tdStyle, color: COLORS.secondary, width: "45%" }}>{e.key}</td>
            <td style={{ ...tdStyle, filter: blur ? "blur(4px)" : undefined }}>
              {typeof e.value === "object" ? JSON.stringify(e.value) : String(e.value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function QueryCard({
  flow,
  query,
  enabled,
  blur,
}: {
  flow: ShareFlow;
  query: ShareQuery;
  enabled: boolean;
  blur: boolean;
}) {
  const sel = flow.selection;
  if (!sel) return null;
  const chosenId = query.multiple ? sel.credentials[query.id]?.[0] ?? query.matches[0]?.credentialId ?? "" : sel.credential[query.id] ?? "";
  const chosen = query.matches.find((m) => m.credentialId === chosenId);
  const claimSetIndex = sel.claimSet[query.id] ?? 0;

  return (
    <div style={{ ...card, marginTop: 8, opacity: enabled ? 1 : 0.5 }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>{query.title ?? query.id}</div>
      {query.purpose && <div style={{ fontSize: 12, color: COLORS.secondary }}>{query.purpose}</div>}

      {/* The credential choice: select one, or check several for multiple: true. */}
      {query.matches.length > 1 && !query.multiple && (
        <select
          disabled={!enabled}
          value={chosenId}
          onChange={(e) => flow.actions.setCredential(query.id, e.target.value)}
          style={{ marginTop: 6, fontSize: 13 }}
        >
          {query.matches.map((m, i) => (
            <option key={m.credentialId} value={m.credentialId}>
              Credential {i + 1}
            </option>
          ))}
        </select>
      )}
      {query.multiple && (
        <div style={{ marginTop: 6, fontSize: 13 }}>
          <div style={{ color: COLORS.secondary }}>
            {query.matches.length} credential{query.matches.length === 1 ? "" : "s"} found. Select one or more to share.
          </div>
          {query.matches.map((m, i) => (
            <label key={m.credentialId} style={{ display: "block" }}>
              <input
                type="checkbox"
                disabled={!enabled}
                checked={(sel.credentials[query.id] ?? []).includes(m.credentialId)}
                onChange={() => flow.actions.toggleInstance(query.id, m.credentialId)}
              />{" "}
              Credential {i + 1}
            </label>
          ))}
        </div>
      )}

      {/* Claim sets: pick one whole disclosure option; no toggle for each claim. */}
      {query.claimSets?.length ? (
        query.claimSets.map((_, i) => {
          const answered = claimSetAnswered(query, chosen, i);
          return (
            <label
              key={i}
              style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 6, opacity: answered ? 1 : 0.5 }}
            >
              <input
                type="radio"
                name={`claimset-${query.id}`}
                disabled={!enabled || !answered}
                checked={claimSetIndex === i}
                onChange={() => flow.actions.chooseClaimSet(query.id, i)}
              />
              <span style={{ flex: 1 }}>
                <ClaimPreviewTable query={query} credentialId={chosenId} claimSetIndex={i} blur={blur} />
              </span>
            </label>
          );
        })
      ) : (
        <ClaimPreviewTable query={query} credentialId={chosenId} claimSetIndex={0} blur={blur} />
      )}
    </div>
  );
}

function OptionGroup({
  flow,
  stepIndex,
  option,
  optionIndex,
  label,
  blur,
}: {
  flow: ShareFlow;
  stepIndex: number;
  option: ShareOption;
  optionIndex: number;
  label: string;
  blur: boolean;
}) {
  const selected = flow.selection?.option[stepIndex] === optionIndex;
  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.5, color: selected ? COLORS.text : "#bdbdbd" }}>
        <input type="radio" checked={selected} onChange={() => flow.actions.selectOption(stepIndex, optionIndex)} />{" "}
        {label}
      </label>
      {option.queries.map((q) => (
        <QueryCard key={q.id} flow={flow} query={q} enabled={selected} blur={blur} />
      ))}
    </div>
  );
}

/** Transaction data to show before consent; a `qes_data.external_link` entry links the unsigned document. */
function TransactionDataSection({ items }: { items: Array<Record<string, unknown> | null> }) {
  const shown = items.filter((i): i is Record<string, unknown> => !!i);
  if (!shown.length) return null;
  const qes = shown.find((i) => (i.qes_data as Record<string, unknown> | undefined)?.external_link);
  return (
    <div style={{ ...card, marginTop: 12, fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Transaction data</div>
      {shown.map((item, i) => (
        <div key={i} style={{ color: COLORS.secondary }}>
          {String(item.type ?? "transaction")}
        </div>
      ))}
      {qes && (
        <a
          href={String((qes.qes_data as Record<string, unknown>).external_link)}
          target="_blank"
          rel="noreferrer"
          style={{ color: COLORS.blue }}
        >
          View the unsigned document
        </a>
      )}
    </div>
  );
}

function Closable({ text, color, onClose }: { text: string; color?: string; onClose: () => void }) {
  return (
    <div style={card}>
      <div style={{ color: color ?? COLORS.text }}>{text}</div>
      <div style={{ marginTop: 10 }}>
        <Button kind="secondary" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

export function ShareWizard({ flow, onClose }: { flow: ShareFlow; onClose: () => void }) {
  const [blur, setBlur] = useState(true);
  const { presentation, model, stepIndex } = flow;
  if (flow.status === "error" && !model) {
    return <Closable text={flow.error ?? "The request could not be read."} color={COLORS.red} onClose={onClose} />;
  }
  if (!presentation) return null;

  if (flow.status === "mandatory_missing") {
    return <Closable text="The wallet does not hold the requested data." color={COLORS.red} onClose={onClose} />;
  }
  if (flow.status === "refused") {
    return (
      <Closable
        text={`The wallet refused this request.${presentation.refusalReason ? ` ${presentation.refusalReason}` : ""}`}
        color={COLORS.red}
        onClose={onClose}
      />
    );
  }
  if (flow.status === "already_answered") {
    return <Closable text={`This request was answered on ${formatDate(presentation.updatedAt)}.`} onClose={onClose} />;
  }
  if (!model || !flow.selection) return null;

  const verifier = verifierDisplay(presentation);
  const step = model.steps[stepIndex];
  const choice = flow.selection.option[stepIndex];

  return (
    <div style={{ ...card, maxWidth: 620 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar src={verifier.logo} alt={verifier.name} size={56} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: COLORS.text }}>{verifier.name}</div>
          <TrustBadge check={presentation.relyingPartyTrustedListCheck} title="Verifier" showText />
          <div style={{ fontSize: 12, color: COLORS.secondary }}>{verifier.location}</div>
        </div>
        <Button kind="secondary" onClick={() => setBlur((b) => !b)}>{blur ? "Show" : "Hide"}</Button>
      </div>

      <div style={{ fontSize: 13, color: COLORS.secondary, margin: "10px 0" }}>
        {flow.isLastStep ? "Confirm" : "Click Next"} to share the selected data with {verifier.name}.
      </div>

      {step.radioMode ? (
        <div>
          {step.options.map((option, oi) => (
            <OptionGroup
              key={oi}
              flow={flow}
              stepIndex={stepIndex}
              option={option}
              optionIndex={oi}
              label={`OPTION ${String(oi + 1).padStart(2, "0")}`}
              blur={blur}
            />
          ))}
          {step.allowNone && (
            <label style={{ display: "block", marginTop: 10, fontSize: 13 }}>
              <input type="radio" checked={choice === "none"} onChange={() => flow.actions.selectOption(stepIndex, "none")} />{" "}
              None
            </label>
          )}
        </div>
      ) : (
        step.options[0]?.queries.map((q) => (
          <div key={q.id}>
            {!step.required && (
              <label style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={!!flow.selection?.included[q.id]}
                  onChange={(e) => flow.actions.toggleQuery(stepIndex, q.id, e.target.checked)}
                />{" "}
                Include
              </label>
            )}
            <QueryCard flow={flow} query={q} enabled={step.required || !!flow.selection?.included[q.id]} blur={blur} />
          </div>
        ))
      )}

      {!flow.isLastStep && (
        <div style={{ ...card, background: "#FFF8EE", border: `1px solid ${COLORS.orange}`, marginTop: 12, fontSize: 13 }}>
          The verifier asks for more data. Click Next to continue.
        </div>
      )}

      <TransactionDataSection items={presentation.transactionDataDecoded ?? []} />

      {flow.error && <div style={{ color: COLORS.red, fontSize: 13, marginTop: 8 }}>{flow.error}</div>}
      {flow.status === "shared" && (
        <div style={{ color: COLORS.green, fontSize: 13, marginTop: 8 }}>The presentation is shared.</div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <Button kind="secondary" onClick={() => (stepIndex > 0 && flow.status !== "shared" ? flow.previous() : onClose())}>
          {stepIndex > 0 && flow.status !== "shared" ? "Back" : "Close"}
        </Button>
        {flow.status !== "shared" &&
          (flow.isLastStep ? (
            <Button disabled={!flow.submittable || flow.status === "sending"} onClick={() => void flow.submit()}>
              Confirm
            </Button>
          ) : (
            <Button onClick={flow.next}>Next</Button>
          ))}
      </div>
    </div>
  );
}
