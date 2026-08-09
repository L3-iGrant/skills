---
name: igrantio-holder-backend
description: Build the backend for an EUDI Wallet / European Business Wallet HOLDER (the wallet side) against the iGrant.io Organisation Wallet Suite (OWS). A tenant-aware Node/TypeScript (Express) service that hides the organisation's API key behind a proxy scoped to holder endpoints - receive credential offers (OpenID4VCI wallet side, incl. transaction code, front-channel authorization code, and deferred issuance), manage held credentials, receive and answer verifier presentation requests (OpenID4VP + DCQL wallet side), holder configuration, wallet-unit status - and relays the holder notifications SSE stream. Use when an application must act as the wallet, receiving, holding, and presenting verifiable credentials.
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, holder, wallet, OpenID4VCI, OpenID4VP, DCQL, receive credential, present credential, notifications, wallet unit
  version: 2026.08.02
  api: https://docs.igrant.io/docs/developer-apis
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC, W3C-VC-2.0, mso_mdoc
  auth: OWS API key (Authorization "ApiKey <key>") injected by the proxy; browser sends no key
  requires-skills: igrantio-ows-overview, igrantio-backend-proxy, igrantio-holder-notifications
---

# iGrant.io holder backend (wallet side: receive, hold, present)

## When to use
Build or extend the server that a **holder** (wallet) frontend talks to - the
organisation is the wallet that receives and presents credentials, e.g. a
European Business Wallet. It composes `igrantio-backend-proxy` (holder
allow-list) + the `igrantio-holder-notifications` SSE relay. For the other two
roles use `igrantio-issuer-backend` / `igrantio-verifier-backend`. Read
`igrantio-ows-overview` first; the exact holder endpoint contract lives in
[`references/holder-api-reference.md`](./references/holder-api-reference.md).

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each. (Webhooks: not needed for the holder role - notifications replace them.)

## What it does
- **Proxy** `GET|POST|PUT|DELETE ${PROXY_PREFIX}/{tenant}/...` → OWS, injecting
  the tenant's `ApiKey`. Allow-lists only OWS **holder** endpoints; RegExp
  rules keep the issuer's `credential/issue|history` and the verifier's
  `verification/send|history` out (least privilege).
- **Relay** `GET ${PROXY_PREFIX}/{tenant}/v2/config/digital-wallet/openid/notifications/sse`
  streams OWS holder notifications, injecting the auth as the `authorization`
  query parameter (EventSource cannot send headers).
- **No webhooks**: holder events arrive on the notifications stream.

## Reference implementation
Runnable Express + TypeScript app in [`./references`](./references):
```
references/
  holder-api-reference.md  the full holder endpoint/payload/response contract
  src/config.ts            env config
  src/tenants.ts           TenantStore - per-tenant API-key resolution (env or pluggable)
  src/proxy.ts             API-key-injecting reverse proxy (allow-list param)
  src/notificationsSse.ts  notifications SSE relay (canonical: igrantio-holder-notifications)
  src/server.ts            composition (holder allow-list + relay)
  .env.example  Dockerfile  package.json  tsconfig.json
```

## Steps
1. `cd references && cp .env.example .env`, then set `OWS_ENV` (demo|staging,
   default demo), `CORS_ORIGINS`, and one `OWS_TENANT_<SLUG>_API_KEY` per
   organisation.
2. `npm install && npm run dev` - backend on `:6003` (alongside issuer `:6001`
   / verifier `:6002`).
3. Point the holder frontend (`igrantio-holder-frontend`) base URL at
   `${PROXY_PREFIX}/<tenant>`; open the notifications stream on
   `…/<tenant>/v2/config/digital-wallet/openid/notifications/sse`.

## Holder contract (what the frontend drives through this backend)

### Receive a credential (OpenID4VCI)
1. `POST …/sdjwt/credential/receive` with
   `{ credentialOffer, autoPresent, kid, trustAnchor }` → `credential`
   (object **or array**; each record's `id` keys the follow-ups).
2. Branch on the record (§1.1 of the API reference):
   **transaction code** → `PUT …/credential/{id}/user-pin`;
   **front-channel** → open `authorizationRequest`, then
   `POST …/credential/exchange-code` with `{ code, state }`;
   **deferred** → `PUT …/credential/{id}/receive-deferred` until
   `credential_acked`.
3. Review: `PUT …/credential/{id}/accept`, or `DELETE …/credential/{id}` to
   reject. List with `GET …/sdjwt/credentials` (response keys `credential` +
   `pagination`).
4. Lifecycle: `PUT …/credential/{id}/request` requests reissuance of an
   expired or near-expiry credential; `GET …/credential/{id}/revocation-status`
   checks the IETF Token Status List.

### Present credentials (OpenID4VP + DCQL)
1. `POST …/sdjwt/verification/receive` (v3) with `{ vpTokenQrCode, … }` →
   `presentation.presentationId`, `presentation.dcqlQuery`,
   `presentation.transactionDataDecoded` (show before consent).
2. `POST …/sdjwt/verification/{id}/filter` (v2, empty body) →
   `inputDescriptors[].matchedCredentials`.
3. `POST …/sdjwt/verification/{presentationId}/send` (v3) with
   `{ credentials: [{ id, credentialId | credentialIds, claimIds? }] }`
   (`inputDescriptors` for legacy PEX) → open
   `presentation.responseRedirectUri` when non-empty. Transaction-data
   signing happens through this call - there is no separate sign endpoint.

Notifications drive both flows - see `igrantio-holder-notifications` for the
notification→action decision table. Exact payloads, response fields, and
status vocabularies: [`references/holder-api-reference.md`](./references/holder-api-reference.md).

## Adapting
- **Key storage**: replace `EnvTenantStore` with a DB/secret-manager `TenantStore`.
- **Path scope**: `HOLDER_PERMITTED_PATHS` in `server.ts` is the allow-list
  (strings match as prefixes, RegExps against the whole path).
- **SSE auth**: if your OWS deployment authenticates SSE with user tokens,
  return `Bearer <jwt>` from the relay's `getAuthorization`.

## Validation / done criteria
- `npm run typecheck` passes.
- `…/sdjwt/credential/receive` proxies through; the issuer's
  `…/sdjwt/credential/issue` and the verifier's `…/sdjwt/verification/send`
  yield 404 (least privilege).
- `DELETE …/sdjwt/credential/{id}` reaches OWS (the proxy forwards DELETE).
- The notifications SSE relay streams `text/event-stream` for a known tenant
  and 404s for an unknown one; the API key never appears in the browser.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
