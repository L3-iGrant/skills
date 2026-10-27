---
name: igrantio-holder-notifications
description: 'Composable building block: the iGrant.io OWS holder notifications inbox - the wallet-side channel that tells a HOLDER a credential offer, transaction code, front-channel authorization, deferred credential, or presentation request needs action. REST endpoints to list and delete notifications, a live Server-Sent Events stream with replay from the last event id, a backend relay that sends the key in the Authorization header (EventSource cannot send headers), and a dependency-free browser client with reconnect/backoff and a notification-to-next-action decision table. Composed by igrantio-holder-backend.'
license: Apache-2.0
metadata:
  categories: [backend]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, holder, wallet, notifications, Server-Sent Events, SSE, OpenID4VCI, OpenID4VP
  version: 2026.10.01
  api: https://docs.igrant.io/docs/developer-apis
  auth: OWS API key (Authorization "ApiKey <key>") injected by the backend relay and proxy; the browser sends no key
  requires-skills: igrantio-ows-overview
---

# iGrant.io holder notifications (REST + SSE)

## When to use
Whenever a **holder** (wallet-side) application must react to wallet events:
an incoming credential offer, a transaction-code prompt, a front-channel
authorization step, a deferred credential becoming ready, or a verifier's
presentation request. Notifications are the holder's event channel - the
holder role has **no webhooks**; issuer/verifier backends use
`igrantio-backend-webhooks` instead. `igrantio-holder-backend` composes this
skill.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
  A key works only in its own environment.

## Ask the integrator first
Ask one question at a time. Wait for the answer. Give the recommended
default with each question. Look up facts in the project (framework,
environment variables, an existing backend) instead of asking for them.
Record the answers before you write code.

1. **Environment** - demo or staging? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - do you have the OWS API key for that environment? If not,
   request it from [support@igrant.io](mailto:support@igrant.io) before you
   continue.
3. **Relay** - stream through the tenant backend relay (recommended), or read
   the list on a timer?
4. **Handled** - mark a notification handled by delete (recommended) or by
   status update?

## Contract

Paths are relative to the OWS base URL; the browser calls them through the
tenant backend proxy (`{backend}/ows/{tenant}/…`).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `v2/config/digital-wallet/openid/notifications?limit=&offset=&search=&notificationType=&status=&sortOrder=` | list; the array is under the response's **`notification`** key, with `pagination` |
| GET | `v2/config/digital-wallet/openid/notification/{id}` | read one |
| PUT | `v2/config/digital-wallet/openid/notification/{id}` | update one - body `{ "status": "<string>" }`, response `{ "notification": … }` |
| DELETE | `v2/config/digital-wallet/openid/notification/{id}` | delete one (the usual "handled" signal, 204) |
| DELETE | `v2/config/digital-wallet/openid/notifications` | delete all (204) |
| GET (SSE) | `v2/config/digital-wallet/openid/notifications/sse[?lastEventId=]` | live stream |

**Notification item**: `id`, `notificationType`, `notificationTypeRelatedId`
(the credential record id), `notificationContent` (object **or** array - take
`[0]`), `status` (`unread`), `createdAt`, `updatedAt` (Unix seconds).
`notificationType` values: `credential_pending`, `credential_acked`,
`credential_revoked`, `credential_expired`.

**Next-action decision table** on `notificationContent`
(`deriveNotificationAction` in the reference client; the calls it names are in
`igrantio-holder-backend/references/holder-api-reference.md`):

| Action | Condition | Follow-up call |
| --- | --- | --- |
| `transaction_code` | `credentialStatus == "credential_pending"` and `userPinRequired` and `userPin` absent | `PUT …/sdjwt/credential/{id}/user-pin` |
| `authorization` | pending, `acceptanceToken` absent, `oAuthFlow == "frontchannel"`, `authorizationRequest` set | open `authorizationRequest`, then `POST …/sdjwt/credential/exchange-code` |
| `deferred_credential` | pending and `acceptanceToken` present | `PUT …/sdjwt/credential/{id}/receive-deferred` |
| `verification` | pending, `presentationId` present, `acceptanceToken` absent | `POST …/sdjwt/verification/{presentationId}/filter`, then v3 `…/{presentationId}/send` |
| `review_credential` | `credentialStatus == "credential_acked"` | `PUT …/sdjwt/credential/{id}/accept` (or `DELETE` to reject) |

**SSE specifics**:
- `EventSource` cannot send headers and the key must not reach the browser,
  so the backend relay opens the OWS stream with the `Authorization` header.
- Frames: `retry: 30000`, then `event: connected` (`{}`), then one
  `event: notification` per notification, and a keep-alive comment every 15s.
  The `notification` data is the notification object with no envelope; the
  frame `id` is the event sequence. `event: error` (`{"error": "…"}`, for
  example an organisation without a wallet) is followed by the end of the
  stream.
- A frame comes when a notification is created, and again (same notification
  `id`, new type and content) when a pending notification changes in place.
  Replace the stored entry by `id`. Deletions and status updates send no
  frame.
- Replay: on reconnect, send the last frame `id` as `Last-Event-ID` or
  `lastEventId`; OWS sends the missed frames first. A replay can repeat a
  frame: drop a repeat by the frame `id`. The stream takes no other query
  parameters; use the list to filter.
- Reconnect with exponential backoff: 5 attempts, 1s base, x2 per attempt,
  10s cap, plus up to 500ms jitter. Refetch the list after a reconnect.
  Delete the notification once acted on - deletion is the "handled" signal.

## Reference
[`./references`](./references):
- `notificationsSse.ts` - `notificationsSseRouter({ owsBaseUrl, getAuthorization })`
  Express relay; streams `GET /:tenant/v2/config/digital-wallet/openid/notifications/sse`.
  **Canonical copy** - `igrantio-holder-backend` vendors it byte-for-byte.
- `notificationsClient.ts` - browser types + `NotificationsClient` (list /
  update / delete / deleteAll), `openNotificationsStream` (backoff, replay,
  dedup),
  `getNotificationContent`, `deriveNotificationAction`.

## Usage
Backend (mount the relay **before** the proxy so one base URL serves both):
```ts
app.use(config.proxyPrefix, notificationsSseRouter({
  owsBaseUrl: config.owsBaseUrl,
  getAuthorization: async (tenant) => {
    const key = await tenants.getApiKey(tenant);
    return key ? `ApiKey ${key}` : undefined;
  },
}));
app.use(config.proxyPrefix, proxyRouter(tenants, HOLDER_PERMITTED_PATHS));
```

Browser:
```ts
const client = new NotificationsClient("https://backend.example.com/ows/acme");
const close = openNotificationsStream({
  baseUrl: "https://backend.example.com/ows/acme",
  onNotification: async (n) => {
    const action = deriveNotificationAction(getNotificationContent(n));
    // switch (action) { … }  then: await client.delete(n.id);
  },
});
```

## Adapting
- **Filtering**: pass `notificationType` to `list()` to build a filtered inbox.

## Validation / done criteria
- `npm run typecheck` passes.
- The relay returns 404 for an unknown tenant and streams `text/event-stream`
  for a known one; the API key never appears in the browser.
- A wallet event (e.g. a credential offer received) appears on the stream and
  in `list()`; deleting the notification removes it from the next `list()`.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
