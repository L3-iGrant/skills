---
name: igrantio-credential-schema-passport
description: 'Claim path pointer schema for the Passport credential (credential type Passport, mdoc doctype org.iso.18013.5.1.passport) from the iGrant.io verifiable data registry. It holds the travel document claims: serialNumber, firstName, lastName, birthDate, gender, nationality, personalNumber, expiryDate, issuerAuthority, image and signature. The registry publishes it in all three formats: dc+sd-jwt, jwt_vc_json and mso_mdoc. Use this skill when you create a passport credential definition on the iGrant.io OpenID4VC API, or when you need the exact claim path for each of the three credential formats.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: passport, travel document, ePassport, org.iso.18013.5.1.passport, nationality, personalNumber, issuerAuthority, SD-JWT VC, dc+sd-jwt, jwt_vc_json, mso_mdoc, claim path pointer, credential definition, EUDIW, selective disclosure
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/passport
  schema-version: 2025.7.1
  formats: dc+sd-jwt, jwt_vc_json, mso_mdoc
  requires-skills: igrantio-api-issuer
---

# Passport credential schema

## When to use
Use this skill when you issue or ask for a **Passport** credential. The
credential is the digital form of a passport: the identity of the holder, the
travel document data, the portrait and the signature. Use it for a border check,
a hotel check-in, or any flow that needs a travel document.

The registry publishes this schema in **all three formats**:

| Format | Metadata flag | Identifier to send |
| --- | --- | --- |
| `dc+sd-jwt` | `isSdJwt: true` | `vct` |
| `jwt_vc_json` | `isJwt: true` | `type` |
| `mso_mdoc` | `isMsoMdoc: true` | `doctype` |

This page describes registry version **2025.7.1**, the latest version of the
template.

## Claim path pointer document - dc+sd-jwt

| Fact | Value |
| --- | --- |
| Title | Passport |
| Credential type | `Passport` |
| Namespace | `Passport` |
| Format | `dc+sd-jwt` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": ["serialNumber"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["firstName"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["signature"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["personalNumber"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["image"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["birthDate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["lastName"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["gender"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["expiryDate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["nationality"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["issuerAuthority"],
      "mandatory": true,
      "limitDisclosure": true
    }
  ]
}
```

## Claim path pointer document - jwt_vc_json

| Fact | Value |
| --- | --- |
| Title | Passport |
| Credential type | `Passport` |
| Namespace | `Passport` |
| Format | `jwt_vc_json` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": ["credentialSubject", "serialNumber"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["credentialSubject", "firstName"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["credentialSubject", "signature"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["credentialSubject", "personalNumber"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["credentialSubject", "id"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["credentialSubject", "image"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["credentialSubject", "birthDate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["credentialSubject", "lastName"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["credentialSubject", "gender"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["credentialSubject", "expiryDate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["credentialSubject", "nationality"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["credentialSubject", "issuerAuthority"],
      "mandatory": true,
      "limitDisclosure": true
    }
  ]
}
```

## Claim path pointer document - mso_mdoc

| Fact | Value |
| --- | --- |
| Title | Passport |
| Credential type | `org.iso.18013.5.1.passport` |
| Doctype | `org.iso.18013.5.1.passport` |
| Namespace | `org.iso.18013.5.1` |
| Format | `mso_mdoc` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": ["org.iso.18013.5.1", "serialNumber"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "firstName"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "signature"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "personalNumber"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "id"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "image"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "birthDate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "lastName"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "gender"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "expiryDate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "nationality"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "issuerAuthority"],
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
  array. The three formats point at the same claims with three different
  prefixes:
  - `dc+sd-jwt` uses the bare claim name, so each path holds one element.
  - `jwt_vc_json` starts every path with `credentialSubject`.
  - `mso_mdoc` starts every path with the mDoc namespace `org.iso.18013.5.1`.
    That namespace is not the doctype `org.iso.18013.5.1.passport`. Every path
    of the configuration must start with the same namespace element.
- `mandatory` says if the claim must hold a value when you issue. The issuer
  reads a missing `mandatory` as `true`. Every claim of this schema is
  mandatory. Remove the claims that you do not issue from your credential
  definition.
- `limitDisclosure` says if the holder can disclose the claim on its own. Every
  document of this template sets it to `true`, so the holder can show the
  nationality and keep the personal number hidden. The field takes effect for
  `dc+sd-jwt` and `mso_mdoc`. The `jwt_vc_json` document also carries the field,
  but `jwt_vc_json` has no selective disclosure.

The `dc+sd-jwt` document holds 11 claims. The `jwt_vc_json` and `mso_mdoc`
documents hold 12: they add `id`, the identifier of the credential subject.

`serialNumber` is the passport number. `personalNumber` is the national number
of the holder. `issuerAuthority` names the authority that issued the passport.
`image` holds the portrait, and `signature` holds the image of the handwritten
signature.

## Use with the iGrant.io API
Create a credential definition with:

`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`

Put one entry in `credentialDefinitions[]` for each format that you publish, and
copy the `claims` array of the matching schema document into that entry.

- Set `version` to `version_01` at the top level of the request.
- For `dc+sd-jwt`: set `vct` to `Passport`, put the array in `claims.claims`,
  and set `validationPath` to `$`.
- For `jwt_vc_json`: set `type` to an array that holds `Passport`, put the array
  in `credentialDefinition.claims`, and set `validationPath` to `$.vc`.
- For `mso_mdoc`: set `doctype` to `org.iso.18013.5.1.passport`, put the array
  in `claims.claims`, and set `validationPath` to `$`.

```json
{
  "label": "Issue Passport",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "Passport",
      "validationPath": "$",
      "supportRevocation": true,
      "revocationMethod": "status_list",
      "claims": {
        "claims": [
          { "path": ["serialNumber"], "mandatory": true, "limitDisclosure": true },
          { "path": ["nationality"], "mandatory": true, "limitDisclosure": true }
        ]
      }
    },
    {
      "credentialFormat": "mso_mdoc",
      "doctype": "org.iso.18013.5.1.passport",
      "validationPath": "$",
      "claims": {
        "claims": [
          {
            "path": ["org.iso.18013.5.1", "serialNumber"],
            "mandatory": true,
            "limitDisclosure": true
          },
          {
            "path": ["org.iso.18013.5.1", "nationality"],
            "mandatory": true,
            "limitDisclosure": true
          }
        ]
      }
    }
  ]
}
```

The example shows two claims per entry. Send the full array when you want the
full schema. A passport can be reported lost, so set `supportRevocation` to
`true`.

When you issue, the top key of `claims` for the `mso_mdoc` entry is the
namespace `org.iso.18013.5.1`.

Read `igrantio-api-issuer` for the full operation reference: every request
field, the display options, revocation, and the issue operation that fills these
claims. Read `igrantio-api-verifier` for the DCQL query that asks for passport
claims.

## Source is the registry
This skill mirrors the claim path pointer template in the iGrant.io verifiable
data registry. If this skill and the registry file disagree, **the registry
wins**. Fetch the source before you rely on a claim path:

- Template: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/passport>
- Raw SD-JWT schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/passport/2025.7.1/dc%2Bsd-jwt.schema.json>
- Raw JWT schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/passport/2025.7.1/jwt_vc_json.schema.json>
- Raw mdoc schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/passport/2025.7.1/mso_mdoc.schema.json>

Each schema file has a `.schema.metadata.json` file beside it. A newer version
directory can appear in the registry. Check the directory listing for a version
above 2025.7.1 and use the newest one.
