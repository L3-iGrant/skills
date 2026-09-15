---
name: igrantio-ows-overview
description: Architecture, glossary, and the full iGrant.io Organisation Wallet Suite (OWS) API reference for issuing and verifying EUDI Wallet (EUDIW) and European Business Wallet (EUBW) credentials under eIDAS 2.0 (eIDAS2), covering issuance (OpenID4VCI) and verification (OpenID4VP + DCQL), including which response fields to extract and how webhooks correlate to a browser session over SSE. Read this first before building an OWS issuer or verifier backend/frontend, or whenever you need the exact OWS endpoint, payload, or response shape.
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, OpenID4VCI, OpenID4VP, DCQL, verifiable credentials, digital identity wallet, transaction data, SCA
  version: 2026.09.01
  api: https://docs.igrant.io/docs/developer-apis
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC, W3C-VC-2.0, mso_mdoc
  auth: OWS API key (Authorization "ApiKey <key>") - held only by the tenant backend, never the browser
---

# iGrant.io OWS integration - overview

## When to use
Read this skill before or alongside any of the `igrantio-*` backend/frontend
skills. It defines the shared architecture and is the **single source of truth**
for OWS endpoints, request payloads, the response fields you must process, and
the integrator intake below. Every other skill in this collection assumes the
contracts described here.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
  A key works only in its own environment.
- For an issuer or a verifier that goes live: the organisation certificate
  registered in the trust list (see the section at the end).

## Ask the integrator first (the integrator intake)

Run this interview before you write any integration code. Ask **one
question at a time**. Wait for the answer. Give the recommended default with
each question. Look up facts in the project (framework, existing env vars,
an existing backend) instead of asking for them; only the decisions go to
the integrator. Record the answers; every later choice hangs off them.

1. **Environment** - demo (`https://demo-api.igrant.io`) or staging
   (`https://staging-api.igrant.io`)? _Default demo; a switch later is a
   configuration change._
2. **API key** - do you have the OWS API key for that environment? If not,
   request it from [support@igrant.io](mailto:support@igrant.io) before you
   continue. It lives server-side only (env var or secret manager); the
   browser never sees it.
3. **Role** - issuer, verifier, holder, or a combination? _This selects the
   skills to open next._
4. **Tenancy** - one organisation, or multiple tenants each with their own
   API key? _Single tenant is one env var; multi-tenant needs a
   `TenantStore` (see `igrantio-backend-proxy`)._
5. **Backend host** - extend an existing Node/TypeScript backend, or
   scaffold a fresh Express service? _Look this up first; ask only if the
   repo is empty or ambiguous._
6. **Webhook reachability** - what public URL will receive OWS webhooks?
   _Local dev needs a tunnel (e.g. an ngrok-style forwarder) or the SSE
   fallback of polling history endpoints. The holder role needs none._
7. **Frontend** - which framework, and the default iGrant.io look
   (`igrantio-usecase-ui`) or the integrator's own design system? The
   wallet QR is always the demonstrator panel (`igrantio-qr-code`); it asks
   which logo goes on the centre disc.
8. **Trust list** - is the organisation certificate registered in the trust
   list (the trust anchor for an issuer, the WRPAC for a relying party)? If
   not, contact [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>.

The interview is done when each answer is recorded and none conflicts with a
discovered fact.

## The architecture in one paragraph
The browser never holds an OWS API key. A **tenant backend** proxies a small
allow-list of OWS endpoints, injecting the organisation's `ApiKey`. When a wallet
completes a flow, OWS delivers a **signed webhook** to the tenant backend; the
backend verifies the HMAC signature, extracts the **exchange id** (the correlation
key) from the webhook, and stores the event. The browser holds an **SSE**
connection keyed by that exchange id and updates the moment the event arrives.

See [`references/architecture.md`](./references/architecture.md) for the full
data-flow, path allow-list, HMAC scheme, and the exchange-id correlation table.

## The two flows

### Issuance (OpenID4VCI) - you are the issuer
1. `POST …/credential/issue` with `credentialDefinitionId` + claims → response
   carries `credentialHistory.CredentialExchangeId` (correlation key) and
   `credentialHistory.credentialOffer` (the `openid-credential-offer://` URI → render as QR / deep link).
2. Open SSE on the `CredentialExchangeId`.
3. Wallet scans, accepts → webhook `openid.credential.credential_accepted` /
   `token_issued` → SSE fires → mark issued.
4. **Deferred** variant: issue with `issuanceMode: "Deferred"`, then on
   `openid.credential.offer_received` `PUT …/credential/history/{CredentialExchangeId}`
   with the collected claims.

### Verification (OpenID4VP + DCQL) - you are the verifier / relying party
1. `POST …/verification/send` with `presentationDefinitionId` (a stored DCQL query)
   → response carries `verificationHistory.presentationExchangeId` (correlation key)
   and `verificationHistory.vpTokenQrCode` (the `openid4vp://` URI → render as QR / DC API request).
2. Open SSE on the `presentationExchangeId`.
3. Wallet presents → webhook `openid.presentation.presentation_acked.v3` /
   `digitalwallet.presentation.verified` → SSE fires with
   `data.presentation.vpTokenResponse` (non-empty = responded),
   `data.presentation.presentation[0]` (the disclosed claims), and
   `data.presentation.verified`.

Exact methods, paths, payloads, and full response schemas:
[`references/api-reference.md`](./references/api-reference.md).

## Environments (OWS base URL)
| Env | Base URL | Use |
| --- | --- | --- |
| Demo (default) | `https://demo-api.igrant.io` | first integration, demos |
| Staging | `https://staging-api.igrant.io` | pre-release testing |

The API key is issued per environment by [support@igrant.io](mailto:support@igrant.io);
a demo key does not work on staging.

The browser targets the **tenant backend** base URL (e.g. `https://your-host/ows/<tenant>`),
never these directly.

## Glossary
- **OWS** - Organisation Wallet Suite (the iGrant.io API surface).
- **credentialDefinitionId** - a stored issuer credential configuration.
- **presentationDefinitionId** - a stored verifier DCQL query / presentation definition.
- **CredentialExchangeId / presentationExchangeId** - per-transaction id; the **SSE correlation key** and the webhook's `external_id`.
- **credentialOffer / vpTokenQrCode** - the wallet-facing URI you render as a QR code or open as a same-device deep link.
- **exchange id** - umbrella term for the two above.

## Validation / done criteria
- You can name the exact OWS path, method, and payload for issue, deferred-issue,
  read-history, verification-send, and read-verification-history without guessing.
- You know which response field is the QR URI and which is the SSE correlation key
  for both flows.
- You know which webhook topics to subscribe to and how each maps to an exchange id.

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
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
- Trust-list registration (verified badge in the wallet): https://docs.igrant.io/docs/trust-relying-party-registration/
