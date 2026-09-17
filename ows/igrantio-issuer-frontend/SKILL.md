---
name: igrantio-issuer-frontend
description: Build the browser UI for an OpenID4VCI credential ISSUER against the iGrant.io Organisation Wallet Suite. Request in-time or deferred issuance through your tenant backend proxy, render the credential-offer QR (or same-device deep link) for an EUDI Wallet (EUDIW) or European Business Wallet (EUBW), and reflect live status over SSE (offer scanned → credential accepted). Composes igrantio-frontend-client; talks to igrantio-issuer-backend.
license: Apache-2.0
metadata:
  categories: [frontend]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, OpenID4VCI, credential offer, QR code, verifiable credentials
  version: 2026.09.01
  api: https://docs.igrant.io/docs/category/openid4vc-api/issuer
  protocols: OpenID4VCI-1.0, SD-JWT-VC, W3C-VC-2.0, mso_mdoc
  auth: none in the browser - the issuer backend injects the OWS API key
  requires-skills: igrantio-ows-overview, igrantio-frontend-client, igrantio-issuer-backend
---

# iGrant.io issuer frontend (OpenID4VCI)

## When to use
Build the issuer-side UI: a user requests a credential, scans a QR (or taps a
same-device deep link), and the page updates the instant the wallet accepts.
Depends on `igrantio-frontend-client` (vendored at `src/lib/ows/`) and an
`igrantio-issuer-backend` deployment. Verifier UI is a separate skill
(`igrantio-verifier-frontend`).

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
5. **QR logo** - which logo goes on the white disc in the centre of the QR
   code? _Your brand mark, or the iGrant.io logo; `igrantio-qr-code` asks the
   rest._
6. **Mode** - in-time or deferred issuance?
7. **Trust list** - is your issuer certificate (the trust anchor) registered
   in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   wallets show your credentials as unverified.

## What it provides
- **`useIssuance({ proxyBaseUrl, webhookBaseUrl })`** →
  `{ status, offerUri, credentialExchangeId, error, issueInTime, issueDeferred, reset }`.
  - `issueInTime(payload)` - claims known now.
  - `issueDeferred(startRequest, claims)` - create the offer now; the hook pushes
    the claims automatically on the `offer_received` webhook.
  - `status`: `idle → offer_ready → scanned → issued` (or `error`).
- **`IssuerFlow`** - a minimal end-to-end demo component that renders the
  wallet QR with `WalletQrPanel` (`logoSrc`, optional `txCode`).
- **`walletQr/`** - `WalletQrPanel.tsx` + `walletQr.css`, the demonstrator
  QR panel (canonical copy: `igrantio-qr-code`).

## Flow (what happens)
1. `POST …/credential/issue` → read `credentialHistory.CredentialExchangeId`
   (SSE key) and `credentialHistory.credentialOffer` (QR URI).
2. Open SSE on the exchange id; render the wallet QR panel
   (`WalletQrPanel`, vendored from `igrantio-qr-code` at
   `features/issuer/walletQr/`): the 240 px code in the rounded frame, the
   logo disc, the refresh pill, the "Open in EUDI Wallet" button, the
   transaction-code box and the hint, at the exact look of the iGrant.io
   demonstrators. `igrantio-qr-code` holds the values and the questions.
3. SSE `data.credential.status`:
   - `offer_received` → (deferred) push claims via `PUT …/credential/history/{id}`.
   - `credential_accepted` / `token_issued` → **done**, close SSE.

## Steps
1. Vendor `igrantio-frontend-client/references/lib/ows` into `src/lib/ows/`.
2. Copy [`./references/features/issuer`](./references/features/issuer) into `src/features/issuer/`.
3. `npm i qrcode.react` (the QR panel) and `npm i qrcode @types/qrcode`
   (only if you also use the bare `QrCode` helper). Import
   `features/issuer/walletQr/walletQr.css` once, or paste its rules into
   your global stylesheet. Put your logo in `public/` and pass it as
   `logoSrc`.
4. Wire it up:
   ```tsx
   <IssuerFlow
     proxyBaseUrl="https://host/ows/acme"
     webhookBaseUrl="https://host/webhook"
     credentialDefinitionId="<cred-def-id>"
     claims={{ given_name: "Lars", family_name: "Johansson" }}
     logoSrc="/your-logo.png"
   />
   ```
   Replace the demo's hard-coded payload with your form; for namespaced formats
   (mdoc) nest claims under the namespace, e.g. `{ "org.iso.18013.5.1": { … } }`.

## Clean-code notes
- No `@igrant/*` SDK; OWS specifics live in the client, flow logic in the hook,
  presentation in the component - swap the UI without touching the flow.
- The QR URI and exchange id are the only two response fields the UI needs.

## Validation / done criteria
- Scanning the QR with a wallet drives `status` to `issued` within ~1s of accept.
- Deferred issuance pushes claims exactly once (on `offer_received`).
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
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
