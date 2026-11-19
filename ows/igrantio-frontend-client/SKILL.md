---
name: igrantio-frontend-client
description: 'Generic, dependency-free browser client for the iGrant.io Organisation Wallet Suite (OWS): a typed fetch client for EUDI Wallet (EUDIW) credential issuance (OpenID4VCI, the issuance history and its credential exchange id) and verification (OpenID4VP, the verification history and its presentationExchangeId) via your tenant backend proxy, a Server-Sent-Events consumer (EventSource + consume-and-delete + reconnect), and optional React hooks (useSSE, useOwsClient, issuance history, verification history) plus QR/deep-link helpers. No iGrant.io SDK. Use as the shared frontend foundation for igrantio-issuer-frontend and igrantio-verifier-frontend.'
license: Apache-2.0
metadata:
  categories: [frontend, education]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, OpenID4VCI, OpenID4VP, React hooks, SSE, browser client
  version: 2026.11.02
  api: https://docs.igrant.io/docs/developer-apis
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC
  auth: none in the browser - the tenant backend injects the OWS API key
  requires-skills: igrantio-ows-overview
---

# iGrant.io frontend client (generic, no SDK)

## When to use
The shared frontend building block for any OWS integration. `igrantio-issuer-frontend`
and `igrantio-verifier-frontend` both build on it. It is self-contained,
framework-agnostic code you own, with no iGrant.io SDK. Read
`igrantio-ows-overview` for the endpoint/response contract.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.

## Ask the integrator first
Ask one question at a time. Wait for the answer. Give the recommended
default with each question. Look up facts in the project (framework,
environment variables, an existing backend) instead of asking for them.
Record the answers before you write code.

1. **Environment** - demo, staging or production? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - do you have the OWS API key for that environment? If not,
   request it from [support@igrant.io](mailto:support@igrant.io) before you
   continue.
3. **Framework** - React (hooks) or another framework (core only)?
4. **Backend** - the proxy base URL and the webhook base URL of your tenant
   backend?

## What it provides
Framework-agnostic core (only `fetch` + `EventSource`):
- **`createOwsClient({ baseUrl, apiKey? })`** - typed methods:
  - `issuanceHistory.issue` (`POST /v4/config/ows/issuer/issuance-history`,
    `mode` `in_time` or `deferred`, the claims of each credential
    configuration in `credentials`): one credential offer, and one issuance
    history for each configuration. `issuanceHistory.supplyClaims` (the
    claims of a deferred issuance history), `issuanceHistory.read` (optional
    `includeClaims`), `issuanceHistory.delete`, `issuanceHistory.revoke`
    (final). Each takes the credential exchange id.
  - `verification.sendRequest`, `verification.readHistory`, `verification.deleteHistory`,
    `verification.receiveDcApiResponse` (posts a same-device Digital Credentials
    API answer back). Each takes the presentationExchangeId.
  - `baseUrl` = your backend proxy (`https://host/ows/<tenant>`); leave `apiKey` empty (the backend injects it).
- **`openSseSession({ webhookBaseUrl, resourceIds, onMessage })`** -
  EventSource session with consume-and-delete and reconnect; returns
  `{ close }`. `resourceIds` are the `subject.id` values of the webhook events:
  the credential exchange ids of the issuance histories of one offer (1 to
  20), or one `presentationExchangeId`. After each message it deletes the
  handled event with its sequence (`DELETE {webhook}/{id}?sequence=<n>`), so a
  newer event of the same resource is not lost.
- **`types.ts`** - request/response + SSE event types. The request types are
  exact: OWS answers `400` for a body member that it does not know. An SSE
  event (`OwsWebhookEvent`) is the webhook event body (`id`, `type`,
  `subject`, `data.issuanceHistory` or `data.verification`) plus
  `receivedAt`; it holds no claims.

React layer (peer deps: `react`, and `qrcode` for `QrCode`):
- **`useSSE()`** → `{ open, close }`; `open` takes one id or an array of ids
- **`useOwsClient(baseUrl, apiKey?)`** - memoised client
- **`useIssuanceHistory` / `useVerificationHistory`** - optional polling reads
- **`QrCode`** component + **`openInWallet(uri)`** deep-link helper - minimal
  URI-to-image only, for tests and tools. Any QR a user sees is the
  demonstrator panel from `igrantio-qr-code` (rounded frame, logo disc,
  refresh pill, wallet button, hint)

## Reference layout (vendor into your app)
Copy [`./references/lib/ows`](./references/lib/ows) into your app at `src/lib/ows/`.
Role features (`igrantio-issuer-frontend`, `igrantio-verifier-frontend`) import
from `../../lib/ows`.
```
lib/ows/
  owsClient.ts     types.ts     sseClient.ts     index.ts
  react/ useSSE.ts  useOwsClient.ts  useIssuanceHistory.ts
         useVerificationHistory.ts  usePolledResource.ts  QrCode.tsx  index.ts
```

## Core usage
```ts
import { createOwsClient, openSseSession } from "./lib/ows";

const client = createOwsClient({ baseUrl: "https://host/ows/acme" }); // no apiKey

// Verification: send → QR URI (requestUrl) + presentationExchangeId
const { verificationHistory } = await client.verification.sendRequest({
  presentationDefinitionId: "<pd-id>",
  requestByReference: true,
});
const exchangeId = verificationHistory.presentationExchangeId;
const qr = verificationHistory.requestUrl;

// Live update: SSE keyed by the presentationExchangeId
const session = openSseSession({
  webhookBaseUrl: "https://host/webhook",
  resourceIds: [exchangeId],
  onMessage: async (event) => {
    if (event.type !== "ows.verifier.verification.presentation_received") return;
    session.close();
    // The event has no claims: read the verification for them.
    const { verificationHistory: result } = await client.verification.readHistory(exchangeId);
    // result.isVerified, result.presentation
  },
});

// Issuance: one offer → QR URI (offer.uri) + one credential exchange id for each configuration
const created = await client.issuanceHistory.issue({
  credentialDefinitionId: "<cd-id>",
  mode: "in_time",
  preAuthorised: true,
  transactionCode: { length: 6, inputMode: "numeric" },
  credentials: [{ claims: { given_name: "Erika", family_name: "Mustermann" } }],
});
// created.offer.uri, created.offer.transactionCode (one time),
// created.issuanceHistory.map((h) => h.credentialExchangeId) (the SSE keys)
```
A definition with more than one credential configuration needs one
`credentials` entry for each, with its `credentialConfigurationId`.

## React usage
```tsx
import { useOwsClient, useSSE, QrCode } from "./lib/ows";

const client = useOwsClient("https://host/ows/acme");
const { open, close } = useSSE();
// after issue: open(created.issuanceHistory.map((h) => h.credentialExchangeId), "https://host/webhook", onMessage)
// after sendRequest: open(verificationHistory.presentationExchangeId, "https://host/webhook", onMessage)
// render: <QrCode value={qrUri} />
```

## Clean-code notes
- Core is decoupled from React and from the QR library (both peer deps) so it
  drops into any framework.
- One responsibility per file; the client is the only place OWS paths live.
- `apiKey` empty by default → the browser never holds a secret.

## Validation / done criteria
- `cd references && npm install && npm run typecheck` passes.
- No import of an iGrant.io SDK package anywhere.
- SSE delivers the event and auto-deletes it; a refresh does not replay it.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
