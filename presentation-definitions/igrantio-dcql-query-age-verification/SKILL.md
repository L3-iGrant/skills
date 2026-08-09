---
name: igrantio-dcql-query-age-verification
description: 'DCQL query template for the EU Age Verification attestation (doctype eu.europa.ec.av.1, mso_mdoc). It asks a wallet for the age threshold flags age_over_14, age_over_16, age_over_18, age_over_21 and age_over_65, and discloses no birth date and no name. Use this skill when you build an age gate for adult content, alcohol, gambling, or any service with a legal age limit, and you need the exact doctype, namespace and claim paths from the iGrant.io verifiable data registry.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, age verification, age_over_18, eu.europa.ec.av.1, mso_mdoc, age gate, data minimisation, OpenID4VP, presentation definition, EUDIW, eIDAS2
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/ageVerification
  requires-skills: igrantio-api-verifier
---

# DCQL query: Age Verification

## When to use
Use this template when your service must know that a person passes an age
threshold, and nothing more. The query asks for five boolean flags. Each flag
answers one question, for example "is this person over 18?". The wallet does not
disclose the birth date, the name, or the document number.

Ask only for the thresholds that your law or your policy needs. One flag is
enough for most age gates. Every extra flag is extra personal data.

## Template facts
Registry version: **2026.4.1**.

| Fact | Value |
| --- | --- |
| Title | Age Verification |
| Purpose | Age Verification |
| Credential type (doctype) | `eu.europa.ec.av.1` |
| Namespace | `eu.europa.ec.av.1` |
| Format | `mso_mdoc` |

The registry holds one format for this template. There is no SD-JWT VC file and
no JWT VC file.

## Claims

### Format `mso_mdoc`

```json
{
  "claims": [
    {
      "path": ["eu.europa.ec.av.1", "age_over_14"]
    },
    {
      "path": ["eu.europa.ec.av.1", "age_over_16"]
    },
    {
      "path": ["eu.europa.ec.av.1", "age_over_18"]
    },
    {
      "path": ["eu.europa.ec.av.1", "age_over_21"]
    },
    {
      "path": ["eu.europa.ec.av.1", "age_over_65"]
    }
  ]
}
```

## How to read the `path` arrays
For `mso_mdoc`, the `path` array holds exactly two elements:

1. the **namespace**, here `eu.europa.ec.av.1`;
2. the **data element name**, here the age flag.

The namespace and the doctype carry the same string in this template. They are
still two different fields. The doctype goes into `meta.doctype_value`. The
namespace goes into the first element of every `path`.

## Use with the iGrant.io API
Create a presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`. Put the
claims into one entry of `dcqlQuery.credentials[]`. Give the entry an `id`, set
`format` to `mso_mdoc`, and set `meta.doctype_value` to the credential type.
`mso_mdoc` allows `doctype_value` only. The server refuses `vct_values` and
`type_values` for this format.

Set `version` to `version_01`.

```json
{
  "label": "Age gate at checkout",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "age-verification",
        "format": "mso_mdoc",
        "meta": { "doctype_value": "eu.europa.ec.av.1" },
        "claims": [
          { "path": ["eu.europa.ec.av.1", "age_over_18"] }
        ]
      }
    ]
  }
}
```

**Do not use the label `Age Verification`.** The server reserves that label for
an extension and refuses it. Give the definition a label that names your use,
for example `Age gate at checkout`.

Then send the verification request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`, and pass the
`presentationDefinitionId` of the record that you created. Read the disclosed
flags from `presentation` on the verification history record.

The `igrantio-api-verifier` skill holds the full operation reference: every
field of the presentation definition, every transport option, and the shape of
the verification history record.

## Source is the registry
The iGrant.io verifiable data registry is the source of truth for this
template. If this skill and the registry file disagree, **the registry wins**.
Fetch the source directory before you rely on a claim path:

- <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/ageVerification>
- Raw file: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/ageVerification/2026.4.1/mso_mdoc.schema.v1.json>

Follow the registry and report the drift so this skill can be corrected.
