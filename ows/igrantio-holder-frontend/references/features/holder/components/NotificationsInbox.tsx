/**
 * Notifications inbox: the action centre of the holder. Each row takes its
 * next action from the content (deferred credential, transaction code,
 * authorisation, presentation during issuance, review). The informational
 * types (`credential_revoked`, `credential_expired`) show text only.
 *
 * When a row is handled:
 * - deferred credential and authorisation: the wallet changes the same
 *   notification in place to `credential_acked`. Do NOT delete it: a delete
 *   of a `credential_acked` notification refuses the offer and deletes the
 *   credential.
 * - transaction code and presentation during issuance: the wallet makes a
 *   new notification for the result, so delete the pending one.
 * - review: accept (or refuse), then delete the notification.
 */

import { useState } from "react";
import type { HolderNotification } from "../notificationsClient";
import { getNotificationContent, type NotificationAction } from "../notificationsClient";
import { useHolderNotifications, useReceiveCredential, useShareFlow } from "../useHolder";
import type { CredentialRecord } from "../holderClient";
import {
  COLORS,
  notificationIssuer,
  notificationTitle,
  notificationTypeLabel,
  STATUS_CHIP,
  timeAgo,
} from "../credentialDisplay";
import { CredentialDetail } from "./CredentialDetail";
import { ShareWizard } from "./ShareWizard";
import { TransactionCodeInput } from "./ReceivePanel";
import { Avatar, Button, Chip, SearchInput, card } from "./ui";

const STATE_FILTERS: Array<[string, string]> = [
  ["", "All States"],
  ["credential_acked", "Credential Acknowledged"],
  ["credential_pending", "Credential Pending"],
  ["credential_expired", "Credential Expired"],
  ["credential_revoked", "Credential Revoked"],
];

const ACTION_TEXT: Record<NotificationAction, string> = {
  transaction_code: "Enter the transaction code to continue",
  authorization: "Authorise the credential issuance",
  deferred_credential: "Get the credential",
  verification: "Provide additional details to continue",
  review_credential: "Review the credential",
  none: "No action required",
};

const INFO_TEXT: Record<string, string> = {
  credential_revoked: "The issuer revoked the credential.",
  credential_expired: "The credential expired and cannot be used.",
};

