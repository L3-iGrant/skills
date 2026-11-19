---
name: igrantio-dcql-kyc
description: 'DCQL pattern: a KYC request that combines two required credential groups in one OpenID4VP verification on the iGrant.io Organisation Wallet Suite: a Photo ID for the identity, and a proof of address where a Utility Bill or a Bank Statement is acceptable, all dc+sd-jwt. Know-your-customer onboarding for banks, fintechs and regulated services with the EUDI Wallet (EUDIW) under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, KYC, know your customer, Photo ID, proof of address, utility bill, bank statement, credential_sets, OpenID4VP, EUDIW, eIDAS2
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/dcql-2-4-4-kyc-request-photo-id-address-proof/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: KYC (photo ID and address proof)

## Scenario
A KYC onboarding needs BOTH a Photo ID (the identity) AND a proof of
address. A Utility Bill or a Bank Statement satisfies the address
requirement. One request holds two required `credential_sets`.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- A **signing key** with an X.509 certificate chain in Key Management (see
  `igrantio-api-key-management`). The example signs the request with it.

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
3. **Adjust** - which parts of the query change for you: `vct_values`,
   claim paths, the accepted address documents?
4. **Signing key** - which key of Key Management signs the request? _It must
   have an X.509 certificate chain. The wallet can then check your access
   certificate._
5. **Channel** - cross-device QR, same-device Digital Credentials API, or
   both? _Recommend QR first; `igrantio-dcapi-android` and
   `igrantio-dcapi-ios` cover the DC API._
6. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## The DCQL query
The presentation definition below holds the DCQL query in `dcqlQuery`. The
key signs the request (client identifier prefix `x509_hash`, the default for
an `x509` key). The platform reserves the label `Know-Your-Customer (KYC)`:
use another label.

```json
{
  "label": "Example KYC with photo ID and address proof",
  "version": "version_01",
  "cryptographicKeyFormat": "x509",
  "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "photo_id",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["eu.europa.ec.eudi.photoid.1"] },
        "claims": [
          { "path": ["iso23220", "family_name_unicode"] },
          { "path": ["iso23220", "given_name_unicode"] },
          { "path": ["iso23220", "birth_date"] }
        ],
        "require_cryptographic_holder_binding": true
      },
      {
        "id": "utility_bill",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["UtilityBill"] },
        "claims": [
          { "path": ["name"] },
          { "path": ["address"] }
        ],
        "require_cryptographic_holder_binding": true
      },
      {
        "id": "bank_statement",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["BankStatement"] },
        "claims": [
          { "path": ["accountHolderName"] },
          { "path": ["address"] }
        ],
        "require_cryptographic_holder_binding": true
      }
    ],
    "credential_sets": [
      { "options": [["photo_id"]], "required": true },
      { "options": [["utility_bill"], ["bank_statement"]], "required": true }
    ]
  }
}
```

## Run it on OWS
1. **Create the presentation definition** - `POST
   /v4/config/ows/verifier/presentation-definitions` with the body above.
   Keep `presentationDefinition.presentationDefinitionId` of the answer.
   The `label` is unique in the organisation: a second create with the same
   label gets HTTP 400. Change the label, or reuse the
   `presentationDefinitionId` of the first run.
2. **Send the request** - `POST /v4/config/ows/verifier/verifications` with
   `{"presentationDefinitionId": "<presentationDefinitionId>", "requestByReference": true}`.
   Show `verificationHistory.requestUrl` as a QR code, or open it as a deep
   link. Keep `verificationHistory.presentationExchangeId`.
3. **Wait for the answer** - the webhook event
   `ows.verifier.verification.presentation_received` (see
   `igrantio-api-webhooks`), or the status stream (see
   `igrantio-api-verifier`).
4. **Read the result** - `GET
   /v4/config/ows/verifier/verifications/{presentationExchangeId}`. Require
   `verificationHistory.status` `presentation_acked` and `isVerified`
   `true`. The presentation holds TWO credentials. The members of the
   `presentationValidity` items name the credential queries that the wallet
   answered (`photo_id`, and `utility_bill` or `bank_statement`). Read the
   claims in `presentation`. `vpToken` holds one text: the JSON of the VP
   Token, with only the claims that the query asks for.
5. **Check the business rule** - compare the name on the Photo ID with the
   name on the address document.

## Adjust for your deployment
- The Photo ID type and its claim paths come from the iGrant.io registry
  (`igrantio-dcql-query-photo-id`). Add the identity claims that your KYC
  needs (for example `["iso23220", "portrait"]`).
- `UtilityBill` and `BankStatement` are example types. Set `vct_values` and
  the claim paths to the types that your issuers use.
- Add other accepted evidence (a rental agreement, a bank letter) to the
  `options` of the address group.
- For regulated onboarding, accept only trusted issuers: add
  `credentialQueryOptions` with `requiresTrustedCredentialSigner` for each
  query id (see `igrantio-api-verifier`), or `trusted_authorities` (see
  `igrantio-dcql-trusted-authority`). The trust check of the issuer is at
  `presentationValidity[].<credential query id>.credentialSignerTrustedListCheck`.

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
- `igrantio-api-verifier` - the presentation definition fields, the send
  and the verification history.
- `igrantio-dcql-student-pass` - the same two-group pattern plus an
  OPTIONAL third group.
- `igrantio-dcql-credential-sets` - one group of alternatives.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-2-4-4-kyc-request-photo-id-address-proof/>
(the query is explained in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
section 2.4.4). Before implementing, fetch the doc page; if it disagrees with
this skill, the documentation wins - follow it and report the drift so the
skill can be updated.
