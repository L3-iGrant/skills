/**
 * Receive panel: paste a credential offer (the reference wallet has no
 * camera scan: the input is a plain textarea), then walk the next step that
 * each record asks for: a deferred fetch, a transaction code, a
 * front-channel authorisation, or the review (accept or refuse). Each step
 * answer replaces the record, so a transaction code that leads to a deferred
 * credential shows the deferred step next.
 *
 * `useReceiveCredential().receive` also takes a wallet-initiated issuance:
 * `{credentialIssuer, credentialConfigurationIds}` (read the configuration
 * ids with `client.issuerMetadata`).
 */

import { useEffect, useState } from "react";
import type { CredentialRecord } from "../holderClient";
import { captureAuthorizationCode, useReceiveCredential, type PendingCredential } from "../useHolder";
import { COLORS } from "../credentialDisplay";
import { CredentialDetail } from "./CredentialDetail";
import { Button, card } from "./ui";

/**
 * The transaction code input, sized and typed by `txCode` of the record. The
 * wallet trims the code and accepts 4 to 12 characters. `txCode.length` is 0
 * when the issuer gives no length.
 */
export function TransactionCodeInput({
  txCode,
  onSubmit,
}: {
  txCode: CredentialRecord["txCode"];
  onSubmit: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  const length = txCode?.length && txCode.length > 0 ? txCode.length : undefined;
  const numeric = txCode?.input_mode !== "text";
  const value = code.trim();
  const valid = length ? value.length === length : value.length >= 4 && value.length <= 12;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13, color: COLORS.secondary, marginBottom: 6 }}>
        {txCode?.description ||
          (length
            ? `Enter the ${length}-character transaction code that the issuer sent you.`
            : "Enter the transaction code that the issuer sent you.")}
      </div>
      <input
        value={code}
        inputMode={numeric ? "numeric" : "text"}
        maxLength={length ?? 12}
        onChange={(e) => setCode(numeric ? e.target.value.replace(/\D/g, "") : e.target.value)}
        style={{ letterSpacing: 6, fontSize: 18, padding: 8, width: 180 }}
      />
      <span style={{ marginLeft: 10 }}>
        <Button disabled={!valid} onClick={() => onSubmit(value)}>
          Submit
        </Button>
      </span>
    </div>
  );
}

export function ReceivePanel({
  proxyBaseUrl,
  onDone,
}: {
  proxyBaseUrl: string;
  /** Called after a credential lands in the wallet (refresh your lists). */
  onDone?: () => void;
}) {
  const receive = useReceiveCredential({ proxyBaseUrl });
  const [offer, setOffer] = useState("");
  const [reviewing, setReviewing] = useState<PendingCredential | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Front-channel return: the issuer redirected back to the portal with ?code&state.
  useEffect(() => {
    const captured = captureAuthorizationCode();
    if (captured) void receive.exchangeCode(captured);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setNotice(null);
    await receive.receive({ credentialOffer: offer.trim() });
  };

  const fetchDeferred = async (p: PendingCredential) => {
    setNotice(null);
    const record = await receive.receiveDeferred(p.record.id);
    if (record && record.credentialStatus !== "credential_acked") {
      const wait = record.deferredIntervalSeconds;
      setNotice(`The issuer is not ready yet.${wait ? ` Try again in ${wait} seconds.` : ""}`);
    }
  };

  return (
    <div style={{ ...card, maxWidth: 560 }}>
      <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Receive a credential</div>
      <textarea
        required
        value={offer}
        onChange={(e) => setOffer(e.target.value)}
        placeholder="Enter Credential Offer URL"
        style={{ width: "100%", height: 120, padding: 10, fontSize: 13, boxSizing: "border-box" }}
      />
      <div style={{ marginTop: 10 }}>
        <Button disabled={!offer.trim() || receive.status === "receiving"} onClick={() => void submit()}>
          Receive
        </Button>
      </div>

      {receive.error && <div style={{ color: COLORS.red, fontSize: 13, marginTop: 8 }}>{receive.error}</div>}
      {notice && <div style={{ color: COLORS.orange, fontSize: 13, marginTop: 8 }}>{notice}</div>}
      {receive.status === "done" && (
        <div style={{ color: COLORS.green, fontSize: 13, marginTop: 8 }}>The credential is in the wallet.</div>
      )}

      {receive.pending.map((p) => (
        <div key={p.record.id} style={{ marginTop: 12, fontSize: 13 }}>
          {p.action === "deferred_credential" && (
            <Button kind="secondary" onClick={() => void fetchDeferred(p)}>
              Get the credential
            </Button>
          )}
          {p.action === "transaction_code" && (
            <TransactionCodeInput
              txCode={p.record.txCode}
              onSubmit={(code) => void receive.submitTransactionCode(p.record.id, code)}
            />
          )}
          {p.action === "authorization" && p.record.authorisationRequest && (
            <Button onClick={() => window.open(p.record.authorisationRequest ?? "", "_blank")}>
              Authorise the credential issuance
            </Button>
          )}
          {p.action === "verification" && (
            <div style={{ color: COLORS.secondary }}>
              The issuer asks for a presentation first. Answer it from the notifications.
            </div>
          )}
          {p.action === "review_credential" && <Button onClick={() => setReviewing(p)}>Review the credential</Button>}
        </div>
      ))}

      {reviewing && (
        <div style={{ marginTop: 12 }}>
          <CredentialDetail
            record={reviewing.record}
            reviewMode
            onAccept={() =>
              void receive.accept(reviewing.record.id).then((ok) => {
                if (!ok) return;
                setReviewing(null);
                onDone?.();
              })
            }
            onReject={() =>
              void receive.reject(reviewing.record.id).then((ok) => {
                if (!ok) return;
                setReviewing(null);
                onDone?.();
              })
            }
            onClose={() => setReviewing(null)}
          />
        </div>
      )}
    </div>
  );
}
