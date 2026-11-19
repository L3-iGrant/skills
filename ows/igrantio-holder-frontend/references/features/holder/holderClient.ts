/**
 * Typed client for the OWS HOLDER (wallet-side) API, called through the
 * tenant backend proxy (`igrantio-holder-backend`), so that the browser
 * never holds the OWS API key. It wraps any requester with the
 * `OwsClient.request` shape: pass `useOwsClient(proxyBaseUrl)` from `lib/ows`.
 */

import type { CredentialQueryMatches, DcqlQuery, SubmissionItem } from "./shareSelection";

export interface OwsRequester {
  request<T>(method: string, path: string, body?: unknown): Promise<T>;
}

const HOLDER = "/v4/config/ows/holder";

/** One certificate of a trust check. */
export interface CheckCertificate {
  subject: string;
  issuer: string;
  serialNumber: string;
  notValidBefore: string;
  notValidAfter: string;
  ski?: string | null;
  aki?: string | null;
  sha256Fingerprint: string;
  certificate: string;
}

/** The trust source entry that a check used (or the entry of its reason). */
export interface TrustEntry {
  entryId?: string;
  status?: string | null;
  provider?: { tSPName?: string | null; tSPTradeName?: string | null; countryName?: string | null; [k: string]: unknown };
  service?: { serviceName?: string | null; serviceTypeIdentifier?: string | null; serviceStatus?: string | null; [k: string]: unknown };
  source?: { id: string; name: string; kind: string; url?: string | null };
  roles?: string[];
  [k: string]: unknown;
}

/** `{code, message}` of a reason or a warning. */
export interface TrustNote {
  code: string;
  message?: string | null;
  status?: string | null;
  [k: string]: unknown;
}

/**
 * The trust check of a signer against the trust sources of an accepted list
 * (`TrustedListCheck`). Every member is present; the last four are `null`
 * when no check ran.
 */
export interface TrustedListCheck {
  verified: boolean;
  result: "trusted" | "not_trusted" | "not_found" | "not_applicable" | "error" | (string & {});
  role: string | null;
  entry: TrustEntry | null;
  reason: TrustNote | null;
  warning: TrustNote | null;
  presentedCertificates: CheckCertificate[] | null;
  matches: Array<Record<string, unknown>> | null;
  pathChecks: Array<{ code: string; result: "passed" | "failed" | "not_checked"; detail?: string | null }> | null;
  acceptedSources: Array<{ id: string; name: string; kind: string; url?: string | null }> | null;
  decision: { code: string; entity?: string | null } | null;
}

/** A held credential record (the credential read answer, and each item of the list). */
export interface CredentialRecord {
  /** The credential id: the `{credentialId}` of every follow-up call. */
  id: string;
  /** The same value as `id`. */
  credentialId?: string;
  /** The same for every record of one reception of an offer. */
  receivedOfferId?: string;
  /** credential_pending | credential_acked | credential_accepted | credential_archived */
  credentialStatus?: string;
  acceptanceToken?: string | null;
  deferredEndpoint?: string;
  deferredIntervalSeconds?: number | null;
  /** `frontchannel` or `backchannel`. */
  oauthFlow?: string | null;
  authorisationRequest?: string | null;
  requiresTransactionCode?: boolean;
  txCode?: { length?: number | null; input_mode?: string | null; description?: string | null } | null;
  presentationId?: string | null;
  version?: string;
  /** dc+sd-jwt | vc+sd-jwt | vp+sd-jwt | jwt_vc_json | jwt_vc | mso_mdoc */
  credentialFormat?: string;
  credentialIssuer?: string;
  /** The decoded claims of the credential. */
  credential?: Record<string, unknown> | null;
  credentialConfigurations?: Record<string, unknown> | null;
  issuer?: {
    name?: string | null;
    logo?: string | null;
    cover?: string | null;
    location?: string;
    description?: string;
    identifier?: string | null;
  } | null;
  /** Operational | Revoked | Suspended, or empty before the first check. */
  revocationStatus?: string;
  credentialSignerTrustedListCheck?: TrustedListCheck | null;
  issuerTrustedListCheck?: TrustedListCheck | null;
  statusIssuerTrustedListCheck?: TrustedListCheck | null;
  statusIssuerIsCredentialSigner?: boolean | null;
  isWalletUnitAttestation?: boolean;
  isSystemManaged?: boolean;
  batchId?: string;
  /** With `groupBatches=true`: the copies of the batch, and the copies not presented yet. */
  batchInstanceCount?: number;
  batchAvailableCount?: number;
  isPresented?: boolean;
  /** Unix time in seconds. */
  issuedAt?: number;
  createdAt?: number;
  updatedAt?: number;
  [k: string]: unknown;
}

