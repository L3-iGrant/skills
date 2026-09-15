---
name: igrantio-credential-schema-age-verification
description: 'Claim path pointer schema for the EUDI Age Verification attestation (doctype eu.europa.ec.av.1) from the iGrant.io verifiable data registry. It holds the five age-over booleans - age_over_14, age_over_16, age_over_18, age_over_21 and age_over_65 - as selectively disclosable mdoc claims. Use this skill when you create an age verification credential definition on the iGrant.io OpenID4VC API, or when you need the exact claim paths, namespace and doctype for a proof-of-age credential.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: age verification, proof of age, age_over_18, eu.europa.ec.av.1, mso_mdoc, mdoc, claim path pointer, credential definition, EUDIW, selective disclosure
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/ageVerification
  schema-version: 2026.4.1
  formats: mso_mdoc
  requires-skills: igrantio-api-issuer
---

# Age Verification credential schema

## When to use
Use this skill when you issue or ask for an **Age Verification** attestation.
The credential proves that the holder is over an age limit. It carries no name,
no date of birth, and no document number. The holder shows one boolean and
keeps the rest of the credential hidden.

The registry publishes this schema in **one format only: `mso_mdoc`**. The
metadata sets `isMsoMdoc` to `true`, and `isSdJwt` and `isJwt` to `false`. There
is no SD-JWT VC form and no JWT form of this schema in the registry.

This page describes registry version **2026.4.1**, the latest version of the
template.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
  A key works only in its own environment.

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
3. **Format** - which of the formats the registry publishes for this schema:
   `dc+sd-jwt`, `jwt_vc_json` or `mso_mdoc`? _Recommend `dc+sd-jwt` unless the
   rule book requires mdoc._
4. **Claims** - all claims of the schema, or a subset? _Mandatory claims
   stay._
5. **Issuance mode** - `InTime` (claims known now) or `Deferred` (claims
   arrive later)?
6. **Revocation** - status list on? _Recommend on for any credential with a
   lifetime._
7. **Signing** - a DID key or an X.509 certificate (`x5c`)? _X.509 is needed
   for mdoc and for the trust list._
8. **Trust list** - is your issuer certificate (the trust anchor) registered
   in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   wallets show your credentials as unverified.

## Claim path pointer document - mso_mdoc

| Fact | Value |
| --- | --- |
| Title | Age Verification |
| Credential type | `eu.europa.ec.av.1` |
| Doctype | `eu.europa.ec.av.1` |
| Namespace | `eu.europa.ec.av.1` |
| Format | `mso_mdoc` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": ["eu.europa.ec.av.1", "age_over_14"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.av.1", "age_over_16"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.av.1", "age_over_18"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.av.1", "age_over_21"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.av.1", "age_over_65"],
      "mandatory": false,
      "limitDisclosure": true
    }
  ]
}
```

## How to read the fields
Each item of the `claims` array is one claim path pointer.

- `path` is an array that selects one claim. Each element is a string for an
  object key, an integer for an array index, or `null` for every element of an
  array. For `mso_mdoc`, **the first element is the mDoc namespace**. Here the
  namespace is `eu.europa.ec.av.1`, and it is the same as the doctype. Every
  path of the configuration must start with that same element.
- `mandatory` says if the claim must hold a value when you issue. The issuer
  reads a missing `mandatory` as `true`. In this schema only `age_over_18` is
  mandatory. The other four age limits are optional: send the ones that your
  use case needs.
- `limitDisclosure` says if the holder can disclose the claim on its own. Every
  claim of this schema sets it to `true`, so the holder can show `age_over_18`
  and keep `age_over_65` hidden.

Every claim value is a boolean.

## Use with the iGrant.io API
Create a credential definition with:

`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`

Put one entry in `credentialDefinitions[]` and copy the `claims` array of the
schema document into that entry.

- Set `version` to `version_01` at the top level of the request.
- Set `credentialFormat` to `mso_mdoc`.
- Set `doctype` to `eu.europa.ec.av.1`.
- Put the array in `claims.claims`.
- Set `validationPath` to `$`.
- Add `cose_key` to `credentialBindingMethods` if the wallet binds the mdoc with
  a COSE key.

```json
{
  "label": "Issue Age Verification",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "mso_mdoc",
      "doctype": "eu.europa.ec.av.1",
      "validationPath": "$",
      "claims": {
        "claims": [
          {
            "path": ["eu.europa.ec.av.1", "age_over_18"],
            "mandatory": true,
            "limitDisclosure": true
          },
          {
            "path": ["eu.europa.ec.av.1", "age_over_21"],
            "mandatory": false,
            "limitDisclosure": true
          }
        ]
      }
    }
  ]
}
```

The example shows two claims. Send the full array when you want the full
schema.

`label` is free text and does not change the schema. The platform reserves some
labels. If the create call fails with HTTP 400 because of the label, choose
another one.

When you issue, the top key of `claims` in the issue request is the doctype
namespace `eu.europa.ec.av.1`.

Read `igrantio-api-issuer` for the full operation reference: every request
field, the display options, revocation, and the issue operation that fills these
claims. Read `igrantio-api-verifier` for the DCQL query that asks for one age
limit.

## Source is the registry
This skill mirrors the claim path pointer template in the iGrant.io verifiable
data registry. If this skill and the registry file disagree, **the registry
wins**. Fetch the source before you rely on a claim path:

- Template: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/ageVerification>
- Raw schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/ageVerification/2026.4.1/mso_mdoc.schema.json>
- Raw metadata: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/ageVerification/2026.4.1/mso_mdoc.schema.metadata.json>

A newer version directory can appear in the registry. Check the directory
listing for a version above 2026.4.1 and use the newest one.
