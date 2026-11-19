/**
 * Framework-agnostic selection engine for the "share credentials" flow of
 * the holder (OpenID4VP 1.0 + DCQL):
 *
 *   POST .../presentations -> .../{presentationId}/matching-credentials
 *   -> pre-flight check -> one wizard step for each credential set
 *   -> the user selects -> the submission items -> .../{presentationId}/response
 *
 * Pure data and functions; the React layer (useHolder.ts) holds the state.
 */

export interface DcqlClaim {
  id?: string;
  path?: Array<string | number | null>;
  [k: string]: unknown;
}

export interface DcqlCredentialQuery {
  id: string;
  format?: string;
  multiple?: boolean;
  claims?: DcqlClaim[];
  /** Disclosure options: each entry is a list of claim ids. */
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
  /** Alternatives: each option is a list of credential query ids. */
  options: string[][];
  /** OpenID4VP 1.0: `true` when it is left out. */
  required?: boolean;
  purpose?: unknown;
  [k: string]: unknown;
}

export interface DcqlQuery {
  credentials?: DcqlCredentialQuery[];
  credential_sets?: CredentialSet[];
  [k: string]: unknown;
}

export interface MatchedCredential {
  credentialId: string;
  /** The claims of the held credential that answer the query (for previews). */
  match?: Record<string, unknown>;
  vct?: string;
  doctype?: string;
  type?: string[];
  /** The `claim_sets` options that this credential answers. */
  claimSets?: string[][];
  [k: string]: unknown;
}

/** One entry of the matching-credentials answer: one credential query. */
export interface CredentialQueryMatches {
  id: string;
  name?: string;
  purpose?: string;
  matchedCredentials?: MatchedCredential[] | null;
  /** The `claim_sets` options that a match answers, in the order of preference of the verifier. */
  claimSets?: string[][];
  /** Present only when `true`. */
  multiple?: boolean;
  [k: string]: unknown;
}

const matchCount = (q: CredentialQueryMatches | undefined): number => q?.matchedCredentials?.length ?? 0;
const isRequired = (set: CredentialSet): boolean => set.required !== false;

/**
 * Pre-flight rule, run before any share user interface opens. With
 * credential sets, each required set needs one option whose queries all
 * have matches; optional sets can match nothing. Without credential sets,
 * every credential query needs a match. Show a failure as "The wallet does
 * not hold the requested data".
 */
export function preflightError(
  queries: CredentialQueryMatches[],
  dcql: DcqlQuery | null | undefined,
): "mandatory_missing" | null {
  if (!queries.length) return "mandatory_missing";
  const byId = new Map(queries.map((q) => [q.id, q]));
  const sets = dcql?.credential_sets;
  if (sets?.length) {
    for (const set of sets) {
      if (!isRequired(set)) continue;
      const completable = set.options.some((opt) => opt.every((id) => matchCount(byId.get(id)) > 0));
      if (!completable) return "mandatory_missing";
    }
    return queries.every((q) => matchCount(q) === 0) ? "mandatory_missing" : null;
  }
  return queries.some((q) => matchCount(q) === 0) ? "mandatory_missing" : null;
}

/** Wizard order: required sets first; among required sets, the single-choice sets first. */
export function sortCredentialSets(sets: CredentialSet[]): CredentialSet[] {
  const singleChoice = (s: CredentialSet) => s.options.length === 1 && s.options[0].length === 1;
  return [...sets].sort((a, b) => {
    if (isRequired(a) !== isRequired(b)) return isRequired(a) ? -1 : 1;
    if (isRequired(a) && isRequired(b) && singleChoice(a) !== singleChoice(b)) {
      return singleChoice(a) ? -1 : 1;
    }
    return 0;
  });
}

export interface ShareQuery {
  id: string;
  title?: string;
  purpose?: string;
  multiple: boolean;
  /** Disclosure options; the user picks one whole option with a radio. */
  claimSets?: string[][];
  claims?: DcqlClaim[];
  format?: string;
  matches: MatchedCredential[];
}

export interface ShareOption {
  ids: string[];
  queries: ShareQuery[];
  /** True when every query of the option has at least one match. */
  complete: boolean;
}

export interface ShareStep {
  required: boolean;
  /** Options that still contain at least one matched query. */
  options: ShareOption[];
  /** Show the alternatives as radios when the set has more than one option. */
  radioMode: boolean;
  /** Offer a "None" radio: an optional set, several options, a wizard with several steps. */
  allowNone: boolean;
  purpose?: unknown;
}

export interface ShareModel {
  steps: ShareStep[];
}

