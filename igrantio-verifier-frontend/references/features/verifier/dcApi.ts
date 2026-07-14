/**
 * Same-device verification via the browser Digital Credentials API.
 *
 * Optional companion to the QR (cross-device) path. When
 * `verificationHistory.dcApiRequest` is present, invoke the wallet on THIS device
 * with `navigator.credentials.get`, then post the response back to OWS (through
 * your backend proxy) to complete the exchange. The SSE stream still delivers the
 * final verified result, so the UI code path is unchanged.
 *
 * Dependency-free; genericised from the landing-page dcApiService.
 */

export type DcApiProtocol = "openid4vp" | "openid4vp-v1-signed";

export interface DcApiRequest {
  chrome: unknown;
  safari: unknown;
}

export interface DcApiResult {
  success: boolean;
  data?: string;
  error?: string;
  errorType?: "cancelled" | "no_credential" | "not_supported" | "unknown";
}

interface DigitalCredentialsNavigator extends Navigator {
  credentials: CredentialsContainer & {
    get(options: { digital: unknown }): Promise<{ data: unknown; protocol: string }>;
  };
}

/** True if this browser exposes the Digital Credentials API. */
export function supportsDcApi(): boolean {
  return typeof navigator !== "undefined" && "credentials" in navigator;
}

function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/** Pick the platform-specific request object the backend prepared. */
export function getPlatformRequest(request: DcApiRequest): unknown {
  return isSafari() ? request.safari : request.chrome;
}

/** Invoke the wallet on this device; returns the raw credential data or an error. */
export async function invokeWallet(request: DcApiRequest): Promise<DcApiResult> {
  if (!supportsDcApi()) {
    return { success: false, error: "DC API not supported", errorType: "not_supported" };
  }

  const platformRequest = getPlatformRequest(request) as {
    digital?: { providers?: Array<{ protocol: string; request: string | object }> };
  };
  const nav = navigator as DigitalCredentialsNavigator;

  try {
    const providers = platformRequest?.digital?.providers;
    let credential: { data: unknown; protocol: string } | null = null;

    if (providers?.length) {
      const provider = providers[0];
      const data =
        typeof provider.request === "string" ? JSON.parse(provider.request) : provider.request;
      credential = await nav.credentials.get({
        digital: { requests: [{ protocol: provider.protocol, data }] },
      });
    } else {
      credential = await nav.credentials.get({ digital: platformRequest });
    }

    if (!credential?.data) {
      return { success: false, error: "No matching credential", errorType: "no_credential" };
    }
    const data =
      typeof credential.data === "string" ? credential.data : JSON.stringify(credential.data);
    return { success: true, data };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (name === "NotAllowedError" || name === "AbortError") {
      return { success: false, error: "Cancelled", errorType: "cancelled" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorType: "unknown",
    };
  }
}

/** Shape the wallet response for posting back to OWS to complete the exchange. */
export function buildReceivePayload(
  credentialData: string,
  protocol: DcApiProtocol,
): Record<string, unknown> {
  if (protocol === "openid4vp-v1-signed") {
    return { response: credentialData }; // encrypted JWE — send as-is
  }
  try {
    const parsed = JSON.parse(credentialData);
    return { vp_token: parsed.vp_token ?? parsed };
  } catch {
    return { vp_token: credentialData };
  }
}
