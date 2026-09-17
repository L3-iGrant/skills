---
name: igrantio-verifier-frontend
description: Build the browser UI for an OpenID4VP + DCQL credential VERIFIER / relying party against the iGrant.io Organisation Wallet Suite. Send a presentation request through your tenant backend proxy, render the QR (cross-device) or invoke the same-device Digital Credentials API to reach the EUDI Wallet (EUDIW) or European Business Wallet (EUBW), and read the disclosed claims + verified decision live over SSE. Composes igrantio-frontend-client; talks to igrantio-verifier-backend.
license: Apache-2.0
metadata:
  categories: [frontend]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, OpenID4VP, DCQL, Digital Credentials API, credential verification, QR code, transaction data, SCA
  version: 2026.09.01
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
3. **Framework** - React, Next.js, or another? _Look it up in the project
   before you ask._
4. **Look** - the default iGrant.io look (`igrantio-usecase-ui`), or the
   integrator's own design system?
5. **Channel** - cross-device QR, same-device Digital Credentials API, or
   both? _Recommend QR first; `igrantio-dcapi-android` and
   `igrantio-dcapi-ios` cover the DC API._
6. **QR logo** - which logo goes on the white disc in the centre of the QR
   code? _Your brand mark, or the iGrant.io logo; `igrantio-qr-code` asks the
   rest._
7. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## What it provides
- **`useVerification({ proxyBaseUrl, webhookBaseUrl })`** →
  `{ status, qrUri, presentationExchangeId, result, error, requestPresentation, reset }`.
  - `requestPresentation(payload)` - send a DCQL request; returns the full
    `verificationHistory` (so you can also drive same-device DC API).
  - `result`: `{ verified, claims, presentations }` once the wallet responds.
  - `status`: `idle → waiting → verified | rejected` (or `error`).
- **`dcApi.ts`** - same-device Digital Credentials API helpers (`supportsDcApi`,
  `invokeWallet`, `buildReceivePayload`).
- **`VerifierFlow`** - a minimal end-to-end demo component that renders the
  wallet QR with `WalletQrPanel` (`logoSrc`).
- **`walletQr/`** - `WalletQrPanel.tsx` + `walletQr.css`, the demonstrator
  QR panel (canonical copy: `igrantio-qr-code`).

## Flow (what happens)
1. `POST …/verification/send` with `presentationDefinitionId` → read
   `verificationHistory.presentationExchangeId` (SSE key) and
   `verificationHistory.vpTokenQrCode` (QR URI). Optionally include
   `transactionData` (SCA payment, e-mandate, login/risk, account access, or
   QES signing - typed as `TransactionData` in `lib/ows/types.ts`; shapes in
   `igrantio-ows-overview` api-reference §2.1) so the wallet displays and
   signs over the transaction details.
2. Open SSE on the exchange id; render the wallet QR panel
   (`WalletQrPanel`, vendored from `igrantio-qr-code` at
   `features/verifier/walletQr/`): the 240 px code in the rounded frame, the
   logo disc, the refresh pill, the "Open in EUDI Wallet" button and the
   hint, at the exact look of the iGrant.io demonstrators.
   `igrantio-qr-code` holds the values and the questions.
3. SSE `data.presentation`: once `vpTokenResponse.length > 0`, read
   `presentation[0]` (disclosed claims) and `verified` (decision). Accept only
   when `verified === true` (plus your trust rules).

## Steps
1. Vendor `igrantio-frontend-client/references/lib/ows` into `src/lib/ows/`.
2. Copy [`./references/features/verifier`](./references/features/verifier) into `src/features/verifier/`.
3. `npm i qrcode.react` (the QR panel) and `npm i qrcode @types/qrcode`
   (only if you also use the bare `QrCode` helper). Import
   `features/verifier/walletQr/walletQr.css` once, or paste its rules into
   your global stylesheet. Put your logo in `public/` and pass it as
   `logoSrc`.
4. Wire it up:
   ```tsx
   <VerifierFlow
     proxyBaseUrl="https://host/ows/acme"
     webhookBaseUrl="https://host/webhook"
     presentationDefinitionId="<pd-id>"
     logoSrc="/your-logo.png"
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
