import { useCallback, useEffect, useRef, useState } from "react";

export interface PolledResource<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  refetch: () => void;
}

export interface PollOptions {
  /** Poll interval in ms; 0 disables polling (fetch once). */
  refreshInterval?: number;
  /** Gate the fetch (e.g. until an id is known). */
  enabled?: boolean;
}

/**
 * Small generic polling primitive - no external data-fetching dependency.
 * `useCredentialHistory` and `useVerificationHistory` are built on it. Prefer
 * SSE for completion signals; use polling as a fallback or for periodic reads.
 */
export function usePolledResource<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
  { refreshInterval = 0, enabled = true }: PollOptions = {},
): PolledResource<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await fetcherRef.current());
      setError(undefined);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled) return;
    void load();
    if (refreshInterval <= 0) return;
    const id = setInterval(() => void load(), refreshInterval);
    return () => clearInterval(id);
  }, [enabled, refreshInterval, load]);

  return { data, error, isLoading, refetch: load };
}
