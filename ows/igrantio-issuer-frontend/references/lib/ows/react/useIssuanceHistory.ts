import type { OwsClient } from "../owsClient";
import type { IssuanceHistoryDetail } from "../types";
import { usePolledResource, type PollOptions, type PolledResource } from "./usePolledResource";

/**
 * Read one issuance history by its credential exchange id. Optional polling;
 * prefer SSE for the completion signal.
 */
export function useIssuanceHistory(
  client: OwsClient,
  credentialExchangeId: string | null | undefined,
  options?: PollOptions,
): PolledResource<IssuanceHistoryDetail> {
  return usePolledResource<IssuanceHistoryDetail>(
    () => client.issuanceHistory.read(credentialExchangeId as string),
    [client, credentialExchangeId],
    { ...options, enabled: (options?.enabled ?? true) && !!credentialExchangeId },
  );
}
