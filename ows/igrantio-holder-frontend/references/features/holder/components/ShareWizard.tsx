/**
 * Share wizard (OpenID4VP + DCQL): one step per credential set (required
 * first), OR alternatives as "OPTION 01/02/…" radios with an optional "None",
 * claim-set radios previewing exactly the claims that will be disclosed,
 * checkbox multi-pick for multiple:true descriptors, transaction data and the
 * data-agreement policy shown before consent, Next/Confirm gated by the
 * selection rules, and the verifier's post-share redirect opened on success.
 */

import { useState } from "react";
import type { useShareFlow } from "../useHolder";
import { claimPreview, type ShareDescriptor, type ShareOption } from "../shareSelection";
import { COLORS, formatDate, verifierDisplay } from "../credentialDisplay";
import { TrustBadge } from "./TrustBadge";
import { Avatar, Button, card, tableStyle, tdStyle } from "./ui";

type ShareFlow = ReturnType<typeof useShareFlow>;

function ClaimPreviewTable({
  descriptor,
  credentialId,
  claimSetIndex,
  blur,
}: {
  descriptor: ShareDescriptor;
  credentialId: string;
  claimSetIndex: number;
  blur: boolean;
}) {
  const matched = descriptor.matches.find((m) => m.credentialId === credentialId) ?? descriptor.matches[0];
  if (!matched) return null;
  const entries = claimPreview(descriptor, matched, claimSetIndex);
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

function DescriptorCard({
  flow,
  descriptor,
  enabled,
  blur,
}: {
  flow: ShareFlow;
  descriptor: ShareDescriptor;
  enabled: boolean;
  blur: boolean;
}) {
  const sel = flow.selection;
  if (!sel) return null;
  const chosenId = sel.credential[descriptor.id] ?? "";
  const claimSetIndex = sel.claimSet[descriptor.id] ?? 0;

  return (
    <div style={{ ...card, marginTop: 8, opacity: enabled ? 1 : 0.5 }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.text }}>
        {descriptor.title ?? descriptor.id}
      </div>
      {descriptor.purpose && (
        <div style={{ fontSize: 12, color: COLORS.secondary }}>{descriptor.purpose}</div>
      )}

      {/* Instance choice: select one, or check several when multiple:true. */}
      {descriptor.matches.length > 1 && !descriptor.multiple && (
        <select
          disabled={!enabled}
          value={chosenId}
          onChange={(e) => flow.actions.setCredential(descriptor.id, e.target.value)}
          style={{ marginTop: 6, fontSize: 13 }}
        >
          {descriptor.matches.map((m, i) => (
            <option key={m.credentialId} value={m.credentialId}>
              Instance {i + 1}
            </option>
          ))}
        </select>
      )}
      {descriptor.multiple && (
        <div style={{ marginTop: 6, fontSize: 13 }}>
          <div style={{ color: COLORS.secondary }}>
            {descriptor.matches.length} instance{descriptor.matches.length === 1 ? "" : "s"} found.
            Select one or more to share.
          </div>
          {descriptor.matches.map((m, i) => (
            <label key={m.credentialId} style={{ display: "block" }}>
              <input
                type="checkbox"
                disabled={!enabled}
                checked={(sel.credentials[descriptor.id] ?? []).includes(m.credentialId)}
                onChange={() => flow.actions.toggleInstance(descriptor.id, m.credentialId)}
              />{" "}
              Instance {i + 1}
            </label>
          ))}
        </div>
      )}

      {/* Claim sets: radio-select a whole disclosure profile; no per-claim toggles. */}
      {descriptor.claimSets?.length ? (
        descriptor.claimSets.map((_, i) => (
          <label key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 6 }}>
            <input
              type="radio"
              name={`claimset-${descriptor.id}`}
              disabled={!enabled}
              checked={claimSetIndex === i}
              onChange={() => flow.actions.chooseClaimSet(descriptor.id, i)}
            />
            <span style={{ flex: 1 }}>
              <ClaimPreviewTable descriptor={descriptor} credentialId={chosenId} claimSetIndex={i} blur={blur} />
            </span>
          </label>
        ))
      ) : (
        <ClaimPreviewTable descriptor={descriptor} credentialId={chosenId} claimSetIndex={0} blur={blur} />
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
        <input
          type="radio"
          checked={selected}
          onChange={() => flow.actions.selectOption(stepIndex, optionIndex)}
        />{" "}
        {label}
      </label>
      {option.descriptors.map((d) => (
        <DescriptorCard key={d.id} flow={flow} descriptor={d} enabled={selected} blur={blur} />
      ))}
    </div>
  );
}

