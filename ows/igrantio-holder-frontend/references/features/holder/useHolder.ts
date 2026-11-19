/**
 * React hooks for the holder portal. Flow logic only: the rendering is in
 * `./components`, the API paths in `./holderClient`, the selection rules in
 * `./shareSelection`, the display chains in `./credentialDisplay`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOwsClient } from "../../lib/ows";
import {
  createHolderClient,
  normalizeReceived,
  pickQueryMatches,
  type AuthorizationResponse,
  type CredentialRecord,
  type HolderConfiguration,
  type PresentationRecord,
  type PresentationStats,
  type ReceiveCredentialPayload,
} from "./holderClient";
import {
  buildShareModel,
  buildSubmissionPayload,
  canSubmit as canSubmitSelection,
  chooseClaimSet,
  initialSelection,
  preflightError,
  selectOption,
  setCredential,
  toggleInstance,
  toggleQuery,
  type ShareModel,
  type ShareSelection,
} from "./shareSelection";
import {
  deriveNotificationAction,
  getNotificationContent,
  NotificationsClient,
  openNotificationsStream,
  type HolderNotification,
  type NotificationAction,
} from "./notificationsClient";

export interface HolderConfig {
  /** Holder backend proxy base of this tenant, for example https://wallet-portal.example.com/ows/acme */
  proxyBaseUrl: string;
}

export function useHolderClient({ proxyBaseUrl }: HolderConfig) {
  const ows = useOwsClient(proxyBaseUrl);
  return useMemo(() => createHolderClient(ows), [ows]);
}

/**
 * The text of a failed call: `errorDescription` of the API error answer
 * (the `lib/ows` error keeps the answer body in `body`), else the message.
 */
export function errorMessage(e: unknown): string {
  const body = (e as { body?: unknown } | null)?.body;
  if (typeof body === "string" && body) {
    try {
      const json = JSON.parse(body) as { errorDescription?: string; detail?: string };
      if (json.errorDescription || json.detail) return String(json.errorDescription ?? json.detail);
    } catch {
      // not JSON: use the message below
    }
  }
  return e instanceof Error ? e.message : String(e);
}

/* ------------------------------------------------------------------ */
/* Wallet lists                                                        */
/* ------------------------------------------------------------------ */

