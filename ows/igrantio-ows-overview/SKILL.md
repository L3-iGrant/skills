---
name: igrantio-ows-overview
description: Architecture, glossary, environments and the shared API contracts of the iGrant.io Organisation Wallet Suite (OWS) for issuing and verifying EUDI Wallet (EUDIW) and European Business Wallet (EUBW) credentials under eIDAS 2.0 (eIDAS2), covering issuance (OpenID4VCI, the issuance history and its credential exchange id) and verification (OpenID4VP + DCQL, the presentationExchangeId and requestUrl), the response fields to extract, the webhook events, and how webhooks correlate to a browser session over SSE. Read this first before building an OWS issuer or verifier backend/frontend, or whenever you need the exact OWS endpoint, payload, or response shape.
license: Apache-2.0
metadata:
  categories: [overview, education]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, OpenID4VCI, OpenID4VP, DCQL, verifiable credentials, digital identity wallet, transaction data, SCA
  version: 2026.11.02
  api: https://docs.igrant.io/docs/developer-apis
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC, W3C-VC-2.0, mso_mdoc
  auth: OWS API key (Authorization "ApiKey <key>") - held only by the tenant backend, never the browser
---

# iGrant.io OWS integration - overview

## When to use
Read this skill before or alongside any of the `igrantio-*` backend/frontend
skills. It defines the shared architecture, the environments, the integrator
intake below, and the OWS endpoints, request payloads and response fields that
the building blocks use. Every other skill in this collection assumes the
contracts described here. The `igrantio-api-*` skills give the full API of
each group (for example `igrantio-api-issuer`, `igrantio-api-verifier`,
`igrantio-api-webhooks`).

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- For an issuer or a verifier that goes live: the organisation certificate
  registered in the trust list (see the section at the end).

## Ask the integrator first (the integrator intake)

Run this interview before you write any integration code. Ask **one
question at a time**. Wait for the answer. Give the recommended default with
each question. Look up facts in the project (framework, existing env vars,
an existing backend) instead of asking for them; only the decisions go to
the integrator. Record the answers; every later choice hangs off them.

1. **Environment** - demo, staging or production? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
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
   fallback of polling the read endpoints. The holder role needs none._
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
completes a step, OWS delivers a **signed webhook event** to the tenant backend;
the backend verifies the HMAC signature over the raw body, and stores the event
under its **resource id** (`subject.id`: the credential exchange id of an
issuance history, or the presentationExchangeId of a verification). The
browser holds an **SSE** connection keyed by those resource ids and updates the
moment the event arrives.

All wallet paths start with `/v4/config/ows/<role>/` (for example
`/v4/config/ows/issuer/issuance-history`). The roles are `issuer`, `holder`,
`verifier`, `wallet-provider`, `key-management`, `trust` and `wallet`. The
webhooks, the SSE ticket and the sandbox organisations are platform routes
under `/v4/config/platform/` (for example `/v4/config/platform/webhook`).

See [`references/architecture.md`](./references/architecture.md) for the full
data-flow, path allow-list, HMAC scheme, and the correlation table.

## The two flows

### Issuance (OpenID4VCI) - you are the issuer
1. `POST /v4/config/ows/issuer/issuance-history` with `credentialDefinitionId`,
   `mode` (`in_time` or `deferred`) and `credentials`
   (`[{"credentialConfigurationId", "claims"}]`, the claims of each
   credential configuration) → HTTP 201 with:
   - `offer.uri`: the `openid-credential-offer://` URI → render it as a QR
     code or open it as a deep link;
   - `offer.offerId`: the id of the credential offer;
   - `issuanceHistory[]`: one item for each credential configuration of the
     definition, each with its `credentialExchangeId` (the correlation key)
     and `status` `offer_sent`.
   With `preAuthorised: true` and `transactionCode: {length, inputMode}`, the
   issuer makes the code and gives it one time in `offer.transactionCode`.
2. Open one SSE stream on the credential exchange ids of the offer.
3. The wallet scans and takes the credentials → event
   `ows.issuer.issuance_history.credential_issued` for each issuance history
   (then `credential_accepted` when the wallet confirms) → SSE fires → mark
   issued when every issuance history is issued.
   `ows.issuer.issuance_history.denied` or `expired` → show the failure.
