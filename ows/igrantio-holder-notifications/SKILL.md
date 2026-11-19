---
name: igrantio-holder-notifications
description: 'Composable building block: the iGrant.io OWS holder notifications inbox - the wallet-side channel that tells a HOLDER that a credential offer, a transaction code, a front-channel authorisation, a deferred credential, or a presentation during issuance needs action. REST operations to list, read, mark as read and delete notifications, a live Server-Sent Events stream with replay from the last event id, a backend relay that sends the key in the Authorization header (EventSource cannot send headers), and a dependency-free browser client with reconnect and backoff and a notification-to-next-action decision table. Composed by igrantio-holder-backend.'
license: Apache-2.0
metadata:
  categories: [backend]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, holder, wallet, notifications, Server-Sent Events, SSE, SSE ticket, OpenID4VCI, OpenID4VP
  version: 2026.11.02
  api: https://docs.igrant.io/docs/developer-apis/
  auth: OWS API key (Authorization "ApiKey <key>") sent by the backend relay and proxy; the browser sends no key
  requires-skills: igrantio-ows-overview
---

# iGrant.io holder notifications (REST + SSE)

## When to use
Use this skill when a **holder** (wallet-side) application must react to
wallet events: a received credential offer, a transaction code prompt, a
front-channel authorisation step, a deferred credential that is ready, or a
presentation that the issuer asks for during the issuance. The
notifications are the event channel of the holder user interface.
`igrantio-holder-backend` composes this skill.

The holder role needs no webhook URL. A server that must log or react
without a browser can also subscribe to the holder webhook events
(`ows.holder.credential.*`, `ows.holder.presentation.*`); see
`igrantio-api-webhooks`.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.

## Ask the integrator first
Ask one question at a time. Wait for the answer. Give the recommended
default with each question. Look up facts in the project (framework,
environment variables, an existing backend) instead of asking for them.
Record the answers before you write code.

1. **Environment** - demo, staging or production? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - do you have the OWS API key for that environment? If not,
   request it from [support@igrant.io](mailto:support@igrant.io) before you
   continue.
3. **Stream** - relay the stream through the tenant backend (recommended),
   give the browser a one-time SSE ticket, or read the list on a timer?

## Contract

