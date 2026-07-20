---
name: igrantio-dcapi-android
description: 'Same-device and cross-device credential verification on Android via the W3C Digital Credentials API (browser invokes the wallet, no QR scan needed on same device) using OpenID4VP on the iGrant.io Organisation Wallet Suite. Presentation definition with responseMode dc_api (or signed with expectedOrigins), verification request v3 with requestByReference, navigator.credentials.get invocation from Chrome 141+, then verify vpTokenResponse and trust-list status. For EUDI Wallet (EUDIW) and European Business Wallet (EUBW) relying parties under eIDAS 2.0.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: Digital Credentials API, DC API, Android, Chrome, OpenID4VP, EUDIW, EUBW, eIDAS2, same-device, verification
  version: 2026.07.03
  source-doc: https://docs.igrant.io/docs/openID4vc-send-verify-credentials-dcapi-android/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend, igrantio-verifier-frontend
---

# DC API verification on Android

## When to use
Verify a credential in the browser on Android without a QR scan on the same
device: the page calls the W3C Digital Credentials API and Chrome invokes
the wallet. Cross-device still works (Chrome shows a QR; Bluetooth must be
on for the proximity check).

## Prerequisites
- Chrome 141+ (or 128+ with `chrome://flags#web-identity-digital-credentials`).
- The credential in the user's Data Wallet.
- Bluetooth on both devices for cross-device.

## Workflow
1. **Presentation definition** - protocol OpenID4VP, format IETF SD-JWT,
   `responseMode: "dc_api"`. For the signed variant
   (`openid4vp-v1-signed`) also set `expectedOrigins` to your page origin
   (replay protection).
2. **Verification request (v3)** - `requestByReference: true` with the
   `presentationDefinitionId`. The response's
   `verificationHistory.dcApiRequest` + `dcApiProtocol` are the browser
   payload.
3. **Invoke the wallet** - `navigator.credentials.get({ digital: ... })`
   with the backend-provided request object. Use the ready-made
   `dcApi.ts` helpers in `igrantio-verifier-frontend`
   (`supportsDcApi`, `invokeWallet`, `buildReceivePayload`) - they handle
   the Chrome request formats and the plain-vs-signed response shapes.
4. **Post the response back** through your backend proxy on an allow-listed
   receive path; the SSE stream still delivers the final result.
5. **Verify** - read verification history (v3): decode `vpTokenResponse`,
   check `verified`, `isVerifiedWithTrustList`, and `trustServiceProvider`.

## Adjust for your deployment
- Choose plain `dc_api` vs signed per your threat model; signed requires
  `expectedOrigins` to exactly match the serving origin(s).
- Feature-detect and fall back to the QR flow
  (`igrantio-verifier-frontend`) when the DC API is unavailable.
- Credential format and DCQL query are yours to set - compose with any
  `igrantio-dcql-*` workflow skill.

## Cross-references
- `igrantio-dcapi-ios` - the iOS variant (ISO 18013-7 Annex C, always
  signed).
- `igrantio-verifier-frontend` - `dcApi.ts` reference implementation.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/openID4vc-send-verify-credentials-dcapi-android/>.
Before implementing, fetch that page; if it disagrees with this skill
(browser versions, response modes, endpoints), the documentation wins -
follow it and report the drift so the skill can be updated.
