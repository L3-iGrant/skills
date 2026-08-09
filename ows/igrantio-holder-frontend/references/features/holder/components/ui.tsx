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
