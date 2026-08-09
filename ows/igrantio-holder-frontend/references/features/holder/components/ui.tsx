/** Minimal shared primitives for the holder portal - restyle or replace freely. */

import type { CSSProperties, ReactNode } from "react";
import { COLORS } from "../credentialDisplay";

export const card: CSSProperties = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: 16,
  background: "#fff",
};

export const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
  color: COLORS.text,
};

export const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: `1px solid ${COLORS.border}`,
  color: COLORS.secondary,
  fontWeight: 600,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.3,
};

export const tdStyle: CSSProperties = {
  padding: "8px 10px",
  borderBottom: `1px solid ${COLORS.border}`,
  verticalAlign: "top",
};

export function Chip({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <span
      style={{
        color: fg,
        background: bg,
        borderRadius: 12,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  kind = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind?: "primary" | "secondary" | "danger";
}) {
  const palette: Record<string, CSSProperties> = {
    primary: { background: COLORS.text, color: "#fff", border: `1px solid ${COLORS.text}` },
    secondary: { background: "#fff", color: COLORS.text, border: `1px solid ${COLORS.border}` },
    danger: { background: "#fff", color: COLORS.red, border: `1px solid ${COLORS.red}` },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...palette[kind],
        borderRadius: 8,
        padding: "7px 16px",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        height: 35,
        padding: "0 12px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        fontSize: 13,
        minWidth: 260,
      }}
    />
  );
}

/** Clickable stat card; active cards get a border in their colour (used as list filters). */
export function StatCard({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        ...card,
        cursor: onClick ? "pointer" : "default",
        border: active ? `1.5px solid ${color}` : card.border,
        boxShadow: active ? `0 0 0 1px ${color}22` : undefined,
        minWidth: 130,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, textTransform: "uppercase", color: COLORS.secondary, letterSpacing: 0.4 }}>
        {label}
      </div>
    </div>
  );
}

/** Right-anchored drawer - the reference wallet hosts every detail view in one. */
export function Drawer({
  open,
  onClose,
  children,
  width = 600,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1301 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: `min(${width}px, 100%)`,
          background: "#fff",
          overflowY: "auto",
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Bell with the reference count formatting: >999 → "nK+", >99 → "99+". */
export function NotificationBell({ count, onClick }: { count: number; onClick: () => void }) {
  const label = count > 999 ? `${Math.floor(count / 1000)}K+` : count > 99 ? "99+" : String(count);
  return (
    <button
      type="button"
      onClick={onClick}
      title="Notifications"
      style={{
        position: "relative",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: count > 0 ? COLORS.text : COLORS.secondary,
        fontSize: 20,
        padding: 6,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: 0,
            right: -2,
            background: COLORS.red,
            color: "#fff",
            borderRadius: 10,
            fontSize: 10,
            fontWeight: 700,
            padding: "1px 5px",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

export function Avatar({ src, alt, size = 44 }: { src?: string; alt: string; size?: number }) {
  return src ? (
    <img
      src={src}
      alt={alt}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
    />
  ) : (
    <div
      aria-label={alt}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: COLORS.border,
        color: COLORS.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size / 2.5,
        flexShrink: 0,
      }}
    >
      {alt.charAt(0).toUpperCase() || "?"}
    </div>
  );
}
