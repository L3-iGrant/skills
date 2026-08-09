---
name: igrantio-dcql-query-lpid
description: 'DCQL query template for Legal Person Identification Data (LPID), the identity attestation of a company or other legal person. It asks a wallet for two claims, identifier and legalName, in dc+sd-jwt, jwt_vc_json or mso_mdoc (doctype org.iso.18013.5.1.lpid). Use this skill when a European Business Wallet must prove which legal entity acts, and you need the exact credential type and claim paths from the iGrant.io verifiable data registry.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, LPID, Legal Person Identification Data, LegalPersonIdentificationData, org.iso.18013.5.1.lpid, legalName, company identity, dc+sd-jwt, jwt_vc_json, mso_mdoc, OpenID4VP, presentation definition, EUBW, eIDAS2
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/lpid
  requires-skills: igrantio-api-verifier
---

# DCQL query: Legal Person Identification Data (LPID)

## When to use
Use this template when you must know which legal person acts. LPID is the
company counterpart of a personal identity attestation. The query asks for two
claims only:

- `identifier` - the unique identifier of the legal person, for example the
  registration number in the national business register;
- `legalName` - the registered name.

Typical uses are business account opening, supplier onboarding, business-to-
business sign-in, and any step where a European Business Wallet must name the
entity behind the session.

LPID says who the company is. It carries no registration extract. Use the
Certificate Of Registration template when you also need the legal form, the
status, or the registered address. See
`igrantio-dcql-query-certificate-of-registration`.

## Template facts
Registry version: **2025.7.1**.

| Fact | Value |
| --- | --- |
| Title | Legal Person Identification Data (LPID) |
| Purpose | Legal Person Identification Data (LPID) |
| Credential type (`dc+sd-jwt`, `jwt_vc_json`) | `LegalPersonIdentificationData` |
| Credential type (doctype, `mso_mdoc`) | `org.iso.18013.5.1.lpid` |
| Namespace (`mso_mdoc`) | `org.iso.18013.5.1` |
| Formats | `dc+sd-jwt`, `jwt_vc_json`, `mso_mdoc` |

The doctype and the namespace differ for `mso_mdoc`. The doctype names the
document, `org.iso.18013.5.1.lpid`. The namespace groups the data elements,
`org.iso.18013.5.1`.

## Claims

### Format `dc+sd-jwt`

```json
{
  "claims": [
    {
      "path": [
        "identifier"
      ]
    },
    {
      "path": [
        "legalName"
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
        "identifier"
      ]
    },
    {
      "path": [
        "credentialSubject",
        "legalName"
      ]
    }
  ]
}
```

### Format `mso_mdoc`

```json
{
  "claims": [
    {
      "path": [
        "org.iso.18013.5.1",
        "identifier"
      ]
    },
    {
      "path": [
        "org.iso.18013.5.1",
        "legalName"
      ]
    }
  ]
}
```

The registry also holds an older `mso_mdoc` file that names each claim with a
`namespace` and a `claim_name` pair. It lists the same two claims. Use the
`path` form above for a `version_01` presentation definition.

## How to read the `path` arrays
The `path` array names one claim, one element per level.

- **`dc+sd-jwt`**: the path starts at the top level of the SD-JWT VC payload.
  `["legalName"]` is the top-level `legalName` claim.
- **`jwt_vc_json`**: the path starts with `credentialSubject`, because a W3C VC
  keeps the subject claims under that key.
- **`mso_mdoc`**: the path holds exactly two elements. The **first element is the
  namespace**, here `org.iso.18013.5.1`. The second element is the data element
  name.

## Use with the iGrant.io API
Create a presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`. Put the
claims of one format into one entry of `dcqlQuery.credentials[]`. Give the entry
an `id`, set `format`, and set `meta` for that format:

| `format` | `meta` |
| --- | --- |
| `dc+sd-jwt` | `{ "vct_values": ["LegalPersonIdentificationData"] }` |
| `jwt_vc_json` | `{ "type_values": [["LegalPersonIdentificationData"]] }` |
| `mso_mdoc` | `{ "doctype_value": "org.iso.18013.5.1.lpid" }` |

The format gates the `meta` keys. The server refuses `vct_values` on
`jwt_vc_json` and refuses anything but `doctype_value` on `mso_mdoc`.

Set `version` to `version_01`.

```json
{
  "label": "Identify the legal person",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "lpid",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["LegalPersonIdentificationData"] },
        "claims": [
          { "path": ["identifier"] },
          { "path": ["legalName"] }
        ]
      }
    ]
  }
}
```

Then send the verification request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`, and pass the
`presentationDefinitionId` of the record that you created. Read the disclosed
claims from `presentation` on the verification history record.

The `igrantio-api-verifier` skill holds the full operation reference: every
field of the presentation definition, every transport option, and the shape of
the verification history record.

## Source is the registry
The iGrant.io verifiable data registry is the source of truth for this
template. If this skill and the registry file disagree, **the registry wins**.
Fetch the source directory before you rely on a claim path:

- <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/lpid>
- Raw file: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/lpid/2025.7.1/dc%2Bsd-jwt.schema.json>

Follow the registry and report the drift so this skill can be corrected.
