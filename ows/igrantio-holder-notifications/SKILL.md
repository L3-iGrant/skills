---
name: igrantio-holder-notifications
description: 'Composable building block: the iGrant.io OWS holder notifications inbox - the wallet-side channel that tells a HOLDER a credential offer, transaction code, front-channel authorization, deferred credential, or presentation request needs action. REST endpoints to list and delete notifications, a live Server-Sent Events stream (auth via the authorization query parameter because EventSource cannot send headers), a backend relay that injects the key, and a dependency-free browser client with reconnect/backoff and a notification-to-next-action decision table. Composed by igrantio-holder-backend.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, holder, wallet, notifications, Server-Sent Events, SSE, OpenID4VCI, OpenID4VP
  version: 2026.08.01
  api: https://docs.igrant.io/docs/developer-apis
  auth: OWS API key injected by the backend relay/proxy; the SSE upstream reads the "authorization" query parameter
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

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each.

## Contract

Paths are relative to the OWS base URL; the browser calls them through the
tenant backend proxy (`{backend}/ows/{tenant}/…`).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `v2/config/digital-wallet/openid/notifications?limit=&offset=&search=&notificationType=` | list; the array is under the response's **`notification`** key |
| PUT | `v2/config/digital-wallet/openid/notification/{id}` | update one (e.g. mark handled) |
| DELETE | `v2/config/digital-wallet/openid/notification/{id}` | delete one (the usual "handled" signal) |
| DELETE | `v2/config/digital-wallet/openid/notifications` | delete all |
| GET (SSE) | `v2/config/digital-wallet/openid/notifications/sse?status=unread&limit=10&offset=0&authorization=…` | live stream |

**Notification item**: `id`, `notificationType`, `notificationContent`
(object **or** array - take `[0]`), `status` (`unread`), `createdAt`,
`updatedAt`. `notificationType` values: `credential_pending`,
`credential_acked`, `credential_revoked`, `credential_expired`, and (SSE only)
`credential_received`.

**Next-action decision table** on `notificationContent`
(`deriveNotificationAction` in the reference client; the calls it names are in
`igrantio-holder-backend/references/holder-api-reference.md`):

| Action | Condition | Follow-up call |
| --- | --- | --- |
| `transaction_code` | `credentialStatus == "credential_pending"` and `userPinRequired` and `userPin` absent | `PUT …/sdjwt/credential/{id}/user-pin` |
| `authorization` | pending, `acceptanceToken` absent, `oAuthFlow == "frontchannel"`, `authorizationRequest` set | open `authorizationRequest`, then `POST …/sdjwt/credential/exchange-code` |
| `deferred_credential` | pending and `acceptanceToken` present | `PUT …/sdjwt/credential/{id}/receive-deferred` |
| `verification` | pending, `presentationId` present, `acceptanceToken` absent | `POST …/sdjwt/verification/{id}/filter` → `…/{presentationId}/send` |
| `review_credential` | `credentialStatus == "credential_acked"` | `PUT …/sdjwt/credential/{id}/accept` (or `DELETE` to reject) |

**SSE specifics**:
- Auth rides in the **`authorization` query parameter** (value e.g.
  `ApiKey <key>` or `Bearer <jwt>`) because `EventSource` cannot send headers.
  The key must not reach the browser, so the backend relay injects it.
- Named events: `connected`, `config`, `notification`, `close`; also handle
  untyped messages.
- `notification` payloads come in two shapes: a root-level
  `{ notificationType, notificationContent, id }` or legacy
  `{ notification: [ … ] }`. De-duplicate by `id`.
- Reconnect with exponential backoff: 5 attempts, 1s base, x2 per attempt,
  10s cap, plus up to 500ms jitter; treat ~3 minutes of silence as stale and
  reconnect. Delete the notification once acted on - deletion is the
  "handled" signal.

## Reference
[`./references`](./references):
- `notificationsSse.ts` - `notificationsSseRouter({ owsBaseUrl, getAuthorization })`
  Express relay; streams `GET /:tenant/v2/config/digital-wallet/openid/notifications/sse`.
  **Canonical copy** - `igrantio-holder-backend` vendors it byte-for-byte.
- `notificationsClient.ts` - browser types + `NotificationsClient` (list /
  update / delete / deleteAll), `openNotificationsStream` (backoff + dedup),
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
- **Auth scheme**: if your OWS deployment authenticates SSE with user tokens,
  return `Bearer <jwt>` from `getAuthorization` - the relay passes the value
  through unchanged.
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
