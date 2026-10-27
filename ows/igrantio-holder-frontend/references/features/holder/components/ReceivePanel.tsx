/**
 * Receive panel: paste a credential offer (there is no camera scanning in the
 * reference wallet - input is a plain textarea), then walk the follow-up the
 * offer demands: transaction code, front-channel authorization, deferred
 * retry, or review (accept/reject).
 */

import { useEffect, useState } from "react";
import type { PendingCredential } from "../useHolder";
import { captureAuthorizationCode, useReceiveCredential } from "../useHolder";
import { COLORS } from "../credentialDisplay";
import { CredentialDetail } from "./CredentialDetail";
import { Button, card } from "./ui";

function TransactionCodeInput({
  pending,
  onSubmit,
}: {
  pending: PendingCredential;
  onSubmit: (pin: string) => void;
}) {
  const [pin, setPin] = useState("");
  const length = pending.record.txCode?.length ?? 6;
  const numeric = pending.record.txCode?.input_mode !== "text";
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13, color: COLORS.secondary, marginBottom: 6 }}>
        Enter the {length}-character transaction code the issuer sent you.
      </div>
      <input
        value={pin}
        inputMode={numeric ? "numeric" : "text"}
        maxLength={length}
        onChange={(e) => setPin(numeric ? e.target.value.replace(/\D/g, "") : e.target.value)}
        style={{ letterSpacing: 6, fontSize: 18, padding: 8, width: 180 }}
      />
      <span style={{ marginLeft: 10 }}>
        <Button disabled={pin.length !== length} onClick={() => onSubmit(pin)}>
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

  // Front-channel return leg: the issuer redirected back with ?code&state.
  useEffect(() => {
    const captured = captureAuthorizationCode();
    if (captured) {
      void receive.exchangeCode(captured).then((ok) => ok && onDone?.());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    const pending = await receive.receive(offer.trim());
    if (pending?.every((p) => p.action === "none")) onDone?.();
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
      {receive.status === "done" && (
        <div style={{ color: COLORS.green, fontSize: 13, marginTop: 8 }}>Credential received.</div>
      )}

      {receive.pending.map((p) => (
        <div key={p.record.id} style={{ marginTop: 12, fontSize: 13 }}>
          {p.action === "transaction_code" && (
            <TransactionCodeInput
              pending={p}
              onSubmit={(pin) =>
                void receive.submitTransactionCode(p.record.id, pin).then((ok) => ok && onDone?.())
              }
            />
          )}
          {p.action === "authorization" && p.record.authorizationRequest && (
            <Button onClick={() => window.open(p.record.authorizationRequest, "_blank")}>
              Authorise credential issuance
            </Button>
          )}
          {p.action === "deferred_credential" && (
            <Button
              kind="secondary"
              onClick={() => void receive.receiveDeferred(p.record.id).then((ok) => ok && onDone?.())}
            >
              Get the credential issued
            </Button>
          )}
          {p.action === "review_credential" && (
            <Button onClick={() => setReviewing(p)}>Review credential</Button>
          )}
        </div>
      ))}

      {reviewing && (
        <div style={{ marginTop: 12 }}>
          <CredentialDetail
            record={reviewing.record}
            reviewMode
            onAccept={() =>
              void receive.accept(reviewing.record.id).then(() => {
                setReviewing(null);
                onDone?.();
              })
            }
            onReject={() =>
              void receive.reject(reviewing.record.id).then(() => {
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
