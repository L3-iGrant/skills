import type {
  CreateIssuanceRequest,
  DcApiReceivePayload,
  IssuanceClaimsRequest,
  IssuanceCreated,
  IssuanceDetail,
  IssuanceRevocation,
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

const ISSUANCES = "/v4/config/ows/issuer/issuances";
const VERIFICATIONS = "/v4/config/ows/verifier/verifications";

const PATHS = {
  issuances: ISSUANCES,
  issuance: (id: string) => `${ISSUANCES}/${encodeURIComponent(id)}`,
  verifications: VERIFICATIONS,
  verification: (id: string) => `${VERIFICATIONS}/${encodeURIComponent(id)}`,
} as const;

export interface OwsClient {
  issuance: {
    /** Make one issuance and its credential offer. `in_time` needs the claims now. */
    create(payload: CreateIssuanceRequest): Promise<IssuanceCreated>;
    /** Give the claims of a `deferred` issuance (PUT .../issuances/{id}/claims). */
    supplyClaims(issuanceId: string, payload: IssuanceClaimsRequest): Promise<IssuanceDetail>;
    /** Read the detail of the issuance; `includeClaims` adds the claims. */
    read(issuanceId: string, options?: { includeClaims?: boolean }): Promise<IssuanceDetail>;
    /** Delete the issuance and stop its offer (204). */
    delete(issuanceId: string): Promise<void>;
    /** Revoke every issued credential of the issuance. Final. */
    revoke(issuanceId: string, reason?: string): Promise<IssuanceRevocation>;
  };
  verification: {
    /** Send a DCQL verification request; returns the QR URI + presentationExchangeId. */
    sendRequest(payload: SendVerificationRequest): Promise<VerificationResponse>;
    /** Read the verification result (verified flag + disclosed claims). */
    readHistory(presentationExchangeId: string): Promise<VerificationHistoryResponse>;
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
    issuance: {
      create: (payload) => request("POST", PATHS.issuances, payload),
      supplyClaims: (id, payload) => request("PUT", `${PATHS.issuance(id)}/claims`, payload),
      read: (id, options) =>
        request("GET", `${PATHS.issuance(id)}${options?.includeClaims ? "?include=claims" : ""}`),
      delete: (id) => request("DELETE", PATHS.issuance(id)),
      revoke: (id, reason) =>
        request("POST", `${PATHS.issuance(id)}/revocation`, reason ? { reason } : {}),
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