export function NotificationsInbox({
  proxyBaseUrl,
  onWalletChanged,
}: {
  proxyBaseUrl: string;
  /** Called when an action changed the wallet (refresh your lists). */
  onWalletChanged?: () => void;
}) {
  const inbox = useHolderNotifications({ proxyBaseUrl });
  const receive = useReceiveCredential({ proxyBaseUrl });
  const flow = useShareFlow({ proxyBaseUrl });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pinFor, setPinFor] = useState<HolderNotification | null>(null);
  const [reviewing, setReviewing] = useState<HolderNotification | null>(null);
  const [sharingFor, setSharingFor] = useState<HolderNotification | null>(null);

  /** The pending notification is done: the wallet made a new one for the result. */
  const finish = async (n: HolderNotification) => {
    await inbox.remove(n.id);
    onWalletChanged?.();
  };

  const act = async (n: HolderNotification) => {
    const content = getNotificationContent(n);
    if (!content?.id) return;
    const credentialId = content.id;
    const action = inbox.actionOf(n);
    setNotice(null);
    setBusyId(n.id);
    try {
      switch (action) {
        case "transaction_code":
          setPinFor(n);
          break;
        case "authorization":
          // The notification changes in place after the code exchange: keep it.
          if (content.authorisationRequest) window.open(content.authorisationRequest, "_blank");
          break;
        case "deferred_credential": {
          // The notification changes in place to credential_acked: keep it.
          const record = await receive.receiveDeferred(credentialId);
          if (record?.credentialStatus === "credential_acked") {
            await inbox.refresh();
            onWalletChanged?.();
          } else if (record) {
            const wait = record.deferredIntervalSeconds ?? content.deferredIntervalSeconds;
            setNotice(`The issuer is not ready yet.${wait ? ` Try again in ${wait} seconds.` : ""}`);
          }
          break;
        }
        case "verification":
          if (content.presentationId) {
            setSharingFor(n);
            await flow.start({ presentationId: content.presentationId });
          }
          break;
        case "review_credential":
          setReviewing(n);
          break;
        default:
          break;
      }
    } finally {
      setBusyId(null);
    }
  };

  const reviewRecord = (n: HolderNotification): CredentialRecord => {
    const content = getNotificationContent(n) ?? {};
    return { ...content, id: content.id ?? "" } as CredentialRecord;
  };

  return (
    <div style={{ ...card, maxWidth: 620 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 700, color: COLORS.text, flex: 1 }}>Credential State Notifications</div>
        <Button kind="danger" disabled={!inbox.notifications.length} onClick={() => void inbox.clearAll()}>
          Clear all
        </Button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <select
          value={inbox.typeFilter}
          onChange={(e) => inbox.setTypeFilter(e.target.value)}
          style={{ fontSize: 13 }}
          aria-label="Filter by State"
        >
          {STATE_FILTERS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <SearchInput
          value={inbox.search}
          onChange={inbox.setSearch}
          placeholder="Search by Credential Type, Issuer Name"
        />
      </div>

      {notice && <div style={{ color: COLORS.orange, fontSize: 13, marginBottom: 8 }}>{notice}</div>}
      {receive.error && <div style={{ color: COLORS.red, fontSize: 13, marginBottom: 8 }}>{receive.error}</div>}

      {!inbox.notifications.length && (
        <div style={{ color: COLORS.secondary, fontSize: 13 }}>
          {inbox.search || inbox.typeFilter
            ? "No notifications match your search or filter"
            : "No notifications yet"}
        </div>
      )}

      {inbox.notifications.map((n) => {
        const issuer = notificationIssuer(n);
        const action = inbox.actionOf(n);
        const info = INFO_TEXT[n.notificationType];
        const [fg, bg] = STATUS_CHIP[n.notificationType] ?? [COLORS.secondary, "#f5f5f7"];
        const clickable = !info && action !== "none";
        return (
          <div key={n.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
            <Avatar src={issuer.logo} alt={issuer.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div
                  style={{
                    fontWeight: n.status === "unread" ? 700 : 500,
                    fontSize: 13,
                    color: COLORS.text,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {notificationTitle(n)}
                </div>
                {/* A delete of an unaccepted credential_acked notification refuses the offer. */}
                <span
                  style={{ cursor: "pointer", color: COLORS.secondary }}
                  onClick={() => void inbox.remove(n.id).then(() => onWalletChanged?.())}
                  title={action === "review_credential" ? "Refuse and delete" : "Delete"}
                >
                  ✕
                </span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.secondary }}>{issuer.name}</div>
              <div style={{ fontSize: 11, color: "#999" }}>{timeAgo(n.updatedAt ?? n.createdAt)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <Chip label={notificationTypeLabel(n.notificationType)} fg={fg} bg={bg} />
                {clickable ? (
                  <Button kind="secondary" disabled={busyId === n.id} onClick={() => void act(n)}>
                    {busyId === n.id ? "Processing..." : ACTION_TEXT[action]}
                  </Button>
                ) : (
                  <span
                    style={{ fontSize: 12, color: COLORS.secondary, cursor: n.status === "unread" ? "pointer" : undefined }}
                    title={n.status === "unread" ? "Mark as read" : undefined}
                    onClick={n.status === "unread" ? () => void inbox.markRead(n.id) : undefined}
                  >
                    {info ?? ACTION_TEXT.none}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {pinFor && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <TransactionCodeInput
            txCode={getNotificationContent(pinFor)?.txCode}
            onSubmit={(code) => {
              const credentialId = getNotificationContent(pinFor)?.id;
              if (!credentialId) return;
              void receive.submitTransactionCode(credentialId, code).then(async (result) => {
                if (result) {
                  await finish(pinFor);
                  setPinFor(null);
                }
              });
            }}
          />
        </div>
      )}

      {reviewing && (
        <div style={{ marginTop: 12 }}>
          <CredentialDetail
            record={reviewRecord(reviewing)}
            reviewMode
            onAccept={() => {
              const credentialId = getNotificationContent(reviewing)?.id;
              if (!credentialId) return;
              void receive.accept(credentialId).then(async (ok) => {
                if (!ok) return;
                // The credential is accepted, so this delete does not touch it.
                await finish(reviewing);
                setReviewing(null);
              });
            }}
            onReject={() => {
              const credentialId = getNotificationContent(reviewing)?.id;
              if (!credentialId) return;
              void receive.reject(credentialId).then(async (ok) => {
                if (!ok) return;
                await finish(reviewing);
                setReviewing(null);
              });
            }}
            onClose={() => setReviewing(null)}
          />
        </div>
      )}

      {flow.status !== "idle" && (
        <div style={{ marginTop: 12 }}>
          <ShareWizard
            flow={flow}
            onClose={() => {
              const shared = flow.status === "shared";
              flow.reset();
              // After the share, the wallet receives the credential and makes a new notification.
              if (shared && sharingFor) void finish(sharingFor);
              setSharingFor(null);
              onWalletChanged?.();
            }}
          />
        </div>
      )}
    </div>
  );
}
