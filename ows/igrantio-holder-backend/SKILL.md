---
name: igrantio-holder-backend
description: Build the backend for an EUDI Wallet / European Business Wallet HOLDER (the wallet side) against the iGrant.io Organisation Wallet Suite (OWS). A tenant-aware Node/TypeScript (Express) service that hides the API key of the organisation behind a proxy for the holder routes only - receive credential offers or start a wallet-initiated issuance (OpenID4VCI wallet side, with transaction code, front-channel authorisation code and deferred issuance), manage held credentials, receive and answer verifier presentation requests (OpenID4VP + DCQL wallet side), the holder configuration with its trust settings, the issuer metadata and the wallet unit status - and relays the holder notification stream (SSE). Use when an application must act as the wallet that receives, holds and presents verifiable credentials.
license: Apache-2.0
metadata:
  categories: [backend]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, holder, wallet, OpenID4VCI, OpenID4VP, DCQL, receive credential, present credential, notifications, SSE, trust settings, wallet unit
  version: 2026.11.02
  api: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC, W3C-VC-2.0, mso_mdoc
  auth: OWS API key (Authorization "ApiKey <key>") added by the proxy; the browser sends no key
  requires-skills: igrantio-ows-overview, igrantio-backend-proxy, igrantio-holder-notifications
---

# iGrant.io holder backend (wallet side: receive, hold, present)

## When to use
Build or extend the server that a **holder** (wallet) frontend talks to. The
organisation is the wallet that receives and presents credentials, for
example a European Business Wallet. This backend composes
`igrantio-backend-proxy` (with a holder allow-list) and the
`igrantio-holder-notifications` stream relay. For the other two roles use
`igrantio-issuer-backend` or `igrantio-verifier-backend`. Read
`igrantio-ows-overview` first. The holder contract in flow order is in
[`references/holder-api-reference.md`](./references/holder-api-reference.md);
the full field dictionary is `igrantio-api-holder`.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- A key of the **main organisation**. A key of a sandbox organisation cannot
  call the held credential operations (they answer 400).

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
3. **Tenancy** - one organisation, or several tenants each with its own API
   key? _One tenant is one environment variable; several tenants need a
   `TenantStore` (see `igrantio-backend-proxy`)._
4. **Backend host** - extend an existing Node/TypeScript backend, or
   scaffold a new Express service? _Look this up first; ask only if the
   repository is empty or not clear._

The holder role needs no webhook URL: the portal gets its events on the
notification stream. Do not ask for one.

## What it does
- **Proxy** `GET|POST|PUT|PATCH|DELETE ${PROXY_PREFIX}/{tenant}/...` to the
  API host, with the `ApiKey` of the tenant. It allows only the OWS
  **holder** routes (`/v4/config/ows/holder/...`); the issuer and verifier
  routes stay out (least privilege).
- **Relay** `GET ${PROXY_PREFIX}/{tenant}/v4/config/ows/holder/notification-stream`
  streams the holder notifications. It sends the key in the `Authorization`
  header (`EventSource` cannot send headers) and passes `Last-Event-ID` on as
  `lastEventId`, so that a reconnect replays the missed frames.

## Reference implementation
A runnable Express + TypeScript app in [`./references`](./references):
```
references/
  holder-api-reference.md  the holder contract in flow order (paths, bodies, answers)
  src/config.ts            environment configuration (canonical: igrantio-backend-proxy)
  src/tenants.ts           TenantStore: the API key of each tenant (canonical: igrantio-backend-proxy)
  src/proxy.ts             reverse proxy that adds the API key (canonical: igrantio-backend-proxy)
  src/notificationsSse.ts  notification stream relay (canonical: igrantio-holder-notifications)
  src/server.ts            composition: holder allow-list + relay
  .env.example  Dockerfile  package.json  tsconfig.json
```

## Steps
1. `cd references && cp .env.example .env`, then set `OWS_ENV` (demo,
   staging or production; default demo), `CORS_ORIGINS`, and one
   `OWS_TENANT_<SLUG>_API_KEY` for each organisation.
2. `npm install && npm run dev`: the backend listens on `:6003` (next to
   the issuer backend on `:6001` and the verifier backend on `:6002`).
3. Point the holder frontend (`igrantio-holder-frontend`) at
   `${PROXY_PREFIX}/<tenant>`. It opens the stream on
   `.../<tenant>/v4/config/ows/holder/notification-stream`.
4. For a front-channel issuance that returns to the portal, set
   `redirectUrl` of the holder configuration to the portal URL
   (`PATCH /v4/config/ows/holder/configuration`). Leave it empty to let the
   wallet exchange the code on its own callback URL.

## Holder contract (what the frontend drives through this backend)

