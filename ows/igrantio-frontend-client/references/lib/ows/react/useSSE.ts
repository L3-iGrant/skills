import { useCallback, useEffect, useRef } from "react";
import { openSseSession, type SseSession } from "../sseClient";
import type { OwsWebhookEvent } from "../types";

/**
 * React wrapper over openSseSession. Returns imperative open/close so a flow can
 * connect once it has its resource ids and disconnect on completion/unmount.
 *
 *   const { open, close } = useSSE();
 *   open(credentialExchangeIds, webhookBaseUrl, (event) => { ... close(); });
 *   open(presentationExchangeId, webhookBaseUrl, (event) => { ... close(); });
 */
export function useSSE() {
  const sessionRef = useRef<SseSession | null>(null);
  const currentKeyRef = useRef<string | null>(null);

  const close = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    currentKeyRef.current = null;
  }, []);

  const open = useCallback(
    (
      resourceIds: string | string[],
      webhookBaseUrl: string,
      onMessage: (event: OwsWebhookEvent) => void,
    ) => {
      const ids = (Array.isArray(resourceIds) ? resourceIds : [resourceIds]).filter(Boolean);
      if (ids.length === 0) return;
      // Reuse an existing session for the same ids.
      const key = ids.join(",");
      if (currentKeyRef.current === key && sessionRef.current) return;
      close();
      currentKeyRef.current = key;
      sessionRef.current = openSseSession({ webhookBaseUrl, resourceIds: ids, onMessage });
    },
    [close],
  );

  useEffect(() => close, [close]);

  return { open, close };
}
