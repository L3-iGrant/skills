---
name: igrantio-credential-schema-authenticator
description: 'Claim path pointer schema for the iGrant.io Authenticator credential (credential type io.igrant.authenticator) from the iGrant.io verifiable data registry. It holds one claim, email_address, and the registry publishes it in all three formats: dc+sd-jwt, jwt_vc_json and mso_mdoc. Use this skill when you create an authenticator credential definition on the iGrant.io OpenID4VC API, when you build passwordless sign-in with a wallet, or when you need the exact claim path for each of the three credential formats.'
license: Apache-2.0
metadata:
  categories: [credential-schema]
  provider: iGrant.io
  keywords: authenticator, io.igrant.authenticator, passwordless login, email_address, SD-JWT VC, dc+sd-jwt, jwt_vc_json, mso_mdoc, claim path pointer, credential definition, EUDIW, selective disclosure
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/authenticator
  schema-version: 2025.7.1
  formats: dc+sd-jwt, jwt_vc_json, mso_mdoc
  requires-skills: igrantio-api-issuer
---

# iGrant.io Authenticator credential schema

## When to use
Use this skill when you issue or ask for an **iGrant.io Authenticator**
credential. The credential proves control of one email address, and nothing
else. It is the smallest schema in the registry: one claim. iGrant.io uses it
for passwordless sign-in, where the user presents the credential in place of a
password.

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
| Title | iGrant.io Authenticator |
| Credential type | `io.igrant.authenticator` |
| Namespace | `io.igrant.authenticator` |
| Format | `dc+sd-jwt` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": [
        "email_address"
      ],
      "mandatory": true,
      "limitDisclosure": true
    }
  ]
}
```

## Claim path pointer document - jwt_vc_json

| Fact | Value |
| --- | --- |
| Title | iGrant.io Authenticator |
| Credential type | `io.igrant.authenticator` |
| Namespace | `io.igrant.authenticator` |
| Format | `jwt_vc_json` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": [
        "credentialSubject",
        "email_address"
      ],
      "mandatory": true
    }
  ]
}
```

## Claim path pointer document - mso_mdoc

| Fact | Value |
| --- | --- |
| Title | iGrant.io Authenticator |
| Credential type | `io.igrant.authenticator` |
| Doctype | `io.igrant.authenticator` |
| Namespace | `io.igrant.authenticator` |
| Format | `mso_mdoc` |
| Supported version | `version_01` |

```json
{
  "claims": [
    {
      "path": ["io.igrant.authenticator", "email_address"],
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
  array. The three formats point at the same claim with three different
  prefixes:
  - `dc+sd-jwt` uses the bare claim name, so the path holds one element.
  - `jwt_vc_json` starts every path with `credentialSubject`.
  - `mso_mdoc` starts every path with the mDoc namespace. Here the namespace is
    `io.igrant.authenticator`, and it is the same as the doctype. Every path of
    the configuration must start with that same element.
- `mandatory` says if the claim must hold a value when you issue. The issuer
  reads a missing `mandatory` as `true`. The one claim of this schema is
  mandatory in all three formats.
- `limitDisclosure` says if the holder can disclose the claim on its own. The
  `dc+sd-jwt` and `mso_mdoc` documents set it to `true`. The `jwt_vc_json`
  document leaves it out, because `jwt_vc_json` has no selective disclosure.

## Use with the iGrant.io API
Create a credential definition with:

`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`

Put one entry in `credentialDefinitions[]` for each format that you publish, and
copy the `claims` array of the matching schema document into that entry.

- Set `version` to `version_01` at the top level of the request.
- For `dc+sd-jwt`: set `vct` to `io.igrant.authenticator`, put the array in
  `claims.claims`, and set `validationPath` to `$`.
- For `jwt_vc_json`: set `type` to an array that holds
  `io.igrant.authenticator`, put the array in `credentialDefinition.claims`, and
  set `validationPath` to `$.vc`.
- For `mso_mdoc`: set `doctype` to `io.igrant.authenticator`, put the array in
  `claims.claims`, and set `validationPath` to `$`.

```json
{
  "label": "Issue iGrant.io Authenticator",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "io.igrant.authenticator",
      "validationPath": "$",
      "supportRevocation": true,
      "revocationMethod": "status_list",
      "claims": {
        "claims": [
          {
            "path": ["email_address"],
            "mandatory": true,
            "limitDisclosure": true
          }
        ]
      }
    },
    {
      "credentialFormat": "jwt_vc_json",
      "type": ["VerifiableCredential", "io.igrant.authenticator"],
      "validationPath": "$.vc",
      "credentialDefinition": {
        "claims": [
          {
            "path": ["credentialSubject", "email_address"],
            "mandatory": true
          }
        ]
      }
    }
  ]
}
```

A sign-in credential must be revocable, so set `supportRevocation` to `true`.
When you issue, the top key of `claims` for the `mso_mdoc` entry is the
namespace `io.igrant.authenticator`.

Read `igrantio-api-issuer` for the full operation reference: every request
field, the display options, revocation, and the issue operation that fills these
claims. Read `igrantio-api-verifier` for the DCQL query that asks for the email
address at sign-in.

## Source is the registry
This skill mirrors the claim path pointer template in the iGrant.io verifiable
data registry. If this skill and the registry file disagree, **the registry
wins**. Fetch the source before you rely on a claim path:

- Template: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/authenticator>
- Raw SD-JWT schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/authenticator/2025.7.1/dc%2Bsd-jwt.schema.json>
- Raw JWT schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/authenticator/2025.7.1/jwt_vc_json.schema.json>
- Raw mdoc schema: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/authenticator/2025.7.1/mso_mdoc.schema.json>

Each schema file has a `.schema.metadata.json` file beside it. A newer version
directory can appear in the registry. Check the directory listing for a version
above 2025.7.1 and use the newest one.
