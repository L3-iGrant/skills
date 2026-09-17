---
name: igrantio-dcql-query-diploma
description: 'DCQL query for the diploma qualification check used by the ITU / GovStack Education Wallet showcase. One OpenID4VP presentation definition that asks a job applicant for a Person Identification Data (PID) credential (given name, family name, email) and the National Diploma credential (vct urn:education:diploma:1: learner name, qualification, qualification code, awarding institution and award date). Use this skill when an employer or relying party verifies an education qualification with selective disclosure.'
license: Apache-2.0
metadata:
  categories: [education, dcql-query]
  provider: iGrant.io
  keywords: DCQL, presentation definition, OpenID4VP, diploma, qualification check, employer, selective disclosure, PID, National Learner Registry, EUDIW, GovStack, ITU
  version: 2026.09.01
  source-doc: https://giga-staging.igrant.io/knowledgebase/showcase-credentials
  requires-skills: igrantio-api-verifier
---

# Diploma qualification check - DCQL query

## When to use
Use this skill when an **employer**, or any relying party, verifies a person's
education qualification. The request asks for two credentials in one exchange:

- the **PID** for the applicant's identity (given name, family name, email), and
- the **National Diploma** (`urn:education:diploma:1`) for the qualification
  (learner name, qualification, code, awarding institution, award date).

The wallet discloses only these fields and nothing else. In the showcase this is
the CivicWorks Careers "Apply with your wallet" step. It carries no transaction
data.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key** for the verifying
  organisation (the employer sandbox in the showcase). Server-side only.
- The **OWS environment** the key belongs to (default demo,
  `https://demo-api.igrant.io`).
- An **x509 verifier certificate** registered on a trust list (the showcase uses
  NXD WRPAC), so the wallet trusts the request. See
  <https://docs.igrant.io/docs/trust-relying-party-registration/>.
- The diploma credential type must exist as a credential definition first - see
  `igrantio-credential-schema-diploma`.

## Ask the integrator first
1. **Environment** - demo or staging? _Default demo._
2. **API key** - the OWS API key for the verifying organisation.
3. **Label** - a unique presentation definition label (at least 3 characters),
   for example `Diploma qualification check`.
4. **Signing key (`kid`)** - the x509 verifier key, its certificate on the trust
   list.
5. **Fields** - the identity and diploma claims to request. _Default: the five
   diploma fields below plus three PID fields; ask for no more than you need._

## The DCQL query
Two credential queries, one PID and one diploma, in a single request.

```json
{
  "credentials": [
    {
      "id": "pid",
      "format": "dc+sd-jwt",
      "meta": { "vct_values": ["urn:eu.europa.ec.eudi:pid:1"] },
      "claims": [
        { "path": ["given_name"] },
        { "path": ["family_name"] },
        { "path": ["email"] }
      ]
    },
    {
      "id": "diploma",
      "format": "dc+sd-jwt",
      "meta": { "vct_values": ["urn:education:diploma:1"] },
      "claims": [
        { "path": ["learnerName"] },
        { "path": ["qualificationName"] },
        { "path": ["qualificationCode"] },
        { "path": ["awardingInstitution"] },
        { "path": ["awardDate"] }
      ]
    }
  ]
}
```

## Use with the iGrant.io API
Create the presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`, then send
it at request time with the V3 verification `send` operation
(`POST /v3/config/digital-wallet/openid/sdjwt/verification/send` with
`{ presentationDefinitionId, requestByReference: true }`).

```json
{
  "label": "Diploma qualification check",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "clientIdScheme": "x509_hash",
  "trustAnchor": "x509",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "pid",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["urn:eu.europa.ec.eudi:pid:1"] },
        "claims": [
          { "path": ["given_name"] },
          { "path": ["family_name"] },
          { "path": ["email"] }
        ]
      },
      {
        "id": "diploma",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["urn:education:diploma:1"] },
        "claims": [
          { "path": ["learnerName"] },
          { "path": ["qualificationName"] },
          { "path": ["qualificationCode"] },
          { "path": ["awardingInstitution"] },
          { "path": ["awardDate"] }
        ]
      }
    ]
  }
}
```

Notes on the request.

- `label` must be unique and at least 3 characters. Pick a fresh label so you do
  not collide with an existing presentation definition.
- Always send `version` with the value `version_01`.
- Both queries are required by default, so the wallet must hold both a PID and a
  diploma. Read the verification result with
  `GET /v3/config/digital-wallet/openid/sdjwt/verification/history/{exchangeId}`.
- `clientIdScheme: "x509_hash"` and `trustAnchor: "x509"` sign the request with
  the verifier certificate, so the wallet shows the request as trusted.

Read `igrantio-api-verifier` for the full DCQL reference (claim sets, credential
sets, trusted authorities, transaction data) and the send and history
operations.

## Cross-references
- `igrantio-credential-schema-diploma` - the diploma credential definition this
  query reads.
- `igrantio-dcql-query-pid` - the PID query on its own (the learner sign-in).
- `igrantio-api-verifier` - create presentation definition, send, and read
  history.
- `igrantio-ows-overview` - architecture and glossary.
