---
name: igrantio-verifier-backend
description: Build the backend for an OpenID4VP + DCQL credential VERIFIER / relying party against the iGrant.io Organisation Wallet Suite (OWS). A tenant-aware Node/TypeScript (Express) service that hides per-organisation API keys behind a proxy, registers and receives OWS verification webhooks (HMAC-verified), and pushes the verified result to the browser over SSE. Use when an application must request and verify a presentation and the API key must never reach the frontend.
license: Apache-2.0
metadata:
  provider: iGrant.io
  version: 1.0.0
  api: https://docs.igrant.io/docs/openid4vc-api
  protocols: OpenID4VP-1.0, DCQL, SD-JWT-VC
  auth: OWS API key (Authorization "ApiKey <key>") injected by the proxy; browser sends no key
  requires-skills: igrantio-ows-overview, igrantio-backend-proxy, igrantio-backend-webhooks, igrantio-backend-sse
---

# iGrant.io verifier backend (OpenID4VP + DCQL)

## When to use
Build or extend the server that a **verifier / relying-party** frontend talks to.
It composes `igrantio-backend-proxy` + `igrantio-backend-webhooks` +
`igrantio-backend-sse` for the verification flow only (least privilege). For the
issuer equivalent use `igrantio-issuer-backend` (separate skill). Read
`igrantio-ows-overview` first.

## What it does
- **Proxy** `GET|POST|PUT ${PROXY_PREFIX}/{tenant}/...` → OWS, injecting the tenant's
  `ApiKey`. Allow-lists only OWS **verification** endpoints (send, history).
- **Register** the verifier webhook idempotently (`VERIFIER_TOPICS`) via
  `scripts/register-webhook.ts`.
- **Receive** `POST /webhook`, verify the `X-iGrant-Signature` HMAC, extract the
  `presentationExchangeId`, store the event.
- **SSE** `GET /webhook/sse/{presentationExchangeId}` streams the event to the
  browser; `DELETE /webhook/{id}` consume-and-delete.

## Reference implementation
Runnable Express + TypeScript app in [`./reference`](./reference). Same modules as
the issuer backend; the only role differences are in `src/server.ts`
(verification allow-list) and `scripts/register-webhook.ts` (`VERIFIER_TOPICS`).
Default `PORT=6002` so it can run alongside an issuer backend.

## Steps
1. `cd reference && cp .env.example .env`; set `OWS_ENV` (demo|staging, default
   demo), `WEBHOOK_SECRET_KEY`, `PUBLIC_BASE_URL`, `CORS_ORIGINS`, and one
   `OWS_TENANT_<SLUG>_API_KEY` per organisation.
2. `npm install && npm run dev` — backend on `:6002`.
3. Register the webhook once per tenant: `npm run register-webhook -- <tenant>`
   (idempotent).
4. Point the verifier frontend base URL at `${PUBLIC_BASE_URL}${PROXY_PREFIX}/<tenant>`
   and the webhook base at `${PUBLIC_BASE_URL}/webhook`.

## Verification contract (what the frontend drives through this backend)
- `POST …/verification/send` → response `verificationHistory.presentationExchangeId`
  (SSE key) + `verificationHistory.vpTokenQrCode` (QR URI).
- Done on webhook `openid.presentation.presentation_acked.v3` /
  `digitalwallet.presentation.verified`; the SSE event carries
  `data.presentation.verified` and `data.presentation.presentation[0]` (claims).
See `igrantio-ows-overview/references/api-reference.md` §2 and §4.

## Adapting
- **Multi-instance**: replace `InMemoryEventStore` with a shared store.
- **Key storage**: replace `EnvTenantStore` with a DB/secret-manager `TenantStore`.
- **Path scope**: `VERIFIER_PERMITTED_PREFIXES` in `server.ts` is the allow-list.

## Validation / done criteria
- `npm run typecheck` passes.
- A wrong/absent `X-iGrant-Signature` yields 401; a valid one stores the event.
- Hitting a non-verification OWS path through the proxy yields 404 (least privilege).
- The browser SSE fires within ~1s of the webhook, keyed by `presentationExchangeId`.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
- Configure a webhook: https://docs.igrant.io/docs/openid4vc-api/config-create-webhook
