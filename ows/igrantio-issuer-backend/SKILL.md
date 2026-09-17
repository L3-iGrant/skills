---
name: igrantio-issuer-backend
description: Build the backend for an OpenID4VCI credential ISSUER against the iGrant.io Organisation Wallet Suite (OWS). A tenant-aware Node/TypeScript (Express) service that hides per-organisation API keys behind a proxy, registers and receives OWS issuance webhooks (HMAC-verified), and pushes live status to the browser over SSE. Use when an application must issue verifiable credentials (SD-JWT VC, W3C VC, mso_mdoc) to an eIDAS 2.0 EUDI Wallet (EUDIW) or European Business Wallet (EUBW) and the API key must never reach the frontend.
license: Apache-2.0
metadata:
  categories: [education, backend]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, OpenID4VCI, credential issuance, verifiable credentials, SD-JWT VC, mso_mdoc
  version: 2026.09.01
  api: https://docs.igrant.io/docs/category/openid4vc-api/issuer
  protocols: OpenID4VCI-1.0, SD-JWT-VC, W3C-VC-2.0, mso_mdoc
  auth: OWS API key (Authorization "ApiKey <key>") injected by the proxy; browser sends no key
  requires-skills: igrantio-ows-overview, igrantio-backend-proxy, igrantio-backend-webhooks, igrantio-backend-sse
---

# iGrant.io issuer backend (OpenID4VCI)

## When to use
Build or extend the server that an **issuer** frontend talks to. It composes three
building blocks for the issuance flow only (least privilege):
`igrantio-backend-proxy` + `igrantio-backend-webhooks` + `igrantio-backend-sse`.
For the verifier equivalent use `igrantio-verifier-backend` (separate skill). Read
`igrantio-ows-overview` first for the API and architecture.

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
3. **Tenancy** - one organisation, or several tenants each with its own API
   key? _Single tenant is one env var; multi-tenant needs a `TenantStore` (see
   `igrantio-backend-proxy`)._
4. **Backend host** - extend an existing Node/TypeScript backend, or scaffold
   a fresh Express service? _Look this up first; ask only if the repo is empty
   or ambiguous._
5. **Webhook reachability** - which public HTTPS URL receives OWS webhooks?
   _Local dev needs a tunnel or the polling fallback._
6. **Trust list** - is your issuer certificate (the trust anchor) registered
   in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   wallets show your credentials as unverified.

## What it does
- **Proxy** `GET|POST|PUT|DELETE ${PROXY_PREFIX}/{tenant}/...` → OWS, injecting the tenant's
  `ApiKey`. Allow-lists only OWS **credential** endpoints (issue, history).
- **Register** the issuer webhook idempotently (`ISSUER_TOPICS`) via
  `scripts/register-webhook.ts`.
- **Receive** `POST /webhook`, verify the `X-iGrant-Signature` HMAC, extract the
  `CredentialExchangeId`, store the event.
- **SSE** `GET /webhook/sse/{CredentialExchangeId}` streams the event to the browser;
  `DELETE /webhook/{id}` lets it consume-and-delete.

## Reference implementation
Runnable Express + TypeScript app in [`./references`](./references):
```
references/
  src/config.ts          env config
  src/tenants.ts         TenantStore - per-tenant API-key resolution (env or pluggable)
  src/eventStore.ts      in-memory event store (swap for Redis/Postgres)
  src/topics.ts          ISSUER_TOPICS + topic→exchangeId extraction
  src/proxy.ts           API-key-injecting reverse proxy (allow-list param)
  src/webhooks.ts        HMAC verify + receiver
  src/sse.ts             SSE stream + consume-and-delete
  src/server.ts          composition (issuer allow-list = credential/* only)
  src/registerWebhook.ts idempotent register helper
  scripts/register-webhook.ts   CLI
  .env.example  Dockerfile  package.json  tsconfig.json
```

## Steps
1. `cd references && cp .env.example .env`, then set `OWS_ENV`
   (demo|staging, default demo), `WEBHOOK_SECRET_KEY`, `PUBLIC_BASE_URL`, `CORS_ORIGINS`, and one
   `OWS_TENANT_<SLUG>_API_KEY` per organisation.
2. `npm install && npm run dev` - backend on `:6001`.
3. Register the webhook once per tenant: `npm run register-webhook -- <tenant>`
   (idempotent - safe to re-run; skips if the payloadUrl already exists).
4. Point the issuer frontend base URL at `${PUBLIC_BASE_URL}${PROXY_PREFIX}/<tenant>`
   and the webhook base at `${PUBLIC_BASE_URL}/webhook`.

## Issuance contract (what the frontend drives through this backend)
- `POST …/credential/issue` → response `credentialHistory.CredentialExchangeId`
  (SSE key) + `credentialHistory.credentialOffer` (QR URI).
- Deferred: on webhook `openid.credential.offer_received`,
  `PUT …/credential/history/{CredentialExchangeId}` with the claims.
- Done on webhook `openid.credential.credential_accepted` / `token_issued`.
See `igrantio-ows-overview/references/api-reference.md` §1 and §4.

## Adapting
- **Multi-instance**: replace `InMemoryEventStore` with a shared store (Redis/Postgres)
  implementing `EventStore`.
- **Key storage**: replace `EnvTenantStore` with a DB/secret-manager `TenantStore`.
- **Path scope**: `ISSUER_PERMITTED_PREFIXES` in `server.ts` is the allow-list.

## Validation / done criteria
- `npm run typecheck` passes.
- A wrong/absent `X-iGrant-Signature` yields 401; a valid one stores the event.
- Hitting a non-credential OWS path through the proxy yields 404 (least privilege).
- The browser SSE fires within ~1s of the webhook arriving, keyed by `CredentialExchangeId`.

## Register your certificate in the trust list
Wallets show your organisation as verified only when your certificate is in
the trust list. Do this before you go live on any environment:

1. Prepare the certificate. An issuer registers its trust anchor (the root
   CA certificate). A relying party registers its Wallet-Relying Party
   Access Certificate (WRPAC). `igrantio-api-key-management` shows how to
   get the CSR and upload the signed chain (`x5c`).
2. Contact [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>.
3. Confirm the verified badge in the wallet after the trust list refreshes.

Until the entry is in place the wallet shows an unverified warning.
`igrantio-trustlist-entries` covers registration from automation.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Configure a webhook: https://docs.igrant.io/docs/openid4vc-api/config-create-webhook
