import type {
  DcApiReceivePayload,
  IssuanceHistoryClaimsRequest,
  IssuanceHistoryCreated,
  IssuanceHistoryDetail,
  IssuanceHistoryRevocation,
  IssueCredentialRequest,
  SendVerificationRequest,
  VerificationHistoryResponse,
  VerificationResponse,
} from "./types";

/**
 * A dependency-free OWS client that talks to your tenant backend proxy.
 *
 * `baseUrl` is the proxy base, e.g. `https://host/ows/acme`. Leave `apiKey`
 * empty in the browser - the backend injects the real OWS key. Set `apiKey`
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

const ISSUANCE_HISTORY = "/v4/config/ows/issuer/issuance-history";
const VERIFICATIONS = "/v4/config/ows/verifier/verifications";

const PATHS = {
  issuanceHistory: ISSUANCE_HISTORY,
  issuanceHistoryItem: (credentialExchangeId: string) =>
    `${ISSUANCE_HISTORY}/${encodeURIComponent(credentialExchangeId)}`,
  verifications: VERIFICATIONS,
  verification: (id: string) => `${VERIFICATIONS}/${encodeURIComponent(id)}`,
} as const;

export interface OwsClient {
  issuanceHistory: {
    /**
     * Issue a credential: one credential offer for all the credential
     * configurations of the definition, and one issuance history for each.
     * `in_time` needs the claims of each configuration in `credentials`.
     */
    issue(payload: IssueCredentialRequest): Promise<IssuanceHistoryCreated>;
    /** Give the claims of a `deferred` issuance history (PUT .../issuance-history/{id}/claims). */
    supplyClaims(credentialExchangeId: string, payload: IssuanceHistoryClaimsRequest): Promise<IssuanceHistoryDetail>;
    /** Read one issuance history; `includeClaims` adds the claims. */
    read(credentialExchangeId: string, options?: { includeClaims?: boolean }): Promise<IssuanceHistoryDetail>;
    /** Delete one issuance history and stop its offer (204). */
    delete(credentialExchangeId: string): Promise<void>;
    /** Revoke every issued credential of the issuance history. Final. */
    revoke(credentialExchangeId: string, reason?: string): Promise<IssuanceHistoryRevocation>;
  };
  verification: {
    /** Send a DCQL verification request; the answer has `requestUrl` (the QR URI) and the presentationExchangeId. */
    sendRequest(payload: SendVerificationRequest): Promise<VerificationResponse>;
    /** Read the verification: `isVerified` and the disclosed claims (`presentation`). */
    readHistory(presentationExchangeId: string): Promise<VerificationHistoryResponse>;
    /** Delete the verification (200, empty body). */
    deleteHistory(presentationExchangeId: string): Promise<void>;
    /** Post the wallet answer of a same-device Digital Credentials API request back to OWS. */
    receiveDcApiResponse(presentationExchangeId: string, payload: DcApiReceivePayload): Promise<unknown>;
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
    // A delete answers 204 (or 200) with an empty body.
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  return {
    issuanceHistory: {
      issue: (payload) => request("POST", PATHS.issuanceHistory, payload),
      supplyClaims: (id, payload) => request("PUT", `${PATHS.issuanceHistoryItem(id)}/claims`, payload),
      read: (id, options) =>
        request("GET", `${PATHS.issuanceHistoryItem(id)}${options?.includeClaims ? "?include=claims" : ""}`),
      delete: (id) => request("DELETE", PATHS.issuanceHistoryItem(id)),
      revoke: (id, reason) =>
        request("POST", `${PATHS.issuanceHistoryItem(id)}/revocation`, reason ? { reason } : {}),
    },
    verification: {
      sendRequest: (payload) => request("POST", PATHS.verifications, payload),
      readHistory: (id) => request("GET", PATHS.verification(id)),
      deleteHistory: (id) => request("DELETE", PATHS.verification(id)),
      receiveDcApiResponse: (id, payload) => request("POST", `${PATHS.verification(id)}/response`, payload),
    },
    request,
  };
}
