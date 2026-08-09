---
name: igrantio-dcql-query-software-statement
description: 'DCQL query template for the Software Statement credential (credential type SoftwareStatement) from the iGrant.io verifiable data registry. The dc+sd-jwt query asks for one claim, client_uri, which names the client that the statement describes. Use this skill when a relying party or a wallet must check the registration of a client application before it trusts it, for example in an open banking or a dynamic client registration flow.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, Software Statement, SoftwareStatement, client_uri, dynamic client registration, open banking, relying party registration, presentation definition, OpenID4VP, SD-JWT VC, EUDIW, eIDAS2
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/softwareStatement
  registry-version: 2025.7.1
  requires-skills: igrantio-api-verifier
---

# DCQL query: Software Statement

## When to use
Use this skill when you ask for a **Software Statement**. A Software
Statement describes a registered client application. A trusted body, for
example a registry of an open banking scheme, issues it. The holder is the
software, not a person.

The query asks for one claim, `client_uri`, which names the client that the
statement covers.

Use this skill when:

- a relying party must show that it is registered before a wallet answers it;
- a service must check the registration of a client application before it
  opens an interface;
- you build a dynamic client registration step that reads the statement from
  a wallet instead of a static file.

## Registry facts

| Fact | Value |
| --- | --- |
| Title | Software Statement |
| Purpose | Software Statement |
| Registry version | 2025.7.1 |
| Formats | `dc+sd-jwt` |
| `dc+sd-jwt` vct | `SoftwareStatement` |

The registry gives no `mso_mdoc` file and no `jwt_vc_json` file for this
template. The Software Statement is an SD-JWT VC only.

## Claims

### Format `dc+sd-jwt`
The registry file is `2025.7.1/dc+sd-jwt.schema.json`.

```json
{
  "claims": [
    { "path": ["client_uri"] }
  ]
}
```

## How to read the `path` arrays
For `dc+sd-jwt`, the path walks the JSON payload of the credential. One
element names a top-level claim, so `["client_uri"]` asks for the
`client_uri` claim of the Software Statement payload. There is no nesting
here.

This template has no `mso_mdoc` file. In an mDoc query the first element of
the path would be the namespace, but that rule does not apply to this
template.

## Use with the iGrant.io API
Store the query as a presentation definition, then send the verification
request.

**Step 1.** Create the presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`.
Put one entry in `dcqlQuery.credentials`. Give it an `id`, the `dc+sd-jwt`
format, the `vct_values` meta and the claim. Set `version` to `version_01`.

```json
{
  "label": "Check client registration",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "software-statement",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["SoftwareStatement"] },
        "claims": [
          { "path": ["client_uri"] }
        ]
      }
    ]
  }
}
```

`dc+sd-jwt` takes `vct_values` or `type_values` in `meta`. It refuses
`doctype_value`, because that key belongs to `mso_mdoc`.

To accept one client only, add a `values` array to the claim. The wallet
then answers only when the `client_uri` matches:

```json
{
  "path": ["client_uri"],
  "values": ["https://client.example.com"]
}
```

To accept the statements of one scheme only, add `trusted_authorities` to the
credential query. Each entry holds a `type`, for example `etsi_tl` for an
ETSI trusted list or `aki` for an authority key identifier, and `values`.
Read `igrantio-dcql-trusted-authority` for that pattern.

**Step 2.** Send the request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`. Send the
`presentationDefinitionId` of the record from step 1. Read `vpTokenQrCode`
for the deep link and `presentationExchangeId` for the correlation id.

`label` must hold 3 to 100 characters. The server refuses the labels that
extensions reserve.

For the full operation reference, the transport fields and the response
shape, read the `igrantio-api-verifier` skill.

## Source is the registry
This skill mirrors the iGrant.io verifiable data registry. If this skill and
the registry file disagree, **the registry wins**. Check the source before
you rely on a claim path:

- Directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/softwareStatement>
- Raw file:
  `https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/softwareStatement/2025.7.1/dc+sd-jwt.schema.json`

A newer version directory can appear next to `2025.7.1`. Always take the
latest one.
