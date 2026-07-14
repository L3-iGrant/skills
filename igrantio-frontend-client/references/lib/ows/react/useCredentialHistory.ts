import type { OwsClient } from "../owsClient";
import type { CredentialHistoryResponse } from "../types";
import { usePolledResource, type PollOptions, type PolledResource } from "./usePolledResource";

/**
 * Read issuance state for a CredentialExchangeId. Optional polling; prefer SSE
 * for the completion signal.
 */
export function useCredentialHistory(
  client: OwsClient,
  credentialExchangeId: string | null | undefined,
  options?: PollOptions,
): PolledResource<CredentialHistoryResponse> {
  return usePolledResource<CredentialHistoryResponse>(
    () => client.issuance.readHistory(credentialExchangeId as string),
    [client, credentialExchangeId],
    { ...options, enabled: (options?.enabled ?? true) && !!credentialExchangeId },
  );
}
