/**
 * OWS OpenID4VC request/response types (self-contained - no external SDK).
 * Request bodies are exact: OWS refuses a member that it does not know (400).
 * Of the responses, only the fields the browser reads are modelled precisely;
 * the rest are left open via index signatures. See igrantio-ows-overview
 * api-reference.
 */

// -------------------------------------------------------- Issuance history ---

/** `in_time`: the claims are known now. `deferred`: the claims come later. */
export type IssuanceMode = "in_time" | "deferred";

/**
 * The status of an issuance history: the step that it reached. A revocation
 * is not a status: it is `revokedAt`.
 */
export type IssuanceHistoryStatus =
  | "offer_sent"
  | "offer_retrieved"
  | "token_issued"
  | "credential_deferred"
  | "claims_supplied"
  | "credential_issued"
  | "credential_accepted"
  | "credential_deleted"
  | "denied"
  | "expired";

/**
 * The claims of one credential configuration, in the form of its format: the
 * claims as they are for `dc+sd-jwt`; `{"<namespace>": {...}}` for `mso_mdoc`;
 * `{"credentialSubject": {...}}` for `jwt_vc_json`.
 */
export type IssuanceClaims = Record<string, unknown>;

/** The transaction code (tx_code) of a pre-authorised offer. */
export interface TransactionCodeRequest {
  /** 4 to 12. */
  length: number;
  /** `numeric`: the digits 0 to 9. `text`: letters and digits (a random code: upper-case letters and digits). */
  inputMode: "numeric" | "text";
  /** Optional: the code, with exactly `length` characters of `inputMode`. Without it, the issuer makes a random code. */
  value?: string;
}

/** One entry of `credentials`: the claims of one credential configuration. */
export interface IssueCredentialEntry {
  /** Mandatory when the definition has more than one credential configuration. */
  credentialConfigurationId?: string;
  claims?: IssuanceClaims;
}

/**
 * Body of `POST /v4/config/ows/issuer/issuance-history`. One call makes one
 * credential offer for all the credential configurations of the definition,
 * and one issuance history for each configuration. There is no top-level
 * `claims`: the claims go in `credentials`.
 */
export interface IssueCredentialRequest {
  mode: IssuanceMode;
  /** Mandatory, except with `dataAgreementId`. */
  credentialDefinitionId?: string;
  /**
   * At most 20 entries, one for each configuration. `in_time`: the claims of
   * each configuration. `deferred`: optional; the claims come later (supplyClaims).
   */
  credentials?: IssueCredentialEntry[];
  /** The pre-authorised code flow (default false: the authorisation code flow). */
  preAuthorised?: boolean;
  /** Only with `preAuthorised: true`. Not with `presentationDefinitionId`. */
  transactionCode?: TransactionCodeRequest;
  /** Push the offer to this individual (not with `mapperId`). */
  individualId?: string;
  mapperId?: string;
  /** Issue for a data agreement of the Consent Building Block; it names the definition. */
  dataAgreementId?: string;
  /** Dynamic credential request: the holder presents a credential before the issuance continues. */
  presentationDefinitionId?: string;
  /** Only with `presentationDefinitionId`; it must fit a transaction data type that the issuer supports. */
  transactionData?: Record<string, unknown>;
  /** Optional credential offer endpoint of a wallet: the issuer also sends the offer there. */
  credentialOfferEndpoint?: string;
  /** The scheme of `offer.uri`; default "openid-credential-offer://". */
  urlScheme?: "openid-credential-offer://" | "haip://";
  hasSignatureStamp?: boolean;
  /** Four integers, 0 to 100000. */
  signatureCoordinate?: [number, number, number, number];
}

/** One issuance history of the issue answer. */
export interface IssuanceHistoryCreatedItem {
  /** The id of the issuance history: the path id of its routes and the `subject.id` of its events. */
  credentialExchangeId: string;
  credentialConfigurationId: string;
  status: IssuanceHistoryStatus;
}

/** Answer 201 of the issue call. The codes are only in this answer. */
export interface IssuanceHistoryCreated {
  offer: {
    /** The id of the credential offer. Every issuance history of the call has it. */
    offerId: string;
    /** `openid-credential-offer://...` URI: render it as a QR code or open it as a deep link. */
    uri: string;
    /** The credential offer by reference, on the wallet service. */
    offerUri: string;
    preAuthorisedCode: string | null;
    /** Give it to the holder on another channel. */
    transactionCode: string | null;
  };
  /** One item for each credential configuration, in the order of the definition. */
  issuanceHistory: IssuanceHistoryCreatedItem[];
  /** RFC 3339, UTC. */
  createdAt: string;
}