function TransactionDataSection({ items }: { items: Array<Record<string, unknown>> }) {
  const qes = items.find((i) => (i.qes_data as Record<string, unknown> | undefined)?.external_link);
  if (!qes) return null;
  return (
    <div style={{ marginTop: 12, fontSize: 13 }}>
      <a
        href={String((qes.qes_data as Record<string, unknown>).external_link)}
        target="_blank"
        rel="noreferrer"
        style={{ color: COLORS.blue }}
      >
        View Unsigned File ›
      </a>
    </div>
  );
}

export function ShareWizard({ flow, onClose }: { flow: ShareFlow; onClose: () => void }) {
  const [blur, setBlur] = useState(true);
  const { presentation, model, stepIndex } = flow;
  if (!presentation) return null;

  if (flow.status === "mandatory_missing") {
    return (
      <div style={card}>
        <div style={{ color: COLORS.red }}>Requested data is not present in holder</div>
        <div style={{ marginTop: 10 }}>
          <Button kind="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }
  if (flow.status === "already_answered") {
    return (
      <div style={card}>
        <div>This request was already answered on {formatDate(presentation.updatedAt)}.</div>
        <div style={{ marginTop: 10 }}>
          <Button kind="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
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
          <TrustBadge
            verified={presentation.isVerifiedWithTrustList}
            provider={presentation.trustServiceProvider}
            showText
          />
          <div style={{ fontSize: 12, color: COLORS.secondary }}>{verifier.location}</div>
        </div>
        <Button kind="secondary" onClick={() => setBlur((b) => !b)}>{blur ? "Show" : "Hide"}</Button>
      </div>

      <div style={{ fontSize: 13, color: COLORS.secondary, margin: "10px 0" }}>
        {flow.isLastStep ? "Confirm" : "Click next"} to share the selected data with {verifier.name}.
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
              <input
                type="radio"
                checked={choice === "none"}
                onChange={() => flow.actions.selectOption(stepIndex, "none")}
              />{" "}
              None
            </label>
          )}
        </div>
      ) : (
        step.options[0]?.descriptors.map((d) => (
          <div key={d.id}>
            {!step.required && (
              <label style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={!!flow.selection?.included[d.id]}
                  onChange={(e) => flow.actions.toggleDescriptor(stepIndex, d.id, e.target.checked)}
                />{" "}
                Include
              </label>
            )}
            <DescriptorCard
              flow={flow}
              descriptor={d}
              enabled={step.required || !!flow.selection?.included[d.id]}
              blur={blur}
            />
          </div>
        ))
      )}

      {!flow.isLastStep && (
        <div style={{ ...card, background: "#FFF8EE", border: `1px solid ${COLORS.orange}`, marginTop: 12, fontSize: 13 }}>
          Additional data has been requested. Click next to proceed.
        </div>
      )}

      <TransactionDataSection items={presentation.transactionDataDecoded ?? []} />

      {flow.error && <div style={{ color: COLORS.red, fontSize: 13, marginTop: 8 }}>{flow.error}</div>}
      {flow.status === "shared" && (
        <div style={{ color: COLORS.green, fontSize: 13, marginTop: 8 }}>Presentation shared.</div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
        <Button
          kind="secondary"
          onClick={() => (stepIndex > 0 ? flow.previous() : onClose())}
        >
          {stepIndex > 0 ? "Back" : "Close"}
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
