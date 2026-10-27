/**
 * iGrant.io Consent BB client (admin Individual API + individual Consent-Record API).
 * Dependency-free (fetch). Runs server-side only - it carries the org API key.
 *
 * All requests send `Authorization: ApiKey <YOUR_API_KEY>`. Consent-record
 * requests also send `X-ConsentBB-IndividualId: <individualId>`: the API takes
 * the individual from this header, not from the path or the query. Paths are
 * under `/v2`.
 */

export interface ConsentClientConfig {
  /** OWS base URL, e.g. https://demo-api.igrant.io */
  owsBaseUrl: string;
  /** Organisation API key (server-side only). */
  apiKey: string;
  fetchFn?: typeof fetch;
}

export class ConsentApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`Consent API request failed (${status}): ${body}`);
    this.name = "ConsentApiError";
  }
}

// ---------------------------------------------------------------- types ---

export interface Individual {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  externalId?: string;
  externalIdType?: string;
  identityProviderId?: string;
  iamId?: string;
  pushNotificationToken?: string;
  deviceType?: "android" | "ios";
  mapperId?: string;
  [k: string]: unknown;
}

export interface Pagination {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  limit: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ConsentRecord {
  id?: string;
  dataAgreementId: string;
  dataAgreementRevisionId?: string;
  dataAgreementRevisionHash?: string;
  individualId: string;
  optIn: boolean;
  state?: "unsigned" | "signed";
  signatureId?: string;
  sectorPreferences?: { sector: string; optIn: boolean; isLastUpdated?: boolean }[];
  [k: string]: unknown;
}

export interface ConsentRecordHistory {
  id: string;
  organisationId: string;
  dataAgreementId: string;
  consentRecordId: string;
  individualId: string;
  log: string;
  timestamp: string;
  sectorName?: string;
}

/** Body of a consent-record update: the whole record, or one sector of it. */
export type ConsentRecordUpdate =
  | { optIn: boolean }
  | { sectorPreference: { sector: string; optIn: boolean } };

export interface ListParams {
  limit?: number;
  offset?: number;
}

const P = {
  createIndividual: "/v2/config/individual",
  individual: (id: string) => `/v2/config/individual/${id}`,
  individuals: "/v2/config/individuals",
  recordForAgreement: (dataAgreementId: string) =>
    `/v2/service/individual/record/data-agreement/${dataAgreementId}`,
  consentRecords: "/v2/service/individual/record/consent-record",
  consentRecord: (consentRecordId: string) =>
    `/v2/service/individual/record/consent-record/${consentRecordId}`,
  consentRecordHistory: "/v2/service/individual/record/consent-record/history",
  allRecords: "/v2/service/individual/record",
} as const;

export interface ConsentClient {
  /** Admin Individual API - organisation-scoped. */
  individuals: {
    create(individual: Individual): Promise<{ individual: Individual }>;
    read(individualId: string): Promise<{ individual: Individual }>;
    update(individualId: string, individual: Individual): Promise<{ individual: Individual }>;
    /**
     * With `externalIndividualId` the list holds that one individual; an unknown
     * external id gives an error (HTTP 500), not an empty list.
     */
    list(
      params: ListParams & { externalIndividualId?: string; search?: string },
    ): Promise<{ individuals: Individual[]; pagination: Pagination }>;
  };
  /** Individual Consent-Record API - acts on behalf of one individual. */
  consentRecords: {
    /**
     * Record consent for a data agreement (first time). The new record is always
     * opted in (`optIn: true`); withdraw with `update`. A second create for the
     * same data agreement gives HTTP 400. Without `revisionId` the record uses
     * the latest revision of the data agreement.
     */
    create(
      individualId: string,
      dataAgreementId: string,
      opts?: { revisionId?: string },
    ): Promise<{ consentRecord: ConsentRecord; revision: unknown }>;
    /** Read the individual's consent record for a data agreement; `null` when there is none. */
    read(
      individualId: string,
      dataAgreementId: string,
    ): Promise<{ consentRecord: ConsentRecord | null }>;
    /** List all consent records for the individual (paginated). */
    list(
      individualId: string,
      params?: ListParams,
    ): Promise<{ consentRecords: ConsentRecord[]; pagination: Pagination }>;
    /**
     * Update an existing consent record (allow/withdraw, or one sector). The
     * record moves to the latest revision of its data agreement and becomes
     * `unsigned`.
     */
    update(
      individualId: string,
      consentRecordId: string,
      body: ConsentRecordUpdate,
    ): Promise<{ consentRecord: ConsentRecord; revision: unknown }>;
    /** Consent-record change history for the individual (paginated). */
    history(
      individualId: string,
      params?: ListParams,
    ): Promise<{ consentRecordHistory: ConsentRecordHistory[]; pagination: Pagination }>;
    /** Delete all of the individual's consent records (right to be forgotten). */
    deleteAll(individualId: string): Promise<void>;
  };
  request<T>(method: string, path: string, opts?: { body?: unknown; individualId?: string }): Promise<T>;
}

export function createConsentClient(config: ConsentClientConfig): ConsentClient {
  const base = config.owsBaseUrl.replace(/\/$/, "");
  const doFetch = config.fetchFn ?? fetch;

  async function request<T>(
    method: string,
    path: string,
    opts: { body?: unknown; individualId?: string } = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: config.apiKey.startsWith("ApiKey ") ? config.apiKey : `ApiKey ${config.apiKey}`,
    };
    if (opts.individualId) headers["X-ConsentBB-IndividualId"] = opts.individualId;

    const res = await doFetch(`${base}${path}`, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) throw new ConsentApiError(res.status, text);
    // Some operations (for example delete all records) answer 200 with no body.
    return (text.trim() === "" ? undefined : JSON.parse(text)) as T;
  }

  const qs = (params: Record<string, string | number | undefined>): string => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined) sp.set(k, String(v));
    const s = sp.toString();
    return s ? `?${s}` : "";
  };

  return {
    individuals: {
      create: (individual) => request("POST", P.createIndividual, { body: { individual } }),
      read: (id) => request("GET", P.individual(id)),
      update: (id, individual) => request("PUT", P.individual(id), { body: { individual } }),
      list: ({ limit = 10, offset = 0, externalIndividualId, search }) =>
        request("GET", P.individuals + qs({ limit, offset, externalIndividualId, search })),
    },
    consentRecords: {
      create: (individualId, dataAgreementId, opts) =>
        request("POST", P.recordForAgreement(dataAgreementId) + qs({ revisionId: opts?.revisionId }), {
          individualId,
        }),
      read: (individualId, dataAgreementId) =>
        request("GET", P.recordForAgreement(dataAgreementId), { individualId }),
      list: (individualId, { limit = 10, offset = 0 } = {}) =>
        request("GET", P.consentRecords + qs({ limit, offset }), { individualId }),
      update: (individualId, consentRecordId, body) =>
        request("PUT", P.consentRecord(consentRecordId), { individualId, body }),
      history: (individualId, { limit = 10, offset = 0 } = {}) =>
        request("GET", P.consentRecordHistory + qs({ limit, offset }), { individualId }),
      deleteAll: (individualId) => request("DELETE", P.allRecords, { individualId }),
    },
    request,
  };
}
