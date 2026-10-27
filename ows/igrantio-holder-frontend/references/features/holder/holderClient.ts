/**
 * Typed client for the OWS HOLDER (wallet-side) API, called through the
 * tenant backend proxy (`igrantio-holder-backend`) so the browser never holds
 * the OWS API key. Wraps any requester with the `OwsClient.request` shape -
 * pass `useOwsClient(proxyBaseUrl)` from `lib/ows`.
 */

import type { DcqlQuery, FilterDescriptor, SubmissionItem } from "./shareSelection";

export interface OwsRequester {
  request<T>(method: string, path: string, body?: unknown): Promise<T>;
}

const DW = "/v2/config/digital-wallet/openid";
const SD = `${DW}/sdjwt`;
const SD3 = "/v3/config/digital-wallet/openid/sdjwt";

export interface CredentialRecord {
  /** Record id - the `{id}` of every follow-up call. */
  id: string;
  credentialId?: string;
  credentialStatus?: string;
  acceptanceToken?: string | null;
  oAuthFlow?: string;
  authorizationRequest?: string;
  userPinRequired?: boolean;
  userPin?: string | null;
  presentationId?: string | null;
  txCode?: { length?: number; input_mode?: "numeric" | "text"; description?: string };
  version?: string;
  credentialFormat?: string;
  credential?: Record<string, unknown>;
  credentialConfigurations?: Record<string, unknown>;
  issuer?: { name?: string; logo?: string; cover?: string };
  isVerifiedWithTrustList?: boolean;
  trustServiceProvider?: unknown;
  autoPresent?: boolean;
  revocationStatus?: string;
  /** Unix time in seconds. */
  createdAt?: number;
  updatedAt?: number;
  [k: string]: unknown;
}

export interface PresentationRecord {
  presentationId: string;
  status?: string;
  dcqlQuery?: DcqlQuery;
  presentationDefinition?: unknown;
  clientMetadata?: { clientName?: string; logoUri?: string; coverUri?: string; location?: string };
  transactionDataDecoded?: Array<Record<string, unknown>>;
  dataAgreement?: { policy?: unknown };
  responseRedirectUri?: string;
  presentation?: Array<Record<string, unknown>>;
  isVerifiedWithTrustList?: boolean;
  trustServiceProvider?: unknown;
  responseType?: string;
  /** Unix time in seconds. */
  updatedAt?: number;
  [k: string]: unknown;
}

