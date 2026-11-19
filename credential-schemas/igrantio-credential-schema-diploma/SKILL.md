---
name: igrantio-credential-schema-diploma
description: 'Claim path pointer schema for the National Diploma credential (vct urn:education:diploma:1) of the ITU / GovStack National Learner Registry and Education Wallet use case. A dc+sd-jwt education credential the Ministry of Education issues to a learner, with the learner name, qualification, awarding institution, award date, programme, result, learner identifier (ULID) and the graduation decision hash. Use this skill when you build the diploma credential definition for the iGrant.io OpenID4VC API.'
license: Apache-2.0
metadata:
  categories: [credential-schema, education]
  provider: iGrant.io
  keywords: diploma, education credential, qualification, National Learner Registry, ULID, awarding institution, credential schema, claim path pointer, SD-JWT VC, EUDIW, GovStack, ITU
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-credential-definition/
  credential-formats: dc+sd-jwt
  requires-skills: igrantio-api-issuer
---

# National Diploma - credential schema

## When to use
Use this skill when the ministry, or a national learner registry, issues a
**diploma** as a verifiable credential to a learner. The diploma is the
qualification evidence a graduate later shares with an employer. It is issued in
the same wallet session as the diploma-fee payment (a dynamic credential
request), so the credential definition sets
`requiresInteractiveAuthorisation: true`.

This is a **use-case credential**, not a type of the public verifiable data
registry. The use case defines it with the type `urn:education:diploma:1` in
the `dc+sd-jwt` format. It models the W3C VC 2.0 / Open Badges education fields
semantically, carried as an OWS `dc+sd-jwt` credential so the holder can
selectively disclose each field.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- A **signing key** with an X.509 certificate chain in Key Management (see
  `igrantio-api-key-management`). Each credential configuration names one.
  Register its certificate in a trust list, for example the NXD Pub-EAA list.
  Until then, wallets show the credential as unverified. See
  <https://docs.igrant.io/docs/trust-relying-party-registration/>.

## Ask the integrator first
Ask one question at a time, with a recommended default. Record the answers
before you write code.

1. **Environment** - demo, staging or production? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - the OWS API key of the issuing organisation, for example the
   ministry of education.
3. **Label** - the credential definition label. It has 3 to 100 characters
   and is unique in the organisation. Pick a new label, so that the create
   does not collide with an existing definition (for example `National
   Diploma`).
4. **Signing key (`cryptographicKeyIdentifier`)** - which key of Key
   Management signs the credentials? _`x509` is the only key format. The key
   must be an active key of the organisation with a certificate chain._
5. **Revocation** - status list on? _Recommend on; a diploma has a lifetime._
6. **Validity** - `expirationInDays`? _Recommend 3650 (10 years)._

## What the claims describe
All nine claims are mandatory and selectively disclosable (`dc+sd-jwt`).

- **Learner and award**: `learnerName`, `qualificationName`, `qualificationCode`,
  `awardingInstitution`, `awardDate`, `programme`, `result`.
- **Registry link**: `ulid` (the learner identifier from the National Learner
  Registry) and `graduationDecisionHash` (the hash of the signed graduation
  decision the diploma references).

## Claim path pointer document (`dc+sd-jwt`)

| Fact | Value |
| --- | --- |
| Title | Diploma |
| Format | `dc+sd-jwt` |
| `vct` to send | `urn:education:diploma:1` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

```json
{
  "claims": [
    { "path": ["learnerName"], "mandatory": true, "limitDisclosure": true },
    { "path": ["qualificationName"], "mandatory": true, "limitDisclosure": true },
    { "path": ["qualificationCode"], "mandatory": true, "limitDisclosure": true },
    { "path": ["awardingInstitution"], "mandatory": true, "limitDisclosure": true },
    { "path": ["awardDate"], "mandatory": true, "limitDisclosure": true },
    { "path": ["programme"], "mandatory": true, "limitDisclosure": true },
    { "path": ["result"], "mandatory": true, "limitDisclosure": true },
    { "path": ["ulid"], "mandatory": true, "limitDisclosure": true },
    { "path": ["graduationDecisionHash"], "mandatory": true, "limitDisclosure": true }
  ]
}
```

## Use with the iGrant.io API
Create the credential definition with
`POST /v4/config/ows/issuer/credential-definitions`. Send the
`claims` array above inside the single `dc+sd-jwt` configuration entry.

```json
{
  "label": "National Diploma",
  "version": "version_01",
  "requiresInteractiveAuthorisation": true,
  "display": {
    "name": "Diploma",
    "description": "Ministry of Education diploma credential",
    "backgroundColor": "#1d4e89",
    "textColor": "#ffffff"
  },
  "credentialConfigurations": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "urn:education:diploma:1",
      "cryptographicKeyFormat": "x509",
      "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
      "claims": {
        "claims": [
          { "path": ["learnerName"], "mandatory": true, "limitDisclosure": true },
          { "path": ["qualificationName"], "mandatory": true, "limitDisclosure": true },
          { "path": ["qualificationCode"], "mandatory": true, "limitDisclosure": true },
          { "path": ["awardingInstitution"], "mandatory": true, "limitDisclosure": true },
          { "path": ["awardDate"], "mandatory": true, "limitDisclosure": true },
          { "path": ["programme"], "mandatory": true, "limitDisclosure": true },
          { "path": ["result"], "mandatory": true, "limitDisclosure": true },
          { "path": ["ulid"], "mandatory": true, "limitDisclosure": true },
          { "path": ["graduationDecisionHash"], "mandatory": true, "limitDisclosure": true }
        ]
      },
      "revocation": { "enabled": true, "method": "status_list", "revokeWhenHolderDeletes": true },
      "expirationInDays": 3650
    }
  ]
}
```

Notes on the request.

- `label` has 3 to 100 characters and is unique in the organisation. A second
  create with the same label gets HTTP 400. Before you run the sample again,
  change the label, or reuse the `id` of the first run. The platform reserves
  the labels `Payment User Credential`, `Payment Card Credential`, `Payment
  Account Credential`, `PID Issuance` and `Photo ID Issuance` (in any letter
  case); pick another label.
- `version` is required. Its only value is `version_01` (OpenID4VCI 1.0), and
  you cannot change it after you create the definition.
- The configuration names its signing key: `cryptographicKeyFormat: "x509"`
  (the only format) and `cryptographicKeyIdentifier`, the id of an active key
  of the organisation with an X.509 certificate chain. A key at the top level
  of the request gets HTTP 400.
- `requiresInteractiveAuthorisation: true` lets the holder present the payment
  credential during the issuance, so the diploma follows in the same session
  (the dynamic credential request). Leave it out if you issue the diploma on
  its own.
- Keep the `credentialConfigurationId` that the answer gives. To issue, call
  `POST /v4/config/ows/issuer/issuance-history` and give the claims in
  `credentials: [{"credentialConfigurationId", "claims"}]`. For the dynamic
  credential request, also send `presentationDefinitionId` and, if the
  presentation needs it, `transactionData`, with `preAuthorised: false`.

Read `igrantio-api-issuer` for the issue operation (`in_time`, pre-authorised code,
and the dynamic credential request with transaction data), the revocation
operation, and the full request reference.

## Cross-references
- `igrantio-api-issuer` - create credential definition, issue, and revoke.
- `igrantio-dcql-query-diploma` - the DCQL query that asks a holder for a diploma
  (the employer's qualification check).
- `igrantio-api-verifier` - transaction data and the dynamic credential request.
- `igrantio-ows-overview` - architecture and glossary.