/** Body of `PUT /v4/config/ows/issuer/issuance-history/{credentialExchangeId}/claims`. */
export interface IssuanceHistoryClaimsRequest {
  claims: IssuanceClaims;
}

/** Answer of `GET /v4/config/ows/issuer/issuance-history/{credentialExchangeId}` (and of the claims update). */
export interface IssuanceHistoryDetail {
  credentialExchangeId: string;
  credentialDefinition: { id: string | null; definitionVersion: number | null };
  credentialConfigurationId: string | null;
  format: string | null;
  mode: IssuanceMode;
  status: IssuanceHistoryStatus;
  deniedReason: string | null;
  offer: {
    offerId: string | null;
    reusedOfferId: string | null;
    preAuthorised: boolean;
    walletInitiated: boolean;
    /** The offer URI while a wallet can still use it; else null. */
    uri: string | null;
  };
  individualId: string | null;
  dataAgreementId: string | null;
  /** The presentation of a dynamic credential request, else null. */
  presentation: { definitionId: string | null; exchangeId: string | null } | null;
  /** The wallet (`clientId`) and the checks of its attestations and proof. */
  authorisation: {
    clientId: string | null;
    walletUnitAttestation: Record<string, unknown> | null;
    proof: { type: string | null; verified: boolean } | null;
    keyAttestation: Record<string, unknown> | null;
  };
  revocation: { enabled: boolean; method: string | null; revokedAt: string | null; reason: string | null };
  reissue: { allowed: boolean; count: number; lastAt: string | null };
  latestCredential: {
    id: string;
    version: number;
    issuedAt: string | null;
    validUntil: string | null;
    copies: number;
  } | null;
  /** Only with `?include=claims`. */
  claims?: IssuanceClaims;
  createdAt: string;
  updatedAt: string;
  issuedAt: string | null;
}

/** Answer of `POST .../issuance-history/{credentialExchangeId}/revocation`. A revocation is final. */
export interface IssuanceHistoryRevocation {
  revokedAt: string;
  reason: string | null;
  /** At most the 10 newest revoked credentials. */
  credentials: { id: string; version: number; copy: number }[];
  credentialCount: number;
}

// ------------------------------------------------- Transaction data (SCA) ---

/** A payee / merchant shown by the wallet. */
export interface ScaParty {
  name: string;
  /** Organisation or merchant id. */
  id: string;
  logo?: string;
  website?: string;
}

/** A payment / account-information service provider (PISP or AISP). */
export interface ScaProvider {
  legal_name: string;
  brand_name: string;
  domain_name: string;
}

/** Merchant-initiated-transaction limits inside a recurrence block. */
export interface ScaMitOptions {
  amount_variable?: boolean;
  min_amount?: number;
  max_amount?: number;
  total_amount?: number;
  initial_amount?: number;
  initial_amount_number?: number;
  apr?: number;
}

/** TS12 frequency code. */
export type ScaFrequency =
  | "INDA"
  | "DAIL"
  | "WEEK"
  | "TOWK"
  | "TWMN"
  | "MNTH"
  | "TOMN"
  | "QUTR"
  | "FOMN"
  | "SEMI"
  | "YEAR"
  | "TYEA";

/** Recurring schedule. Omit the whole block for one-off payments. */
export interface ScaRecurrence {
  /** "yyyy-mm-dd" */
  start_date?: string;
  /** "yyyy-mm-dd" */
  end_date?: string;
  /** Number of occurrences. */
  number?: number;
  frequency: ScaFrequency;
  mit_options?: ScaMitOptions;
}

/** `urn:eudi:sca:payment:1` - payment confirmation (card or account). */
export interface ScaPaymentPayload {
  /** At most 36 characters. */
  transaction_id: string;
  /** ISO 8601 date-time. */
  date_time?: string;
  payee: ScaParty;
  /** Present for account payments initiated via a PISP. */
  pisp?: ScaProvider;
  /** "yyyy-mm-dd"; "" or omitted = immediate, future date = scheduled. */
  execution_date?: string;
  /** ISO 4217 code, three capital letters. */
  currency: string;
  amount: number;
  amount_estimated?: boolean;
  amount_earmarked?: boolean;
  /** SEPA instant credit transfer. */
  sct_inst?: boolean;
  recurrence?: ScaRecurrence;
}

