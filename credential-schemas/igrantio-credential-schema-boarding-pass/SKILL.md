---
name: igrantio-credential-schema-boarding-pass
description: 'Claim path pointer schema for the Boarding Pass credential (credential type VerifiableFerryBoardingPassCredentialSDJWT, namespace eu.europa.ec.eudi.boardingpass) from the iGrant.io verifiable data registry. It holds the 14 flat travel claims of a ferry or airline boarding pass: departure and arrival date, time and port, passenger name, seat number and type, ticket number, ticket QR and vessel description. Use this skill when you create a boarding pass credential definition on the iGrant.io OpenID4VC API, or when you need the exact claim paths of a travel ticket credential.'
license: Apache-2.0
metadata:
  categories: [credential-schema]
  provider: iGrant.io
  keywords: boarding pass, ferry ticket, travel credential, VerifiableFerryBoardingPassCredentialSDJWT, eu.europa.ec.eudi.boardingpass, SD-JWT VC, dc+sd-jwt, claim path pointer, credential definition, EUDIW, selective disclosure
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/boardingPass
  schema-version: 2025.7.1
  formats: dc+sd-jwt
  requires-skills: igrantio-api-issuer
---

# Boarding Pass credential schema

## When to use
Use this skill when you issue or ask for a **Boarding Pass**. The credential
holds one travel ticket: who travels, on which vessel, from which port, at which
time, and in which seat. The registry models a ferry boarding pass, and the same
claims fit any scheduled trip with a departure port and an arrival port.

The registry publishes this schema in **one format only: `dc+sd-jwt`** (SD-JWT
VC). The metadata sets `isSdJwt` to `true`, and `isJwt` and `isMsoMdoc` to
`false`. There is no JWT form and no mdoc form of this schema in the registry.

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
| Title | Boarding Pass |
| Credential type | `VerifiableFerryBoardingPassCredentialSDJWT` |
| Namespace | `eu.europa.ec.eudi.boardingpass` |
| Format | `dc+sd-jwt` |
| Supported version | `version_01` |

```json
{
    "claims": [
      {
        "path": [
          "arrivalDate"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "arrivalPort"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "arrivalTime"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "departureDate"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "departureTime"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "firstName"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "identifier"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "lastName"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "seatNumber"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "seatType"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "ticketLet"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "ticketNumber"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "ticketQR"
        ],
        "mandatory": true,
        "limitDisclosure": true
      },
      {
        "path": [
          "vesselDescription"
        ],
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
  array. Every path of this schema holds one element, so the claim structure is
  flat: all 14 claims sit at the top level of the credential.
- `mandatory` says if the claim must hold a value when you issue. The issuer
  reads a missing `mandatory` as `true`. Every claim of this schema is
  mandatory, so an issue request must fill all 14 claims. Remove the claims that
  you do not issue from your credential definition.
- `limitDisclosure` says if the holder can disclose the claim on its own. Every
  claim sets it to `true`, so the passenger can show the ticket number at the
  gate and keep the name hidden.

`ticketQR` holds the barcode payload of the paper ticket. `ticketLet` holds the
ticket letter of the booking. `identifier` is the identifier of the booking.

## Use with the iGrant.io API
Create a credential definition with:

`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`

Put one entry in `credentialDefinitions[]` and copy the `claims` array of the
schema document into that entry.

- Set `version` to `version_01` at the top level of the request.
- Set `credentialFormat` to `dc+sd-jwt`.
- Set `vct` to the credential type `VerifiableFerryBoardingPassCredentialSDJWT`.
  The registry also gives the namespace `eu.europa.ec.eudi.boardingpass`. Some
  ecosystem profiles use that namespace as the `vct`. Send the value that your
  verifier expects, because the verifier matches on the `vct`.
- Put the array in `claims.claims`.
- Set `validationPath` to `$`.

```json
{
  "label": "Issue Boarding Pass",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "VerifiableFerryBoardingPassCredentialSDJWT",
      "validationPath": "$",
      "expirationInDays": 1,
      "claims": {
        "claims": [
          { "path": ["ticketNumber"], "mandatory": true, "limitDisclosure": true },
          { "path": ["seatNumber"], "mandatory": true, "limitDisclosure": true }
        ]
      }
    }
  ]
}
```

The example shows two claims. Send the full array when you want the full
schema. A boarding pass is valid for one trip, so set `expirationInDays` to a
short value.

When you issue, send `vct` plus `claims` in the credential object.

Read `igrantio-api-issuer` for the full operation reference: every request
field, the display options, revocation, and the issue operation that fills these
claims.

## Source is the registry
This skill mirrors the claim path pointer template in the iGrant.io verifiable
data registry. If this skill and the registry file disagree, **the registry
wins**. Fetch the source before you rely on a claim path:

- Template: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/boardingPass>
- Raw schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/boardingPass/2025.7.1/dc%2Bsd-jwt.schema.json>
- Raw metadata: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/boardingPass/2025.7.1/dc%2Bsd-jwt.schema.metadata.json>

A newer version directory can appear in the registry. Check the directory
listing for a version above 2025.7.1 and use the newest one.
