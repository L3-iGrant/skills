---
name: igrantio-verifier-frontend
description: Build the browser UI for an OpenID4VP + DCQL credential VERIFIER / relying party against the iGrant.io Organisation Wallet Suite. Send a presentation request through your tenant backend proxy, render the QR (cross-device) or invoke the same-device Digital Credentials API to reach the EUDI Wallet (EUDIW) or European Business Wallet (EUBW), and read the disclosed claims + verified decision live over SSE. Composes igrantio-frontend-client; talks to igrantio-verifier-backend.
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, OpenID4VP, DCQL, Digital Credentials API, credential verification, QR code, transaction data, SCA
  version: 2026.07.03
  api: https://docs.igrant.io/docs/category/openid4vc-api/verifier
  protocols: OpenID4VP-1.0, DCQL, SD-JWT-VC, Digital-Credentials-API
  auth: none in the browser - the verifier backend injects the OWS API key
  requires-skills: igrantio-ows-overview, igrantio-frontend-client, igrantio-verifier-backend
---

# iGrant.io verifier frontend (OpenID4VP + DCQL)

## When to use
Build the relying-party UI: request a verifiable presentation, let the user scan
a QR (or use the same-device wallet), and show the disclosed claims and the
`verified` decision the instant the wallet responds. Depends on
`igrantio-frontend-client` (vendored at `src/lib/ows/`) and an
`igrantio-verifier-backend` deployment. Issuer UI is a separate skill
(`igrantio-issuer-frontend`).

## What it provides
- **`useVerification({ proxyBaseUrl, webhookBaseUrl })`** →
  `{ status, qrUri, presentationExchangeId, result, error, requestPresentation, reset }`.
  - `requestPresentation(payload)` - send a DCQL request; returns the full
    `verificationHistory` (so you can also drive same-device DC API).
  - `result`: `{ verified, claims, presentations }` once the wallet responds.
  - `status`: `idle → waiting → verified | rejected` (or `error`).
- **`dcApi.ts`** - same-device Digital Credentials API helpers (`supportsDcApi`,
  `invokeWallet`, `buildReceivePayload`).
- **`VerifierFlow`** - a minimal end-to-end demo component.

## Flow (what happens)
1. `POST …/verification/send` with `presentationDefinitionId` → read
   `verificationHistory.presentationExchangeId` (SSE key) and
   `verificationHistory.vpTokenQrCode` (QR URI). Optionally include
   `transactionData` (SCA payment, e-mandate, login/risk, account access, or
   QES signing - typed as `TransactionData` in `lib/ows/types.ts`; shapes in
   `igrantio-ows-overview` api-reference §2.1) so the wallet displays and
   signs over the transaction details.
2. Open SSE on the exchange id; render the QR / same-device button. For the
   full QR panel (optional centre logo, green tick on scan, refresh,
   open-in-wallet button) use `igrantio-qr-code` - it asks the integrator
   about the logo and tick options.
3. SSE `data.presentation`: once `vpTokenResponse.length > 0`, read
   `presentation[0]` (disclosed claims) and `verified` (decision). Accept only
   when `verified === true` (plus your trust rules).

## Steps
1. Vendor `igrantio-frontend-client/references/lib/ows` into `src/lib/ows/`.
2. Copy [`./references/features/verifier`](./references/features/verifier) into `src/features/verifier/`.
3. `npm i qrcode @types/qrcode`.
4. Wire it up:
   ```tsx
   <VerifierFlow
     proxyBaseUrl="https://host/ows/acme"
     webhookBaseUrl="https://host/webhook"
     presentationDefinitionId="<pd-id>"
   />
   ```

## Same-device (optional)
If `requestPresentation` returns a `verificationHistory.dcApiRequest`, call
`invokeWallet(dcApiRequest)` from `dcApi.ts`, then post the result back to OWS via
the proxy (`buildReceivePayload`) on an allow-listed receive path. The SSE stream
still delivers the final verified result, so the render path is unchanged.
Platform-specific end-to-end recipes: `igrantio-dcapi-android` (OpenID4VP) and
`igrantio-dcapi-ios` (ISO 18013-7 Annex C, signed).

## Clean-code notes
- No `@igrant/*` SDK; OWS specifics live in the client, flow logic in the hook,
  DC-API concerns isolated in `dcApi.ts`.
- Read the decision from `verified` and claims from `presentation[0]` - the only
  fields the UI needs.

## Validation / done criteria
- Presenting a valid credential drives `status` to `verified` with the disclosed
  claims shown; a tampered/absent one shows `rejected`.
- No OWS API key is present anywhere in the browser bundle.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
