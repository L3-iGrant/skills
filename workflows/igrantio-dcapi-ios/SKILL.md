---
name: igrantio-dcapi-ios
description: 'Same-device and cross-device credential verification on iOS/iPadOS via the W3C Digital Credentials API using ISO 18013-7 Annex C request/response with ISO/IEC 18013-5 mdoc/mDL credentials on the iGrant.io Organisation Wallet Suite. On iOS the DC API runs over Annex C only and the request must be signed (expectedOrigins required). Presentation definition, verification request v3 with requestByReference, wallet invocation from the browser, then verify vpTokenResponse and trust-list status. For EUDI Wallet (EUDIW) relying parties under eIDAS 2.0.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: Digital Credentials API, DC API, iOS, Safari, ISO 18013-7, mdoc, mDL, OpenID4VP, EUDIW, eIDAS2, verification
  version: 2026.07.04
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

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each.

## Prerequisites
- A DC-API-capable browser (Chrome 141+, or flag-enabled earlier builds).
- The mdoc credential (e.g. age verification) in the user's Data Wallet.
- Bluetooth on both devices for cross-device (QR) flows.

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
