---
name: igrantio-frontend-client
description: 'Generic, dependency-free browser client for the iGrant.io Organisation Wallet Suite (OWS): a typed fetch client for EUDI Wallet (EUDIW) credential issuance (OpenID4VCI) and verification (OpenID4VP) via your tenant backend proxy, a Server-Sent-Events consumer (EventSource + consume-and-delete + reconnect), and optional React hooks (useSSE, useOwsClient, credential/ verification history) plus QR/deep-link helpers. No @igrant/* SDK. Use as the shared frontend foundation for igrantio-issuer-frontend and igrantio-verifier-frontend.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, OpenID4VCI, OpenID4VP, React hooks, SSE, browser client
  version: 2026.07.04
  api: https://docs.igrant.io/docs/developer-apis
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC
  auth: none in the browser - the tenant backend injects the OWS API key
  requires-skills: igrantio-ows-overview
---

# iGrant.io frontend client (generic, no SDK)

## When to use
The shared frontend building block for any OWS integration. `igrantio-issuer-frontend`
and `igrantio-verifier-frontend` both build on it. It replaces the internal
`@igrant/usecase-sdk` / `igrant-api-lib` with self-contained, framework-agnostic
code you own. Read `igrantio-ows-overview` for the endpoint/response contract.

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each.

## What it provides
Framework-agnostic core (only `fetch` + `EventSource`):
- **`createOwsClient({ baseUrl, apiKey? })`** - typed methods:
  - `issuance.issueInTime`, `issuance.startDeferred`, `issuance.completeDeferred`,
    `issuance.readHistory`, `issuance.deleteHistory`
  - `verification.sendRequest`, `verification.readHistory`, `verification.deleteHistory`
  - `baseUrl` = your backend proxy (`https://host/ows/<tenant>`); leave `apiKey` empty (the backend injects it).
- **`openSseSession({ webhookBaseUrl, exchangeId, onMessage })`** - EventSource
  session with consume-and-delete and reconnect; returns `{ close }`.
- **`types.ts`** - request/response + SSE event types.

React layer (peer deps: `react`, and `qrcode` for `QrCode`):
- **`useSSE()`** → `{ open, close }`
- **`useOwsClient(baseUrl, apiKey?)`** - memoised client
- **`useCredentialHistory` / `useVerificationHistory`** - optional polling reads
- **`QrCode`** component + **`openInWallet(uri)`** deep-link helper - minimal
  URI-to-image only; for the full panel (centre logo, green tick, refresh,
  wallet button, tx code) use `igrantio-qr-code`

## Reference layout (vendor into your app)
Copy [`./references/lib/ows`](./references/lib/ows) into your app at `src/lib/ows/`.
Role features (`igrantio-issuer-frontend`, `igrantio-verifier-frontend`) import
from `../../lib/ows`.
```
lib/ows/
  owsClient.ts     types.ts     sseClient.ts     index.ts
  react/ useSSE.ts  useOwsClient.ts  useCredentialHistory.ts
         useVerificationHistory.ts  usePolledResource.ts  QrCode.tsx  index.ts
```

## Core usage
```ts
import { createOwsClient, openSseSession } from "./lib/ows";

const client = createOwsClient({ baseUrl: "https://host/ows/acme" }); // no apiKey

// Verification: send → get QR + exchange id
const { verificationHistory } = await client.verification.sendRequest({
  requestByReference: true,
  presentationDefinitionId: "<pd-id>",
});
const exchangeId = verificationHistory!.presentationExchangeId;
const qr = verificationHistory!.vpTokenQrCode;

// Live update: SSE keyed by exchange id
const session = openSseSession({
  webhookBaseUrl: "https://host/webhook",
  exchangeId,
  onMessage: (event) => {
    // event.data.presentation.verified / .vpTokenResponse / .presentation[0]
    session.close();
  },
});
```

## React usage
```tsx
import { useOwsClient, useSSE, QrCode } from "./lib/ows";

const client = useOwsClient("https://host/ows/acme");
const { open, close } = useSSE();
// after sendRequest/issue: open(exchangeId, "https://host/webhook", onMessage)
// render: <QrCode value={qrUri} />
```

## Clean-code notes
- Core is decoupled from React and from the QR library (both peer deps) so it
  drops into any framework.
- One responsibility per file; the client is the only place OWS paths live.
- `apiKey` empty by default → the browser never holds a secret.

## Validation / done criteria
- `cd references && npm install && npm run typecheck` passes.
- No import of `@igrant/*` anywhere.
- SSE delivers the event and auto-deletes it; a refresh does not replay it.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
