---
name: igrantio-issuer-frontend
description: Build the browser UI for an OpenID4VCI credential ISSUER against the iGrant.io Organisation Wallet Suite. Request in-time or deferred issuance through your tenant backend proxy, render the credential-offer QR (or same-device deep link) for an EUDI Wallet (EUDIW) or European Business Wallet (EUBW), and reflect live status over SSE (offer scanned → credential accepted). Composes igrantio-frontend-client; talks to igrantio-issuer-backend.
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, OpenID4VCI, credential offer, QR code, verifiable credentials
  version: 2026.07.02
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

## What it provides
- **`useIssuance({ proxyBaseUrl, webhookBaseUrl })`** →
  `{ status, offerUri, credentialExchangeId, error, issueInTime, issueDeferred, reset }`.
  - `issueInTime(payload)` - claims known now.
  - `issueDeferred(startRequest, claims)` - create the offer now; the hook pushes
    the claims automatically on the `offer_received` webhook.
  - `status`: `idle → offer_ready → scanned → issued` (or `error`).
- **`IssuerFlow`** - a minimal end-to-end demo component.

## Flow (what happens)
1. `POST …/credential/issue` → read `credentialHistory.CredentialExchangeId`
   (SSE key) and `credentialHistory.credentialOffer` (QR URI).
2. Open SSE on the exchange id; render the QR / same-device button.
3. SSE `data.credential.status`:
   - `offer_received` → (deferred) push claims via `PUT …/credential/history/{id}`.
   - `credential_accepted` / `token_issued` → **done**, close SSE.

## Steps
1. Vendor `igrantio-frontend-client/references/lib/ows` into `src/lib/ows/`.
2. Copy [`./references/features/issuer`](./references/features/issuer) into `src/features/issuer/`.
3. `npm i qrcode @types/qrcode` (for `QrCode`).
4. Wire it up:
   ```tsx
   <IssuerFlow
     proxyBaseUrl="https://host/ows/acme"
     webhookBaseUrl="https://host/webhook"
     credentialDefinitionId="<cred-def-id>"
     claims={{ given_name: "Lars", family_name: "Johansson" }}
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

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
