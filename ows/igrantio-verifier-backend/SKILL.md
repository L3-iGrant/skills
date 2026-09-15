---
name: igrantio-verifier-backend
description: Build the backend for an OpenID4VP + DCQL credential VERIFIER / relying party against the iGrant.io Organisation Wallet Suite (OWS). A tenant-aware Node/TypeScript (Express) service that hides per-organisation API keys behind a proxy, registers and receives OWS verification webhooks (HMAC-verified), and pushes the verified result to the browser over SSE. Use when an application must request and verify a credential presentation from an eIDAS 2.0 EUDI Wallet (EUDIW) or European Business Wallet (EUBW) and the API key must never reach the frontend. Supports wallet-signed transaction data (SCA payments, e-mandates, login/risk authentication, account access, QES document signing).
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, OpenID4VP, DCQL, relying party, credential verification, verifiable presentations, transaction data, SCA, e-mandate, QES
  version: 2026.09.01
  api: https://docs.igrant.io/docs/category/openid4vc-api/verifier
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
6. **Transaction data** - does the wallet sign over transaction details
   (payment, e-mandate, QES)? _Only when the use case needs it._
7. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## What it does
- **Proxy** `GET|POST|PUT|DELETE ${PROXY_PREFIX}/{tenant}/...` → OWS, injecting the tenant's
  `ApiKey`. Allow-lists only OWS **verification** endpoints (send, history).
- **Register** the verifier webhook idempotently (`VERIFIER_TOPICS`) via
  `scripts/register-webhook.ts`.
- **Receive** `POST /webhook`, verify the `X-iGrant-Signature` HMAC, extract the
  `presentationExchangeId`, store the event.
- **SSE** `GET /webhook/sse/{presentationExchangeId}` streams the event to the
  browser; `DELETE /webhook/{id}` consume-and-delete.

## Reference implementation
Runnable Express + TypeScript app in [`./references`](./references). Same modules as
the issuer backend; the only role differences are in `src/server.ts`
(verification allow-list) and `scripts/register-webhook.ts` (`VERIFIER_TOPICS`).
Default `PORT=6002` so it can run alongside an issuer backend.

## Steps
1. `cd references && cp .env.example .env`; set `OWS_ENV` (demo|staging,
   default demo), `WEBHOOK_SECRET_KEY`, `PUBLIC_BASE_URL`, `CORS_ORIGINS`, and one
   `OWS_TENANT_<SLUG>_API_KEY` per organisation.
2. `npm install && npm run dev` - backend on `:6002`.
3. Register the webhook once per tenant: `npm run register-webhook -- <tenant>`
   (idempotent).
4. Point the verifier frontend base URL at `${PUBLIC_BASE_URL}${PROXY_PREFIX}/<tenant>`
   and the webhook base at `${PUBLIC_BASE_URL}/webhook`.

## Verification contract (what the frontend drives through this backend)
- `POST …/verification/send` → response `verificationHistory.presentationExchangeId`
  (SSE key) + `verificationHistory.vpTokenQrCode` (QR URI).
- The send body may carry optional `transactionData` - wallet-displayed and
  wallet-signed transaction data (SCA): simple `payment_data`, an EUDI SCA
  rulebook (TS12) `payload` (payment / e-mandate / login-risk / account
  access), or `qes_data` (QES document signing). The proxy passes it through
  unchanged; see `igrantio-ows-overview/references/api-reference.md` §2.1 for
  the exact shapes and §2.2 for verifying the returned
  `transaction_data_hashes`.
- Done on webhook `openid.presentation.presentation_acked.v3` /
  `digitalwallet.presentation.verified`; the SSE event carries
  `data.presentation.verified` and `data.presentation.presentation[0]` (claims).
See `igrantio-ows-overview/references/api-reference.md` §2 and §4.

## Adapting
- **Query patterns**: ready-made DCQL workflows (trusted authority, claim
  sets, credential sets, KYC, optional groups, multiple instances, value
  matching) live in the `igrantio-dcql-*` workflow skills.
- **Multi-instance**: replace `InMemoryEventStore` with a shared store.
- **Key storage**: replace `EnvTenantStore` with a DB/secret-manager `TenantStore`.
- **Path scope**: `VERIFIER_PERMITTED_PREFIXES` in `server.ts` is the allow-list.

## Validation / done criteria
- `npm run typecheck` passes.
- A wrong/absent `X-iGrant-Signature` yields 401; a valid one stores the event.
- Hitting a non-verification OWS path through the proxy yields 404 (least privilege).
- The browser SSE fires within ~1s of the webhook, keyed by `presentationExchangeId`.

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
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
- Configure a webhook: https://docs.igrant.io/docs/openid4vc-api/config-create-webhook
