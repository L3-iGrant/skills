---
name: igrantio-dcapi-ios
description: 'Same-device and cross-device credential verification on iOS and iPadOS with the W3C Digital Credentials API, ISO 18013-7 Annex C request and response, and ISO/IEC 18013-5 mdoc or mDL credentials on the iGrant.io Organisation Wallet Suite. On iOS the DC API runs over Annex C only: a presentation definition with version iso18013_7_annex_c, responseType device_response, responseMode dc_api, exactly one expectedOrigins entry, no clientIdScheme and (recommended) a signed request with reader authentication and an X.509 key. Then the verification request, the wallet call from Safari, the receive call, and the check of the result and of the trust of the issuer. For EUDI Wallet (EUDIW) relying parties under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [dcapi]
  provider: iGrant.io
  keywords: Digital Credentials API, DC API, iOS, Safari, ISO 18013-7, Annex C, org-iso-mdoc, mdoc, mDL, reader authentication, EUDIW, eIDAS2, verification
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/openID4vc-send-verify-credentials-dcapi-ios/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend, igrantio-verifier-frontend
---

# DC API verification on iOS

## When to use
Verify a credential in the browser with the wallet on an iPhone or iPad.
The main difference from Android: on iOS the Digital Credentials API runs
over **ISO 18013-7 Annex C only** (protocol `org-iso-mdoc`), with
**ISO/IEC 18013-5 mdoc or mDL** credentials. Safari does not offer
OpenID4VP over the DC API. The request is bound to **one** page origin
(`expectedOrigins`).

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- For a signed request, a **signing key** with an X.509 certificate chain in
  Key Management (see `igrantio-api-key-management`).
- Safari 26 or later. Every browser on iOS uses WebKit, so all of them
  behave as Safari.
- A page served over HTTPS from the origin in `expectedOrigins`.
- The mdoc credential (for example the age verification attestation) in
  the wallet of the holder.
- For the cross-device (QR) flow: Bluetooth on both devices.

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
3. **Origin** - the one exact page origin for `expectedOrigins`?
4. **Signed** - signed (reader authentication with your X.509 key) or
   unsigned? _Recommend signed: the wallet can then check your access
   certificate. The wallet shows "Service provider not verified" for an
   unsigned request._
5. **Credential** - which mdoc doctype?
6. **Fallback** - the QR flow when the DC API is not available? _Recommend
   yes._
7. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## Workflow
1. **Presentation definition** - `POST
   /v4/config/ows/verifier/presentation-definitions`. The Annex C rules:
   `version: "iso18013_7_annex_c"`, `responseType: "device_response"`,
   `responseMode: "dc_api"`, `cryptographicKeyFormat: "x509"`, exactly one
   `expectedOrigins` entry (also for an unsigned request), no
   `clientIdScheme` and no transaction data. In the DCQL query: `mso_mdoc`
   only, `meta.doctype_value`, a non-empty `claims` array with paths of two
   strings `[namespace, element]`,
   `require_cryptographic_holder_binding: true`, no `claim_sets` and no
   `credential_sets`. `dcApiRequestType: "signed"` adds reader
   authentication, signed with the key of `cryptographicKeyIdentifier` and
   its certificate chain. For an unsigned request, send
   `dcApiRequestType: "unsigned"` and no `cryptographicKeyIdentifier`.
   The `label` is unique in the organisation: a second create with the same
   label gets HTTP 400. Change the label, or reuse the
   `presentationDefinitionId` of the first run. The platform reserves the
   label `Age Verification`: use another label.

   ```json
   {
     "label": "Example age check over the DC API on iOS",
     "version": "iso18013_7_annex_c",
     "cryptographicKeyFormat": "x509",
     "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
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
2. **Verification request** - `POST /v4/config/ows/verifier/verifications`
   with `{"presentationDefinitionId": "<presentationDefinitionId>"}` only;
   the presentation definition gives the rest. A DC API request does not use
   `requestByReference`. Read `verificationHistory.dcApiRequest` (with a
   `safari` variant) and `verificationHistory.dcApiProtocol`
   (`org-iso-mdoc`), and keep `verificationHistory.presentationExchangeId`.
3. **Invoke the wallet** from the page. Use `dcApi.ts` of
   `igrantio-verifier-frontend`: `getPlatformRequest` picks the Safari
   variant, `invokeWallet` calls the API, and `buildReceivePayload` returns
   the `{"response": "<EncryptedResponse>"}` shape (base64url). When the
   holder closes the sheet, the call ends with `NotAllowedError` or
   `AbortError`: the holder declined, the request is not wrong.
4. **Post the response back** - through your backend to `POST
   /v4/config/ows/verifier/verifications/{presentationExchangeId}/response`
   with `{"response": "<base64url EncryptedResponse>"}`. The verifier
   decrypts it. Then the webhook event
   `ows.verifier.verification.presentation_received` arrives (see
   `igrantio-api-webhooks`).
5. **Verify** - `GET
   /v4/config/ows/verifier/verifications/{presentationExchangeId}`. Require
   `verificationHistory.status` `presentation_acked` and `isVerified`
   `true`. Read the disclosed data elements in `presentation`. `vpToken`
   holds the encrypted response as the wallet sent it; the verifier deletes
   the decryption key after use, so you cannot decrypt it. The trust check
   of the issuer is at
   `presentationValidity[].age_verification.credentialSignerTrustedListCheck`.
   It runs only when
   `credentialQueryOptions.age_verification.requiresTrustedCredentialSigner`
   is `true` (see `igrantio-api-verifier`). With the switch off, `result` is
   `not_applicable`.

## Adjust for your deployment
- Annex C takes exactly one origin. Serve the page from that origin only
  (`www` and the bare domain are different origins).
- Detect the platform. Send Android to `igrantio-dcapi-android` (OpenID4VP)
  or use Annex C there too, and keep the QR flow as the general fallback.
- iOS recognises only some mdoc document types (for example the EU age
  verification attestation, the EU PID, the photo ID and the mDL). Ask
  only for a document that the holder can have on the device.

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
- `igrantio-api-verifier` - the Annex C rules of a presentation definition,
  the response operation and the verification history.
- `igrantio-dcapi-android` - the Android variant (OpenID4VP, signed or
  unsigned).
- `igrantio-eu-age-verification` - an mdoc use case for this flow.
- `igrantio-verifier-frontend` - the `dcApi.ts` reference implementation.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/openID4vc-send-verify-credentials-dcapi-ios/>.
Before implementing, fetch that page; if it disagrees with this skill
(protocols, signing requirements, endpoints), the documentation wins -
follow it and report the drift so the skill can be updated.
