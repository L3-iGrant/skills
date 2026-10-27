/**
 * OWS OpenID4VC request/response types (self-contained - no external SDK).
 * Request bodies are exact: OWS refuses a member that it does not know (400).
 * Of the responses, only the fields the browser reads are modelled precisely;
 * the rest are left open via index signatures. See igrantio-ows-overview
 * api-reference.
 */

// ---------------------------------------------------------------- Issuance ---

export type IssuanceMode = "InTime" | "Deferred";

/** SD-JWT VC / mdoc credential body (claims can be flat or namespaced). */
export interface SdJwtCredentialBody {
  claims: Record<string, unknown>;
  vct?: string;
  doctype?: string;
  id?: string;
}

/** W3C VC credential body. */
export interface W3cCredentialBody {
  credentialSubject: Record<string, unknown>;
  type?: string[];
  id?: string;
}

export type CredentialBody = SdJwtCredentialBody | W3cCredentialBody;

/** One entry of `credentials`: `id` names the credential configuration it fills. */
export type CredentialConfigurationBody = CredentialBody & { id: string };

interface IssueRequestBase {
  credentialDefinitionId: string;
  /** Claims for a definition with one credential configuration. */
  credential?: CredentialBody;
  /** Claims for a definition with more than one credential configuration. */
  credentials?: CredentialConfigurationBody[];
  /**
   * Transaction code (tx_code), 4 to 12 characters. Sending it selects the
   * pre-authorised code flow. Not with `presentationDefinitionId`.
   */
  userPin?: string;
  /** Pre-authorised code flow without a transaction code. */
  isPreAuthorised?: boolean;
  /** Gate issuance behind a presentation ("dynamic" issuance). */
  presentationDefinitionId?: string;
  /** Only together with `presentationDefinitionId`. */
  transactionData?: TransactionData;
  /** Deep-link scheme of `credentialOffer`; default "openid-credential-offer://". */
  urlScheme?: string;
  /** Push the offer to this individual (not with `mapperId`). */
  individualId?: string;
  mapperId?: string;
}

export interface IssueInTimeRequest extends IssueRequestBase {
  issuanceMode: "InTime";
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

export interface StartDeferredRequest extends IssueRequestBase {
  issuanceMode: "Deferred";
}

export type IssueCredentialRequest = IssueInTimeRequest | StartDeferredRequest;

/** Body for supplying claims to complete a deferred issuance (PUT history). */
export interface UpdateCredentialHistoryPayload {
  /** `id`: the credential configuration id, `credentialHistory.credential.id` of the offer. */
  credential: CredentialBody & { id?: string };
}

export interface CredentialHistoryItem {
  CredentialExchangeId?: string;
  credentialOffer?: string;
  credentialStatus?: "pending" | "ready";
  status?:
    | "offer_sent"
    | "offer_received"
    | "token_issued"
    | "credential_issued"
    | "credential_acked"
    | "credential_accepted"
    | "credential_deleted"
    | "issuance_denied";
  /** The reason when status is issuance_denied. */
  issuanceDeniedReason?: string;
  presentationExchangeId?: string;
  credential?: { type?: string[]; credentialSubject?: Record<string, unknown>; claims?: Record<string, unknown>; [k: string]: unknown } | null;
  credentialFormat?: "jwt_vc_json" | "dc+sd-jwt" | "mso_mdoc";
  revocationStatus?: "Operational" | "Revoked" | "Suspended";
  holder?: { name: string; [k: string]: unknown };
  createdAt?: number;
  updatedAt?: number;
  [k: string]: unknown;
}

export interface IssueCredentialResponse {
  /** An array when the definition has more than one credential configuration. */
  credentialHistory?: CredentialHistoryItem | CredentialHistoryItem[];
  [k: string]: unknown;
}

export interface CredentialHistoryResponse {
  credentialHistory: CredentialHistoryItem;
  [k: string]: unknown;
}

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

/** One webhook event, as re-emitted by the backend over SSE. */
export interface OwsWebhookEvent<TData = IssuanceSSEData | PresentationSSEData> {
  id: number;
  delivery_id: string;
  webhook_id: string; // the exchange id
  timestamp: string;
  created_at: string;
  type: string;
  data: TData;
}

export interface IssuanceSSEData {
  credential: CredentialHistoryItem & {
    CredentialExchangeId: string;
    status: NonNullable<CredentialHistoryItem["status"]>;
  };
  organisationId?: string;
}

export interface PresentationSSEData {
  presentation: {
    verified: boolean;
    vpTokenResponse: string[] | null;
    presentation: Record<string, unknown>[] | null;
    presentationExchangeId: string;
    status: string;
    holder?: { name: string; [k: string]: unknown };
    [k: string]: unknown;
  };
  organisationId?: string;
}
