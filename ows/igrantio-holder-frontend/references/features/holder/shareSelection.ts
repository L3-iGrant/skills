/**
 * Framework-agnostic selection engine for the holder's "share credentials"
 * flow (OpenID4VP + DCQL). Mirrors the rules of the iGrant.io dashboard:
 *
 *   verification/receive → verification/{id}/filter → pre-flight validation
 *   → build a step-per-credential-set wizard model → user selects → uniform
 *   submission payload → verification/{presentationId}/send.
 *
 * Pure data + functions; the React layer (useHolder.ts) holds the state.
 */

export interface DcqlClaim {
  id?: string;
  path?: Array<string | number>;
  [k: string]: unknown;
}

export interface DcqlCredential {
  id: string;
  format?: string;
  multiple?: boolean;
  claims?: DcqlClaim[];
  /** Disclosure profiles: each entry is a list of claim ids. */
  claim_sets?: string[][];
  meta?: {
    vct_values?: string[];
    doctype_value?: string;
    type_values?: string[][];
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export interface CredentialSet {
  /** OR alternatives: each option is a list of dcql credential ids. */
  options: string[][];
  required?: boolean;
  purpose?: unknown;
  [k: string]: unknown;
}

export interface DcqlQuery {
  credentials?: DcqlCredential[];
  credential_sets?: CredentialSet[];
  [k: string]: unknown;
}

export interface MatchedCredential {
  credentialId: string;
  /** The matched claims of the held credential (for previews). */
  match?: Record<string, unknown>;
  vct?: string;
  doctype?: string;
  type?: string | string[];
  [k: string]: unknown;
}

/** One entry of the filter response (`inputDescriptors` / `inputDescriptor` / `credentials`). */
export interface FilterDescriptor {
  id: string;
  name?: string;
  purpose?: string;
  matchedCredentials?: MatchedCredential[];
  [k: string]: unknown;
}

const matchCount = (d: FilterDescriptor | undefined): number => d?.matchedCredentials?.length ?? 0;

/**
 * Pre-flight rule, run before opening any share UI. Asymmetric on purpose:
 * with credential_sets, optional alternatives may legitimately have zero
 * matches, so only "no required set is completable" or "everything empty"
 * fails; without credential_sets every descriptor is mandatory.
 * The dashboard surfaces this as "Requested data is not present in holder".
 */
export function preflightError(
  descriptors: FilterDescriptor[],
  query: DcqlQuery | undefined,
): "mandatory_missing" | null {
  if (!descriptors.length) return "mandatory_missing";
  const byId = new Map(descriptors.map((d) => [d.id, d]));
  const sets = query?.credential_sets;
  if (sets?.length) {
    for (const set of sets) {
      if (!set.required) continue;
      const completable = set.options.some((opt) => opt.every((id) => matchCount(byId.get(id)) > 0));
      if (!completable) return "mandatory_missing";
    }
    return descriptors.every((d) => matchCount(d) === 0) ? "mandatory_missing" : null;
  }
  return descriptors.some((d) => matchCount(d) === 0) ? "mandatory_missing" : null;
}

/** Wizard ordering: required sets first; among required, single-choice sets first. */
export function sortCredentialSets(sets: CredentialSet[]): CredentialSet[] {
  const singleChoice = (s: CredentialSet) => s.options.length === 1 && s.options[0].length === 1;
  return [...sets].sort((a, b) => {
    if (!!a.required !== !!b.required) return a.required ? -1 : 1;
    if (a.required && b.required && singleChoice(a) !== singleChoice(b)) {
      return singleChoice(a) ? -1 : 1;
    }
    return 0;
  });
}

export interface ShareDescriptor {
  id: string;
  title?: string;
  purpose?: string;
  multiple: boolean;
  /** Disclosure profiles from the dcql credential; radio-select one whole set. */
  claimSets?: string[][];
  claims?: DcqlClaim[];
  format?: string;
  matches: MatchedCredential[];
}

export interface ShareOption {
  ids: string[];
  descriptors: ShareDescriptor[];
  /** True when every id in the option has at least one match. */
  complete: boolean;
}

export interface ShareStep {
  required: boolean;
  /** Option groups that still contain at least one matched descriptor. */
  options: ShareOption[];
  /** Render OR alternatives as radios when the set has more than one option. */
  radioMode: boolean;
  /** Offer a "None" radio: optional set, several options, multi-step wizard. */
  allowNone: boolean;
  purpose?: unknown;
}

export interface ShareModel {
  steps: ShareStep[];
}

export function buildShareModel(
  descriptors: FilterDescriptor[],
  query: DcqlQuery | undefined,
): ShareModel {
  const byId = new Map(descriptors.map((d) => [d.id, d]));
  const dcqlById = new Map((query?.credentials ?? []).map((c) => [c.id, c]));

  const toShareDescriptor = (id: string): ShareDescriptor | null => {
    const d = byId.get(id);
    if (!d || matchCount(d) === 0) return null;
    const dcql = dcqlById.get(id);
    return {
      id,
      title: d.name,
      purpose: d.purpose,
      multiple: dcql?.multiple === true,
      claimSets: dcql?.claim_sets?.length ? dcql.claim_sets : undefined,
      claims: dcql?.claims,
      format: dcql?.format,
      matches: d.matchedCredentials ?? [],
    };
  };

  const buildOption = (ids: string[]): ShareOption => {
    const shown = ids.map(toShareDescriptor).filter((d): d is ShareDescriptor => d !== null);
    return { ids, descriptors: shown, complete: ids.every((id) => matchCount(byId.get(id)) > 0) };
  };

  const sets = query?.credential_sets;
  if (sets?.length) {
    const sorted = sortCredentialSets(sets);
    const steps = sorted.map((set): ShareStep => {
      const options = set.options.map(buildOption).filter((o) => o.descriptors.length > 0);
      const required = set.required === true;
      return {
        required,
        options,
        radioMode: set.options.length > 1,
        allowNone: !required && options.length > 1 && sorted.length > 1,
        purpose: set.purpose,
      };
    });
    return { steps: steps.filter((s) => s.options.length > 0) };
  }

  // No credential_sets: one implicit required step, one group, all matched shown.
  const all = buildOption(descriptors.map((d) => d.id));
  return { steps: all.descriptors.length ? [{ required: true, options: [all], radioMode: false, allowNone: false }] : [] };
}

export interface ShareSelection {
  /** Per step index: chosen option index, or "none", or null (nothing yet). */
  option: Record<number, number | "none" | null>;
  /** Per descriptor id: chosen held-credential id (single-pick descriptors). */
  credential: Record<string, string>;
  /** Per descriptor id: chosen held-credential ids (multiple:true descriptors). */
  credentials: Record<string, string[]>;
  /** Per descriptor id: chosen claim-set index (defaults to 0). */
  claimSet: Record<string, number>;
  /** Per descriptor id: checkbox state for optional non-radio steps. */
  included: Record<string, boolean>;
}

function defaultsForOption(
  step: ShareStep,
  option: ShareOption,
  sel: ShareSelection,
  included: boolean,
): void {
  for (const d of option.descriptors) {
    sel.included[d.id] = included;
    sel.credential[d.id] = d.matches[0]?.credentialId ?? "";
    // multiple:true only preselects the first instance when the set is required.
    sel.credentials[d.id] = d.multiple && included && step.required && d.matches[0]
      ? [d.matches[0].credentialId]
      : [];
    sel.claimSet[d.id] = 0;
  }
}

/**
 * Preselection: required radio steps pick option 0; optional radio steps pick
 * "None" when offered; single-group required steps are locked on; optional
 * single-group steps start unchecked.
 */
export function initialSelection(model: ShareModel): ShareSelection {
  const sel: ShareSelection = { option: {}, credential: {}, credentials: {}, claimSet: {}, included: {} };
  model.steps.forEach((step, i) => {
    if (step.radioMode) {
      const choice = step.required ? 0 : step.allowNone ? ("none" as const) : 0;
      sel.option[i] = choice;
      step.options.forEach((opt, oi) => defaultsForOption(step, opt, sel, choice === oi));
    } else {
      sel.option[i] = 0;
      defaultsForOption(step, step.options[0], sel, step.required);
    }
  });
  return sel;
}

const clone = (sel: ShareSelection): ShareSelection => ({
  option: { ...sel.option },
  credential: { ...sel.credential },
  credentials: { ...sel.credentials },
  claimSet: { ...sel.claimSet },
  included: { ...sel.included },
});

/** Radio change: reset the whole step, then enable the chosen option's descriptors. */
export function selectOption(
  model: ShareModel,
  sel: ShareSelection,
  stepIndex: number,
  choice: number | "none",
): ShareSelection {
  const next = clone(sel);
  const step = model.steps[stepIndex];
  next.option[stepIndex] = choice;
  step.options.forEach((opt, oi) => defaultsForOption(step, opt, next, choice === oi));
  return next;
}

/** Checkbox on optional single-group steps (required groups are locked on). */
export function toggleDescriptor(
  model: ShareModel,
  sel: ShareSelection,
  stepIndex: number,
  descriptorId: string,
  checked: boolean,
): ShareSelection {
  const step = model.steps[stepIndex];
  if (step.required && !step.radioMode) return sel; // locked on
  const next = clone(sel);
  next.included[descriptorId] = checked;
  return next;
}

/** Pick the held credential for a single-pick descriptor. */
export function setCredential(sel: ShareSelection, descriptorId: string, credentialId: string): ShareSelection {
  const next = clone(sel);
  next.credential[descriptorId] = credentialId;
  return next;
}

/** Toggle one instance of a multiple:true descriptor. */
export function toggleInstance(sel: ShareSelection, descriptorId: string, credentialId: string): ShareSelection {
  const next = clone(sel);
  const current = next.credentials[descriptorId] ?? [];
  next.credentials[descriptorId] = current.includes(credentialId)
    ? current.filter((id) => id !== credentialId)
    : [...current, credentialId];
  return next;
}

/** Radio-select a whole claim set (disclosure profile) for a descriptor. */
export function chooseClaimSet(sel: ShareSelection, descriptorId: string, index: number): ShareSelection {
  const next = clone(sel);
  next.claimSet[descriptorId] = index;
  return next;
}

function satisfied(d: ShareDescriptor, sel: ShareSelection): boolean {
  return d.multiple ? (sel.credentials[d.id]?.length ?? 0) > 0 : !!sel.credential[d.id];
}

/**
 * Submit gating. Radio steps: "None" passes only for optional sets; a chosen
 * option needs every descriptor satisfied. Non-radio steps: required → all
 * satisfied; optional single-step → at least one included; optional step in a
 * multi-step wizard never blocks (its included descriptors must be satisfied).
 */
export function canSubmit(model: ShareModel, sel: ShareSelection): boolean {
  if (!model.steps.length) return false;
  return model.steps.every((step, i) => {
    if (step.radioMode) {
      const choice = sel.option[i];
      if (choice === null || choice === undefined) return false;
      if (choice === "none") return !step.required;
      const opt = step.options[choice];
      return !!opt && opt.descriptors.every((d) => satisfied(d, sel));
    }
    const descriptors = step.options[0]?.descriptors ?? [];
    if (step.required) return descriptors.every((d) => satisfied(d, sel));
    const included = descriptors.filter((d) => sel.included[d.id]);
    if (model.steps.length === 1) return included.length > 0 && included.every((d) => satisfied(d, sel));
    return included.every((d) => satisfied(d, sel));
  });
}

export interface SubmissionItem {
  id: string;
  credentialId?: string;
  credentialIds?: string[];
  claimIds?: string[];
}

/**
 * Uniform payload shape, decided globally over the whole array:
 * any claim sets → items carry claimIds; else any multiple:true → every item
 * uses credentialIds arrays; else every item uses a credentialId string.
 * Wrap as `{ credentials: items }` when the record has a dcqlQuery, or
 * `{ inputDescriptors: items }` for legacy Presentation Exchange.
 */
export function buildSubmissionPayload(model: ShareModel, sel: ShareSelection): SubmissionItem[] {
  const chosen: ShareDescriptor[] = [];
  model.steps.forEach((step, i) => {
    if (step.radioMode) {
      const choice = sel.option[i];
      if (typeof choice === "number") chosen.push(...(step.options[choice]?.descriptors ?? []));
      return;
    }
    const descriptors = step.options[0]?.descriptors ?? [];
    chosen.push(...descriptors.filter((d) => step.required || sel.included[d.id]));
  });

  const claimIdsOf = (d: ShareDescriptor): string[] | undefined => {
    if (!d.claimSets?.length) return undefined;
    const set = d.claimSets[sel.claimSet[d.id] ?? 0] ?? d.claimSets[0];
    return set?.length ? set : undefined;
  };

  const anyClaims = chosen.some((d) => claimIdsOf(d)?.length);
  const anyMultiple = chosen.some((d) => d.multiple);

  return chosen.map((d) => {
    const claimIds = claimIdsOf(d);
    if (anyClaims) {
      const item: SubmissionItem = d.multiple
        ? { id: d.id, credentialIds: sel.credentials[d.id] ?? [] }
        : { id: d.id, credentialId: sel.credential[d.id] ?? "" };
      if (claimIds?.length) item.claimIds = claimIds;
      return item;
    }
    if (anyMultiple) {
      const ids = d.multiple
        ? sel.credentials[d.id] ?? []
        : sel.credential[d.id]
          ? [sel.credential[d.id]]
          : [];
      return { id: d.id, credentialIds: ids };
    }
    return { id: d.id, credentialId: sel.credential[d.id] ?? "" };
  });
}

/** Metadata keys never shown in claim previews (after `$.` prefix stripping). */
const EXCLUDED_MATCH_KEYS = new Set([
  "exp", "iat", "iss", "jti", "nbf", "sub", "vct", "status", "cnf", "kb",
  "dataAgreement", "transaction_data_types", "schema_uri#integrity", "_sd_alg",
]);

export function shouldExcludeMatchKey(rawKey: string): boolean {
  const key = rawKey
    .replace(/^\$\.vc\.credentialSubject\./, "")
    .replace(/^\$\.credentialSubject\./, "")
    .replace(/^\$\./, "");
  return (
    EXCLUDED_MATCH_KEYS.has(key) ||
    key.startsWith("vct") ||
    key.startsWith("transaction_data_types")
  );
}

export interface ClaimEntry {
  key: string;
  value: unknown;
}

/**
 * Preview of the claims that WILL be disclosed for one matched credential.
 * With a claim set selected, resolve each claim id's `path` against the match
 * per format (mdoc: namespace/dotted/flat fallbacks; jwt: drop the leading
 * `credentialSubject` segment). Without claim sets, show every match entry
 * minus the excluded metadata keys. An empty claim set previews nothing - it
 * does not fall back to showing everything.
 */
export function claimPreview(
  descriptor: ShareDescriptor,
  matched: MatchedCredential,
  claimSetIndex: number,
): ClaimEntry[] {
  const match = matched.match ?? {};

  if (descriptor.claimSets?.length) {
    const setIds = descriptor.claimSets[claimSetIndex] ?? descriptor.claimSets[0] ?? [];
    const claimsById = new Map((descriptor.claims ?? []).map((c) => [c.id ?? "", c]));
    const entries: ClaimEntry[] = [];
    for (const claimId of setIds) {
      const claim = claimsById.get(claimId);
      const path = claim?.path?.map(String) ?? [];
      if (!path.length) continue;
      const isMdoc = descriptor.format === "mso_mdoc" || !!matched.doctype;
      const isJwt = path[0] === "credentialSubject";
      let value: unknown;
      let key: string;
      if (isMdoc && path.length >= 2) {
        const [ns, ...rest] = path;
        const field = rest.join(".");
        const nsObj = match[ns];
        value =
          (nsObj && typeof nsObj === "object" ? (nsObj as Record<string, unknown>)[field] : undefined) ??
          match[path.join(".")] ??
          match[field];
        key = path.join(".");
      } else {
        const effective = isJwt ? path.slice(1) : path;
        let cursor: unknown = match;
        for (const seg of effective) {
          cursor = cursor && typeof cursor === "object" ? (cursor as Record<string, unknown>)[seg] : undefined;
        }
        value = cursor ?? match[effective.join(".")];
        key = effective.join(".");
      }
      if (value === undefined) continue;
      if (value && typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length) continue;
      entries.push({ key, value });
    }
    return entries;
  }

  return Object.entries(match)
    .filter(([k]) => !shouldExcludeMatchKey(k))
    .map(([key, value]) => ({
      key: key
        .replace(/^\$\.vc\.credentialSubject\./, "")
        .replace(/^\$\.credentialSubject\./, "")
        .replace(/^\$\./, ""),
      value,
    }));
}
