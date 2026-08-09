/**
 * Notifications inbox: the holder's action centre. Each row derives its
 * next action from the content (transaction code / authorize / deferred /
 * respond to verification / review) - informational types
 * (credential_revoked, credential_expired) render text only. Deleting a
 * notification is the "handled" signal.
 */

import { useState } from "react";
import type { HolderNotification } from "../notificationsClient";
import { getNotificationContent, type NotificationAction } from "../notificationsClient";
import { useHolderNotifications, useReceiveCredential, useShareFlow } from "../useHolder";
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
import { Avatar, Button, Chip, SearchInput, card } from "./ui";

const STATE_FILTERS: Array<[string, string]> = [
  ["", "All States"],
  ["credential_acked", "Credential Acknowledged"],
  ["credential_pending", "Credential Pending"],
  ["credential_expired", "Credential Expired"],
  ["credential_revoked", "Credential Revoked"],
];

const ACTION_TEXT: Record<NotificationAction, string> = {
  transaction_code: "Click to enter transaction code to continue.",
  authorization: "Authorise credential issuance",
  deferred_credential: "Get the credential issued",
  verification: "Provide additional details to continue",
  review_credential: "Get the credential issued",
  none: "No action required",
};

const INFO_TEXT: Record<string, string> = {
  credential_revoked: "Credential revoked by issuer.",
  credential_expired: "Credential expired and cannot be used.",
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
  const [pinFor, setPinFor] = useState<HolderNotification | null>(null);
  const [pin, setPin] = useState("");
  const [reviewing, setReviewing] = useState<HolderNotification | null>(null);

  const finish = async (n: HolderNotification) => {
    await inbox.remove(n.id);
    onWalletChanged?.();
  };

  const act = async (n: HolderNotification) => {
    const content = getNotificationContent(n);
    if (!content) return;
    const action = inbox.actionOf(n);
    setBusyId(n.id);
    try {
      switch (action) {
        case "transaction_code":
          setPinFor(n);
          break;
        case "authorization":
          if (content.authorizationRequest) window.open(content.authorizationRequest, "_blank");
          break;
        case "deferred_credential":
          // Delete the notification only once the credential actually arrived.
          if (content.id && (await receive.receiveDeferred(content.id))) await finish(n);
          break;
        case "verification":
          if (content.presentationId) await flow.start({ presentationId: content.presentationId });
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
                <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {notificationTitle(n)}
                </div>
                <span style={{ cursor: "pointer", color: COLORS.secondary }} onClick={() => void inbox.remove(n.id)} title="Delete">
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
                  <span style={{ fontSize: 12, color: COLORS.secondary }}>
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
          <div style={{ marginBottom: 6 }}>Enter the transaction code:</div>
          <input
            value={pin}
            maxLength={getNotificationContent(pinFor)?.txCode?.length ?? 6}
            onChange={(e) => setPin(e.target.value)}
            style={{ letterSpacing: 6, fontSize: 18, padding: 8, width: 180 }}
          />{" "}
          <Button
            onClick={() => {
              const content = getNotificationContent(pinFor);
              if (!content?.id) return;
              void receive.submitTransactionCode(content.id, pin).then(async (ok) => {
                if (ok) {
                  await finish(pinFor);
                  setPinFor(null);
                  setPin("");
                }
              });
            }}
          >
            Submit
          </Button>
        </div>
      )}

      {reviewing && (
        <div style={{ marginTop: 12 }}>
          <CredentialDetail
            record={{ id: getNotificationContent(reviewing)?.id ?? "", ...getNotificationContent(reviewing) }}
            reviewMode
            onAccept={() => {
              const id = getNotificationContent(reviewing)?.id;
              if (!id) return;
              void receive.accept(id).then(async () => {
                await finish(reviewing);
                setReviewing(null);
              });
            }}
            onReject={() => {
              const id = getNotificationContent(reviewing)?.id;
              if (!id) return;
              void receive.reject(id).then(async () => {
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
              flow.reset();
              onWalletChanged?.();
            }}
          />
        </div>
      )}
    </div>
  );
}
