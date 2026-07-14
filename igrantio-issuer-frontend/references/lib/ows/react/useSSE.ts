import { useCallback, useEffect, useRef } from "react";
import { openSseSession, type SseSession } from "../sseClient";
import type { OwsWebhookEvent } from "../types";

/**
 * React wrapper over openSseSession. Returns imperative open/close so a flow can
 * connect once it has an exchange id and disconnect on completion/unmount.
 *
 *   const { open, close } = useSSE();
 *   open(exchangeId, webhookBaseUrl, (event) => { ... close(); });
 */
export function useSSE() {
  const sessionRef = useRef<SseSession | null>(null);
  const currentIdRef = useRef<string | null>(null);

  const close = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    currentIdRef.current = null;
  }, []);

  const open = useCallback(
    (exchangeId: string, webhookBaseUrl: string, onMessage: (event: OwsWebhookEvent) => void) => {
      if (!exchangeId) return;
      // Reuse an existing session for the same id.
      if (currentIdRef.current === exchangeId && sessionRef.current) return;
      close();
      currentIdRef.current = exchangeId;
      sessionRef.current = openSseSession({ webhookBaseUrl, exchangeId, onMessage });
    },
    [close],
  );

  useEffect(() => close, [close]);

  return { open, close };
}