export function useWalletCredentials(config: HolderConfig & { expired?: boolean; pageSize?: number }) {
  const client = useHolderClient(config);
  const pageSize = Math.min(config.pageSize ?? 10, 100);
  const [records, setRecords] = useState<CredentialRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.credentials.list({
        limit: pageSize,
        offset: page * pageSize,
        expired: config.expired,
        // The wallet view lists the accepted credentials, newest received first,
        // with one row for each batch.
        credentialStatus: "credential_accepted",
        search: search || undefined,
        sortBy: "createdAt",
        groupBatches: true,
      });
      setRecords(res.credential ?? []);
      setTotal(res.pagination?.totalItems ?? 0);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [client, pageSize, page, config.expired, search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { records, total, page, setPage, pageSize, search, setSearch, loading, error, refresh };
}

export function useSharedPresentations(config: HolderConfig & { pageSize?: number }) {
  const client = useHolderClient(config);
  const pageSize = Math.min(config.pageSize ?? 10, 100);
  const [records, setRecords] = useState<PresentationRecord[]>([]);
  const [stats, setStats] = useState<PresentationStats>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"presentation_acked" | "presentation_pending" | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.presentations.list({
        limit: pageSize,
        offset: page * pageSize,
        search: search || undefined,
        status: statusFilter,
      });
      setRecords(res.presentation ?? []);
      setStats(res.presentationStats ?? {});
      setTotal(res.pagination?.totalItems ?? 0);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [client, pageSize, page, search, statusFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    records, stats, total, page, setPage, pageSize,
    search, setSearch, statusFilter, setStatusFilter, loading, error, refresh,
  };
}

export function useWalletUnitStatus(config: HolderConfig) {
  const client = useHolderClient(config);
  const [status, setStatus] = useState<string>("not_installed");
  useEffect(() => {
    let cancelled = false;
    client
      .walletUnitStatus()
      .then((res) => {
        if (!cancelled && res.status) setStatus(res.status.toLowerCase());
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [client]);
  return status;
}

/** The holder configuration (read only here; `client.configuration.update` changes it). */
export function useHolderConfiguration(config: HolderConfig) {
  const client = useHolderClient(config);
  const [configuration, setConfiguration] = useState<HolderConfiguration | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    client.configuration
      .read()
      .then((res) => {
        if (!cancelled) setConfiguration(res.globalConfiguration);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [client]);
  return { configuration, error };
}

/* ------------------------------------------------------------------ */
/* Receive a credential (OpenID4VCI)                                   */
/* ------------------------------------------------------------------ */

export type ReceiveStatus = "idle" | "receiving" | "action_required" | "done" | "error";

export interface PendingCredential {
  record: CredentialRecord;
  action: NotificationAction;
}

const withAction = (record: CredentialRecord): PendingCredential => ({
  record,
  action: deriveNotificationAction(record),
});

/**
 * Deep-link helper: when an OpenID4VP link with `request_uri` opens the
 * portal, return the full URL (raw encoding kept) for
 * `useShareFlow.start({requestUrl})`, and remove `request_uri` and
 * `request_uri_method` from the address bar.
 */
export function captureVerificationRequestUrl(): string | null {
  if (typeof window === "undefined") return null;
  if (!/[?&]request_uri=/.test(window.location.search)) return null;
  const fullUrl = window.location.href;
  const params = new URLSearchParams(window.location.search);
  params.delete("request_uri");
  params.delete("request_uri_method");
  const qs = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  return fullUrl;
}

/**
 * Front-channel helper: when the portal is the `redirectUrl` of the holder
 * configuration, capture `?code`, `?state` (and `?iss`) after the issuer
 * redirects back, and clean the URL. Give the result to `exchangeCode`. A
 * redirect without `state` cannot be matched to a credential record: null.
 */
export function captureAuthorizationCode(): AuthorizationResponse | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) return null;
  const iss = params.get("iss") ?? undefined;
  params.delete("code");
  params.delete("state");
  params.delete("iss");
  const qs = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  return { code, state, iss };
}

export function useReceiveCredential(config: HolderConfig) {
  const client = useHolderClient(config);
  const [status, setStatus] = useState<ReceiveStatus>("idle");
  const [pending, setPending] = useState<PendingCredential[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wrap = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(errorMessage(e));
      setStatus("error");
      return null;
    }
  }, []);

  /** Put the records of a step answer in place of the old ones (by id). */
  const merge = useCallback((records: CredentialRecord[]) => {
    setPending((prev) => {
      const next = [...prev];
      for (const record of records) {
        const i = next.findIndex((p) => p.record.id === record.id);
        if (i >= 0) next[i] = withAction(record);
        else next.push(withAction(record));
      }
      setStatus(next.some((p) => p.action !== "none") ? "action_required" : "done");
      return next;
    });
    return records.map(withAction);
  }, []);

  /** Receive an offer, or start a wallet-initiated issuance. Returns the records with their next action. */
  const receive = useCallback(
    async (payload: ReceiveCredentialPayload) => {
      setStatus("receiving");
      setPending([]);
      const res = await wrap(() => client.credentials.receive(payload));
      if (!res) return null;
      return merge(normalizeReceived(res.credential));
    },
    [client, wrap, merge],
  );

  const submitTransactionCode = useCallback(
    async (credentialId: string, transactionCode: string) => {
      const res = await wrap(() => client.credentials.submitTransactionCode(credentialId, transactionCode.trim()));
      return res ? merge(normalizeReceived(res.credential)) : null;
    },
    [client, wrap, merge],
  );

  const exchangeCode = useCallback(
    async (response: AuthorizationResponse) => {
      const res = await wrap(() => client.credentials.exchangeCode(response));
      return res ? merge(normalizeReceived(res.credential)) : null;
    },
    [client, wrap, merge],
  );

  /**
   * Deferred issuance: returns the record. `credential_acked` means that the
   * credential arrived; `credential_pending` means: call again after
   * `deferredIntervalSeconds`.
   */
  const receiveDeferred = useCallback(
    async (credentialId: string) => {
      const res = await wrap(() => client.credentials.receiveDeferred(credentialId));
      if (!res) return null;
      return merge(normalizeReceived(res.credential))[0]?.record ?? null;
    },
    [client, wrap, merge],
  );

  const settle = useCallback((credentialId: string) => {
    setPending((prev) => {
      const next = prev.filter((p) => p.record.id !== credentialId);
      setStatus(next.some((p) => p.action !== "none") ? "action_required" : "done");
      return next;
    });
  }, []);

  const accept = useCallback(
    async (credentialId: string) => {
      const ok = (await wrap(() => client.credentials.accept(credentialId))) !== null;
      if (ok) settle(credentialId);
      return ok;
    },
    [client, wrap, settle],
  );

  /** Refuse: delete the credential. The wallet tells the issuer. */
  const reject = useCallback(
    async (credentialId: string) => {
      const ok = await wrap(() => client.credentials.delete(credentialId).then(() => true));
      if (ok) settle(credentialId);
      return ok === true;
    },
    [client, wrap, settle],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setPending([]);
    setError(null);
  }, []);

  return { status, pending, error, receive, submitTransactionCode, exchangeCode, receiveDeferred, accept, reject, reset };
}

