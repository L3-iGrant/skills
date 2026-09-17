---
name: igrantio-dcapi-ios
description: 'Same-device and cross-device credential verification on iOS/iPadOS via the W3C Digital Credentials API using ISO 18013-7 Annex C request/response with ISO/IEC 18013-5 mdoc/mDL credentials on the iGrant.io Organisation Wallet Suite. On iOS the DC API runs over Annex C only and the request must be signed (expectedOrigins required). Presentation definition, verification request v3 with requestByReference, wallet invocation from the browser, then verify vpTokenResponse and trust-list status. For EUDI Wallet (EUDIW) relying parties under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [dcapi]
  provider: iGrant.io
  keywords: Digital Credentials API, DC API, iOS, Safari, ISO 18013-7, mdoc, mDL, OpenID4VP, EUDIW, eIDAS2, verification
  version: 2026.09.01
  source-doc: https://docs.igrant.io/docs/openID4vc-send-verify-credentials-dcapi-ios/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend, igrantio-verifier-frontend
---

# DC API verification on iOS

## When to use
Verify a credential in the browser with the wallet on an iPhone/iPad. Key
platform difference vs Android: on iOS the Digital Credentials API runs
over **ISO 18013-7 Annex C only**, with **ISO/IEC 18013-5 mdoc/mDL**
credentials, and the request is **always signed** - `expectedOrigins` is
mandatory.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
  A key works only in its own environment.
- A DC-API-capable browser (Chrome 141+, or flag-enabled earlier builds).
- The mdoc credential (e.g. age verification) in the user's Data Wallet.
- Bluetooth on both devices for cross-device (QR) flows.

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
3. **Origins** - the exact page origin(s) for `expectedOrigins`? _iOS is
   always signed._
4. **Credential** - which mdoc doctype?
5. **Fallback** - the QR flow when the DC API is unavailable? _Recommend yes._
6. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## Workflow
1. **Presentation definition** - protocol ISO 18013-7 Annex C, format
   ISO/IEC 18013-5 mdoc/mDL, response mode DC API **signed**, with
   `expectedOrigins` set to your page origin (replay protection).
2. **Verification request (v3)** - `requestByReference: true` with the
   `presentationDefinitionId`; read
   `verificationHistory.dcApiRequest` / `dcApiProtocol` from the response.
3. **Invoke the wallet** from the page. Use `dcApi.ts` from
   `igrantio-verifier-frontend` - `getPlatformRequest` picks the Safari
   request variant, `invokeWallet` calls the API, `buildReceivePayload`
   returns the `{ response: <JWE> }` shape a signed exchange needs.
4. **Post the response back** via your backend proxy; SSE delivers the
   verified result as usual.
5. **Verify** - read verification history (v3): decode `vpTokenResponse`,
   check `verified`, `isVerifiedWithTrustList`, `trustServiceProvider`.

## Adjust for your deployment
- `expectedOrigins` must list every origin serving the page (www and bare
  domain are different origins).
- Detect the platform and route Android to `igrantio-dcapi-android`
  (OpenID4VP / SD-JWT) and iOS here (Annex C / mdoc); keep the QR flow as
  the universal fallback.
- Compose the credential query with `igrantio-dcql-*` workflow skills where
  DCQL applies.

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

## Cross-references
- `igrantio-dcapi-android` - the Android variant (OpenID4VP, plain or
  signed).
- `igrantio-eu-age-verification` - a natural mdoc use case for this flow.
- `igrantio-verifier-frontend` - `dcApi.ts` reference implementation.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/openID4vc-send-verify-credentials-dcapi-ios/>.
Before implementing, fetch that page; if it disagrees with this skill
(protocols, signing requirements, endpoints), the documentation wins -
follow it and report the drift so the skill can be updated.
