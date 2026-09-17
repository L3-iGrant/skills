---
name: igrantio-credential-schema-certificate-of-registration
description: 'Claim path pointer schema for the Certificate Of Registration credential (credential type CertificateOfRegistration, mdoc doctype org.iso.18013.5.1.cor) from the iGrant.io verifiable data registry. It holds 13 claims that attest a company registration: name, orgNumber, legalForm, legalStatus, activity, registrationDate and the registeredAddress object with its six parts. The registry publishes it in all three formats: dc+sd-jwt, jwt_vc_json and mso_mdoc. Use this skill when you create a company registration credential definition on the iGrant.io OpenID4VC API or build a European Business Wallet (EUBW) integration.'
license: Apache-2.0
metadata:
  categories: [credential-schema]
  provider: iGrant.io
  keywords: certificate of registration, company registration, business register, CertificateOfRegistration, org.iso.18013.5.1.cor, orgNumber, registeredAddress, EUBW, European Business Wallet, SD-JWT VC, dc+sd-jwt, jwt_vc_json, mso_mdoc, claim path pointer, credential definition
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/certificateOfRegistration
  schema-version: 2025.7.1
  formats: dc+sd-jwt, jwt_vc_json, mso_mdoc
  requires-skills: igrantio-api-issuer
---

# Certificate Of Registration credential schema

## When to use
Use this skill when you issue or ask for a **Certificate Of Registration**. A
business register issues this credential to attest that a company exists: its
registered name and number, its legal form and status, its business activity,
the date of registration, and its registered address. It is a core credential of
a European Business Wallet (EUBW) integration.

The registry publishes this schema in **all three formats**:

| Format | Metadata flag | Identifier to send |
| --- | --- | --- |
| `dc+sd-jwt` | `isSdJwt: true` | `vct` |
| `jwt_vc_json` | `isJwt: true` | `type` |
| `mso_mdoc` | `isMsoMdoc: true` | `doctype` |

This page describes registry version **2025.7.1**, the latest version of the
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

## Claim path pointer document - dc+sd-jwt

| Fact | Value |
| --- | --- |
| Title | Certificate Of Registration |
| Credential type | `CertificateOfRegistration` |
| Namespace | `org.iso.18013.5.1.cor` |
| Format | `dc+sd-jwt` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": [
        "name"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "legalForm"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "activity"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "registrationDate"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "legalStatus"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "registeredAddress"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "registeredAddress",
        "adminUnitLevel1"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "registeredAddress",
        "fullAddress"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "registeredAddress",
        "locatorDesignator"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "registeredAddress",
        "postCode"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "registeredAddress",
        "postName"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "registeredAddress",
        "thoroughFare"
      ],
      "limitDisclosure": true,
      "mandatory": true
    },
    {
      "path": [
        "orgNumber"
      ],
      "limitDisclosure": true,
      "mandatory": true
    }
  ]
}
```

## Claim path pointer document - jwt_vc_json

| Fact | Value |
| --- | --- |
| Title | Certificate Of Registration |
| Credential type | `CertificateOfRegistration` |
| Namespace | `org.iso.18013.5.1.cor` |
| Format | `jwt_vc_json` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": ["credentialSubject", "name"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "legalForm"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "activity"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "registrationDate"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "legalStatus"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "registeredAddress"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "registeredAddress", "adminUnitLevel1"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "registeredAddress", "fullAddress"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "registeredAddress", "locatorDesignator"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "registeredAddress", "postCode"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "registeredAddress", "postName"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "registeredAddress", "thoroughFare"],
      "mandatory": true
    },
    {
      "path": ["credentialSubject", "orgNumber"],
      "mandatory": true
    }
  ]
}
```

## Claim path pointer document - mso_mdoc

