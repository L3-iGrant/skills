/**
 * iGrant.io Consent BB client (admin Individual API + individual Consent-Record API).
 * Dependency-free (fetch). Runs server-side only - it carries the org API key.
 *
 * All requests send `Authorization: ApiKey <key>`. Consent-record requests also
 * send `X-ConsentBB-IndividualId: <individualId>`. Paths are under `/v2`.
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
    list(
      params: ListParams & { externalIndividualId?: string },
    ): Promise<{ individuals: Individual[]; pagination: Pagination }>;
  };
  /** Individual Consent-Record API - acts on behalf of one individual. */
  consentRecords: {
    /** Record consent for a data agreement (first time). */
    create(
      individualId: string,
      dataAgreementId: string,
      body?: { optIn?: boolean },
      opts?: { revisionId?: string },
    ): Promise<{ consentRecord: ConsentRecord; revision?: unknown }>;
    /** Read the individual's consent record for a data agreement. */
    read(
      individualId: string,
      dataAgreementId: string,
    ): Promise<{ consentRecord: ConsentRecord }>;
    /** List all consent records for the individual (paginated). */
    list(
      individualId: string,
      params?: ListParams,
    ): Promise<{ consentRecords: ConsentRecord[]; pagination: Pagination }>;
    /** Update an existing consent record (allow/withdraw). */
    update(
      individualId: string,
      consentRecordId: string,
      body: { optIn: boolean; sectorPreferences?: { sector: string; optIn: boolean }[] },
      query: { dataAgreementId: string; revisionId: string },
    ): Promise<{ consentRecord: ConsentRecord }>;
    /** Consent-record change history for the individual (paginated). */
    history(individualId: string, params?: ListParams): Promise<{ consentRecordHistory: unknown; pagination: Pagination }>;
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
    if (!res.ok) throw new ConsentApiError(res.status, await res.text().catch(() => ""));
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
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
      list: ({ limit = 10, offset = 0, externalIndividualId }) =>
        request("GET", P.individuals + qs({ limit, offset, externalIndividualId })),
    },
    consentRecords: {
      create: (individualId, dataAgreementId, body, opts) =>
        request("POST", P.recordForAgreement(dataAgreementId) + qs({ revisionId: opts?.revisionId }), {
          individualId,
          body: body ?? {},
        }),
      read: (individualId, dataAgreementId) =>
        request("GET", P.recordForAgreement(dataAgreementId), { individualId }),
      list: (individualId, { limit = 10, offset = 0 } = {}) =>
        request("GET", P.consentRecords + qs({ limit, offset }), { individualId }),
      update: (individualId, consentRecordId, body, query) =>
        request("PUT", P.consentRecord(consentRecordId) + qs({ individualId, ...query }), {
          individualId,
          body,
        }),
      history: (individualId, { limit = 10, offset = 0 } = {}) =>
        request("GET", P.consentRecordHistory + qs({ limit, offset }), { individualId }),
      deleteAll: (individualId) => request("DELETE", P.allRecords, { individualId }),
    },
    request,
  };
}