### Receive a credential (OpenID4VCI)
1. `POST /v4/config/ows/holder/credentials` with `{credentialOffer}` (an
   offer link or the offer JSON), or with `{credentialIssuer,
   credentialConfigurationIds}` for a wallet-initiated issuance. The answer
   `credential` is one record or a list; `credentialId` (and `id`) is the
   key of the next calls. The body is strict: an unknown field gives 400.
2. Branch on the record (the first match wins):
   **deferred** (`acceptanceToken` set): `PUT /v4/config/ows/holder/credentials/{credentialId}/deferred-credential`
   until `credential_acked`, with a wait of `deferredIntervalSeconds`;
   **transaction code** (`requiresTransactionCode`): `PUT /v4/config/ows/holder/credentials/{credentialId}/transaction-code`
   with `{transactionCode}`;
   **front channel** (`oauthFlow` `frontchannel`): open
   `authorisationRequest`, then `POST /v4/config/ows/holder/authorisation-code-exchanges`
   with `{code, state, iss}` from the redirect;
   **presentation during issuance** (`presentationId` set): answer it as in
   "Present credentials" below.
3. Review: `PUT /v4/config/ows/holder/credentials/{credentialId}/acceptance`,
   or `DELETE /v4/config/ows/holder/credentials/{credentialId}` to refuse.
   List with `GET /v4/config/ows/holder/credentials` (answer `credential` and
   `pagination`; `groupBatches=true` gives one row for each batch).
4. Life cycle: `PUT /v4/config/ows/holder/credentials/{credentialId}/reissuance`
   gets a new credential with the refresh token;
   `GET /v4/config/ows/holder/credentials/{credentialId}/revocation-status`
   reads the status list of the issuer.

### Present credentials (OpenID4VP + DCQL)
1. `POST /v4/config/ows/holder/presentations` with `{requestUrl}` (the
   `openid4vp://` request as it is). The answer `presentation` has
   `presentationId`, `status`, `dcqlQuery`, `clientMetadata`,
   `relyingPartyTrustedListCheck` and `transactionDataDecoded` (show it
   before consent). `status` `request_refused` comes with `refusalReason`.
2. `POST /v4/config/ows/holder/presentations/{presentationId}/matching-credentials`
   (no body): `credentials[]` with `id`, `matchedCredentials`, `claimSets`
   and `multiple`.
3. `POST /v4/config/ows/holder/presentations/{presentationId}/response` with
   `{credentials: [{id, credentialId | credentialIds, claimIds?}]}`. The
   first item decides the form for all items. Open
   `presentation.responseRedirectUri` when it is not empty. The signature of
   transaction data happens in this call: there is no separate sign
   operation.

The notifications drive both flows: see `igrantio-holder-notifications` for
the notification-to-action table. Exact bodies, answers and status values:
[`references/holder-api-reference.md`](./references/holder-api-reference.md).

## Adapting
- **Recommended pairing**: a **Next.js + TypeScript** portal
  (`igrantio-holder-frontend`) with **Better Auth** passwordless login. Run
  this backend as its own service next to the Next.js app, set
  `CORS_ORIGINS` to the portal origin, and for a portal with many users,
  check the Better Auth session in an Express middleware before the proxy
  forwards to the API.
- **Key storage**: replace `EnvTenantStore` with a `TenantStore` on a
  database or a secret manager.
- **Path scope**: `HOLDER_PERMITTED_PATHS` in `server.ts` is the allow-list
  (a string matches as a prefix, a RegExp against the whole path).
- **Holder webhook events**: when a server must react without a browser,
  subscribe to `ows.holder.credential.*` and `ows.holder.presentation.*`
  with `igrantio-api-webhooks` (for example with `igrantio-backend-webhooks`).

## Validation / done criteria
- `npm run typecheck` passes.
- `GET /ows/<tenant>/v4/config/ows/holder/credentials` reaches the API; the
  issuer path `/ows/<tenant>/v4/config/ows/issuer/issuance-history` and the
  verifier path `/ows/<tenant>/v4/config/ows/verifier/verifications` answer
  404 from the proxy (least privilege).
- `DELETE /ows/<tenant>/v4/config/ows/holder/credentials/{credentialId}` and
  `PATCH /ows/<tenant>/v4/config/ows/holder/configuration` reach the API.
- The relay streams `text/event-stream` for a known tenant and answers 404
  for an unknown one; the API key never appears in the browser.

## Documentation
When anything is unclear, consult the iGrant.io documentation before you
guess. If this skill and the documentation disagree, the documentation wins.

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis/
- Holder API group: https://docs.igrant.io/docs/category/openid4vc-api/holder/
- Getting started: https://docs.igrant.io/docs/get-started/
- Workflow: issue a credential (OpenID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Workflow: send and verify credentials (OpenID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
