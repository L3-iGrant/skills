---
name: igrantio-dcapi-android
description: 'Same-device and cross-device credential verification on Android via the W3C Digital Credentials API (browser invokes the wallet, no QR scan needed on same device) using OpenID4VP 1.0 on the iGrant.io Organisation Wallet Suite. Presentation definition with responseMode dc_api or dc_api.jwt and dcApiRequestType signed (with expectedOrigins and an X.509 key) or unsigned, verification request v3, navigator.credentials.get invocation from Chrome 141+, the receive call that posts the wallet response back, then verify the result and the issuer trust status. For EUDI Wallet (EUDIW) and European Business Wallet (EUBW) relying parties under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [dcapi]
  provider: iGrant.io
  keywords: Digital Credentials API, DC API, Android, Chrome, OpenID4VP, EUDIW, EUBW, eIDAS2, same-device, verification
  version: 2026.10.01
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
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
  A key works only in its own environment.
- Chrome 141+ (or 128+ with
  `chrome://flags#web-identity-digital-credentials`).
- The credential in the user's Data Wallet.
- Bluetooth on both devices for cross-device.

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
3. **Signed** - signed (`dcApiRequestType: "signed"`, `expectedOrigins`, an
   X.509 key) or unsigned? _Recommend signed for live use: the wallet can
   then check your access certificate._
4. **Origins** - the exact page origin(s)?
5. **Fallback** - the QR flow when the DC API is unavailable? _Recommend yes._
6. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## Workflow
1. **Presentation definition** - `POST
   /v2/config/digital-wallet/openid/sdjwt/presentation-definition` with
   `version: "version_01"` and a DC API response mode:
   - `responseMode`: `dc_api` (the wallet response is not encrypted) or
     `dc_api.jwt` (the wallet encrypts the response).
   - `dcApiRequestType`: `signed` or `unsigned`. Not sent, it is `unsigned`
     for `dc_api` and `signed` for `dc_api.jwt`.
   - A signed request needs `expectedOrigins` (the exact origins of your
     page; replay protection) and signs with your key. An unsigned request
     refuses `expectedOrigins`.
   - With `cryptographicKeyFormat: "x509"` the key must have a certificate
     chain. Without `cryptographicKeyIdentifier` the default key of the
     organisation signs.

   ```json
   {
     "label": "Verify company identity",
     "version": "version_01",
     "cryptographicKeyFormat": "x509",
     "responseType": "vp_token",
     "responseMode": "dc_api",
     "dcApiRequestType": "signed",
     "expectedOrigins": ["https://verifier.example.com"],
     "dcqlQuery": {
       "credentials": [
         {
           "id": "lpid",
           "format": "dc+sd-jwt",
           "meta": { "vct_values": ["LegalPersonIdentificationData"] },
           "claims": [
             { "path": ["identifier"] },
             { "path": ["legalName"] }
           ]
         }
       ]
     }
   }
   ```
2. **Verification request (v3)** - `POST
   /v3/config/digital-wallet/openid/sdjwt/verification/send` with the
   `presentationDefinitionId`. The answer's `verificationHistory.dcApiRequest`
   holds the browser payload (a `chrome` and a `safari` variant), and
   `verificationHistory.dcApiProtocol` is `openid4vp-v1-signed` or
   `openid4vp-v1-unsigned`. Keep the `presentationExchangeId`.
3. **Invoke the wallet** - `navigator.credentials.get({ digital: ... })`
   with the backend-provided request object. Use the ready-made
   `dcApi.ts` helpers in `igrantio-verifier-frontend`
   (`supportsDcApi`, `invokeWallet`, `buildReceivePayload`) - they handle
   the Chrome request formats and the plain-vs-signed response shapes.
4. **Post the response back** through your backend proxy to `POST
   /v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}/receive`
   with `{ "response": "<wallet response>" }` (or `{ "vp_token": { ... } }`
   for an unencrypted `dc_api` response). The SSE stream still delivers the
   final result.
5. **Verify** - `GET
   /v3/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}`:
   require `verified: true`, read the claims from `presentation`, and read
   the issuer trust status of each credential in `presentationValidity`
   (`issuerTrustServiceProvider.isVerified` and `trustServiceProvider`).

## Adjust for your deployment
- Choose signed or unsigned per your threat model; a signed request needs
  `expectedOrigins` that exactly match the serving origin(s).
- Feature-detect and fall back to the QR flow
  (`igrantio-verifier-frontend`) when the DC API is unavailable.
- Credential format and DCQL query are yours to set - compose with any
  `igrantio-dcql-*` workflow skill.

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
- `igrantio-dcapi-ios` - the iOS variant (ISO 18013-7 Annex C, always
  signed).
- `igrantio-verifier-frontend` - `dcApi.ts` reference implementation.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/openID4vc-send-verify-credentials-dcapi-android/>.
Before implementing, fetch that page; if it disagrees with this skill
(browser versions, response modes, endpoints), the documentation wins -
follow it and report the drift so the skill can be updated.
