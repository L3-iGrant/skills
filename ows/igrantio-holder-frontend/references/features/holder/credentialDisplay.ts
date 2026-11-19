/**
 * Display and view-model helpers for the holder portal. Every fallback chain
 * and exclusion list follows the reference wallet of the iGrant.io
 * dashboard, so that a portal built from these shows credentials the same
 * way.
 */

import type { CredentialRecord, PresentationRecord, TrustedListCheck } from "./holderClient";
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

/** List and table title chain: type array, then vct, then mdoc docType, then vc.type[0], then "Unknown". */
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
 * Detail view title chain (different from the list): the display name, then
 * the credential_metadata display name, then the vc.type values, then "".
 * When the result is an http(s) URL, fetch it and use
 * `data.name ?? data.display.name`.
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

/** Format label, with fallbacks on the structure of the credential. */
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

/** Issuer identity of a held credential (banner and logo chains; "not discoverable" counts as absent). */
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

/** Claim keys that the portal never shows (also the `vct*` and `transaction_data_types*` prefixes). */
export const EXCLUDED_CLAIM_KEYS = new Set([
  "exp", "iat", "iss", "jti", "nbf", "sub", "_sd_alg", "vct", "status", "cnf", "kb",
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
 * mdoc: the first namespace without `dataAgreement`; W3C VC (JWT): the
 * credentialSubject (or a nested credentialSubject) without `dataAgreement`;
 * SD-JWT VC: the claims at the root without the excluded keys (or a
 * `vc.credentialSubject` without the excluded keys and `id`).
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
 * Issue and expiry values: mdoc `issuerAuth.validityInfo.validFrom` and
 * `validUntil` (a "YYYY-MM-DD HH:mm:ss UTC" text); W3C VC `vc.issuanceDate`
 * and `vc.expirationDate`; SD-JWT VC the Unix `iat` and `exp`.
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

/** The label of a presentation status for the holder. */
export function presentationStatusLabel(status: string | undefined): string {
  if (status === "presentation_acked") return "Presentation Shared";
  if (status === "presentation_pending") return "Presentation Pending";
  if (status === "request_refused") return "Request Refused";
  return status ?? "";
}

/** The label and colour of `revocationStatus` (Operational, Revoked, Suspended). */
export function revocationLabel(revocationStatus: string | undefined, expired: boolean): { text: string; color: string } {
  if (revocationStatus === "Revoked") return { text: "Revoked", color: COLORS.red };
  if (revocationStatus === "Suspended") return { text: "Suspended", color: COLORS.orange };
  if (expired) return { text: "Expired", color: COLORS.secondary };
  return { text: "Active", color: COLORS.green };
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
  request_refused: [COLORS.red, "#FFF2F1"],
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

/** `credential_acked` is "Credential Acknowledged"; any other snake_case value becomes Title Case. */
export function notificationTypeLabel(type: string): string {
  if (type === "credential_acked") return "Credential Acknowledged";
  return type
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** SSE snackbar copy per notification type. */
export function snackbarText(type: string): string {
  const texts: Record<string, string> = {
    credential_revoked: "The issuer revoked a credential",
    credential_expired: "A credential expired",
    credential_acked: "A new credential is ready for review",
    credential_pending: "A credential offer needs your action",
  };
  return texts[type] ?? `Notification: ${type}`;
}

/** Age-attestation chip colours: age_over_NN true / false. */
export const AGE_CHIP = { above: "#AEDD94", under: "#E692F8" } as const;

/** Claims for copy-to-clipboard: the visible claims minus `id` for JWT formats. */
export function copyableClaims(record: CredentialRecord): AnyRecord {
  const claims = extractClaims(record);
  const format = str(record.credentialFormat) ?? "";
  if (format === "jwt_vc" || format === "jwt_vc_json") {
    const { id: _id, ...rest } = claims;
    return rest;
  }
  return claims;
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

/* ------------------------------------------------------------------ */
/* Trust checks (TrustedListCheck)                                     */
/* ------------------------------------------------------------------ */

export type TrustTone = "trusted" | "not_trusted" | "not_checked" | "failed";

export interface TrustCheckView {
  tone: TrustTone;
  /** A short label in plain words. */
  label: string;
  color: string;
  /** The listed name of the signer, when a trust source names it. */
  name?: string;
  /** The trust source that holds the entry. */
  source?: string;
  role?: string;
  /** Why the signer did not pass, or why the check did not run. */
  reason?: string;
  warning?: string;
  /** The subject of the signer certificate (leaf). */
  certificateSubject?: string;
  certificateIssuer?: string;
  certificateValidUntil?: string;
}

const REASON_TEXT: Record<string, string> = {
  not_required: "The wallet does not check this signer: the trust setting is off.",
  same_as_credential_signer: "The signer of the status list is the signer of the credential.",
  path_not_valid: "The certificate chain does not lead to a listed certificate.",
  certificate_not_valid: "A certificate of the chain is not valid now.",
  ca_rules_not_met: "A CA certificate of the chain does not follow the CA rules.",
  key_usage_not_allowed: "The key usage of a certificate does not allow this signature.",
  revoked: "A certificate of the chain is revoked.",
  not_granted: "The list entry does not have a granted status.",
  wrong_role: "The list entry does not have the role that the check asks for.",
  object_signature: "The signature does not verify with the certificate.",
  not_accepted: "The client identifier is not one of the accepted client IDs.",
  ski_only: "The list gives only the key identifier of the CA.",
  list_not_downloaded: "A trusted list of the accepted sources is not downloaded.",
  check_failed: "The check could not finish.",
};

const noteText = (note: TrustedListCheck["reason"]): string | undefined =>
  note ? str(note.message) ?? REASON_TEXT[note.code] ?? note.code : undefined;

/**
 * The view model of a trust check for a badge and its detail panel. A
 * missing check (a pending credential) and a check whose switch is off
 * (`not_applicable`) are both "Not checked": a neutral grey, not a warning.
 */
export function trustCheckView(check: TrustedListCheck | null | undefined): TrustCheckView {
  if (!check) return { tone: "not_checked", label: "Not checked", color: COLORS.secondary };
  const leaf = check.presentedCertificates?.[0];
  const entry = check.entry;
  const base = {
    name:
      str(entry?.provider?.tSPName) ??
      str(entry?.service?.serviceName) ??
      str(check.decision?.entity) ??
      undefined,
    source: str(entry?.source?.name),
    role: str(check.role),
    reason: noteText(check.reason),
    warning: noteText(check.warning),
    certificateSubject: str(leaf?.subject),
    certificateIssuer: str(leaf?.issuer),
    certificateValidUntil: str(leaf?.notValidAfter),
  };
  switch (check.result) {
    case "trusted":
      return { ...base, tone: "trusted", label: "Trusted", color: "#2e7d32" };
    case "not_trusted":
      return { ...base, tone: "not_trusted", label: "Not trusted", color: "#d32f2f" };
    case "not_found":
      return { ...base, tone: "not_trusted", label: "Not in the trusted lists", color: "#d32f2f" };
    case "not_applicable":
      return { ...base, tone: "not_checked", label: "Not checked", color: COLORS.secondary };
    default:
      return { ...base, tone: "failed", label: "Check failed", color: COLORS.orange };
  }
}
