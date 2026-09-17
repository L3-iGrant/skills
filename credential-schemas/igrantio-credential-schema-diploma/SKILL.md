---
name: igrantio-credential-schema-diploma
description: 'Claim path pointer schema for the National Diploma credential (vct urn:education:diploma:1) used by the ITU / GovStack National Learner Registry and Education Wallet showcase. A dc+sd-jwt education credential the Ministry of Education issues to a learner, with the learner name, qualification, awarding institution, award date, programme, result, learner identifier (ULID) and the graduation decision hash. Use this skill when you build the diploma credential definition for the iGrant.io OpenID4VC API.'
license: Apache-2.0
metadata:
  categories: [credential-schema, education]
  provider: iGrant.io
  keywords: diploma, education credential, qualification, National Learner Registry, ULID, awarding institution, credential schema, claim path pointer, SD-JWT VC, EUDIW, GovStack, ITU
  version: 2026.09.01
  source-doc: https://giga-staging.igrant.io/knowledgebase/showcase-credentials
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
`supportInteractiveAuthorisationEndpoint: true`.

This is a **use-case credential**, not a public verifiable-data-registry type.
The showcase defines it with the type `urn:education:diploma:1` in the
`dc+sd-jwt` format. It models the W3C VC 2.0 / Open Badges education fields
semantically, carried as an OWS `dc+sd-jwt` credential so the holder can
selectively disclose each field.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key** for the issuing
  organisation. Keep it on the server, in an environment variable or a secret
  manager. The browser never sees it.
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
- An **x509 signing key** whose certificate is registered on a trust list (the
  showcase uses NXD Pub-EAA). Until it is, wallets show the credential as
  unverified. See <https://docs.igrant.io/docs/trust-relying-party-registration/>.

## Ask the integrator first
Ask one question at a time, with a recommended default. Record the answers
before you write code.

1. **Environment** - demo or staging? _Default demo._
2. **API key** - the OWS API key for the issuing organisation (the Ministry of
   Education sandbox in the showcase).
3. **Label** - the credential definition label. Must be unique in the
   organisation and at least 3 characters. Pick a fresh label so you do not
   collide with an existing definition (for example `National Diploma`).
4. **Signing key (`kid`)** - the id of the x509 key to sign with, and its
   certificate on the trust list.
5. **Revocation** - status list on? _Recommend on; a diploma has a lifetime._
6. **Validity** - `expirationInDays`? _The showcase uses 3650 (10 years)._

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
`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`. Send the
`claims` array above inside the single `dc+sd-jwt` configuration entry.

```json
{
  "label": "National Diploma",
  "version": "version_01",
  "trustAnchor": "x509",
  "supportInteractiveAuthorisationEndpoint": true,
  "display": {
    "name": "Diploma",
    "description": "Ministry of Education diploma credential",
    "backgroundColor": "#1d4e89",
    "textColor": "#ffffff"
  },
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "urn:education:diploma:1",
      "validationPath": "$",
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
      "supportRevocation": true,
      "expirationInDays": 3650
    }
  ]
}
```

Notes on the request.

- `label` must be unique and at least 3 characters. The platform reserves the
  labels `Payment User Credential`, `Payment Card Credential`, `Payment Account
  Credential`, `PID Issuance` and `Photo ID Issuance`; pick another label.
- Always send `version` with the value `version_01`. You cannot change it after
  you create the definition.
- `supportInteractiveAuthorisationEndpoint: true` lets the payment credential be
  presented during issuance, so the diploma follows in the same session (the
  dynamic credential request). Leave it off if you issue the diploma on its own.
- Keep the `id` the response returns. The issue operation matches the claims to
  this configuration by that id.

Read `igrantio-api-issuer` for the issue operation (InTime, pre-authorised code,
and the dynamic credential request with transaction data), the revocation
operation, and the full request reference.

## Cross-references
- `igrantio-api-issuer` - create credential definition, issue, and revoke.
- `igrantio-dcql-query-diploma` - the DCQL query that asks a holder for a diploma
  (the employer's qualification check).
- `igrantio-api-verifier` - transaction data and the dynamic credential request.
- `igrantio-ows-overview` - architecture and glossary.
