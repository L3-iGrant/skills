import type {
  CredentialHistoryResponse,
  IssueCredentialResponse,
  IssueInTimeRequest,
  SendVerificationRequest,
  StartDeferredRequest,
  UpdateCredentialHistoryPayload,
  UpdateCredentialHistoryResponse,
  VerificationHistoryResponse,
  VerificationResponse,
} from "./types";

/**
 * A dependency-free OWS client that talks to your tenant backend proxy.
 *
 * `baseUrl` is the proxy base, e.g. `https://host/ows/acme`. Leave `apiKey`
 * empty in the browser — the backend injects the real OWS key. Set `apiKey`
 * only for local direct-to-OWS testing.
 */
export interface OwsClientConfig {
  baseUrl: string;
  apiKey?: string;
  /** Inject a custom fetch (SSR/testing). Defaults to global fetch. */
  fetchFn?: typeof fetch;
}

export class OwsError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`OWS request failed (${status}): ${body}`);
    this.name = "OwsError";
  }
}

const PATHS = {
  issue: "/v2/config/digital-wallet/openid/sdjwt/credential/issue",
  credentialHistory: (id: string) => `/v2/config/digital-wallet/openid/sdjwt/credential/history/${id}`,
  verificationSend: "/v3/config/digital-wallet/openid/sdjwt/verification/send",
  verificationHistory: (id: string) => `/v3/config/digital-wallet/openid/sdjwt/verification/history/${id}`,
} as const;

export interface OwsClient {
  issuance: {
    /** InTime: claims known now — wallet receives the finished credential. */
    issueInTime(payload: IssueInTimeRequest): Promise<IssueCredentialResponse>;
    /** Deferred: create the offer now; supply claims later via completeDeferred(). */
    startDeferred(payload: StartDeferredRequest): Promise<IssueCredentialResponse>;
    /** Supply the claims for a deferred issuance (PUT credential/history/{id}). */
    completeDeferred(
      credentialExchangeId: string,
      payload: UpdateCredentialHistoryPayload,
    ): Promise<UpdateCredentialHistoryResponse>;
    /** Read the current issuance state. */
    readHistory(credentialExchangeId: string): Promise<CredentialHistoryResponse>;
    deleteHistory(credentialExchangeId: string): Promise<void>;
  };
  verification: {
    /** Send a DCQL verification request; returns the QR URI + presentationExchangeId. */
    sendRequest(payload: SendVerificationRequest): Promise<VerificationResponse>;
    /** Read the verification result (verified flag + disclosed claims). */
    readHistory(presentationExchangeId: string): Promise<VerificationHistoryResponse>;
    deleteHistory(presentationExchangeId: string): Promise<void>;
  };
  /** Escape hatch for ad-hoc calls. */
  request<T>(method: string, path: string, body?: unknown): Promise<T>;
}

export function createOwsClient(config: OwsClientConfig): OwsClient {
  const base = config.baseUrl.replace(/\/$/, "");
  const doFetch = config.fetchFn ?? fetch;

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (config.apiKey) {
      headers.Authorization = config.apiKey.startsWith("ApiKey ") ? config.apiKey : `ApiKey ${config.apiKey}`;
    }
    const res = await doFetch(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new OwsError(res.status, await res.text().catch(() => ""));
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    issuance: {
      issueInTime: (payload) => request("POST", PATHS.issue, payload),
      startDeferred: (payload) => request("POST", PATHS.issue, payload),
      completeDeferred: (id, payload) => request("PUT", PATHS.credentialHistory(id), payload),
      readHistory: (id) => request("GET", PATHS.credentialHistory(id)),
      deleteHistory: (id) => request("DELETE", PATHS.credentialHistory(id)),
    },
    verification: {
      sendRequest: (payload) => request("POST", PATHS.verificationSend, payload),
      readHistory: (id) => request("GET", PATHS.verificationHistory(id)),
      deleteHistory: (id) => request("DELETE", PATHS.verificationHistory(id)),
    },
    request,
  };
}