/** `urn:eudi:sca:emandate:1` - e-mandate (SEPA direct debit / card MIT). */
export interface ScaEMandatePayload {
  /** At most 36 characters. */
  transaction_id: string;
  date_time?: string;
  /** Mandate validity, "yyyy-mm-dd". */
  start_date?: string;
  end_date?: string;
  /** At most 50 characters. */
  reference_number?: string;
  /** At most 50 characters. */
  creditor_id?: string;
  /** At most 1000 characters. */
  purpose?: string;
  /** Per-charge economics; populate `recurrence` for recurring mandates. */
  payment_payload?: ScaPaymentPayload;
}

/** `urn:eudi:sca:login_risk_transaction:1` - login / risk-based action. */
export interface ScaLoginRiskPayload {
  /** At most 36 characters. */
  transaction_id: string;
  date_time?: string;
  /** e.g. "Example Bank Online Banking"; at most 100 characters. */
  service?: string;
  /** The action being authorised; at most 140 characters. */
  action: string;
}

/** `urn:eudi:sca:account_access:1` - AISP account-information consent. */
export interface ScaAccountAccessPayload {
  /** At most 36 characters. */
  transaction_id: string;
  date_time?: string;
  aisp?: ScaProvider;
  /** At most 140 characters. */
  description?: string;
}

/** EUDI SCA rulebook (TS12) payload; the family implies the `type` urn. */
export type ScaPayload =
  | ScaPaymentPayload
  | ScaEMandatePayload
  | ScaLoginRiskPayload
  | ScaAccountAccessPayload;

/** QES document signing: the wallet signs the linked document. */
export interface QesData {
  type: "pdf";
  external_link: string;
  hash?: string;
}

/** Simple payment confirmation. */
export interface PaymentData {
  payee: string;
  currency_amount: {
    /** ISO 4217 code, three capital letters. */
    currency: string;
    /** A number above 0. */
    value: number;
  };
  recurring_schedule?: {
    /** "yyyy-mm-dd" */
    start_date: string;
    /** "yyyy-mm-dd" */
    expiry_date?: string;
    /** 1 or more. */
    frequency: number;
  };
}

/**
 * Wallet-displayed, wallet-signed transaction data (Strong Customer
 * Authentication). Exactly one variant, and it must match the
 * `transactionDataDefinitionType` of the presentation definition:
 * - payment_data: simple payment (type `payment_data`)
 * - payload: EUDI SCA rulebook (TS12) payload (types `payment`, `emandate`,
 *   `login_risk_transaction`, `account_access`); OWS wraps it into the
 *   OpenID4VP transaction_data array entry (type urn, credential_ids, hash alg)
 * - qes_data: QES document signing (type `qes_data`)
 * The wallet's KB-JWT echoes matching transaction_data_hashes.
 */
export type TransactionData =
  | { payment_data: PaymentData }
  | { payload: ScaPayload }
  | { qes_data: QesData };

// ------------------------------------------------------------ Verification ---

/** Body of `POST /v4/config/ows/verifier/verifications`. */
export interface SendVerificationRequest {
  presentationDefinitionId: string;
  /**
   * Default false. True puts a `request_uri` in `requestUrl` (a smaller QR
   * code). A signed request always goes by reference. A DC API request does not use it.
   */
  requestByReference?: boolean;
  /** Required when the presentation definition sets `transactionDataDefinitionType`, refused otherwise. */
  transactionData?: TransactionData;
  nonce?: string;
  /** The start of `requestUrl` before `?`; default `openid4vp://`. */
  urlPrefix?: string;
  /** Push the request to this individual (not with `mapperId`). */
  individualId?: string;
  mapperId?: string;
  /** QES signing (`qes_data`): add a visible signature stamp to the PDF. */
  hasSignatureStamp?: boolean;
  /** The stamp box on the page, in points: x1, y1, x2, y2. */
  signatureCoordinate?: [number, number, number, number];
  /** Terms that the holder sees with the request (not in a DC API request). */
  dataAgreement?: Record<string, unknown>;
}

/** Digital Credentials API protocol of a verification request. */
export type DcApiProtocol = "openid4vp-v1-signed" | "openid4vp-v1-unsigned" | "org-iso-mdoc";

/** The `navigator.credentials.get` argument, per browser family. */
export interface DcApiRequest {
  chrome: unknown;
  safari: unknown;
  [k: string]: unknown;
}

/** Body of the Digital Credentials API receive call. */
export type DcApiReceivePayload = { response: string } | { vp_token: Record<string, unknown> };

/** The status of a verification. A wallet error response also ends in `presentation_acked`. */
export type VerificationStatus = "request_sent" | "request_received" | "presentation_acked";

