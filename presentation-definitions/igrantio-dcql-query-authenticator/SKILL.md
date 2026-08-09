---
name: igrantio-dcql-query-authenticator
description: 'DCQL query template for the iGrant.io Authenticator credential (credential type io.igrant.authenticator). It asks a wallet for one claim, email_address, in dc+sd-jwt, jwt_vc_json or mso_mdoc. Use this skill when you build passwordless login with an EUDI Wallet, so a returning user proves the email address that identifies the account, and you need the exact credential type and claim paths from the iGrant.io verifiable data registry.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, authenticator, passwordless login, email_address, io.igrant.authenticator, dc+sd-jwt, jwt_vc_json, mso_mdoc, OpenID4VP, presentation definition, EUDIW, eIDAS2
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/authenticator
  requires-skills: igrantio-api-verifier
---

# DCQL query: iGrant.io Authenticator

## When to use
Use this template for passwordless login. The query asks the wallet for one
claim: the email address that the iGrant.io Authenticator credential holds. Your
service reads that address and signs the person in to the matching account.

The template discloses one claim only. It carries no name, no birth date, and no
document number.

## Template facts
Registry version: **2025.7.1**.

| Fact | Value |
| --- | --- |
| Title | iGrant.io Authenticator |
| Purpose | iGrant.io Authenticator |
| Credential type | `io.igrant.authenticator` for all three formats |
| Namespace (`mso_mdoc`) | `io.igrant.authenticator` |
| Formats | `dc+sd-jwt`, `jwt_vc_json`, `mso_mdoc` |

The credential type carries the same string in all three format files. For
`dc+sd-jwt` it is the `vct`. For `jwt_vc_json` it is the credential type. For
`mso_mdoc` it is the doctype, and also the namespace.

## Claims

### Format `dc+sd-jwt`

```json
{
  "claims": [
    {
      "path": [
        "email_address"
      ]
    }
  ]
}
```

### Format `jwt_vc_json`

```json
{
  "claims": [
    {
      "path": [
        "credentialSubject",
        "email_address"
      ]
    }
  ]
}
```

### Format `mso_mdoc`

The registry file for this format still uses the older `namespace` and
`claim_name` pair:

```json
{
  "claims": [
    {
      "namespace": "io.igrant.authenticator",
      "claim_name": "email_address"
    }
  ]
}
```

A `version_01` presentation definition needs the `path` form. The same claim
reads as `{ "path": ["io.igrant.authenticator", "email_address"] }`.

## How to read the `path` arrays
The `path` array names one claim, one element per level.

- **`dc+sd-jwt`**: the path starts at the top level of the SD-JWT VC payload.
  `["email_address"]` is the top-level `email_address` claim.
- **`jwt_vc_json`**: the path starts with `credentialSubject`, because a W3C VC
  keeps the subject claims under that key.
- **`mso_mdoc`**: the path holds exactly two elements. The **first element is the
  namespace**, here `io.igrant.authenticator`. The second element is the data
  element name.

## Use with the iGrant.io API
Create a presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`. Put the
claims of one format into one entry of `dcqlQuery.credentials[]`. Give the entry
an `id`, set `format`, and set `meta` for that format:

| `format` | `meta` |
| --- | --- |
| `dc+sd-jwt` | `{ "vct_values": ["io.igrant.authenticator"] }` |
| `jwt_vc_json` | `{ "type_values": [["io.igrant.authenticator"]] }` |
| `mso_mdoc` | `{ "doctype_value": "io.igrant.authenticator" }` |

The format gates the `meta` keys. The server refuses `vct_values` on
`jwt_vc_json` and refuses anything but `doctype_value` on `mso_mdoc`.

Set `version` to `version_01`.

```json
{
  "label": "Sign in with your wallet",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "authenticator",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["io.igrant.authenticator"] },
        "claims": [
          { "path": ["email_address"] }
        ]
      }
    ]
  }
}
```

Then send the verification request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`, and pass the
`presentationDefinitionId` of the record that you created. Read the email
address from `presentation` on the verification history record, and open the
session only when `verified` is `true`.

The `igrantio-api-verifier` skill holds the full operation reference: every
field of the presentation definition, every transport option, and the shape of
the verification history record.

## Source is the registry
The iGrant.io verifiable data registry is the source of truth for this
template. If this skill and the registry file disagree, **the registry wins**.
Fetch the source directory before you rely on a claim path:

- <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/authenticator>
- Raw file: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/authenticator/2025.7.1/dc%2Bsd-jwt.schema.json>

Follow the registry and report the drift so this skill can be corrected.
