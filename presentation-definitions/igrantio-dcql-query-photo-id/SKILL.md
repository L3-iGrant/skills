---
name: igrantio-dcql-query-photo-id
description: 'DCQL query template for the Photo ID credential (doctype and vct eu.europa.ec.eudi.photoid.1) from the iGrant.io verifiable data registry. Holds the full claim list for three formats: dc+sd-jwt, jwt_vc_json and mso_mdoc. Use this skill when you build an OpenID4VP presentation definition that asks an EUDI Wallet for a Photo ID, when you need the exact claim path of a travel document group (dtc), an ISO 23220 attribute (iso23220), or a photoid attribute, or when you check that your query matches the registry.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, Photo ID, photoid, eu.europa.ec.eudi.photoid.1, ISO 23220, DTC, digital travel credential, presentation definition, OpenID4VP, mso_mdoc, SD-JWT VC, jwt_vc_json, EUDIW, eIDAS2
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/photoId
  registry-version: 2025.7.1
  requires-skills: igrantio-api-verifier
---

# DCQL query: Photo ID

## When to use
Use this skill when you ask a wallet for a **Photo ID**. The credential
carries a portrait, the name and birth data of the holder, the address of
the holder, and the data groups of a digital travel credential.

The claims fall in three groups:

- `dtc` - the data groups of a digital travel credential, plus the document
  security object (`dtc_sod`) and the version.
- `iso23220` - the ISO 23220 identity attributes: names, birth date,
  nationality, portrait, address, issue date and expiry date, and the age
  statements `age_over_18`, `age_in_years` and `age_birth_year`.
- `photoid` - the extra Photo ID attributes: birth place parts, travel
  document number, person id, administrative number and street address.

Ask for the claims that your use case needs. Do not copy the whole list into
a live query. A short list keeps the request lawful and keeps the consent
screen of the wallet readable.

## Registry facts

| Fact | Value |
| --- | --- |
| Title | Photo ID |
| Purpose | Photo ID |
| Registry version | 2025.7.1 |
| Credential type | `eu.europa.ec.eudi.photoid.1` |
| Formats | `dc+sd-jwt`, `jwt_vc_json`, `mso_mdoc` |
| `mso_mdoc` doctype | `eu.europa.ec.eudi.photoid.1` |
| `mso_mdoc` namespace | `eu.europa.ec.eudi` |
| `dc+sd-jwt` vct | `eu.europa.ec.eudi.photoid.1` |
| `jwt_vc_json` type | `eu.europa.ec.eudi.photoid.1` |

## Claims

### Format `dc+sd-jwt`
The registry file is `2025.7.1/dc+sd-jwt.schema.json`.

