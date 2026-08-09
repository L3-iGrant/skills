/**
 * React hooks for the holder portal. Flow logic only - rendering lives in
 * `./components`, API paths in `./holderClient`, selection rules in
 * `./shareSelection`, display chains in `./credentialDisplay`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOwsClient } from "../../lib/ows";
import {
  createHolderClient,
  normalizeReceived,
  pickDescriptors,
  type CredentialRecord,
  type PresentationRecord,
  type PresentationStats,
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
  toggleDescriptor,
  toggleInstance,
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
  /** Holder backend proxy base for this tenant, e.g. https://host/ows/acme */
  proxyBaseUrl: string;
}

export function useHolderClient({ proxyBaseUrl }: HolderConfig) {
  const ows = useOwsClient(proxyBaseUrl);
  return useMemo(() => createHolderClient(ows), [ows]);
}

/* ------------------------------------------------------------------ */
/* Wallet lists                                                        */
/* ------------------------------------------------------------------ */

export function useWalletCredentials(config: HolderConfig & { expired?: boolean; pageSize?: number }) {
  const client = useHolderClient(config);
  const pageSize = config.pageSize ?? 10;
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
        // The wallet lists only fully accepted credentials.
        credentialStatus: "credential_accepted",
        search: search || undefined,
      });
      setRecords(res.credential ?? []);
      setTotal(res.pagination?.totalItems ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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
  const pageSize = config.pageSize ?? 10;
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
      setError(e instanceof Error ? e.message : String(e));
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

/* ------------------------------------------------------------------ */
/* Receive a credential (OpenID4VCI)                                   */
/* ------------------------------------------------------------------ */

export type ReceiveStatus = "idle" | "receiving" | "action_required" | "done" | "error";

export interface PendingCredential {
  record: CredentialRecord;
  action: NotificationAction;
}

/**
 * Deep-link helper: when the portal is opened via an OpenID4VP link carrying
 * `request_uri`, return the full URL (raw encoding preserved) to feed
 * `useShareFlow.start({requestUrl})`, and strip `request_uri` /
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
 * Front-channel helper: capture `?code`/`?state` after the issuer redirects
 * back, and clean the URL. Call `exchangeCode` with the result.
 */
export function captureAuthorizationCode(): { code: string; state: string | null } | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return null;
  const state = params.get("state");
  params.delete("code");
  params.delete("state");
  const qs = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  return { code, state };
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
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
      return null;
    }
  }, []);

  /** Paste/scan a credential offer. Returns the pending records with their next action. */
  const receive = useCallback(
    async (credentialOffer: string, opts?: { kid?: string; trustAnchor?: string }) => {
      setStatus("receiving");
      const res = await wrap(() => client.credentials.receiveOffer({ credentialOffer, ...opts }));
      if (!res) return null;
      const records = normalizeReceived(res.credential);
      const withActions = records.map((record) => ({
        record,
        action: deriveNotificationAction(record),
      }));
      setPending(withActions);
      setStatus(withActions.some((p) => p.action !== "none") ? "action_required" : "done");
      return withActions;
    },
    [client, wrap],
  );

  const submitTransactionCode = useCallback(
    async (id: string, userPin: string) => {
      const ok = await wrap(() => client.credentials.submitTransactionCode(id, userPin));
      if (ok !== null) setStatus("done");
      return ok !== null;
    },
    [client, wrap],
  );

  const exchangeCode = useCallback(
    async (code: string, state: string | null) => {
      const ok = await wrap(() => client.credentials.exchangeCode(code, state));
      if (ok !== null) setStatus("done");
      return ok !== null;
    },
    [client, wrap],
  );

  /** Deferred issuance: returns true once the credential arrived (`credential_acked`). */
  const receiveDeferred = useCallback(
    async (id: string) => {
      const res = await wrap(() => client.credentials.receiveDeferred(id));
      const acked = res?.credential?.credentialStatus === "credential_acked";
      if (acked) setStatus("done");
      return acked;
    },
    [client, wrap],
  );

  const accept = useCallback(
    async (id: string) => (await wrap(() => client.credentials.accept(id))) !== null,
    [client, wrap],
  );
  const reject = useCallback(
    async (id: string) => (await wrap(() => client.credentials.delete(id))) !== null,
    [client, wrap],
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
    async (
      source: { requestUrl: string; kid?: string; trustAnchor?: string } | { presentationId: string },
    ) => {
      setStatus("resolving");
      setError(null);
      try {
        const record =
          "requestUrl" in source
            ? (
                await client.presentations.receiveRequest({
                  vpTokenQrCode: source.requestUrl,
                  kid: source.kid,
                  trustAnchor: source.trustAnchor,
                })
              ).presentation
            : (await client.presentations.read(source.presentationId)).presentation;
        setPresentation(record);
        if (record.status === "presentation_acked") {
          setStatus("already_answered");
          return record;
        }
        const filterRes = await client.presentations.filter(record.presentationId);
        const descriptors = pickDescriptors(filterRes);
        if (preflightError(descriptors, record.dcqlQuery)) {
          setStatus("mandatory_missing"); // "Requested data is not present in holder"
          return record;
        }
        const m = buildShareModel(descriptors, record.dcqlQuery);
        setModel(m);
        setSelection(initialSelection(m));
        setStepIndex(0);
        setStatus("selecting");
        return record;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
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
      toggleDescriptor: (step: number, id: string, checked: boolean) =>
        setSelection((sel) => (model && sel ? toggleDescriptor(model, sel, step, id, checked) : sel)),
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

  /** Send the presentation; opens `responseRedirectUri` in a new tab when present. */
  const submit = useCallback(async () => {
    if (!model || !selection || !presentation) return false;
    setStatus("sending");
    try {
      const items = buildSubmissionPayload(model, selection);
      const res = await client.presentations.send(
        presentation.presentationId,
        items,
        !!presentation.dcqlQuery,
      );
      setStatus("shared");
      const redirect = res.presentation?.responseRedirectUri?.trim();
      if (redirect) window.open(redirect, "_blank");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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
          limit: 1000,
          search: search || undefined,
          notificationType: typeFilter || undefined,
        }),
      );
    } catch {
      // keep the previous list on transient failures
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
      // The stream has no replay: refetch on every (re)connect to close gaps.
      onConnected: () => void refresh(),
      onNotification: (n) =>
        setNotifications((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev])),
    });
    // Also refetch when the tab becomes visible again.
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      closeRef.current?.();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [config.proxyBaseUrl, streamEnabled, refresh]);

  const remove = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await client.delete(id).catch(() => refresh());
    },
    [client, refresh],
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
    notifications, loading, refresh, remove, clearAll, actionOf,
    search, setSearch, typeFilter, setTypeFilter,
  };
}
