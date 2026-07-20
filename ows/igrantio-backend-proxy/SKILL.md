---
name: igrantio-backend-proxy
description: 'Composable building block: a tenant-aware reverse proxy that hides per-organisation iGrant.io OWS API keys from the browser. Resolves a tenant slug to its API key, allow-lists the OWS paths the frontend may reach, injects Authorization "ApiKey <key>", and forwards to OWS. Use to add API-key hiding + per-tenant key management to any Node/TypeScript backend; the OpenID4VCI issuer and OpenID4VP verifier backends compose it.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, OpenID4VCI, OpenID4VP, reverse proxy, multi-tenant, API key security
  version: 2026.07.04
  api: https://docs.igrant.io/docs/developer-apis
  auth: OWS API key held server-side; injected per request. Browser sends no key.
  requires-skills: igrantio-ows-overview
---

# iGrant.io backend proxy (API-key hiding, per-tenant)

## When to use
Whenever the browser must call OWS but must not hold the API key - which is
always. This is the "manages API key for a specific tenant organisation" piece.
Compose it into an issuer or verifier backend (see `igrantio-issuer-backend` /
`igrantio-verifier-backend`) or mount it in an existing Express app.

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each.

## What it does
`GET|POST|PUT ${proxyPrefix}/{tenant}/{owsPath...}`:
1. resolves `{tenant}` → OWS API key via a **TenantStore** (env or pluggable),
2. rejects any path not on the caller-supplied allow-list (least privilege, 404),
3. sets `Authorization: ApiKey <key>` and forwards to OWS,
4. streams the response back, stripping hop-by-hop headers.

The browser targets `${proxyPrefix}/{tenant}` as its base URL with **no** key.

## Reference
[`./references`](./references):
- `proxy.ts` - `proxyRouter(store, permittedPrefixes)` Express router.
- `tenants.ts` - `TenantStore` interface + `EnvTenantStore` / `MapTenantStore`.
- `config.ts` - OWS base URL (OWS_ENV demo|staging, default demo) + timeout.

## Usage
```ts
import express from "express";
import { proxyRouter } from "./proxy";
import { EnvTenantStore } from "./tenants";
import { config } from "./config";

const ISSUER = [
  "v2/config/digital-wallet/openid/sdjwt/credential/issue",
  "v2/config/digital-wallet/openid/sdjwt/credential/history",
];
app.use(config.proxyPrefix, proxyRouter(new EnvTenantStore(), ISSUER));
```

## Per-tenant key management
- `EnvTenantStore` reads `OWS_TENANT_<SLUG>_API_KEY`.
- Swap in a DB / secret-manager `TenantStore` (async `getApiKey`) for many
  organisations; rotate by updating the store - no frontend change.

## Clean-code notes
- The allow-list is a parameter, so issuer/verifier scope the proxy to just their
  endpoints (least privilege) with one array.
- OWS base URL lives only in `config.ts`; the proxy is transport, not policy.

## Validation / done criteria
- A request to a non-allow-listed path returns 404; the tenant key never appears
  in any response or in the browser.
- An unknown tenant returns 404.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
