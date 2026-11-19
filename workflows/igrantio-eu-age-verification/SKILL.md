---
name: igrantio-eu-age-verification
description: 'EU Age Verification on the iGrant.io Organisation Wallet Suite: issue an age verification attestation as an ISO/IEC 18013-5 mdoc (doctype eu.europa.ec.av.1, boolean age_over_NN claims, age_over_18 mandatory) with OpenID4VCI in_time issuance (one credential offer, one issuance history), then verify a selectively disclosed age_over_18 proof with OpenID4VP and DCQL: no birth date and no identity data. Implements the EU Age Verification solution profile for the EUDI Wallet (EUDIW) under eIDAS 2.0. Use for age-restricted content, products or services.'
license: Apache-2.0
metadata:
  categories: [recipe]
  provider: iGrant.io
  keywords: EU age verification, age_over_18, mso_mdoc, eu.europa.ec.av.1, EUDIW, eIDAS2, OpenID4VCI, OpenID4VP, DCQL, selective disclosure, issuance history
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/eu-age-verification/
  requires-skills: igrantio-ows-overview, igrantio-issuer-backend, igrantio-verifier-backend
---

# EU Age Verification (EUDI Wallet)

## When to use
Prove an age threshold without the birth date or the identity of the
holder. The attestation is an **ISO/IEC 18013-5 mdoc** with the doctype
**`eu.europa.ec.av.1`**, boolean `age_over_NN` claims and selective
disclosure. The registry template holds `age_over_14`, `age_over_16`,
`age_over_18`, `age_over_21` and `age_over_65`. `age_over_18` is mandatory
in every attestation; the other claims are optional.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- For the issuer side, a **signing key** with an X.509 certificate chain in
  Key Management (see `igrantio-api-key-management`). An mdoc needs an
  `x509` key.

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
3. **Side** - issuer, verifier, or both?
4. **Threshold** - which `age_over_NN` claims?
5. **Channel** - cross-device QR, same-device Digital Credentials API, or
   both? _Recommend QR first; `igrantio-dcapi-android` and
   `igrantio-dcapi-ios` cover the DC API._
6. **Trust list** - is your certificate registered in the trust list (the
   trust anchor for an issuer, the WRPAC for a relying party)? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>.

## Workflow
**Issuer side (once for each holder):**
1. **Create a credential definition** - `POST
   /v4/config/ows/issuer/credential-definitions`. The signing key is in
   the credential configuration (`cryptographicKeyFormat: "x509"` and
   `cryptographicKeyIdentifier`). The claims and the `mandatory` flags follow
   the registry template (`igrantio-credential-schema-age-verification`).
   Keep `credentialDefinition.id` and the `credentialConfigurationId` of the
   entry in `credentialConfigurations` of the answer. The `label` is unique
   in the organisation: a second create with the same label gets HTTP 400.
   Change the label, or reuse the `credentialDefinitionId` of the first
   run.

   ```json
   {
     "label": "Example age verification attestation",
     "version": "version_01",
     "credentialConfigurations": [
       {
         "credentialFormat": "mso_mdoc",
         "doctype": "eu.europa.ec.av.1",
         "cryptographicKeyFormat": "x509",
         "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
         "expirationInDays": 180,
         "revocation": {
           "enabled": true,
           "method": "status_list",
           "revokeWhenHolderDeletes": true
         },
         "display": {
           "name": "EU Age Verification",
           "description": "Proof of age attestation of the EU Age Verification profile."
         },
         "claims": {
           "claims": [
             { "path": ["eu.europa.ec.av.1", "age_over_14"], "mandatory": false, "limitDisclosure": true },
             { "path": ["eu.europa.ec.av.1", "age_over_16"], "mandatory": false, "limitDisclosure": true },
             { "path": ["eu.europa.ec.av.1", "age_over_18"], "mandatory": true, "limitDisclosure": true },
             { "path": ["eu.europa.ec.av.1", "age_over_21"], "mandatory": false, "limitDisclosure": true },
             { "path": ["eu.europa.ec.av.1", "age_over_65"], "mandatory": false, "limitDisclosure": true }
           ]
         }
       }
     ]
   }
   ```
