---
name: igrantio-credential-schema-mobile-driving-license
description: 'Claim path pointer schema for the ISO/IEC 18013-5 Mobile Driving Licence (mDL, doctype org.iso.18013.5.1.mDL) from the iGrant.io verifiable data registry. It holds the 25 mdoc claims of the org.iso.18013.5.1 namespace, from family_name and birth_date to driving_privileges, portrait, age_over_18 and issuing_authority. Use this skill when you create an mDL credential definition on the iGrant.io OpenID4VC API, or when you need the exact claim paths, namespace and doctype of a mobile driving licence.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: mDL, mobile driving licence, mobile driving license, ISO 18013-5, org.iso.18013.5.1, mso_mdoc, mdoc, driving privileges, claim path pointer, credential definition, EUDIW, selective disclosure
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/mobileDrivingLicense
  schema-version: 2026.4.1
  formats: mso_mdoc
  requires-skills: igrantio-api-issuer
---

# Mobile Driving Licence (mDL) credential schema

## When to use
Use this skill when you issue or ask for a **Mobile Driving Licence**. The
credential is the ISO/IEC 18013-5 mDL: the driving privileges of the holder plus
the identity data that a roadside or an online check needs.

The registry publishes this schema in **one format only: `mso_mdoc`**. The
metadata sets `isMsoMdoc` to `true`, and `isSdJwt` and `isJwt` to `false`. The
mDL is an mdoc by definition, so there is no SD-JWT VC form and no JWT form in
the registry.

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
| Title | Mobile Driving Licence (mDL) |
| Credential type | `org.iso.18013.5.1.mDL` |
| Doctype | `org.iso.18013.5.1.mDL` |
| Namespace | `org.iso.18013.5.1` |
| Format | `mso_mdoc` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": ["org.iso.18013.5.1", "administrative_number"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "age_birth_year"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "age_in_years"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "age_over_18"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "age_over_21"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "birth_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "birth_place"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "document_number"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "driving_privileges"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "expiry_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "eye_colour"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "family_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "given_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "hair_colour"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "height"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "issue_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "issuing_authority"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "issuing_country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "issuing_jurisdiction"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "portrait"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "portrait_capture_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "resident_address"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "sex"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "un_distinguishing_sign"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "weight"],
      "mandatory": true,
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
  namespace is `org.iso.18013.5.1`. It is not the same as the doctype
  `org.iso.18013.5.1.mDL`. Every path of the configuration must start with the
  same namespace element.
- `mandatory` says if the claim must hold a value when you issue. The issuer
  reads a missing `mandatory` as `true`. Every claim of this schema is
  mandatory, so an issue request must fill all 25 claims. Remove the claims that
  you do not issue from your credential definition.
- `limitDisclosure` says if the holder can disclose the claim on its own. Every
  claim sets it to `true`, so a verifier can ask for `age_over_18` alone and get
  no other data.

`driving_privileges` holds a structure, not a string. `portrait` holds the image
of the holder. `age_over_18` and `age_over_21` are booleans that let a verifier
check an age limit without the birth date.

## Use with the iGrant.io API
Create a credential definition with:

`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`

Put one entry in `credentialDefinitions[]` and copy the `claims` array of the
schema document into that entry.

- Set `version` to `version_01` at the top level of the request.
- Set `credentialFormat` to `mso_mdoc`.
- Set `doctype` to `org.iso.18013.5.1.mDL`.
- Put the array in `claims.claims`.
- Set `validationPath` to `$`.
- Add `cose_key` to `credentialBindingMethods` if the wallet binds the mdoc with
  a COSE key.

```json
{
  "label": "Issue Mobile Driving Licence",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "mso_mdoc",
      "doctype": "org.iso.18013.5.1.mDL",
      "validationPath": "$",
      "supportRevocation": true,
      "revocationMethod": "status_list",
      "claims": {
        "claims": [
          {
            "path": ["org.iso.18013.5.1", "family_name"],
            "mandatory": true,
            "limitDisclosure": true
          },
          {
            "path": ["org.iso.18013.5.1", "driving_privileges"],
            "mandatory": true,
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

When you issue, the top key of `claims` in the issue request is the namespace
`org.iso.18013.5.1`.

Read `igrantio-api-issuer` for the full operation reference: every request
field, the display options, revocation, and the issue operation that fills these
claims. Read `igrantio-api-verifier` for the DCQL query that asks for mDL
claims.

## Source is the registry
This skill mirrors the claim path pointer template in the iGrant.io verifiable
data registry. If this skill and the registry file disagree, **the registry
wins**. Fetch the source before you rely on a claim path:

- Template: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/mobileDrivingLicense>
- Raw schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/mobileDrivingLicense/2026.4.1/mso_mdoc.schema.json>
- Raw metadata: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/mobileDrivingLicense/2026.4.1/mso_mdoc.schema.metadata.json>

A newer version directory can appear in the registry. Check the directory
listing for a version above 2026.4.1 and use the newest one.
