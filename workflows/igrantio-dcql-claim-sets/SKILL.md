---
name: igrantio-dcql-claim-sets
description: 'DCQL pattern: claim_sets with a fallback for selective disclosure. The verifier prefers the minimal claim age_over_16 of the EU age verification attestation (mso_mdoc, doctype eu.europa.ec.av.1) and falls back to the mandatory claim age_over_18 when the attestation does not hold age_over_16, in one OpenID4VP verification on the iGrant.io Organisation Wallet Suite. Data-minimised age verification for EUDI Wallet (EUDIW) relying parties under eIDAS 2.0 and GDPR.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, claim_sets, selective disclosure, age verification, age_over_16, age_over_18, eu.europa.ec.av.1, mso_mdoc, OpenID4VP, EUDIW, eIDAS2, GDPR
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/dcql-2-4-2-claim-set-age-verification/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: claim sets (preferred claim with fallback)

## Scenario
A service for persons of 16 years and over checks the age with the EU age
verification attestation (an mdoc with the doctype `eu.europa.ec.av.1`).
The verifier prefers the claim `age_over_16`. When the attestation does not
hold `age_over_16`, the query falls back to `age_over_18`, the mandatory
claim of the attestation. `claim_sets` are in order: the wallet sends the
first set that it can.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- For live use, a **signing key** with an X.509 certificate chain in Key
  Management (see `igrantio-api-key-management`). The example request is not
  signed, so it needs no key.

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
3. **Adjust** - which parts of the query change for you: the doctype, the
   claim paths, the order of the claim sets?
4. **Signed request** - signed with a key of Key Management, or not signed?
   _Recommend signed for live use: the wallet can then check your access
   certificate. An unsigned request is good for a first test._
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
request uses the client identifier prefix `redirect_uri` and the response
mode `direct_post`. This request is not signed, so the body has no signing
key: the server refuses `cryptographicKeyFormat` and
`cryptographicKeyIdentifier` for it.

```json
{
  "label": "Example age check 16 plus with fallback",
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
          { "id": "over_16", "path": ["eu.europa.ec.av.1", "age_over_16"] },
          { "id": "over_18", "path": ["eu.europa.ec.av.1", "age_over_18"] }
        ],
        "claim_sets": [
          ["over_16"],
          ["over_18"]
        ]
      }
    ]
  }
}
```

For live use, sign the request. Remove `clientIdScheme` and add
`"cryptographicKeyFormat": "x509"` and
`"cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>"`. The
client identifier prefix is then `x509_hash`.

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
   `true`. Read the disclosed claim in `presentation`. Handle the two sets:
   the wallet sends `age_over_16`, or `age_over_18` when the attestation
   has no `age_over_16`. `vpToken` holds one text: the JSON of the VP Token,
   with only the claims that the query asks for.

An iGrant.io organisation wallet as holder names the claim set that it
sends in `claimIds` (see `igrantio-api-holder`). The query has
`claim_sets`, so `claimIds` is mandatory.

## Adjust for your deployment
- Change the threshold claims (`age_over_14`, `age_over_18`, `age_over_21`,
  `age_over_65`) to your rule. The doctype and the claim paths are those of
  the age verification attestation (`igrantio-dcql-query-age-verification`).
- Put the most minimal claim set first. That is the point of the pattern.
- A Person Identification Data (PID) credential holds no age claims (PID
  Rulebook v1.7). An age check against a PID asks for `birthdate`
  (`dc+sd-jwt`, `vct` `urn:eudi:pid:1`), and your backend compares the
  date.
- To accept only trusted issuers, add `credentialQueryOptions` with
  `requiresTrustedCredentialSigner` (see `igrantio-api-verifier`). The trust
  check of the issuer is then at
  `presentationValidity[].age_verification.credentialSignerTrustedListCheck`.

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
- `igrantio-eu-age-verification` - issue and verify the age verification
  attestation (one claim, no fallback).
- `igrantio-dcql-credential-sets` - alternatives across credentials, not
  across claims.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-2-4-2-claim-set-age-verification/>
(the query is explained in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
section 2.4.2). Before implementing, fetch the doc page; if it disagrees with
this skill, the documentation wins - follow it and report the drift so the
skill can be updated.