export interface Pagination {
  currentPage?: number;
  totalItems?: number;
  totalPages?: number;
  limit?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

/**
 * The wallet receives and presents with the organisation default key. The
 * request bodies are strict: an unknown field answers 400.
 */
export interface ReceiveOfferPayload {
  /** The scanned/pasted `openid-credential-offer://…` URI (or offer JSON). */
  credentialOffer: string;
  autoPresent?: boolean;
}

export interface ReceiveRequestPayload {
  /** The pasted verification request - `openid4vp://…` URI or https URL, verbatim. */
  vpTokenQrCode: string;
  autoPresent?: boolean;
}

/** The `?code`, `?state` and (RFC 9207) `?iss` of the issuer redirect. */
export interface AuthorizationResponse {
  code: string;
  state: string;
  iss?: string;
}

export interface ListCredentialsParams {
  limit?: number;
  offset?: number;
  expired?: boolean;
  credentialStatus?: string;
  search?: string;
  /** The list sorts on `updatedAt` unless `createdAt` is asked for. */
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ListPresentationsParams {
  limit?: number;
  offset?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: "presentation_acked" | "presentation_pending";
}

export interface PresentationStats {
  total?: number;
  presentationShared?: number;
  presentationPending?: number;
}

function query(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/** `credential` can be an object or an array - always work with an array. */
export function normalizeReceived(credential: CredentialRecord | CredentialRecord[]): CredentialRecord[] {
  return Array.isArray(credential) ? credential : [credential];
}

/** The filter answers `credentials` (DCQL) or `inputDescriptors` (Presentation Exchange). */
export function pickDescriptors(res: Record<string, unknown>): FilterDescriptor[] {
  const raw = res.credentials ?? res.inputDescriptors;
  return Array.isArray(raw) ? (raw as FilterDescriptor[]) : [];
}

export function createHolderClient(ows: OwsRequester) {
  return {
    credentials: {
      /** Accept a credential offer (OpenID4VCI). Normalise the response with `normalizeReceived`. */
      receiveOffer: (payload: ReceiveOfferPayload) =>
        ows.request<{ credential: CredentialRecord | CredentialRecord[] }>(
          "POST",
          `${SD}/credential/receive`,
          { autoPresent: true, ...payload },
        ),
      /** Pre-authorised-code flow: submit the transaction code. */
      submitTransactionCode: (id: string, userPin: string) =>
        ows.request<unknown>("PUT", `${SD}/credential/${id}/user-pin`, { userPin }),
      /** Front-channel flow: exchange the code of the issuer redirect (`state` is required). */
      exchangeCode: (response: AuthorizationResponse) =>
        ows.request<{ credential: CredentialRecord | CredentialRecord[] | null }>(
          "POST",
          `${SD}/credential/exchange-code`,
          response,
        ),
      /** Deferred issuance: retry until `credential.credentialStatus === "credential_acked"`. */
      receiveDeferred: (id: string) =>
        ows.request<{ credential?: CredentialRecord }>("PUT", `${SD}/credential/${id}/receive-deferred`),
      /** Accept a `credential_acked` credential into the wallet. */
      accept: (id: string) => ows.request<unknown>("PUT", `${SD}/credential/${id}/accept`),
      /** Reject / remove a credential. */
      delete: (id: string) => ows.request<void>("DELETE", `${SD}/credential/${id}`),
      /** Toggle presenting without a manual consent step. */
      configure: (credentialId: string, autoPresent: boolean) =>
        ows.request<unknown>("PUT", `${SD}/credential/${credentialId}/configure`, { autoPresent }),
      /** Request reissuance of an expired or near-expiry credential. */
      requestReissuance: (id: string) =>
        ows.request<unknown>("PUT", `${SD}/credential/${id}/request`),
      /** Check the IETF Token Status List revocation status. */
      revocationStatus: (id: string) =>
        ows.request<unknown>("GET", `${SD}/credential/${id}/revocation-status`),
      read: (id: string) =>
        ows.request<{ credential: CredentialRecord }>("GET", `${SD}/credential/${id}`),
      list: (params: ListCredentialsParams = {}) =>
        ows.request<{ credential?: CredentialRecord[]; pagination?: Pagination }>(
          "GET",
          `${SD}/credentials${query({
            limit: params.limit ?? 10,
            offset: params.offset ?? 0,
            expired: params.expired,
            credentialStatus: params.credentialStatus,
            search: params.search,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
          })}`,
        ),
    },

    presentations: {
      /** Resolve an incoming verification request (OpenID4VP, v3). */
      receiveRequest: (payload: ReceiveRequestPayload) =>
        ows.request<{ presentation: PresentationRecord }>(
          "POST",
          `${SD3}/verification/receive`,
          { autoPresent: true, ...payload },
        ),
      /** Match held credentials against the request (v2; empty body). Use `pickDescriptors`. */
      filter: (presentationId: string) =>
        ows.request<Record<string, unknown>>("POST", `${DW}/sdjwt/verification/${presentationId}/filter`),
      /**
       * Send the selected credentials as a presentation (v3). Wraps the items
       * as `{credentials}` for DCQL or `{inputDescriptors}` for legacy PEX.
       * Open `presentation.responseRedirectUri` when it comes back non-empty.
       */
      send: (presentationId: string, items: SubmissionItem[], hasDcqlQuery: boolean) =>
        ows.request<{ presentation?: PresentationRecord }>(
          "POST",
          `${SD3}/verification/${presentationId}/send`,
          hasDcqlQuery ? { credentials: items } : { inputDescriptors: items },
        ),
      read: (presentationId: string) =>
        ows.request<{ presentation: PresentationRecord }>("GET", `${SD3}/verification/${presentationId}`),
      list: (params: ListPresentationsParams = {}) =>
        ows.request<{
          presentation?: PresentationRecord[];
          pagination?: Pagination;
          presentationStats?: PresentationStats;
        }>(
          "GET",
          `${SD3}/verifications${query({
            limit: params.limit ?? 10,
            offset: params.offset ?? 0,
            search: params.search,
            sortOrder: params.sortOrder,
            status: params.status,
          })}`,
        ),
      /** Delete a presentation record (v2 path - there is no v3 delete). */
      delete: (presentationId: string) =>
        ows.request<void>("DELETE", `${DW}/sdjwt/verification/${presentationId}`),
    },

    /** Wallet unit status: not_installed | installed | operational | valid. */
    walletUnitStatus: () =>
      ows.request<{ status?: string }>("GET", `${DW}/wallet-unit/status`),
  };
}

export type HolderClient = ReturnType<typeof createHolderClient>;
