/**
 * OWS OpenID4VC request/response types (self-contained — no external SDK).
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

export interface StartDeferredRequest {
  issuanceMode: "Deferred";
  credentialDefinitionId: string;
  /** Gate issuance behind a presentation ("dynamic" issuance). */
  presentationDefinitionId?: string;
  userPin?: string;
  transactionData?: Record<string, unknown>;
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
  transactionData?: Record<string, unknown>;
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
