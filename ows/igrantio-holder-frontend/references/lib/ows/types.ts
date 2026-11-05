/**
 * OWS OpenID4VC request/response types (self-contained - no external SDK).
 * Request bodies are exact: OWS refuses a member that it does not know (400).
 * Of the responses, only the fields the browser reads are modelled precisely;
 * the rest are left open via index signatures. See igrantio-ows-overview
 * api-reference.
 */

// ---------------------------------------------------------------- Issuance ---

/** `in_time`: the claims are known now. `deferred`: the claims come later. */
export type IssuanceMode = "in_time" | "deferred";

/** The status of an issuance: the step that it reached. */
export type IssuanceStatus =
  | "created"
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
 * The claims of an issuance, in the form of the format of the credential
 * configuration: the claims as they are for `dc+sd-jwt`; `{"<namespace>": {...}}`
 * for `mso_mdoc`; `{"credentialSubject": {...}}` for `jwt_vc_json`.
 */
export type IssuanceClaims = Record<string, unknown>;

/** The transaction code (tx_code) that the issuer makes for a pre-authorised offer. */
export interface TransactionCodeRequest {
  /** 4 to 12. */
  length: number;
  /** `numeric`: digits. `text`: upper-case letters and digits. */
  inputMode: "numeric" | "text";
}

/** Body of `POST /v4/config/ows/issuer/issuances`: one issuance of one credential configuration. */
export interface CreateIssuanceRequest {
  mode: IssuanceMode;
  credentialDefinitionId: string;
  /** Required when the definition has more than one credential configuration. */
  credentialConfigurationId?: string;
  /** The pre-authorised code flow (default false: the authorisation code flow). */
  preAuthorised?: boolean;
  /** Only with `preAuthorised: true`. Not with `presentationDefinitionId`. */
  transactionCode?: TransactionCodeRequest;
  /** Required for `in_time`. A `deferred` issuance gets them later (supplyClaims). */
  claims?: IssuanceClaims;
  /** Push the offer to this individual (not with `mapperId`). */
  individualId?: string;
  mapperId?: string;
  /** Gate issuance behind a presentation ("dynamic" issuance). */
  presentationDefinitionId?: string;
  /** Only together with `presentationDefinitionId`. */
  transactionData?: TransactionData;
  /** Deep-link scheme of `offer.uri`; default "openid-credential-offer://". */
  urlScheme?: "openid-credential-offer://" | "haip://";
}

/** Answer 201 of the create. The codes are only in this answer. */
export interface IssuanceCreated {
  /** The issuance id: the SSE key and the id of the other issuance paths. */
  id: string;
  status: IssuanceStatus;
  offer: {
    /** `openid-credential-offer://…` URI: render as a QR code or a deep link. */
    uri: string;
    offerUri: string;
    preAuthorisedCode: string | null;
    /** Give it to the holder out of band. */
    transactionCode: string | null;
  };
  /** RFC 3339, UTC. */
  createdAt: string;
}

/** Body of `PUT /v4/config/ows/issuer/issuances/{issuanceId}/claims`. */
export interface IssuanceClaimsRequest {
  claims: IssuanceClaims;
}

/** Answer of `GET /v4/config/ows/issuer/issuances/{issuanceId}` (and of the claims update). */
export interface IssuanceDetail {
  id: string;
  credentialDefinition: { id: string; definitionVersion: number | null };
  credentialConfigurationId: string | null;
  format: "jwt_vc_json" | "dc+sd-jwt" | "mso_mdoc" | null;
  mode: IssuanceMode;
  status: IssuanceStatus;
  deniedReason: string | null;
  offer: {
    offerId: string | null;
    reusedOfferId: string | null;
    preAuthorised: boolean;
    walletInitiated: boolean;
    /** The offer URI while a wallet can still use it; else null. */
    uri: string | null;
  };
  holder: { name: string | null; clientId: string | null; trustServiceProvider: Record<string, unknown> | null };
  revocation: { enabled: boolean; method: string; revokedAt: string | null; reason: string | null };
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
  [k: string]: unknown;
}