| Fact | Value |
| --- | --- |
| Title | Certificate Of Registration |
| Credential type | `CertificateOfRegistration` |
| Doctype | `org.iso.18013.5.1.cor` |
| Namespace in the metadata | `org.iso.18013.5.1.cor` |
| Namespace in the claim paths | `org.iso.18013.5.1` |
| Format | `mso_mdoc` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": ["org.iso.18013.5.1", "name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "legalForm"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "activity"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "registrationDate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "legalStatus"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "registeredAddress"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "registeredAddress", "adminUnitLevel1"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "registeredAddress", "fullAddress"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "registeredAddress", "locatorDesignator"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "registeredAddress", "postCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "registeredAddress", "postName"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "registeredAddress", "thoroughFare"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "orgNumber"],
      "mandatory": true,
      "limitDisclosure": true
    }
  ]
}
```

The metadata namespace and the namespace in the claim paths are not the same
value. The claim paths use `org.iso.18013.5.1`. Send the paths as the schema
document gives them, because the issuer builds the mdoc from the paths.

## How to read the fields
Each item of the `claims` array is one claim path pointer.

- `path` is an array that selects one claim. Each element is a string for an
  object key, an integer for an array index, or `null` for every element of an
  array. The three formats point at the same claims with three different
  prefixes:
  - `dc+sd-jwt` uses the bare claim name.
  - `jwt_vc_json` starts every path with `credentialSubject`.
  - `mso_mdoc` starts every path with the mDoc namespace `org.iso.18013.5.1`.
    Every path of the configuration must start with the same namespace element.
- `mandatory` says if the claim must hold a value when you issue. The issuer
  reads a missing `mandatory` as `true`. Every claim of this schema is
  mandatory. Remove the claims that you do not issue from your credential
  definition.
- `limitDisclosure` says if the holder can disclose the claim on its own. The
  `dc+sd-jwt` and `mso_mdoc` documents set it to `true` on every claim. The
  `jwt_vc_json` document leaves it out, because `jwt_vc_json` has no selective
  disclosure.

`registeredAddress` appears twice in the pattern of the paths. One pointer
selects the whole address object, and six more pointers select its parts:
`adminUnitLevel1` (the region), `fullAddress`, `locatorDesignator` (the house
number), `postCode`, `postName` (the town) and `thoroughFare` (the street). The
holder can disclose the whole address, or one part of it.

`orgNumber` holds the registration number of the company. `legalForm` holds the
company form. `legalStatus` says if the registration is active. `activity` holds
the business activity.

## Use with the iGrant.io API
Create a credential definition with:

`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`

Put one entry in `credentialDefinitions[]` for each format that you publish, and
copy the `claims` array of the matching schema document into that entry.

- Set `version` to `version_01` at the top level of the request.
- For `dc+sd-jwt`: set `vct` to `CertificateOfRegistration`, put the array in
  `claims.claims`, and set `validationPath` to `$`.
- For `jwt_vc_json`: set `type` to an array that holds
  `CertificateOfRegistration`, put the array in `credentialDefinition.claims`,
  and set `validationPath` to `$.vc`.
- For `mso_mdoc`: set `doctype` to `org.iso.18013.5.1.cor`, put the array in
  `claims.claims`, and set `validationPath` to `$`.

```json
{
  "label": "Issue Certificate Of Registration",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "CertificateOfRegistration",
      "validationPath": "$",
      "supportRevocation": true,
      "revocationMethod": "status_list",
      "claims": {
        "claims": [
          { "path": ["name"], "mandatory": true, "limitDisclosure": true },
          { "path": ["orgNumber"], "mandatory": true, "limitDisclosure": true },
          {
            "path": ["registeredAddress", "postCode"],
            "mandatory": true,
            "limitDisclosure": true
          }
        ]
      }
    }
  ]
}
```

The example shows three claims. Send the full array when you want the full
schema. A company can close, so set `supportRevocation` to `true`.

When you issue, the top key of `claims` for the `mso_mdoc` entry is the
namespace `org.iso.18013.5.1`.

Read `igrantio-api-issuer` for the full operation reference: every request
field, the display options, revocation, and the issue operation that fills these
claims. Read `igrantio-api-verifier` for the DCQL query that asks for the
company number.

## Source is the registry
This skill mirrors the claim path pointer template in the iGrant.io verifiable
data registry. If this skill and the registry file disagree, **the registry
wins**. Fetch the source before you rely on a claim path:

- Template: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/certificateOfRegistration>
- Raw SD-JWT schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/certificateOfRegistration/2025.7.1/dc%2Bsd-jwt.schema.json>
- Raw JWT schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/certificateOfRegistration/2025.7.1/jwt_vc_json.schema.json>
- Raw mdoc schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/certificateOfRegistration/2025.7.1/mso_mdoc.schema.json>

Each schema file has a `.schema.metadata.json` file beside it. A newer version
directory can appear in the registry. Check the directory listing for a version
above 2025.7.1 and use the newest one.