```json
{
  "claims": [
    { "path": ["dtc", "dg_content_info"] },
    { "path": ["dtc", "dtc_dg1"] },
    { "path": ["dtc", "dtc_dg10"] },
    { "path": ["dtc", "dtc_dg11"] },
    { "path": ["dtc", "dtc_dg12"] },
    { "path": ["dtc", "dtc_dg13"] },
    { "path": ["dtc", "dtc_dg14"] },
    { "path": ["dtc", "dtc_dg15"] },
    { "path": ["dtc", "dtc_dg16"] },
    { "path": ["dtc", "dtc_dg2"] },
    { "path": ["dtc", "dtc_dg3"] },
    { "path": ["dtc", "dtc_dg4"] },
    { "path": ["dtc", "dtc_dg5"] },
    { "path": ["dtc", "dtc_dg6"] },
    { "path": ["dtc", "dtc_dg7"] },
    { "path": ["dtc", "dtc_dg8"] },
    { "path": ["dtc", "dtc_dg9"] },
    { "path": ["dtc", "dtc_sod"] },
    { "path": ["dtc", "dtc_version"] },
    { "path": ["iso23220", "age_birth_year"] },
    { "path": ["iso23220", "age_in_years"] },
    { "path": ["iso23220", "age_over_18"] },
    { "path": ["iso23220", "family_name_latin1"] },
    { "path": ["iso23220", "given_name_latin1"] },
    { "path": ["iso23220", "issue_date"] },
    { "path": ["iso23220", "issuing_authority_unicode"] },
    { "path": ["iso23220", "name_at_birth"] },
    { "path": ["iso23220", "nationality"] },
    { "path": ["iso23220", "birthplace"] },
    { "path": ["iso23220", "given_name_unicode"] },
    { "path": ["iso23220", "family_name_unicode"] },
    { "path": ["iso23220", "birth_date"] },
    { "path": ["iso23220", "sex"] },
    { "path": ["iso23220", "portrait"] },
    { "path": ["iso23220", "portrait_capture_date"] },
    { "path": ["iso23220", "resident_address_unicode"] },
    { "path": ["iso23220", "resident_city_unicode"] },
    { "path": ["iso23220", "resident_postal_code"] },
    { "path": ["iso23220", "issuing_country"] },
    { "path": ["iso23220", "expiry_date"] },
    { "path": ["iso23220", "resident_country"] },
    { "path": ["photoid", "birth_city"] },
    { "path": ["photoid", "birth_country"] },
    { "path": ["photoid", "birth_state"] },
    { "path": ["photoid", "travel_document_number"] },
    { "path": ["photoid", "person_id"] },
    { "path": ["photoid", "administrative_number"] },
    { "path": ["photoid", "resident_street"] },
    { "path": ["photoid", "resident_state"] }
  ]
}
```

### Format `jwt_vc_json`
The registry file is `2025.7.1/jwt_vc_json.schema.json`.

```json
{
  "claims": [
    { "path": ["credentialSubject", "dtc", "dg_content_info"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg1"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg10"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg11"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg12"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg13"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg14"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg15"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg16"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg2"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg3"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg4"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg5"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg6"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg7"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg8"] },
    { "path": ["credentialSubject", "dtc", "dtc_dg9"] },
    { "path": ["credentialSubject", "dtc", "dtc_sod"] },
    { "path": ["credentialSubject", "dtc", "dtc_version"] },
    { "path": ["credentialSubject", "iso23220", "age_birth_year"] },
    { "path": ["credentialSubject", "iso23220", "age_in_years"] },
    { "path": ["credentialSubject", "iso23220", "age_over_18"] },
    { "path": ["credentialSubject", "iso23220", "family_name_latin1"] },
    { "path": ["credentialSubject", "iso23220", "given_name_latin1"] },
    { "path": ["credentialSubject", "iso23220", "issue_date"] },
    { "path": ["credentialSubject", "iso23220", "issuing_authority_unicode"] },
    { "path": ["credentialSubject", "iso23220", "name_at_birth"] },
    { "path": ["credentialSubject", "iso23220", "nationality"] },
    { "path": ["credentialSubject", "iso23220", "birthplace"] },
    { "path": ["credentialSubject", "iso23220", "given_name_unicode"] },
    { "path": ["credentialSubject", "iso23220", "family_name_unicode"] },
    { "path": ["credentialSubject", "iso23220", "birth_date"] },
    { "path": ["credentialSubject", "iso23220", "sex"] },
    { "path": ["credentialSubject", "iso23220", "portrait"] },
    { "path": ["credentialSubject", "iso23220", "portrait_capture_date"] },
    { "path": ["credentialSubject", "iso23220", "resident_address_unicode"] },
    { "path": ["credentialSubject", "iso23220", "resident_city_unicode"] },
    { "path": ["credentialSubject", "iso23220", "resident_postal_code"] },
    { "path": ["credentialSubject", "iso23220", "issuing_country"] },
    { "path": ["credentialSubject", "iso23220", "expiry_date"] },
    { "path": ["credentialSubject", "iso23220", "resident_country"] },
    { "path": ["credentialSubject", "photoid", "birth_city"] },
    { "path": ["credentialSubject", "photoid", "birth_country"] },
    { "path": ["credentialSubject", "photoid", "birth_state"] },
    { "path": ["credentialSubject", "photoid", "travel_document_number"] },
    { "path": ["credentialSubject", "photoid", "person_id"] },
    { "path": ["credentialSubject", "photoid", "administrative_number"] },
    { "path": ["credentialSubject", "photoid", "resident_street"] },
    { "path": ["credentialSubject", "photoid", "resident_state"] }
  ]
}
```