2. **Issue in_time** - after you checked the age of the person (for example
   against a PID or a national eID), `POST
   /v4/config/ows/issuer/issuance-history`. Put the boolean claims under the
   namespace in `credentials`:

   ```json
   {
     "credentialDefinitionId": "<credentialDefinitionId>",
     "mode": "in_time",
     "preAuthorised": true,
     "urlScheme": "openid-credential-offer://",
     "credentials": [
       {
         "credentialConfigurationId": "<credentialConfigurationId>",
         "claims": {
           "eu.europa.ec.av.1": {
             "age_over_14": true,
             "age_over_16": true,
             "age_over_18": true,
             "age_over_21": false,
             "age_over_65": false
           }
         }
       }
     ]
   }
   ```

   The answer is HTTP 201 with `offer.uri` (the `openid-credential-offer://`
   QR code or deep link; render it with `igrantio-qr-code`) and one item in
   `issuanceHistory` with its `credentialExchangeId`. The webhook event
   `ows.issuer.issuance_history.credential_issued` tells you that the wallet
   got the attestation (see `igrantio-api-webhooks`).

**Verifier side (for each check):**
3. **Create a presentation definition** - `POST
   /v4/config/ows/verifier/presentation-definitions` with a DCQL query that
   asks for one boolean. The `label` is the purpose that the wallet shows to
   the holder. The example request uses the client identifier prefix
   `redirect_uri` and the response mode `direct_post`: it is not signed, so
   the body has no signing key. The `label` is unique in the organisation:
   change it for each new definition, or reuse the
   `presentationDefinitionId` of the first run. The platform reserves the
   label `Age Verification`: use another label.

   ```json
   {
     "label": "Example access to an 18 plus service",
     "version": "version_01",
     "clientIdScheme": "redirect_uri",
     "responseMode": "direct_post",
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

   For live use, sign the request: remove `clientIdScheme` and add
   `"cryptographicKeyFormat": "x509"` and
   `"cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>"` (the
   client identifier prefix is then `x509_hash`).
4. **Send the verification request** - `POST
   /v4/config/ows/verifier/verifications`:

   ```json
   {
     "presentationDefinitionId": "<presentationDefinitionId>",
     "requestByReference": true,
     "urlPrefix": "openid4vp://"
   }
   ```

   Render `verificationHistory.requestUrl` (the `openid4vp://` QR code or
   deep link). Keep `verificationHistory.presentationExchangeId`.
5. **Read the result** - the wallet discloses only the boolean. The webhook
   event `ows.verifier.verification.presentation_received` tells you that
   the answer is there. Then `GET
   /v4/config/ows/verifier/verifications/{presentationExchangeId}`: require
   `verificationHistory.status` `presentation_acked` and `isVerified`
   `true`, and read `age_over_18` in `presentation`. To accept only trusted
   issuers, add `credentialQueryOptions.age_verification` with
   `requiresTrustedCredentialSigner` (see `igrantio-api-verifier`); the
   result is then at
   `presentationValidity[].age_verification.credentialSignerTrustedListCheck`.

## Adjust for your deployment
- Pick the `age_over_NN` claims that your use case needs. Ask for exactly
  one boolean in each verification: more claims break data minimisation.
- Same-device flows can use the Digital Credentials API in place of a QR
  code: see `igrantio-dcapi-android` and `igrantio-dcapi-ios`.
- When you only verify (another issuer gives the attestation), skip the
  issuer steps and keep steps 3 to 5.
- `revokeWhenHolderDeletes: true` revokes the attestation when the wallet
  sends the notification `credential_deleted`. Change it when your rule is
  different.

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
- `igrantio-api-issuer` - the credential definition fields, the issue call
  and the issuance history.
- `igrantio-api-verifier` - the presentation definition fields, the send
  and the verification history.
- `igrantio-dcql-claim-sets` - an age check with a fallback claim.
- `igrantio-verifier-frontend` - the QR and DC API rendering;
  `igrantio-qr-code` for the QR panel.

## Source of truth
This workflow mirrors <https://docs.igrant.io/docs/eu-age-verification/>.
Before implementing, fetch that page; if it disagrees with this skill
(doctype, claim names, endpoints), the documentation wins - follow it and
report the drift so the skill can be updated.