export function buildShareModel(
  queries: CredentialQueryMatches[],
  dcql: DcqlQuery | null | undefined,
): ShareModel {
  const byId = new Map(queries.map((q) => [q.id, q]));
  const dcqlById = new Map((dcql?.credentials ?? []).map((c) => [c.id, c]));

  const toShareQuery = (id: string): ShareQuery | null => {
    const q = byId.get(id);
    if (!q || matchCount(q) === 0) return null;
    const dcqlQuery = dcqlById.get(id);
    const claimSets = q.claimSets?.length ? q.claimSets : dcqlQuery?.claim_sets;
    return {
      id,
      title: q.name,
      purpose: q.purpose,
      multiple: q.multiple === true || dcqlQuery?.multiple === true,
      claimSets: claimSets?.length ? claimSets : undefined,
      claims: dcqlQuery?.claims,
      format: dcqlQuery?.format,
      matches: q.matchedCredentials ?? [],
    };
  };

  const buildOption = (ids: string[]): ShareOption => {
    const shown = ids.map(toShareQuery).filter((q): q is ShareQuery => q !== null);
    return { ids, queries: shown, complete: ids.every((id) => matchCount(byId.get(id)) > 0) };
  };

  const sets = dcql?.credential_sets;
  if (sets?.length) {
    const sorted = sortCredentialSets(sets);
    const steps = sorted.map((set): ShareStep => {
      const options = set.options.map(buildOption).filter((o) => o.queries.length > 0);
      const required = isRequired(set);
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

  // No credential sets: one required step with one option that holds every query.
  const all = buildOption(queries.map((q) => q.id));
  return { steps: all.queries.length ? [{ required: true, options: [all], radioMode: false, allowNone: false }] : [] };
}

export interface ShareSelection {
  /** For each step index: the chosen option index, "none", or null (nothing yet). */
  option: Record<number, number | "none" | null>;
  /** For each query id: the chosen held credential id (single pick). */
  credential: Record<string, string>;
  /** For each query id: the chosen held credential ids (`multiple: true`). */
  credentials: Record<string, string[]>;
  /** For each query id: the chosen claim set index (default 0). */
  claimSet: Record<string, number>;
  /** For each query id: the checkbox state on an optional step without radios. */
  included: Record<string, boolean>;
}

function defaultsForOption(step: ShareStep, option: ShareOption, sel: ShareSelection, included: boolean): void {
  for (const q of option.queries) {
    sel.included[q.id] = included;
    sel.credential[q.id] = q.matches[0]?.credentialId ?? "";
    // multiple: true preselects the first credential only on a required set.
    sel.credentials[q.id] = q.multiple && included && step.required && q.matches[0] ? [q.matches[0].credentialId] : [];
    sel.claimSet[q.id] = firstAnsweredClaimSet(q, q.matches[0]);
  }
}

/**
 * Preselection: a required radio step picks option 0; an optional radio step
 * picks "None" when it is offered; a required step without radios is locked
 * on; an optional step without radios starts unchecked.
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

/** Radio change: reset the whole step, then turn on the queries of the chosen option. */
export function selectOption(model: ShareModel, sel: ShareSelection, stepIndex: number, choice: number | "none"): ShareSelection {
  const next = clone(sel);
  const step = model.steps[stepIndex];
  next.option[stepIndex] = choice;
  step.options.forEach((opt, oi) => defaultsForOption(step, opt, next, choice === oi));
  return next;
}

/** Checkbox on an optional step without radios (a required step is locked on). */
export function toggleQuery(
  model: ShareModel,
  sel: ShareSelection,
  stepIndex: number,
  queryId: string,
  checked: boolean,
): ShareSelection {
  const step = model.steps[stepIndex];
  if (step.required && !step.radioMode) return sel;
  const next = clone(sel);
  next.included[queryId] = checked;
  return next;
}

/** Pick the held credential of a single-pick query. */
export function setCredential(sel: ShareSelection, queryId: string, credentialId: string): ShareSelection {
  const next = clone(sel);
  next.credential[queryId] = credentialId;
  return next;
}

/** Toggle one credential of a `multiple: true` query. */
export function toggleInstance(sel: ShareSelection, queryId: string, credentialId: string): ShareSelection {
  const next = clone(sel);
  const current = next.credentials[queryId] ?? [];
  next.credentials[queryId] = current.includes(credentialId)
    ? current.filter((id) => id !== credentialId)
    : [...current, credentialId];
  return next;
}

/** Pick one whole claim set (disclosure option) of a query. */
export function chooseClaimSet(sel: ShareSelection, queryId: string, index: number): ShareSelection {
  const next = clone(sel);
  next.claimSet[queryId] = index;
  return next;
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join("\u0000") === [...b].sort().join("\u0000");

/**
 * Whether a held credential answers a claim set option. A match gives the
 * options that it answers; without that list, every option is open.
 */
export function claimSetAnswered(query: ShareQuery, matched: MatchedCredential | undefined, index: number): boolean {
  const option = query.claimSets?.[index];
  if (!option) return false;
  if (!matched?.claimSets) return true;
  return matched.claimSets.some((s) => sameSet(s, option));
}

function firstAnsweredClaimSet(query: ShareQuery, matched: MatchedCredential | undefined): number {
  if (!query.claimSets?.length) return 0;
  const index = query.claimSets.findIndex((_, i) => claimSetAnswered(query, matched, i));
  return index < 0 ? 0 : index;
}

function satisfied(q: ShareQuery, sel: ShareSelection): boolean {
  const picked = q.multiple ? (sel.credentials[q.id]?.length ?? 0) > 0 : !!sel.credential[q.id];
  if (!picked || !q.claimSets?.length) return picked;
  // With claim sets, the chosen option must be one that the chosen credential answers.
  const ids = q.multiple ? sel.credentials[q.id] ?? [] : [sel.credential[q.id]];
  const index = sel.claimSet[q.id] ?? 0;
  return ids.every((id) => claimSetAnswered(q, q.matches.find((m) => m.credentialId === id), index));
}

/**
 * Submit gating. Radio steps: "None" passes only for optional sets; a chosen
 * option needs every query satisfied. Steps without radios: required, all
 * satisfied; the only step and optional, at least one included; an optional
 * step in a wizard with several steps never blocks (its included queries
 * must be satisfied).
 */
export function canSubmit(model: ShareModel, sel: ShareSelection): boolean {
  if (!model.steps.length) return false;
  return model.steps.every((step, i) => {
    if (step.radioMode) {
      const choice = sel.option[i];
      if (choice === null || choice === undefined) return false;
      if (choice === "none") return !step.required;
      const opt = step.options[choice];
      return !!opt && opt.queries.every((q) => satisfied(q, sel));
    }
    const queries = step.options[0]?.queries ?? [];
    if (step.required) return queries.every((q) => satisfied(q, sel));
    const included = queries.filter((q) => sel.included[q.id]);
    if (model.steps.length === 1) return included.length > 0 && included.every((q) => satisfied(q, sel));
    return included.every((q) => satisfied(q, sel));
  });
}

export interface SubmissionItem {
  id: string;
  credentialId?: string;
  credentialIds?: string[];
  claimIds?: string[];
}

/**
 * The `credentials` items of the response call. The wallet takes the form
 * of the first item for every item: when any chosen query has
 * `multiple: true`, every item uses a `credentialIds` list; else every item
 * uses a `credentialId` text. `claimIds` is only on the items of a query
 * with claim sets, and names one option exactly.
 */
export function buildSubmissionPayload(model: ShareModel, sel: ShareSelection): SubmissionItem[] {
  const chosen: ShareQuery[] = [];
  model.steps.forEach((step, i) => {
    if (step.radioMode) {
      const choice = sel.option[i];
      if (typeof choice === "number") chosen.push(...(step.options[choice]?.queries ?? []));
      return;
    }
    const queries = step.options[0]?.queries ?? [];
    chosen.push(...queries.filter((q) => step.required || sel.included[q.id]));
  });

  const anyMultiple = chosen.some((q) => q.multiple);

  return chosen.map((q) => {
    const item: SubmissionItem = { id: q.id };
    if (anyMultiple) {
      item.credentialIds = q.multiple
        ? sel.credentials[q.id] ?? []
        : sel.credential[q.id]
          ? [sel.credential[q.id]]
          : [];
    } else {
      item.credentialId = sel.credential[q.id] ?? "";
    }
    if (q.claimSets?.length) {
      item.claimIds = q.claimSets[sel.claimSet[q.id] ?? 0] ?? q.claimSets[0];
    }
    return item;
  });
}

/** Metadata keys that a claim preview never shows (after the `$.` prefix is removed). */
const EXCLUDED_MATCH_KEYS = new Set([
  "exp", "iat", "iss", "jti", "nbf", "sub", "vct", "status", "cnf", "kb",
  "dataAgreement", "transaction_data_types", "schema_uri#integrity", "_sd_alg",
]);

export function shouldExcludeMatchKey(rawKey: string): boolean {
  const key = rawKey
    .replace(/^\$\.vc\.credentialSubject\./, "")
    .replace(/^\$\.credentialSubject\./, "")
    .replace(/^\$\./, "");
  return EXCLUDED_MATCH_KEYS.has(key) || key.startsWith("vct") || key.startsWith("transaction_data_types");
}

export interface ClaimEntry {
  key: string;
  value: unknown;
}

/**
 * Preview of the claims that the wallet WILL disclose for one matched
 * credential. With claim sets, resolve the `path` of each claim id of the
 * chosen option against the match, per format (mdoc: namespace, dotted and
 * flat lookups; W3C VC: drop the leading `credentialSubject` segment).
 * Without claim sets, show every match entry except the metadata keys. An
 * empty claim set shows nothing.
 */
export function claimPreview(query: ShareQuery, matched: MatchedCredential, claimSetIndex: number): ClaimEntry[] {
  const match = matched.match ?? {};

  if (query.claimSets?.length) {
    const setIds = query.claimSets[claimSetIndex] ?? query.claimSets[0] ?? [];
    const claimsById = new Map((query.claims ?? []).map((c) => [c.id ?? "", c]));
    const entries: ClaimEntry[] = [];
    for (const claimId of setIds) {
      const claim = claimsById.get(claimId);
      const path = (claim?.path ?? []).filter((s) => s !== null).map(String);
      if (!path.length) continue;
      const isMdoc = query.format === "mso_mdoc" || !!matched.doctype;
      const isW3c = path[0] === "credentialSubject";
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
        const effective = isW3c ? path.slice(1) : path;
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