/* ------------------------------------------------------------------ */
/* Share credentials (OpenID4VP + DCQL)                                */
/* ------------------------------------------------------------------ */

export type ShareStatus =
  | "idle"
  | "resolving"
  | "selecting"
  | "sending"
  | "shared"
  | "already_answered"
  | "refused"
  | "mandatory_missing"
  | "error";

export function useShareFlow(config: HolderConfig) {
  const client = useHolderClient(config);
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [presentation, setPresentation] = useState<PresentationRecord | null>(null);
  const [model, setModel] = useState<ShareModel | null>(null);
  const [selection, setSelection] = useState<ShareSelection | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /** Start from a pasted request URL, or from a stored `presentationId` (notification flow). */
  const start = useCallback(
    async (source: { requestUrl: string } | { presentationId: string }) => {
      setStatus("resolving");
      setError(null);
      try {
        const record =
          "requestUrl" in source
            ? (await client.presentations.receiveRequest({ requestUrl: source.requestUrl })).presentation
            : (await client.presentations.read(source.presentationId)).presentation;
        setPresentation(record);
        if (record.status === "presentation_acked") {
          setStatus("already_answered");
          return record;
        }
        if (record.status === "request_refused") {
          setStatus("refused"); // record.refusalReason tells why
          return record;
        }
        const queries = pickQueryMatches(await client.presentations.matchingCredentials(record.presentationId));
        if (preflightError(queries, record.dcqlQuery)) {
          setStatus("mandatory_missing");
          return record;
        }
        const m = buildShareModel(queries, record.dcqlQuery);
        setModel(m);
        setSelection(initialSelection(m));
        setStepIndex(0);
        setStatus("selecting");
        return record;
      } catch (e) {
        setError(errorMessage(e));
        setStatus("error");
        return null;
      }
    },
    [client],
  );

  const actions = useMemo(
    () => ({
      selectOption: (step: number, choice: number | "none") =>
        setSelection((sel) => (model && sel ? selectOption(model, sel, step, choice) : sel)),
      toggleQuery: (step: number, id: string, checked: boolean) =>
        setSelection((sel) => (model && sel ? toggleQuery(model, sel, step, id, checked) : sel)),
      setCredential: (id: string, credentialId: string) =>
        setSelection((sel) => (sel ? setCredential(sel, id, credentialId) : sel)),
      toggleInstance: (id: string, credentialId: string) =>
        setSelection((sel) => (sel ? toggleInstance(sel, id, credentialId) : sel)),
      chooseClaimSet: (id: string, index: number) =>
        setSelection((sel) => (sel ? chooseClaimSet(sel, id, index) : sel)),
    }),
    [model],
  );

  const isLastStep = !model || stepIndex >= model.steps.length - 1;
  const next = useCallback(() => setStepIndex((i) => i + 1), []);
  const previous = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);
  const submittable = !!model && !!selection && canSubmitSelection(model, selection);

  /** Send the presentation; opens `responseRedirectUri` in a new tab when it is not empty. */
  const submit = useCallback(async () => {
    if (!model || !selection || !presentation) return false;
    setStatus("sending");
    setError(null);
    try {
      const items = buildSubmissionPayload(model, selection);
      const res = await client.presentations.send(presentation.presentationId, items);
      setPresentation(res.presentation ?? presentation);
      setStatus("shared");
      const redirect = res.presentation?.responseRedirectUri?.trim();
      if (redirect) window.open(redirect, "_blank");
      return true;
    } catch (e) {
      setError(errorMessage(e));
      setStatus("error");
      return false;
    }
  }, [client, model, selection, presentation]);

  const reset = useCallback(() => {
    setStatus("idle");
    setPresentation(null);
    setModel(null);
    setSelection(null);
    setStepIndex(0);
    setError(null);
  }, []);

  return {
    status, presentation, model, selection, stepIndex, isLastStep,
    error, submittable, start, actions, next, previous, submit, reset,
  };
}

