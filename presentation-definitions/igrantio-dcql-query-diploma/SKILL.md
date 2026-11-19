---
name: igrantio-dcql-query-diploma
description: 'DCQL query for the diploma qualification check of the ITU / GovStack Education Wallet use case. One OpenID4VP presentation definition that asks a job applicant for a Person Identification Data (PID) credential (given name, family name, email) and the National Diploma credential (vct urn:education:diploma:1: learner name, qualification, qualification code, awarding institution and award date). Use this skill when an employer or relying party verifies an education qualification with selective disclosure.'
license: Apache-2.0
metadata:
  categories: [dcql-query, education]
  provider: iGrant.io
  keywords: DCQL, presentation definition, OpenID4VP, diploma, qualification check, employer, selective disclosure, PID, National Learner Registry, EUDIW, GovStack, ITU
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-presentation-definition/
  requires-skills: igrantio-api-verifier
---

# Diploma qualification check - DCQL query

## When to use
Use this skill when an **employer**, or any relying party, verifies a person's
education qualification. The request asks for two credentials in one exchange:

- the **PID** for the applicant's identity (given name, family name, email), and
- the **National Diploma** (`urn:education:diploma:1`) for the qualification
  (learner name, qualification, code, awarding institution, award date).

The wallet discloses only these fields and nothing else. A job portal can use
it, for example, in an "Apply with your wallet" step. It carries no
transaction data.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- A **signing key** with an X.509 certificate chain in Key Management (see
  `igrantio-api-key-management`). Every signed request needs one. Register its
  Wallet-Relying Party Access Certificate (WRPAC) in a trust list, for example
  the NXD WRPAC list, so that the wallet trusts the request. See
  <https://docs.igrant.io/docs/trust-relying-party-registration/>.
- The diploma credential type must exist as a credential definition first - see
  `igrantio-credential-schema-diploma`.

## Ask the integrator first
1. **Environment** - demo, staging or production? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - the OWS API key of the verifying organisation.
3. **Label** - a presentation definition label that is unique in the
   organisation (3 to 100 characters), for example `Diploma qualification
   check`.
4. **Signing key (`cryptographicKeyIdentifier`)** - which key of Key
   Management signs the requests? _It must be an active key of the
   organisation with a certificate chain. The verifier signs with no other
   key._
5. **Fields** - the identity and diploma claims to request. _Default: the five
   diploma fields below plus three PID fields; ask for no more than you need._

## The DCQL query
Two credential queries, one PID and one diploma, in a single request. The PID
query accepts the PID of PID Rulebook v1.7 (`urn:eudi:pid:1`) and the PID of
the first shape (`urn:eu.europa.ec.eudi:pid:1`). Both shapes hold `given_name`,
`family_name` and `email`.

```json
{
  "credentials": [
    {
      "id": "pid",
      "format": "dc+sd-jwt",
      "meta": { "vct_values": ["urn:eudi:pid:1", "urn:eu.europa.ec.eudi:pid:1"] },
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
`POST /v4/config/ows/verifier/presentation-definitions`, then send
it at request time with the verification `send` operation
(`POST /v4/config/ows/verifier/verifications` with
`{ presentationDefinitionId, requestByReference: true }`).

```json
{
  "label": "Diploma qualification check",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "clientIdScheme": "x509_hash",
  "cryptographicKeyFormat": "x509",
  "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "pid",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["urn:eudi:pid:1", "urn:eu.europa.ec.eudi:pid:1"] },
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

- `label` has 3 to 100 characters and is unique in the organisation. A second
  create with the same label gets HTTP 400. Before you run the sample again,
  change the label, or reuse the `presentationDefinitionId` of the first run.
- `version` is required. Use `version_01` (OpenID4VP 1.0).
- `cryptographicKeyIdentifier` names the key that signs the request: an
  active key of the organisation with an X.509 certificate chain. A create
  without it gets HTTP 400. With `clientIdScheme: "x509_hash"`, the wallet
  shows the request as trusted when the certificate is in a trust list.
- Both queries are required by default, so the wallet must hold both a PID and a
  diploma.
- The send answer is `{"verificationHistory": {...}}`. Show its `requestUrl`
  as a QR code, or open it as a deep link, and keep its
  `presentationExchangeId`. Read the result with
  `GET /v4/config/ows/verifier/verifications/{verificationId}`, where
  `{verificationId}` is the `presentationExchangeId`. `isVerified` is `true`
  when every check passed, and `presentation` holds the disclosed claims of
  both credentials.

Read `igrantio-api-verifier` for the full DCQL reference (claim sets, credential
sets, trusted authorities, transaction data) and the send and read
operations of the verifications.

## Cross-references
- `igrantio-credential-schema-diploma` - the diploma credential definition this
  query reads.
- `igrantio-dcql-query-pid` - the PID query on its own (the learner sign-in).
- `igrantio-api-verifier` - create presentation definition, send, and read
  the verification.
- `igrantio-ows-overview` - architecture and glossary.
