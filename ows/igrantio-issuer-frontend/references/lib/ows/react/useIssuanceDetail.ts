import type { OwsClient } from "../owsClient";
import type { IssuanceDetail } from "../types";
import { usePolledResource, type PollOptions, type PolledResource } from "./usePolledResource";

/**
 * Read the detail of an issuance by its id. Optional polling; prefer SSE for
 * the completion signal.
 */
export function useIssuanceDetail(
  client: OwsClient,
  issuanceId: string | null | undefined,
  options?: PollOptions,
): PolledResource<IssuanceDetail> {
  return usePolledResource<IssuanceDetail>(
    () => client.issuance.read(issuanceId as string),
    [client, issuanceId],
    { ...options, enabled: (options?.enabled ?? true) && !!issuanceId },
  );
}
