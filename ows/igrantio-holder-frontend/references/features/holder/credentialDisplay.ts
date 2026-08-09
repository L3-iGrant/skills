/**
 * Display/view-model helpers for the holder portal. Every fallback chain and
 * exclusion list mirrors the iGrant.io dashboard behaviour so a portal built
 * from these renders credentials the same way the reference wallet does.
 */

import type { CredentialRecord, PresentationRecord } from "./holderClient";
import type { HolderNotification, NotificationContent } from "./notificationsClient";
import { getNotificationContent } from "./notificationsClient";

type AnyRecord = Record<string, unknown>;

const obj = (v: unknown): AnyRecord | undefined =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as AnyRecord) : undefined;
const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);
const arr = (v: unknown): unknown[] | undefined => (Array.isArray(v) && v.length ? v : undefined);

/** `credentialConfigurations.display[0]` ?? `credentialConfigurations.credential_metadata.display[0]`. */
export function displayConfig(record: CredentialRecord): AnyRecord | undefined {
  const cfg = obj(record.credentialConfigurations);
  return (
    obj(arr(cfg?.display)?.[0]) ??
    obj(arr(obj(cfg?.credential_metadata)?.display)?.[0])
  );
}

/** List/table title chain: type array → vct → mdoc docType → draft-11 vc.type[0] → "Unknown". */
export function credentialListTitle(record: CredentialRecord): string {
  const cfg = obj(record.credentialConfigurations);
  const cred = obj(record.credential);
  const typeArr = arr(obj(cfg?.credential_definition)?.type);
  if (typeArr) return typeArr.map(String).join(", ");
  return (
    str(cfg?.vct) ??
    str(obj(cred?.issuerAuth)?.docType) ??
    str(arr(obj(cred?.vc)?.type)?.[0]) ??
    "Unknown"
  );
}

/**
 * Detail-view title chain (different from the list): display name →
 * credential_metadata display name → vc.type join → "". When the result is an
 * http(s) URL, fetch it and use `data.name ?? data.display.name`.
 */
export function credentialDetailTitle(record: CredentialRecord): string {
  const cfg = obj(record.credentialConfigurations);
  const cred = obj(record.credential);
  return (
    str(obj(arr(cfg?.display)?.[0])?.name) ??
    str(obj(arr(obj(cfg?.credential_metadata)?.display)?.[0])?.name) ??
    arr(obj(cred?.vc)?.type)?.map(String).join(", ") ??
    ""
  );
}