/* ------------------------------------------------------------------ */
/* Notifications inbox                                                 */
/* ------------------------------------------------------------------ */

export function useHolderNotifications(config: HolderConfig & { stream?: boolean }) {
  const [notifications, setNotifications] = useState<HolderNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const client = useMemo(() => new NotificationsClient(config.proxyBaseUrl), [config.proxyBaseUrl]);
  const streamEnabled = config.stream !== false;
  const closeRef = useRef<(() => void) | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setNotifications(
        await client.list({
          limit: 100,
          search: search || undefined,
          notificationType: typeFilter || undefined,
        }),
      );
    } catch {
      // Keep the previous list when a call fails for a short time.
    } finally {
      setLoading(false);
    }
  }, [client, search, typeFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!streamEnabled) return;
    closeRef.current = openNotificationsStream({
      baseUrl: config.proxyBaseUrl,
      // Read the list on every (re)connect too: the replay has a size limit.
      onConnected: () => void refresh(),
      // A pending notification changes in place (same id): replace it.
      onNotification: (n) =>
        setNotifications((prev) =>
          prev.some((p) => p.id === n.id) ? prev.map((p) => (p.id === n.id ? n : p)) : [n, ...prev],
        ),
    });
    // Read the list again when the tab becomes visible.
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      closeRef.current?.();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [config.proxyBaseUrl, streamEnabled, refresh]);

  /**
   * Delete a notification. Caution: for a `credential_acked` notification
   * whose credential is still `credential_acked`, the wallet also deletes
   * the credential (the offer is refused).
   */
  const remove = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await client.delete(id).catch(() => refresh());
    },
    [client, refresh],
  );

  const markRead = useCallback(
    async (id: string) => {
      const updated = await client.markRead(id).catch(() => null);
      if (updated) setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    },
    [client],
  );

  const clearAll = useCallback(async () => {
    setNotifications([]);
    await client.deleteAll().catch(() => refresh());
  }, [client, refresh]);

  const actionOf = useCallback(
    (n: HolderNotification): NotificationAction => deriveNotificationAction(getNotificationContent(n)),
    [],
  );

  return {
    notifications, loading, refresh, remove, markRead, clearAll, actionOf,
    search, setSearch, typeFilter, setTypeFilter,
  };
}
