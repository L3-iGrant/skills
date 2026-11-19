---
name: igrantio-dcapi-android
description: 'Same-device and cross-device credential verification on Android with the W3C Digital Credentials API (the browser invokes the wallet, no QR scan on the same device) and OpenID4VP 1.0 on the iGrant.io Organisation Wallet Suite. A presentation definition with responseMode dc_api or dc_api.jwt: a signed request (dcApiRequestType signed, expectedOrigins, an X.509 key, client identifier prefix x509_hash) or an unsigned request (dcApiRequestType unsigned, client identifier prefix redirect_uri, no key, no expectedOrigins). Then the verification request, the navigator.credentials.get call from Chrome 141 or later, the receive call that posts the wallet response back, and the check of the result and of the trust of the issuer. For EUDI Wallet (EUDIW) and European Business Wallet (EUBW) relying parties under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [dcapi]
  provider: iGrant.io
  keywords: Digital Credentials API, DC API, Android, Chrome, Credential Manager, OpenID4VP, dc_api, EUDIW, EUBW, eIDAS2, same-device, verification
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/openID4vc-send-verify-credentials-dcapi-android/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend, igrantio-verifier-frontend
---

# DC API verification on Android

## When to use
Verify a credential in the browser on Android without a QR scan on the same
device. The page calls the W3C Digital Credentials API, Chrome gives the
request to the Android Credential Manager, and the holder picks the wallet.
The cross-device flow also works: Chrome on a desktop shows a QR code, and
Bluetooth must be on for the proximity check. Chrome on Android also
carries ISO 18013-7 Annex C (`org-iso-mdoc`): for that protocol, use the
Annex C presentation definition of `igrantio-dcapi-ios`.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- For a signed request, a **signing key** with an X.509 certificate chain in
  Key Management (see `igrantio-api-key-management`).
- Chrome 141 or later (from Chrome 128, turn on
  `chrome://flags#web-identity-digital-credentials`), or a current
  Chromium-based Edge.
- A wallet on the Android device that registers with Credential Manager as
  a digital credential provider, and the credential in that wallet.
- For the cross-device flow: Google Play services 24.0 or later, and
  Bluetooth on both devices.

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
3. **Signed** - a signed request (`dcApiRequestType: "signed"`,
   `expectedOrigins`, an X.509 key) or an unsigned request? _Recommend
   signed for live use: the wallet can then check your access certificate.
   The wallet shows "Service provider not verified" for an unsigned
   request._
4. **Origins** - the exact origins of the page that calls the API (for a
   signed request)?
5. **Fallback** - the QR flow when the DC API is not available? _Recommend
   yes._
6. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## Workflow
1. **Presentation definition** - `POST
   /v4/config/ows/verifier/presentation-definitions` with
   `version: "version_01"` and a DC API response mode:
   - `responseMode`: `dc_api` (the wallet response is not encrypted) or
     `dc_api.jwt` (the wallet encrypts the response).
   - `dcApiRequestType`: `signed` or `unsigned`. When you do not send it,
     it is `unsigned` for `dc_api` and `signed` for `dc_api.jwt`.
   - A signed request needs `expectedOrigins`: the exact origins
     (`https://host[:port]`, no path) of your page. The wallet compares them
     with the calling page (replay protection). The key of
     `cryptographicKeyIdentifier` signs the request; it must be a key of the
     organisation with a certificate chain. The client identifier prefix is
     `x509_hash`.
   - An unsigned request uses the client identifier prefix `redirect_uri`.
     It names no signing key and has no `expectedOrigins` (the server
     refuses them for an unsigned OpenID4VP request).
   - The `label` is unique in the organisation: a second create with the
     same label gets HTTP 400. Change the label, or reuse the
     `presentationDefinitionId` of the first run.

   Signed request:

   ```json
   {
     "label": "Example company identity over the DC API, signed",
     "version": "version_01",
     "cryptographicKeyFormat": "x509",
     "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
     "clientIdScheme": "x509_hash",
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
           ],
           "require_cryptographic_holder_binding": true
         }
       ]
     }
   }
   ```

   Unsigned request:

   ```json
   {
     "label": "Example company identity over the DC API, unsigned",
     "version": "version_01",
     "clientIdScheme": "redirect_uri",
     "responseType": "vp_token",
     "responseMode": "dc_api",
     "dcApiRequestType": "unsigned",
     "dcqlQuery": {
       "credentials": [
         {
           "id": "lpid",
           "format": "dc+sd-jwt",
           "meta": { "vct_values": ["LegalPersonIdentificationData"] },
           "claims": [
             { "path": ["identifier"] },
             { "path": ["legalName"] }
           ],
           "require_cryptographic_holder_binding": true
         }
       ]
     }
   }
   ```
