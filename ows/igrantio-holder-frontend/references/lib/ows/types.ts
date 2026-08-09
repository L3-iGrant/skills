/**
 * OWS OpenID4VC request/response types (self-contained - no external SDK).
 * Only the fields the browser actually reads are modelled precisely; the rest
 * are left open via index signatures. See igrantio-ows-overview api-reference.
 */

// ---------------------------------------------------------------- Issuance ---

export type IssuanceMode = "InTime" | "Deferred";

/** SD-JWT VC / mdoc credential body (claims can be flat or namespaced). */
export interface SdJwtCredentialBody {
  claims: Record<string, unknown>;
  vct?: string;
  id?: string;
}

/** W3C VC credential body. */
export interface W3cCredentialBody {
  credentialSubject: Record<string, unknown>;
  type?: string[];
  id?: string;
}

export type CredentialBody = SdJwtCredentialBody | W3cCredentialBody;

export interface IssueInTimeRequest {
  issuanceMode: "InTime";
  credentialDefinitionId: string;
  credential?: CredentialBody;
  credentials?: Array<CredentialBody & { id?: string }>;
  userPin?: string;
  individualId?: string;
}

// ------------------------------------------------- Transaction data (SCA) ---

/** A payee / merchant shown by the wallet. */
export interface ScaParty {
  name: string;
  id?: string;
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

/**
 * Recurring schedule. Omit the whole block for one-off payments - OWS
 * rejects an empty `frequency` string.
 */
export interface ScaRecurrence {
  /** "yyyy-mm-dd" */
  start_date: string;
  /** "yyyy-mm-dd" */
  end_date?: string;
  /** Number of occurrences. */
  number?: number;
  /** TS12 frequency code, e.g. "MNTH" (monthly), "ADHO" (ad hoc). */
  frequency: string;
  mit_options?: ScaMitOptions;
}

/** `urn:eudi:sca:payment:1` - payment confirmation (card or account). */
export interface ScaPaymentPayload {
  transaction_id: string;
  /** ISO 8601 date-time. */
  date_time: string;
  payee: ScaParty;
  /** Present for account payments initiated via a PISP. */
  pisp?: ScaProvider;
  /** "yyyy-mm-dd"; "" or omitted = immediate, future date = scheduled. */
  execution_date?: string;
  /** ISO 4217 code. */
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
  transaction_id: string;
  date_time: string;
  /** Mandate validity, "yyyy-mm-dd". */
  start_date: string;
  end_date: string;
  reference_number: string;
  creditor_id: string;
  purpose: string;
  /** Per-charge economics; populate `recurrence` for recurring mandates. */
  payment_payload: ScaPaymentPayload;
}

/** `urn:eudi:sca:login_risk_transaction:1` - login / risk-based action. */
export interface ScaLoginRiskPayload {
  transaction_id: string;
  date_time: string;
  /** e.g. "Piggy Bank Online Banking". */
  service: string;
  /** The action being authorised, e.g. "Change daily transaction limit". */
  action: string;
  action_type?: string;
}

/** `urn:eudi:sca:account_access:1` - AISP account-information consent. */
export interface ScaAccountAccessPayload {
  transaction_id: string;
  date_time: string;
  aisp: ScaProvider;
  /** Keep short - OWS enforces a length limit. */
  description: string;
}

/** EUDI SCA rulebook (TS12) payload; the family implies the `type` urn. */
export type ScaPayload =
  | ScaPaymentPayload
  | ScaEMandatePayload
  | ScaLoginRiskPayload
  | ScaAccountAccessPayload;

/** QES document signing: the wallet signs the linked document. */
export interface QesData {
  /** Document type, e.g. "pdf". */
  type: string;
  external_link: string;
}

/**
 * Wallet-displayed, wallet-signed transaction data (Strong Customer
 * Authentication). Exactly one variant:
 * - payment_data: simple payment (legacy shape)
 * - payload: EUDI SCA rulebook (TS12) payload; OWS wraps it into the
 *   OpenID4VP transaction_data array entry (type urn, credential_ids,
 *   hash alg)
 * - qes_data: QES document signing
 * The wallet's KB-JWT echoes matching transaction_data_hashes.
 */
export type TransactionData =
  | { payment_data: { payee: string; currency_amount: { currency: string; value: string | number } } }
  | { payload: ScaPayload }
  | { qes_data: QesData };

export interface StartDeferredRequest {
  issuanceMode: "Deferred";
  credentialDefinitionId: string;
  /** Gate issuance behind a presentation ("dynamic" issuance). */
  presentationDefinitionId?: string;
  userPin?: string;
  transactionData?: TransactionData;
}

export type IssueCredentialRequest = IssueInTimeRequest | StartDeferredRequest;

/** Body for supplying claims to complete a deferred issuance (PUT history). */
export interface UpdateCredentialHistoryPayload {
  credential: CredentialBody & { id?: string };
}

export interface CredentialHistoryItem {
  CredentialExchangeId?: string;
  credentialOffer?: string;
  credentialStatus?: "pending" | "ready";
  status?:
    | "offer_sent"
    | "offer_received"
    | "credential_issued"
    | "credential_acked"
    | "credential_accepted"
    | "credential_deleted"
    | "issuance_denied"
    | "token_issued";
  presentationExchangeId?: string;
  credential?: { type?: string[]; credentialSubject?: Record<string, unknown>; claims?: Record<string, unknown>; [k: string]: unknown };
  credentialFormat?: "jwt_vc_json" | "dc+sd-jwt" | "mso_mdoc";
  revocationStatus?: "Operational" | "Revoked" | "Suspended";
  holder?: { name: string; [k: string]: unknown };
  createdAt?: number;
  updatedAt?: number;
  [k: string]: unknown;
}

export interface IssueCredentialResponse {
  credentialHistory?: CredentialHistoryItem;
  [k: string]: unknown;
}

export interface CredentialHistoryResponse {
  credentialHistory: CredentialHistoryItem;
  [k: string]: unknown;
}

export interface UpdateCredentialHistoryResponse {
  success?: boolean;
  message?: string;
  [k: string]: unknown;
}

// ------------------------------------------------------------ Verification ---

export interface SendVerificationRequest {
  requestByReference: boolean;
  presentationDefinitionId: string;
  transactionData?: TransactionData;
  individualId?: string;
  mapperId?: string;
  [k: string]: unknown;
}

export interface VerificationHistoryItem {
  presentationExchangeId: string;
  vpTokenQrCode: string;
  status: "request_sent" | "request_received" | "presentation_acked";
  /** The accept/reject decision. */
  verified: boolean;
  /** Non-empty once the wallet has responded. */
  vpTokenResponse: string[];
  /** Disclosed claims; presentation[0] = first credential. */
  presentation?: Record<string, unknown>[];
  presentationSubmission?: Record<string, unknown>;
  holder?: { name: string; [k: string]: unknown };
  createdAt?: number;
  updatedAt?: number;
  /** Present for same-device Digital Credentials API flows. */
  dcApiRequest?: { chrome: unknown; safari: unknown };
  dcApiProtocol?: "openid4vp" | "openid4vp-v1-signed";
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
    vpTokenResponse: string[];
    presentation: Record<string, unknown>[];
    presentationExchangeId: string;
    status: string;
    holder?: { name: string; [k: string]: unknown };
    [k: string]: unknown;
  };
  organisationId?: string;
}
