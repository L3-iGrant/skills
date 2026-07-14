import { useMemo } from "react";
import { createOwsClient, type OwsClient } from "../owsClient";

/**
 * Memoised OWS client bound to a backend proxy base URL. Leave apiKey empty in
 * the browser (the backend injects it).
 */
export function useOwsClient(baseUrl: string, apiKey = ""): OwsClient {
  return useMemo(() => createOwsClient({ baseUrl, apiKey }), [baseUrl, apiKey]);
}