2. **Verification request** - `POST /v4/config/ows/verifier/verifications`
   with `{"presentationDefinitionId": "<presentationDefinitionId>"}`. A DC
   API request does not use `requestByReference`.
   `verificationHistory.dcApiRequest` holds the whole request for the
   browser (a `chrome` and a `safari` variant), and
   `verificationHistory.dcApiProtocol` is `openid4vp-v1-signed` or
   `openid4vp-v1-unsigned`. `requestUrl` is empty. Keep
   `verificationHistory.presentationExchangeId`.
3. **Invoke the wallet** - give `dcApiRequest.chrome` to
   `navigator.credentials.get()`. Use the `dcApi.ts` helpers of
   `igrantio-verifier-frontend` (`supportsDcApi`, `invokeWallet`,
   `buildReceivePayload`): they handle the Chrome request format and the
   response shapes. When the holder closes the sheet, the call ends with
   `NotAllowedError` or `AbortError`: the holder declined, the request is
   not wrong.
4. **Post the response back** - through your backend to `POST
   /v4/config/ows/verifier/verifications/{presentationExchangeId}/response`
   with `{"response": "<wallet response>"}` (the JWE of `dc_api.jwt`, or the
   JSON text of a `dc_api` response), or with `{"vp_token": {...}}` (the
   parsed VP Token of a `dc_api` response). The verifier takes one response
   for each request. Then the webhook event
   `ows.verifier.verification.presentation_received` arrives (see
   `igrantio-api-webhooks`).
5. **Verify** - `GET
   /v4/config/ows/verifier/verifications/{presentationExchangeId}`. Require
   `verificationHistory.status` `presentation_acked` and `isVerified`
   `true`. Read the claims in `presentation`. `vpToken` holds one text: the
   JSON of the VP Token, with only the claims that the query asks for. The
   trust check of the issuer is at
   `presentationValidity[].lpid.credentialSignerTrustedListCheck`. It runs
   only when `credentialQueryOptions.lpid.requiresTrustedCredentialSigner`
   is `true` (see `igrantio-api-verifier`). With the switch off, `result` is
   `not_applicable`.

## Adjust for your deployment
- Choose signed or unsigned for your threat model. A signed request needs
  `expectedOrigins` that are exactly the origins that serve the page.
- Detect the feature and fall back to the QR flow
  (`igrantio-verifier-frontend`) when the DC API is not available.
- The credential format and the DCQL query are yours to set: combine with
  any `igrantio-dcql-*` workflow skill. The claim paths must be those of the
  credential in the wallet. The example uses the claims of the registry
  LPID (`igrantio-credential-schema-lpid`); an LPID from
  `igrantio-ebw-owner-id` has other claim names (`legal_person_id`,
  `legal_person_name`).

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
- `igrantio-api-verifier` - the DC API fields of a presentation definition,
  the response operation and the verification history.
- `igrantio-dcapi-ios` - the iOS variant (ISO 18013-7 Annex C only).
- `igrantio-verifier-frontend` - the `dcApi.ts` reference implementation.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/openID4vc-send-verify-credentials-dcapi-android/>.
Before implementing, fetch that page; if it disagrees with this skill
(browser versions, response modes, endpoints), the documentation wins -
follow it and report the drift so the skill can be updated.
