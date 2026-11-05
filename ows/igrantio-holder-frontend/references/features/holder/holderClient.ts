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

const HOLDER = "/v4/config/ows/holder";

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
}

export interface ReceiveRequestPayload {
  /** The pasted verification request - `openid4vp://…` URI or https URL, verbatim. */
  vpTokenQrCode: string;
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
          `${HOLDER}/credentials`,
          payload,
        ),
      /** Pre-authorised-code flow: submit the transaction code. */
      submitTransactionCode: (id: string, transactionCode: string) =>
        ows.request<unknown>("PUT", `${HOLDER}/credentials/${id}/transaction-code`, { transactionCode }),
      /** Front-channel flow: exchange the code of the issuer redirect (`state` is required). */
      exchangeCode: (response: AuthorizationResponse) =>
        ows.request<{ credential: CredentialRecord | CredentialRecord[] | null }>(
          "POST",
          `${HOLDER}/authorisation-code-exchanges`,
          response,
        ),
      /** Deferred issuance: retry until `credential.credentialStatus === "credential_acked"`. */
      receiveDeferred: (id: string) =>
        ows.request<{ credential?: CredentialRecord }>("PUT", `${HOLDER}/credentials/${id}/deferred-credential`),
      /** Accept a `credential_acked` credential into the wallet. */
      accept: (id: string) => ows.request<unknown>("PUT", `${HOLDER}/credentials/${id}/acceptance`),
      /** Reject / remove a credential. */
      delete: (id: string) => ows.request<void>("DELETE", `${HOLDER}/credentials/${id}`),
      /** Request reissuance of an expired or near-expiry credential. */
      requestReissuance: (id: string) =>
        ows.request<unknown>("PUT", `${HOLDER}/credentials/${id}/reissuance`),
      /** Check the IETF Token Status List revocation status. */
      revocationStatus: (id: string) =>
        ows.request<unknown>("GET", `${HOLDER}/credentials/${id}/revocation-status`),
      read: (id: string) =>
        ows.request<{ credential: CredentialRecord }>("GET", `${HOLDER}/credentials/${id}`),
      list: (params: ListCredentialsParams = {}) =>
        ows.request<{ credential?: CredentialRecord[]; pagination?: Pagination }>(
          "GET",
          `${HOLDER}/credentials${query({
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
      /** Resolve an incoming verification request (OpenID4VP). */
      receiveRequest: (payload: ReceiveRequestPayload) =>
        ows.request<{ presentation: PresentationRecord }>(
          "POST",
          `${HOLDER}/presentations`,
          payload,
        ),
      /** Match held credentials against the request (empty body). Use `pickDescriptors`. */
      filter: (presentationId: string) =>
        ows.request<Record<string, unknown>>("POST", `${HOLDER}/presentations/${presentationId}/matching-credentials`),
      /**
       * Send the selected credentials as a presentation. Wraps the items
       * as `{credentials}` for DCQL or `{inputDescriptors}` for legacy PEX.
       * Open `presentation.responseRedirectUri` when it comes back non-empty.
       */
      send: (presentationId: string, items: SubmissionItem[], hasDcqlQuery: boolean) =>
        ows.request<{ presentation?: PresentationRecord }>(
          "POST",
          `${HOLDER}/presentations/${presentationId}/response`,
          hasDcqlQuery ? { credentials: items } : { inputDescriptors: items },
        ),
      read: (presentationId: string) =>
        ows.request<{ presentation: PresentationRecord }>("GET", `${HOLDER}/presentations/${presentationId}`),
      list: (params: ListPresentationsParams = {}) =>
        ows.request<{
          presentation?: PresentationRecord[];
          pagination?: Pagination;
          presentationStats?: PresentationStats;
        }>(
          "GET",
          `${HOLDER}/presentations${query({
            limit: params.limit ?? 10,
            offset: params.offset ?? 0,
            search: params.search,
            sortOrder: params.sortOrder,
            status: params.status,
          })}`,
        ),
      /** Delete a presentation record. */
      delete: (presentationId: string) =>
        ows.request<void>("DELETE", `${HOLDER}/presentations/${presentationId}`),
    },

    /** Wallet unit status: not_installed | installed | operational | valid. */
    walletUnitStatus: () =>
      ows.request<{ status?: string }>("GET", `${HOLDER}/wallet-unit/status`),
  };
}

export type HolderClient = ReturnType<typeof createHolderClient>;
