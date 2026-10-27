/**
 * Toast layer for live notifications: watches the inbox list for new
 * arrivals, shows at most 5 snackbars at a time, auto-hides each after 6
 * seconds, and suppresses duplicates over the last 50 seen entries. An entry
 * is the id plus the type, so a notification that changes in place (pending
 * to acknowledged) is toasted again. Notifications already present on first
 * render are not toasted.
 */

import { useEffect, useRef, useState } from "react";
import type { HolderNotification } from "../notificationsClient";
import { COLORS, notificationTitle, snackbarText } from "../credentialDisplay";

interface Toast {
  id: string;
  text: string;
  title: string;
}

const toastKey = (n: HolderNotification) => `${n.id}:${n.notificationType}`;

export function NotificationSnackbars({ notifications }: { notifications: HolderNotification[] }) {
  const seen = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (seen.current === null) {
      // First render: baseline, no toasts for the existing inbox.
      seen.current = new Set(notifications.map(toastKey));
      return;
    }
    const fresh = notifications.filter((n) => !seen.current!.has(toastKey(n)));
    if (!fresh.length) return;
    for (const n of fresh) {
      seen.current.add(toastKey(n));
      if (seen.current.size > 50) {
        seen.current = new Set([...seen.current].slice(-25));
      }
    }
    setToasts((prev) =>
      [
        ...fresh.map((n) => ({
          id: toastKey(n),
          text: snackbarText(n.notificationType),
          title: notificationTitle(n),
        })),
        ...prev,
      ].slice(0, 5),
    );
    const timer = setTimeout(
      () => setToasts((prev) => prev.filter((t) => !fresh.some((n) => toastKey(n) === t.id))),
      6000,
    );
    return () => clearTimeout(timer);
  }, [notifications]);

  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 16, left: 16, zIndex: 1400, display: "grid", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: COLORS.text,
            color: "#fff",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            maxWidth: 320,
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ fontWeight: 600 }}>{t.text}</div>
          <div style={{ opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t.title}
          </div>
        </div>
      ))}
    </div>
  );
}
