import type { OwsClient } from "../owsClient";
import type { VerificationHistoryResponse } from "../types";
import { usePolledResource, type PollOptions, type PolledResource } from "./usePolledResource";

/**
 * Read verification state for a presentationExchangeId (verified flag + disclosed
 * claims). Optional polling; prefer SSE for the completion signal.
 */
export function useVerificationHistory(
  client: OwsClient,
  presentationExchangeId: string | null | undefined,
  options?: PollOptions,
): PolledResource<VerificationHistoryResponse> {
  return usePolledResource<VerificationHistoryResponse>(
    () => client.verification.readHistory(presentationExchangeId as string),
    [client, presentationExchangeId],
    { ...options, enabled: (options?.enabled ?? true) && !!presentationExchangeId },
  );
}