/** Resolve an http(s) title to its registry name (`data.name ?? data.display.name`). */
export async function resolveTitleUrl(title: string, fetchFn: typeof fetch = fetch): Promise<string> {
  if (!/^https?:\/\//.test(title)) return title;
  try {
    const res = await fetchFn(title);
    const data = (await res.json()) as AnyRecord;
    return str(data.name) ?? str(obj(data.display)?.name) ?? title;
  } catch {
    return title;
  }
}

const FORMAT_LABELS: Record<string, string> = {
  mso_mdoc: "ISO 18013-5 mdoc/mDL",
  "dc+sd-jwt": "IETF SD-JWT VC",
  "vp+sd-jwt": "IETF SD-JWT VC",
  "vc+sd-jwt": "IETF SD-JWT VC",
  sdjwt: "IETF SD-JWT VC",
  jwt_vc: "W3C VC (JWT)",
  jwt_vc_json: "W3C VC (JWT)",
};

/** Human format label with the dashboard's structural fallbacks. */
export function formatLabel(record: CredentialRecord): string {
  const direct = FORMAT_LABELS[str(record.credentialFormat) ?? ""];
  if (direct) return direct;
  const cred = obj(record.credential);
  if (obj(cred?.nameSpaces)) return FORMAT_LABELS.mso_mdoc;
  if (obj(obj(cred?.vc)?.credentialSubject)) return FORMAT_LABELS.jwt_vc;
  if (str(cred?.vct) || obj(cred?.dataAgreement)) return FORMAT_LABELS.sdjwt;
  return "Unknown";
}

const notDiscoverable = (v: string | undefined): string | undefined =>
  v && v.toLowerCase() !== "not discoverable" ? v : undefined;

export interface PartyDisplay {
  name: string;
  logo?: string;
  banner?: string;
  location?: string;
}

/** Issuer identity for a held credential (banner/logo chains with the "not discoverable" guard). */
export function issuerDisplay(record: CredentialRecord): PartyDisplay {
  const cfg = displayConfig(record);
  const issuer = obj(record.issuer);
  return {
    name: str(issuer?.name) ?? "Unknown",
    logo: str(obj(cfg?.logo)?.uri) ?? notDiscoverable(str(issuer?.logo)),
    banner: str(obj(cfg?.background_image)?.uri) ?? notDiscoverable(str(issuer?.cover)),
  };
}

/** Verifier identity for a presentation request. */
export function verifierDisplay(p: PresentationRecord): PartyDisplay {
  const meta = obj(p.clientMetadata);
  return {
    name: str(meta?.clientName) ?? "Unknown",
    logo: str(meta?.logoUri),
    banner: str(meta?.coverUri),
    location: str(meta?.location) ?? "Not Discoverable",
  };
}

/** Claim keys never rendered (plus `vct*` / `transaction_data_types*` prefixes). */
export const EXCLUDED_CLAIM_KEYS = new Set([
  "exp", "iat", "iss", "jti", "nbf", "sub", "_sd_alg", "vct", "status", "cnf",
  "dataAgreement", "transaction_data_types", "schema_uri#integrity",
]);

const excludedClaimKey = (key: string): boolean =>
  EXCLUDED_CLAIM_KEYS.has(key) || key.startsWith("vct") || key.startsWith("transaction_data_types");

const withoutKeys = (source: AnyRecord, extra: string[] = []): AnyRecord =>
  Object.fromEntries(
    Object.entries(source).filter(([k]) => !excludedClaimKey(k) && !extra.includes(k)),
  );

/**
 * Claims to show in the detail view, per format:
 * mdoc → first namespace minus `dataAgreement`; W3C JWT → (possibly nested)
 * credentialSubject minus `dataAgreement`; SD-JWT → credentialSubject minus
 * excluded keys and `id`; legacy SD-JWT (claims at the credential root) minus
 * excluded keys.
 */
export function extractClaims(record: CredentialRecord): AnyRecord {
  const cred = obj(record.credential);
  if (!cred) return {};
  const format = str(record.credentialFormat) ?? "";

  const nameSpaces = obj(cred.nameSpaces);
  if (format === "mso_mdoc" || nameSpaces) {
    const first = obj(Object.values(nameSpaces ?? {})[0]);
    if (!first) return {};
    const { dataAgreement: _da, ...rest } = first;
    return rest;
  }

  const vc = obj(cred.vc);
  if (format === "jwt_vc" || format === "jwt_vc_json") {
    const subject = obj(vc?.credentialSubject);
    const inner = obj(subject?.credentialSubject) ?? subject ?? {};
    const { dataAgreement: _da, ...rest } = inner;
    return rest;
  }

  const sdSubject = obj(vc?.credentialSubject);
  if (sdSubject) return withoutKeys(sdSubject, ["id"]);
  return withoutKeys(cred);
}

/** True when a key looks like an embedded base64 portrait/photo. */
export const isPortraitKey = (key: string): boolean =>
  /portrait|photo|image|face/i.test(key);

export interface CredentialDates {
  issued?: string | number;
  expires?: string | number;
}

/**
 * Issued/expiry values: mdoc → `issuerAuth.validityInfo.validFrom/validUntil`
 * (a "YYYY-MM-DD HH:mm:ss UTC" string); W3C → `vc.issuanceDate` /
 * `vc.expirationDate`; SD-JWT → unix `iat` / `exp`.
 */
export function credentialDates(record: CredentialRecord): CredentialDates {
  const cred = obj(record.credential);
  const validity = obj(obj(cred?.issuerAuth)?.validityInfo);
  if (validity) return { issued: str(validity.validFrom), expires: str(validity.validUntil) };
  const vc = obj(cred?.vc);
  if (str(vc?.issuanceDate) || str(vc?.expirationDate)) {
    return { issued: str(vc?.issuanceDate), expires: str(vc?.expirationDate) };
  }
  return {
    issued: typeof cred?.iat === "number" ? cred.iat : undefined,
    expires: typeof cred?.exp === "number" ? cred.exp : undefined,
  };
}

/** Format a date value (unix seconds, ISO string, or mdoc UTC string). */
export function formatDate(value: string | number | undefined): string {
  if (value === undefined) return "";
  const date =
    typeof value === "number"
      ? new Date(value * 1000)
      : new Date(value.replace(" UTC", "Z").replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString(undefined, {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
}

/** Shared-credentials list: label of what was presented (or requested). */
export function presentationTypeLabel(p: PresentationRecord): string {
  const presented = arr(p.presentation);
  if (presented) {
    const labels = presented
      .map((item) => {
        const o = obj(item) ?? {};
        const type = arr(o.type);
        return str(type?.[type.length - 1]) ?? str(o.doctype) ?? str(o.vct);
      })
      .filter((v): v is string => !!v);
    if (labels.length) return labels.join(", ");
  }
  const creds = arr(obj(p.dcqlQuery)?.credentials);
  if (creds) {
    const labels = creds
      .map((c) => {
        const o = obj(c) ?? {};
        const meta = obj(o.meta) ?? {};
        return (
          str(meta.doctype_value) ??
          arr(meta.vct_values)?.map(String).join(", ") ??
          arr(meta.type_values)?.flat().map(String).join(", ")
        );
      })
      .filter((v): v is string => !!v);
    if (labels.length) return labels.join(", ");
  }
  return "Unknown";
}

/** Presentation status → holder-facing label. */
export function presentationStatusLabel(status: string | undefined): string {
  if (status === "presentation_acked") return "Presentation Shared";
  if (status === "presentation_pending") return "Presentation Pending";
  return status ?? "";
}

/** Portal palette (matches the reference wallet). */
export const COLORS = {
  text: "#1d1d1f",
  secondary: "#86868b",
  border: "#d2d2d7",
  green: "#34C759",
  orange: "#FF9500",
  red: "#FF3B30",
  blue: "#007aff",
} as const;

/** Status chip colours: [foreground, background]. */
export const STATUS_CHIP: Record<string, [string, string]> = {
  presentation_acked: [COLORS.green, "#F0FFF4"],
  presentation_pending: [COLORS.orange, "#FFF8EE"],
  credential_pending: [COLORS.orange, "#FFF8EE"],
  credential_acked: [COLORS.orange, "#FFF8EE"],
  credential_revoked: [COLORS.red, "#FFF2F1"],
  credential_expired: [COLORS.secondary, "rgba(134,134,139,.08)"],
};

/** Wallet-unit status ladder (WUA lifecycle). Receive is enabled from `operational`. */
export const WALLET_UNIT_STEPS = ["not_installed", "installed", "operational", "valid"] as const;
export type WalletUnitStatus = (typeof WALLET_UNIT_STEPS)[number];

export function canReceive(status: string | undefined): boolean {
  const s = (status ?? "").toLowerCase().replace(" ", "_");
  return s === "operational" || s === "valid";
}

/** Notification title chain (joins array contents, dropping "Unknown" entries). */
export function notificationTitle(n: HolderNotification): string {
  const contents = Array.isArray(n.notificationContent)
    ? n.notificationContent
    : n.notificationContent
      ? [n.notificationContent]
      : [];
  const titleOf = (c: NotificationContent): string => {
    const cred = obj(c.credential);
    const cfg = obj(c.credentialConfigurations);
    return (
      str(cred?.vct) ??
      str(obj(cred?.issuerAuth)?.docType) ??
      str(arr(obj(cred?.vc)?.type)?.[0]) ??
      str(cfg?.vct) ??
      str(arr(obj(cfg?.credential_definition)?.type)?.[0]) ??
      str(cfg?.doctype) ??
      str(obj(arr(cfg?.display)?.[0])?.name) ??
      str(obj(arr(obj(cfg?.credential_metadata)?.display)?.[0])?.name) ??
      "Unknown"
    );
  };
  const titles = contents.map(titleOf).filter((t) => t !== "Unknown");
  return titles.length ? titles.join(", ") : "Unknown";
}

/** Notification issuer name + logo chains. */
export function notificationIssuer(n: HolderNotification): { name: string; logo?: string } {
  const c = getNotificationContent(n) ?? {};
  const cfg = obj(c.credentialConfigurations);
  const display = obj(arr(cfg?.display)?.[0]);
  const issuer = obj(c.issuer);
  return {
    name: str(issuer?.name) ?? str(display?.name) ?? "Unknown Issuer",
    logo: str(obj(display?.logo)?.uri) ?? str(issuer?.logo),
  };
}

/** `credential_acked` → "Credential Acknowledged"; otherwise snake_case → Title Case. */
export function notificationTypeLabel(type: string): string {
  if (type === "credential_acked") return "Credential Acknowledged";
  return type
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** "Just now" / "Xm ago" / "Xh ago" / absolute date. Numbers are unix seconds. */
export function timeAgo(value: string | number | undefined): string {
  if (value === undefined) return "Just now";
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ago`;
  return formatDate(date.toISOString());
}
