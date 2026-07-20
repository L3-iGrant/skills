---
name: igrantio-issuer-backend
description: Build the backend for an OpenID4VCI credential ISSUER against the iGrant.io Organisation Wallet Suite (OWS). A tenant-aware Node/TypeScript (Express) service that hides per-organisation API keys behind a proxy, registers and receives OWS issuance webhooks (HMAC-verified), and pushes live status to the browser over SSE. Use when an application must issue verifiable credentials (SD-JWT VC, W3C VC, mso_mdoc) to an eIDAS 2.0 EUDI Wallet (EUDIW) or European Business Wallet (EUBW) and the API key must never reach the frontend.
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, OpenID4VCI, credential issuance, verifiable credentials, SD-JWT VC, mso_mdoc
  version: 2026.07.04
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

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each.

## What it does
- **Proxy** `GET|POST|PUT ${PROXY_PREFIX}/{tenant}/...` → OWS, injecting the tenant's
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
1. `cd references && cp .env.example .env`, then set `OWS_BASE_URL`,
   `WEBHOOK_SECRET_KEY`, `PUBLIC_BASE_URL`, `CORS_ORIGINS`, and one
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

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Configure a webhook: https://docs.igrant.io/docs/openid4vc-api/config-create-webhook