/** Answer of `POST /v4/config/ows/issuer/issuances/{issuanceId}/revocation`. A revocation is final. */
export interface IssuanceRevocation {
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
  /** e.g. "Piggy Bank Online Banking"; at most 100 characters. */
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

export interface SendVerificationRequest {
  presentationDefinitionId: string;
  /** Serve the request object by reference (recommended). Default false. */
  requestByReference?: boolean;
  /** Required when the presentation definition sets `transactionDataDefinitionType`, refused otherwise. */
  transactionData?: TransactionData;
  nonce?: string;
  urlPrefix?: string;
  /** Push the request to this individual (not with `mapperId`). */
  individualId?: string;
  mapperId?: string;
  /** QES signing: add a visible signature stamp to the PDF. */
  signatureStamp?: boolean;
  /** The stamp box on the page: x1, y1, x2, y2. */
  signatureCoordinate?: [number, number, number, number];
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

export interface VerificationHistoryItem {
  presentationExchangeId: string;
  /** The `openid4vp://` request URI; empty for a Digital Credentials API request. */
  vpTokenQrCode: string;
  status: "request_sent" | "request_received" | "presentation_acked";
  /** The accept/reject decision. */
  verified: boolean;
  /** Non-empty once the wallet has responded; null before. */
  vpTokenResponse: string[] | null;
  /** Disclosed claims; presentation[0] = first credential. */
  presentation?: Record<string, unknown>[] | null;
  presentationSubmission?: Record<string, unknown> | null;
  /** Per-credential validity and issuer trust results. */
  presentationValidity?: Record<string, unknown>[] | null;
  holder?: { name: string; [k: string]: unknown };
  createdAt?: number;
  updatedAt?: number;
  /** Present for same-device Digital Credentials API flows. */
  dcApiRequest?: DcApiRequest;
  dcApiProtocol?: DcApiProtocol;
  [k: string]: unknown;
}

export interface VerificationResponse {
  verificationHistory?: VerificationHistoryItem;
  [k: string]: unknown;
}

export type VerificationHistoryResponse = VerificationResponse;

// -------------------------------------------------------------------- SSE ---

/**
 * One webhook event of the wallet, as the backend re-emits it over SSE: the
 * body that the webhook delivered, plus the time the backend received it.
 * The body holds no claims and no presentation: read the resource for them.
 */
export interface OwsWebhookEvent<TData = IssuanceEventData | VerificationEventData> {
  /** The event id. */
  id: string;
  /** `ows.<role>.<resource>.<event>`, for example `ows.issuer.issuance.credential_issued`. */
  type: string;
  schemaVersion: number;
  occurredAt: string;
  organisationId: string;
  sandboxOrganisationId: string | null;
  /** `id` is the SSE key: the issuance id or the verification id. */
  subject: { type: string; id: string; sequence: number };
  data: TData;
  receivedAt: string;
}

/** `{code, description}` of `denied`, `credential_failed`, `revoked` and `declined`. */
export interface EventReason {
  code: string;
  description: string;
}

/** `data` of an `ows.issuer.issuance.*` event. */
export interface IssuanceEventData {
  issuance: {
    id: string;
    credentialDefinitionId: string | null;
    credentialConfigurationId: string | null;
    format: string | null;
    mode: IssuanceMode;
    origin: "offer" | "wallet_initiated" | "offer_reuse";
    offerId: string | null;
    status: IssuanceStatus;
    revokedAt: string | null;
    individualId: string | null;
    holder: { clientId: string | null; name: string | null };
    reissueCount: number;
    createdAt: string;
    updatedAt: string;
    issuedAt: string | null;
    lastReissuedAt: string | null;
  };
  credential?: {
    id: string;
    version: number;
    copies: number;
    issuedAt: string;
    validUntil: string | null;
    holderKeyChanged: boolean;
  } | null;
  reason?: EventReason;
}

/** `data` of an `ows.verifier.verification.*` event. */
export interface VerificationEventData {
  verification: {
    /** The `presentationExchangeId` of the verification. */
    id: string;
    presentationDefinitionId: string | null;
    status: "request_sent" | "request_received" | "presentation_acked";
    isVerified: boolean;
    responseMode: string | null;
    credentialExchangeId: string | null;
    individualId: string | null;
    dataAgreementId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  reason?: EventReason;
}