/** One credential that the wallet shared (`presentation[]` of a presentation record). */
export interface PresentedCredential {
  /** The credential query that it answered. */
  id: string;
  credentialId: string;
  /** SD-JWT VC and mdoc: the disclosed claims. */
  claims?: Record<string, unknown>;
  /** W3C VC: the type and the credential subject. */
  type?: string[];
  credentialSubject?: Record<string, unknown>;
  vct?: string;
  doctype?: string;
}

export interface PresentationRecord {
  /** The presentation id (the same value as `id`). */
  presentationId: string;
  id?: string;
  /** presentation_pending | presentation_acked | request_refused */
  status?: string;
  /** Why the wallet refused the request (status `request_refused`). */
  refusalReason?: string;
  dcqlQuery?: DcqlQuery | null;
  clientId?: string;
  clientIdScheme?: string;
  clientMetadata?: {
    clientName?: string | null;
    logoUri?: string | null;
    coverUri?: string | null;
    location?: string;
    description?: string;
  };
  /** The trust check of the signer of the request. */
  relyingPartyTrustedListCheck?: TrustedListCheck | null;
  transactionData?: unknown;
  transactionDataDecoded?: Array<Record<string, unknown> | null> | null;
  dataAgreement?: Record<string, unknown> | null;
  encryptedResponseEncValuesSupported?: string[] | null;
  encryptionAlgorithm?: string;
  /** After the send: where to send the browser of the user, when not empty. */
  responseRedirectUri?: string;
  /** After the send: the shared credentials. */
  presentation?: PresentedCredential[] | null;
  /** Unix time in seconds. */
  createdAt?: number;
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
 * The receive body: an offer from an issuer, or a wallet-initiated issuance.
 * The wallet always uses its own holder key. The bodies are strict: an
 * unknown field answers 400.
 */
export type ReceiveCredentialPayload =
  | {
      /** The scanned or pasted `openid-credential-offer://` link, or the offer JSON. */
      credentialOffer: string;
    }
  | {
      /** The Credential Issuer Identifier, or the URL of its metadata document. */
      credentialIssuer: string;
      /** Keys of `credential_configurations_supported` of the issuer metadata. */
      credentialConfigurationIds: string[];
    };

export interface ReceiveRequestPayload {
  /** The scanned or pasted `openid4vp://` Authorization Request URI, as it is. */
  requestUrl: string;
}

/** The `?code`, `?state` and (RFC 9207) `?iss` of the issuer redirect. */
export interface AuthorizationResponse {
  code: string;
  state: string;
  iss?: string;
}

export interface ListCredentialsParams {
  /** At most 100. */
  limit?: number;
  offset?: number;
  /** true: revoked, archived or past its expiry. Leave it out for both. */
  expired?: boolean;
  /** One value or a comma list. */
  credentialStatus?: string;
  vct?: string;
  doctype?: string;
  type?: string;
  /** A comma list of credential ids. */
  ids?: string;
  receivedOfferId?: string;
  search?: string;
  /** The list sorts on `updatedAt` unless `createdAt` is asked for. */
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  /** One row for each batch, with `batchInstanceCount` and `batchAvailableCount`. */
  groupBatches?: boolean;
}

export interface ListPresentationsParams {
  limit?: number;
  offset?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
  status?: "presentation_acked" | "presentation_pending" | "request_refused";
}

export interface PresentationStats {
  total?: number;
  presentationShared?: number;
  presentationPending?: number;
}

/** The holder configuration (`globalConfiguration` of the answer). */
export interface HolderConfiguration {
  id: string;
  holderGlobalConfigurationId?: string;
  isCredentialEncryptionEnabled: boolean;
  credentialStatusRefreshIntervalSeconds: number;
  /** The stored URL, else the callback URL of the wallet. */
  redirectUrl: string;
  requiresPushedAuthorisationRequests: boolean;
  requiresTrustedCredentialSigner: boolean;
  acceptedCredentialSigners: string[];
  requiresTrustedIssuer: boolean;
  acceptedIssuers: string[];
  requiresTrustedStatusIssuer: boolean;
  acceptCredentialSignerAsStatusIssuer: boolean;
  acceptedStatusIssuers: string[];
  requiresTrustedRelyingParty: boolean;
  acceptedRelyingParties: string[];
  acceptedClientIds: string[];
  acceptedEtsiTrustedLists: string[];
  createdAt?: number;
  updatedAt?: number;
  [k: string]: unknown;
}

/** The `PATCH` body: send only the fields to change; a sent list replaces the stored one. */
export type HolderConfigurationUpdate = Partial<
  Omit<HolderConfiguration, "id" | "holderGlobalConfigurationId" | "createdAt" | "updatedAt">
>;

function query(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

const segment = (id: string) => encodeURIComponent(id);

/** `credential` is one record, a list, or null: always work with a list. */
export function normalizeReceived(credential: CredentialRecord | CredentialRecord[] | null | undefined): CredentialRecord[] {
  if (!credential) return [];
  return Array.isArray(credential) ? credential : [credential];
}

/** The entries of the matching-credentials answer (the key is left out when empty). */
export function pickQueryMatches(res: { credentials?: CredentialQueryMatches[] } | undefined): CredentialQueryMatches[] {
  return Array.isArray(res?.credentials) ? res.credentials : [];
}

export function createHolderClient(ows: OwsRequester) {
  return {
    credentials: {
      /** Receive an offer, or start a wallet-initiated issuance. Normalise the answer with `normalizeReceived`. */
      receive: (payload: ReceiveCredentialPayload) =>
        ows.request<{ credential: CredentialRecord | CredentialRecord[] | null }>(
          "POST",
          `${HOLDER}/credentials`,
          payload,
        ),
      /** Pre-authorised code flow: send the transaction code (a JSON string, 4 to 12 characters). */
      submitTransactionCode: (credentialId: string, transactionCode: string) =>
        ows.request<{ credential: CredentialRecord | CredentialRecord[] | null }>(
          "PUT",
          `${HOLDER}/credentials/${segment(credentialId)}/transaction-code`,
          { transactionCode },
        ),
      /** Authorization Code Flow: exchange the code of the redirect (`code` and `state` are mandatory). */
      exchangeCode: (response: AuthorizationResponse) =>
        ows.request<{ credential: CredentialRecord | CredentialRecord[] | null }>(
          "POST",
          `${HOLDER}/authorisation-code-exchanges`,
          response,
        ),
      /** Deferred issuance: call again after `deferredIntervalSeconds` until `credential_acked`. */
      receiveDeferred: (credentialId: string) =>
        ows.request<{ credential: CredentialRecord | CredentialRecord[] | null }>(
          "PUT",
          `${HOLDER}/credentials/${segment(credentialId)}/deferred-credential`,
        ),
      /** Accept a `credential_acked` credential. The wallet tells the issuer. */
      accept: (credentialId: string) =>
        ows.request<{ credential: CredentialRecord }>("PUT", `${HOLDER}/credentials/${segment(credentialId)}/acceptance`),
      /** Refuse or remove a credential, with every copy of its batch (204). */
      delete: (credentialId: string) =>
        ows.request<void>("DELETE", `${HOLDER}/credentials/${segment(credentialId)}`),
      /** Get a new credential from the issuer with the refresh token of the record. */
      requestReissuance: (credentialId: string) =>
        ows.request<{ credential: CredentialRecord }>("PUT", `${HOLDER}/credentials/${segment(credentialId)}/reissuance`),
      /** Read the status list of the issuer and update `revocationStatus`. */
      revocationStatus: (credentialId: string) =>
        ows.request<{ credential: CredentialRecord }>(
          "GET",
          `${HOLDER}/credentials/${segment(credentialId)}/revocation-status`,
        ),
      read: (credentialId: string) =>
        ows.request<{ credential: CredentialRecord }>("GET", `${HOLDER}/credentials/${segment(credentialId)}`),
      list: (params: ListCredentialsParams = {}) =>
        ows.request<{ credential?: CredentialRecord[]; pagination?: Pagination }>(
          "GET",
          `${HOLDER}/credentials${query({
            limit: params.limit ?? 10,
            offset: params.offset ?? 0,
            expired: params.expired,
            credentialStatus: params.credentialStatus,
            vct: params.vct,
            doctype: params.doctype,
            type: params.type,
            ids: params.ids,
            receivedOfferId: params.receivedOfferId,
            search: params.search,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
            groupBatches: params.groupBatches,
          })}`,
        ),
    },

    presentations: {
      /** Receive an OpenID4VP request (DCQL). */
      receiveRequest: (payload: ReceiveRequestPayload) =>
        ows.request<{ presentation: PresentationRecord }>("POST", `${HOLDER}/presentations`, payload),
      /** The held credentials that answer each credential query (no body). Use `pickQueryMatches`. */
      matchingCredentials: (presentationId: string) =>
        ows.request<{ credentials?: CredentialQueryMatches[] }>(
          "POST",
          `${HOLDER}/presentations/${segment(presentationId)}/matching-credentials`,
        ),
      /**
       * Send the selected credentials. Open `presentation.responseRedirectUri`
       * when it comes back not empty. `encryptionAlgorithm` is optional: a
       * value of `encryptedResponseEncValuesSupported` of the record.
       */
      send: (presentationId: string, credentials: SubmissionItem[], encryptionAlgorithm?: string) =>
        ows.request<{ presentation: PresentationRecord }>(
          "POST",
          `${HOLDER}/presentations/${segment(presentationId)}/response`,
          encryptionAlgorithm ? { credentials, encryptionAlgorithm } : { credentials },
        ),
      read: (presentationId: string) =>
        ows.request<{ presentation: PresentationRecord }>("GET", `${HOLDER}/presentations/${segment(presentationId)}`),
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
      /** Delete a presentation record (204). */
      delete: (presentationId: string) =>
        ows.request<void>("DELETE", `${HOLDER}/presentations/${segment(presentationId)}`),
    },

    configuration: {
      read: () => ows.request<{ globalConfiguration: HolderConfiguration }>("GET", `${HOLDER}/configuration`),
      /** Partial update: a field that you leave out keeps its stored value. */
      update: (changes: HolderConfigurationUpdate) =>
        ows.request<{ globalConfiguration: HolderConfiguration }>("PATCH", `${HOLDER}/configuration`, changes),
    },

    /** Read and check the Credential Issuer Metadata (for a wallet-initiated issuance). */
    issuerMetadata: (credentialIssuer: string) =>
      ows.request<{ credentialIssuerMetadata: Record<string, unknown> }>(
        "GET",
        `${HOLDER}/credential-issuer-metadata${query({ credentialIssuer })}`,
      ),

    /** Wallet unit status: not_installed | installed | operational | valid. */
    walletUnitStatus: () => ows.request<{ status?: string }>("GET", `${HOLDER}/wallet-unit/status`),
  };
}

export type HolderClient = ReturnType<typeof createHolderClient>;