/** The verification history of the send, read and revalidation answers. */
export interface VerificationHistoryItem {
  /** The correlation id: the `{verificationId}` of the other calls and the `subject.id` of the events. */
  presentationExchangeId: string;
  /** The same value as `presentationExchangeId`. */
  id: string;
  /** The `openid4vp://` Authorization Request URL; empty for a Digital Credentials API request. */
  requestUrl: string;
  status: VerificationStatus;
  /** The accept/reject decision: true when every check passed. */
  isVerified: boolean;
  /** The decoded credentials, with only the asked claims. Null until the wallet answers. */
  presentation: Record<string, unknown>[] | null;
  /** The VP Token as the verifier keeps it. Null until the wallet answers. */
  vpToken: string[] | null;
  /**
   * The checks of each credential query that the wallet answered:
   * `[{ "validatedAt": ..., "<credential query id>": { "isVerified", ..., "credentialSignerTrustedListCheck" } }]`.
   */
  presentationValidity: Record<string, unknown>[] | null;
  presentationDefinitionId: string;
  holder: { name?: string; [k: string]: unknown };
  responseMode: string;
  /** Unix seconds. */
  createdAt: number;
  updatedAt: number;
  /** Only for a Digital Credentials API request. */
  dcApiRequest?: DcApiRequest | null;
  dcApiProtocol?: DcApiProtocol | null;
  [k: string]: unknown;
}

/** The send, read and revalidation answer. */
export interface VerificationResponse {
  verificationHistory: VerificationHistoryItem;
}

export type VerificationHistoryResponse = VerificationResponse;

// -------------------------------------------------------------------- SSE ---

/**
 * One webhook event of the wallet, as the backend re-emits it over SSE: the
 * body that the webhook delivered, plus the time the backend received it.
 * The body holds no claims and no presentation: read the resource for them.
 */
export interface OwsWebhookEvent<TData = IssuanceHistoryEventData | VerificationEventData> {
  /** The event id. */
  id: string;
  /** `ows.<role>.<resource>.<event>`, for example `ows.issuer.issuance_history.credential_issued`. */
  type: string;
  schemaVersion: number;
  occurredAt: string;
  organisationId: string;
  sandboxOrganisationId: string | null;
  /**
   * `type` is `issuance_history` or `verification`. `id` is the SSE key: the
   * credential exchange id, or the presentationExchangeId. `sequence` counts
   * the events of the resource, from 1.
   */
  subject: { type: string; id: string; sequence: number };
  data: TData;
  receivedAt: string;
}

/** `{code, description}` of `denied`, `credential_failed`, `revoked` and `declined`. */
export interface EventReason {
  code: string;
  description: string;
}

/** The summary of an issuance history in its events: the list item of the API. */
export interface IssuanceHistorySummary {
  credentialExchangeId: string;
  credentialDefinitionId: string | null;
  credentialConfigurationId: string | null;
  format: string | null;
  mode: IssuanceMode;
  origin: "offer" | "wallet_initiated" | "offer_reuse";
  offerId: string | null;
  status: IssuanceHistoryStatus;
  revokedAt: string | null;
  individualId: string | null;
  /** The client id of the wallet. */
  clientId: string | null;
  reissueCount: number;
  createdAt: string;
  updatedAt: string;
  issuedAt: string | null;
  lastReissuedAt: string | null;
}

/** `data` of an `ows.issuer.issuance_history.*` event. */
export interface IssuanceHistoryEventData {
  issuanceHistory: IssuanceHistorySummary;
  /** The issued credential version of the step, without its token. */
  credential?: {
    id: string;
    version: number;
    copies: number;
    issuedAt: string;
    validUntil: string | null;
    holderKeyChanged: boolean;
  } | null;
  /** `denied`, `credential_failed` and `revoked`. */
  reason?: EventReason;
  /** `token_issued`. */
  grant?: "pre_authorised_code" | "authorisation_code" | "refresh_token";
  /** `credential_deleted`: true when the issuer revoked in the same step. */
  revoked?: boolean;
  /** `revoked`: at most 10, newest first. */
  credentials?: { id: string; version: number; copy: number }[];
  credentialCount?: number;
}

/** `data` of an `ows.verifier.verification.*` event. */
export interface VerificationEventData {
  verification: {
    /** The `presentationExchangeId` of the verification. */
    id: string;
    presentationDefinitionId: string | null;
    status: VerificationStatus;
    isVerified: boolean;
    responseMode: string | null;
    /** An issuance with presentation: the credential exchange id of the issuance history. */
    credentialExchangeId: string | null;
    individualId: string | null;
    dataAgreementId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  /** `declined`. */
  reason?: EventReason;
}