4. **Deferred** variant: issue with `mode: "deferred"`, then on
   `ows.issuer.issuance_history.offer_retrieved`, `token_issued` or
   `credential_deferred` (the first that arrives)
   `PUT /v4/config/ows/issuer/issuance-history/{credentialExchangeId}/claims`
   with `{"claims": {...}}`, once for each issuance history.

### Verification (OpenID4VP + DCQL) - you are the verifier / relying party
1. `POST /v4/config/ows/verifier/verifications` with `presentationDefinitionId`
   (a stored DCQL query) → HTTP 200 `{"verificationHistory": {...}}` with
   `presentationExchangeId` (the correlation key) and `requestUrl` (the
   `openid4vp://` URL → render as QR), or `dcApiRequest` for the same-device
   Digital Credentials API (then `requestUrl` is empty).
2. Open SSE on the `presentationExchangeId`.
3. The wallet presents → event `ows.verifier.verification.presentation_received`
   → SSE fires with `data.verification.isVerified`. The event holds no claims:
   read `GET /v4/config/ows/verifier/verifications/{presentationExchangeId}`
   for `presentation` (the disclosed claims) and `isVerified` (the decision).
   `ows.verifier.verification.declined` → the holder declined, or the wallet
   answered with an error.

Exact methods, paths, payloads, and full response schemas:
[`references/api-reference.md`](./references/api-reference.md).

## Environments
| Environment | API (base URL of every `/v4` call) | Wallet service (public OpenID4VC endpoints) | Dashboard |
| --- | --- | --- | --- |
| Demo (default) | `https://demo-api.igrant.io` | `https://oid4vc.igrant.io` | `https://demo-business.igrant.io` |
| Staging | `https://staging-api.igrant.io` | `https://staging-oid4vc.igrant.io` | `https://staging-business.igrant.io` |
| Production | `https://api.igrant.io` | `https://wallet.igrant.io` | `https://business.igrant.io` |

- [support@igrant.io](mailto:support@igrant.io) issues the API key for one
  environment. A key works only in its own environment.
- Your integration calls only the API host. The wallets call the wallet
  service (the credential offer, the token and credential endpoints, the
  presentation request): its host is in `offer.uri` and `requestUrl`.
- The browser targets the **tenant backend** base URL (for example
  `https://your-host/ows/<tenant>`), never these hosts directly.

## Glossary
- **OWS** - Organisation Wallet Suite (the iGrant.io API surface).
- **credentialDefinitionId** - a stored credential definition of the issuer.
  It holds one or more credential configurations.
- **credentialConfigurationId** - one credential configuration of a
  definition: one credential type, format and signing key in the Credential
  Issuer Metadata.
- **credential offer / offerId** - one issue call makes one credential offer
  for all the credential configurations of the definition. `offer.offerId` is
  its id; `offer.uri` is the URI that the wallet opens.
- **issuance history** - the record of one credential configuration in one
  credential offer, and of the credentials that the issuer signed for it.
- **credential exchange id** (`credentialExchangeId`) - the id of an issuance
  history: the path id of its routes, the `subject.id` of the
  `ows.issuer.issuance_history.*` events, and the SSE key of the issuer flow.
- **presentationDefinitionId** - a stored DCQL query of the verifier (the
  presentation definition).
- **presentationExchangeId** - the id of a verification: the
  `{verificationId}` of the verifier routes (`id` holds the same value), the
  `subject.id` and `data.verification.id` of the
  `ows.verifier.verification.*` events, and the SSE key of the verifier flow.
- **requestUrl** - the `openid4vp://` Authorization Request URL of a
  verification: render it as a QR code or open it as a deep link.
- **resource id** - the umbrella term for the credential exchange id and the
  presentationExchangeId.
- **webhook event** - `ows.<role>.<resource>.<event>`, one at each step of a
  resource, signed over the exact body bytes.

## Validation / done criteria
- You can name the exact OWS path, method, and payload to issue a credential,
  give deferred claims, read an issuance history, send a verification request,
  and read a verification without guessing.
- You know which response field is the QR URI (`offer.uri`, `requestUrl`) and
  which is the SSE correlation key (each `issuanceHistory[].credentialExchangeId`,
  `presentationExchangeId`) for both flows.
- You know which webhook event types to subscribe to and that `subject.id` is
  the resource id of each.

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