### Format `mso_mdoc`
The registry file is `2025.7.1/mso_mdoc.schema.v1.json`. This is the form for
`version_01`.

```json
{
  "claims": [
    { "path": ["eu.europa.ec.eudi", "dtc"] },
    { "path": ["eu.europa.ec.eudi", "iso23220"] },
    { "path": ["eu.europa.ec.eudi", "photoid"] }
  ]
}
```

The mDoc form asks for three data elements, and each data element holds a
whole group. The wallet gives the full `dtc`, `iso23220` or `photoid`
structure. It cannot hold back one member of a group.

The registry also holds `2025.7.1/mso_mdoc.schema.json`. That file gives the
same three claims in an older shape, with a `namespace` key and a
`claim_name` key instead of a `path` array. Do not send that shape with
`version_01`.

## How to read the `path` arrays
- For `dc+sd-jwt`, the path walks the JSON payload of the credential. One
  element names a top-level claim. Two elements name a member inside a
  top-level object, so `["iso23220", "portrait"]` asks for the `portrait`
  member of the `iso23220` object.
- For `jwt_vc_json`, the path starts at the root of the credential, so the
  first element is always `credentialSubject`.
- For `mso_mdoc`, **the first element is the namespace and the second element
  is the data element identifier**. Here the namespace is
  `eu.europa.ec.eudi` for all three claims. An mDoc path always holds exactly
  two elements.

## Use with the iGrant.io API
Store the query as a presentation definition, then send the verification
request.

**Step 1.** Create the presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`.
Put one entry in `dcqlQuery.credentials`. Give it an `id`, the `format`, the
`meta` that the format allows, and the `claims` that you need. Set `version`
to `version_01`.

`mso_mdoc` takes `doctype_value` only:

```json
{
  "label": "Photo ID check",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "photo-id",
        "format": "mso_mdoc",
        "meta": { "doctype_value": "eu.europa.ec.eudi.photoid.1" },
        "claims": [
          { "path": ["eu.europa.ec.eudi", "iso23220"] }
        ]
      }
    ]
  }
}
```

`dc+sd-jwt` takes `vct_values` instead:

```json
{
  "id": "photo-id",
  "format": "dc+sd-jwt",
  "meta": { "vct_values": ["eu.europa.ec.eudi.photoid.1"] },
  "claims": [
    { "path": ["iso23220", "family_name_unicode"] },
    { "path": ["iso23220", "given_name_unicode"] },
    { "path": ["iso23220", "portrait"] }
  ]
}
```

`jwt_vc_json` takes `type_values` only. The value is an array of type sets,
so it is an array of arrays: `{ "type_values": [["eu.europa.ec.eudi.photoid.1"]] }`.

**Step 2.** Send the request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`. Send the
`presentationDefinitionId` of the record from step 1. Read `vpTokenQrCode`
for the deep link and `presentationExchangeId` for the correlation id.

`label` must hold 3 to 100 characters. The server refuses the labels that
extensions reserve, for example `Age Verification`.

For the full operation reference, the transport fields and the response
shape, read the `igrantio-api-verifier` skill.

## Source is the registry
This skill mirrors the iGrant.io verifiable data registry. If this skill and
the registry file disagree, **the registry wins**. Check the source before
you rely on a claim path:

- Directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/photoId>
- Raw file, for example:
  `https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/photoId/2025.7.1/mso_mdoc.schema.v1.json`

A newer version directory can appear next to `2025.7.1`. Always take the
latest one.