The holder paths start with `/v4/config/ows/holder`. The browser calls them
through the tenant backend proxy (`{backend}/ows/{tenant}/...`).

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v4/config/ows/holder/notifications` | List. Filters: `status`, `notificationType`, `search`, `sortOrder` (`asc`, else newest first), `offset`, `limit` (default 10, at most 100). The answer is `{notification: [...], pagination}`. | [List notifications](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-notification/) |
| `GET` | `/v4/config/ows/holder/notifications/{notificationId}` | Read one. The answer is `{notification}`. | [Read notification](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-notification/) |
| `PUT` | `/v4/config/ows/holder/notifications/{notificationId}` | Mark one as read: body `{"status": "read"}` (the only accepted value). The answer is `{notification}`. | [Update notification](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-notification/) |
| `DELETE` | `/v4/config/ows/holder/notifications/{notificationId}` | Delete one (204). | [Delete notification](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-notification/) |
| `DELETE` | `/v4/config/ows/holder/notifications` | Delete all (204). | [Delete all notifications](https://docs.igrant.io/docs/openid4vc-api/config-delete-all-digital-wallet-open-id-notification/) |
| `GET` | `/v4/config/ows/holder/notification-stream` | The live stream (SSE). | [Stream notifications (SSE)](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-notification-sse/) |
| `POST` | `/v4/config/platform/sse-ticket` | A one-time ticket that lets a browser open the stream on the API host. | [Create SSE ticket](https://docs.igrant.io/docs/openid4vc-api/config-create-sse-ticket/) |

**Notification**: `id`, `notificationType`, `notificationTypeRelatedId`
(the credential id), `notificationContent`, `status` (`unread` or `read`),
`createdAt` and `updatedAt` (Unix seconds). `notificationType` values:
`credential_pending`, `credential_acked`, `credential_revoked`,
`credential_expired`.

`notificationContent` is a list with one item for each credential of the
offer (take `[0]` for the decision; an older notification can hold one
object). An item is the credential record at the time of the
notification, with the keys of the credential read operation: `id`,
`credentialStatus`, `requiresTransactionCode`, `txCode`, `acceptanceToken`,
`deferredIntervalSeconds`, `oauthFlow`, `authorisationRequest`,
`presentationId`, `issuer`, `credentialConfigurations`,
`credentialSignerTrustedListCheck` and more. It never holds a secret of the
flow (no transaction code, no access or refresh token).

**Next-action decision table** on the first content item
(`deriveNotificationAction` in the reference client; the first match wins).
An absent value is `null` in a notification and `""` in a credential answer.

| Action | Condition | Follow-up call | Then |
| --- | --- | --- | --- |
| `deferred_credential` | `credentialStatus` is `credential_pending` and `acceptanceToken` is set | `PUT .../holder/credentials/{id}/deferred-credential` | When the credential arrives, this notification changes in place to `credential_acked`. Do not delete it. When the issuer is not ready, call again after `deferredIntervalSeconds`. |
| `transaction_code` | pending and `requiresTransactionCode` is `true` | `PUT .../holder/credentials/{id}/transaction-code` with `{"transactionCode": "..."}` | The wallet makes a new notification for the result. Delete this one. |
| `authorization` | pending, `oauthFlow` is `frontchannel` and `authorisationRequest` is set | Open `authorisationRequest`. When the portal is the redirect URL, `POST .../holder/authorisation-code-exchanges` with `code`, `state` and `iss` | This notification changes in place. Do not delete it. |
| `verification` | pending and `presentationId` is set | `POST .../holder/presentations/{presentationId}/matching-credentials`, then `.../response` | The wallet then receives the credential and makes a new notification. Delete this one. |
| `review_credential` | `credentialStatus` is `credential_acked` | `PUT .../holder/credentials/{id}/acceptance`, or `DELETE .../holder/credentials/{id}` to refuse | Delete the notification after the accept or the refusal. |

Caution: a delete of a `credential_acked` notification whose credential is
still `credential_acked` also deletes the credential (the offer is refused).
Accept first, then delete the notification. To keep a notification, mark it
as read.

**SSE specifics**:
- The stream needs authentication. `EventSource` cannot send headers, and the
  key must not reach the browser. Two ways:
  - **Relay (recommended)**: the backend opens the stream with the
    `Authorization` header and pipes the bytes (`notificationsSse.ts`).
  - **Ticket**: the backend calls `POST /v4/config/platform/sse-ticket` with
    `{"path": "/v4/config/ows/holder/notification-stream"}`. The answer is
    `201 {"ticket": "...", "expiresIn": 30}`. The browser opens the stream on
    the API host with `?ticket=<ticket>`. A ticket is valid for 30 seconds and
    one connection: get a new ticket for each connection and each reconnect.
    An unknown, used or expired ticket gives 401.
- Frames: `retry: 30000`, then `event: connected` (`{}`), then one
  `event: notification` for each new notification, and a `: keep-alive`
  comment every 15 seconds. The `data` of a notification frame is the
  notification with no envelope. The frame `id` is the sequence of the event.
  When the organisation has no wallet, the stream sends `event: error`
  (`{"error": "..."}`) and ends.
- A frame comes when a notification is created, and again (same notification
  `id`, new type and content) when a pending notification changes in place.
  Replace the stored entry by `id`. A status change and a delete send no
  frame.
- Replay: on a reconnect, send the last frame `id` as `Last-Event-ID` or
  `lastEventId`; the wallet sends the missed frames first (at most 500).
  A replay can repeat a frame: drop a repeat by the frame `id`. The stream
  takes no other query parameter; use the list to filter.
- Reconnect with exponential backoff: 5 attempts, 1 s base, x2 for each
  attempt, 10 s cap, plus up to 500 ms jitter. Read the list again after
  each connect.

## Reference
[`./references`](./references):
- `notificationsSse.ts` - `notificationsSseRouter({ owsBaseUrl, getAuthorization })`,
  an Express relay that streams
  `GET /:tenant/v4/config/ows/holder/notification-stream`. **Canonical copy**:
  `igrantio-holder-backend` vendors it byte for byte.
- `notificationsClient.ts` - browser types, `NotificationsClient` (`list`,
  `get`, `markRead`, `delete`, `deleteAll`), `openNotificationsStream`
  (backoff, replay, repeat drop), `getNotificationContent` and
  `deriveNotificationAction`. **Canonical copy**: `igrantio-holder-frontend`
  vendors it byte for byte.

## Usage
Backend (mount the relay **before** the proxy, so that one base URL serves
both):
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
  onConnected: () => void client.list().then(setInbox),
  onNotification: (n) => {
    upsertById(n); // a pending notification can change in place
    const action = deriveNotificationAction(getNotificationContent(n));
    // Show the action. Delete the notification only as the table says.
  },
});
```

## Adapting
- **Filtering**: pass `notificationType` or `status` to `list()` to build a
  filtered inbox.
- **Read state**: use `markRead()` when the user opens a notification that
  needs no action (`credential_revoked`, `credential_expired`).

## Validation / done criteria
- `npm run typecheck` passes.
- The relay answers 404 for an unknown tenant and streams
  `text/event-stream` for a known one; the API key never appears in the
  browser.
- A received credential offer appears on the stream and in `list()`.
- A deferred credential that arrives changes the same inbox row to
  `credential_acked`, and the credential stays in the wallet.

## Documentation
When anything is unclear, consult the iGrant.io documentation before you
guess. If this skill and the documentation disagree, the documentation wins.

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis/
- Holder API group: https://docs.igrant.io/docs/category/openid4vc-api/holder/
- The exact holder paths and fields: `igrantio-api-holder`.
