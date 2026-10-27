---
name: igrantio-dcapi-ios
description: 'Same-device and cross-device credential verification on iOS/iPadOS via the W3C Digital Credentials API using ISO 18013-7 Annex C request/response with ISO/IEC 18013-5 mdoc/mDL credentials on the iGrant.io Organisation Wallet Suite. On iOS the DC API runs over Annex C only: a presentation definition with version iso18013_7_annex_c, responseType device_response, an X.509 key, exactly one expectedOrigins entry and (recommended) a signed request with reader authentication. Then the verification request v3, wallet invocation from Safari, the receive call, and the check of the result and the issuer trust status. For EUDI Wallet (EUDIW) relying parties under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [dcapi]
  provider: iGrant.io
  keywords: Digital Credentials API, DC API, iOS, Safari, ISO 18013-7, mdoc, mDL, OpenID4VP, EUDIW, eIDAS2, verification
  version: 2026.10.01
  source-doc: https://docs.igrant.io/docs/openID4vc-send-verify-credentials-dcapi-ios/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend, igrantio-verifier-frontend
---

# DC API verification on iOS

## When to use
Verify a credential in the browser with the wallet on an iPhone/iPad. Key
platform difference vs Android: on iOS the Digital Credentials API runs
over **ISO 18013-7 Annex C only** (protocol `org-iso-mdoc`), with
**ISO/IEC 18013-5 mdoc/mDL** credentials. The request is bound to **one**
page origin (`expectedOrigins`).

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
  A key works only in its own environment.
- Safari 26 or later. Every browser on iOS uses WebKit, so they all behave
  as Safari.
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
3. **Origin** - the one exact page origin for `expectedOrigins`?
4. **Signed** - signed (reader authentication with your X.509 key) or
   unsigned? _Recommend signed: the wallet can then check your access
   certificate._
5. **Credential** - which mdoc doctype?
6. **Fallback** - the QR flow when the DC API is unavailable? _Recommend yes._
7. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## Workflow
1. **Presentation definition** - `POST
   /v2/config/digital-wallet/openid/sdjwt/presentation-definition`. The
   Annex C rules: `version: "iso18013_7_annex_c"`, `responseType:
   "device_response"`, `responseMode: "dc_api"`, `cryptographicKeyFormat:
   "x509"`, exactly one `expectedOrigins` entry, no `clientIdScheme` and no
   transaction data. In the DCQL query: `mso_mdoc` only, `meta.doctype_value`,
   paths of two strings `[namespace, element]`,
   `require_cryptographic_holder_binding: true`, no `claim_sets` and no
   `credential_sets`. `dcApiRequestType: "signed"` adds reader
   authentication, signed with your key and its certificate chain.

   ```json
   {
     "label": "Age check",
     "version": "iso18013_7_annex_c",
     "cryptographicKeyFormat": "x509",
     "responseType": "device_response",
     "responseMode": "dc_api",
     "dcApiRequestType": "signed",
     "expectedOrigins": ["https://verifier.example.com"],
     "dcqlQuery": {
       "credentials": [
         {
           "id": "age_verification",
           "format": "mso_mdoc",
           "meta": { "doctype_value": "eu.europa.ec.av.1" },
           "claims": [
             { "path": ["eu.europa.ec.av.1", "age_over_18"] }
           ],
           "require_cryptographic_holder_binding": true
         }
       ]
     }
   }
   ```
2. **Verification request (v3)** - `POST
   /v3/config/digital-wallet/openid/sdjwt/verification/send` with the
   `presentationDefinitionId` only; the presentation definition gives the
   rest. Read `verificationHistory.dcApiRequest` (with a `safari` variant)
   and `verificationHistory.dcApiProtocol` (`org-iso-mdoc`), and keep the
   `presentationExchangeId`.
3. **Invoke the wallet** from the page. Use `dcApi.ts` from
   `igrantio-verifier-frontend` - `getPlatformRequest` picks the Safari
   request variant, `invokeWallet` calls the API, `buildReceivePayload`
   returns the `{ response: <EncryptedResponse> }` shape.
4. **Post the response back** via your backend proxy to `POST
   /v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}/receive`;
   the backend decrypts it. SSE delivers the verified result as usual.
5. **Verify** - `GET
   /v3/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}`:
   require `verified: true`, and read the issuer trust status of each
   credential in `presentationValidity`
   (`issuerTrustServiceProvider.isVerified` and `trustServiceProvider`).

## Adjust for your deployment
- Annex C takes exactly one origin. Serve the page from that origin only
  (www and the bare domain are different origins).
- Detect the platform and route Android to `igrantio-dcapi-android`
  (OpenID4VP) and iOS here (Annex C / mdoc); keep the QR flow as the
  universal fallback.
- The label `Age Verification` is reserved; use another label.

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
