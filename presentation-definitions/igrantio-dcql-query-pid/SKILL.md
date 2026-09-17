---
name: igrantio-dcql-query-pid
description: 'DCQL query template for the Person Identification Data (PID) credential (vct urn:eu.europa.ec.eudi:pid:1, mDoc doctype eu.europa.ec.eudi.pid.1) from the iGrant.io verifiable data registry. Holds the claim list for three formats: dc+sd-jwt, jwt_vc_json and mso_mdoc, with the name, birth date, address, contact and age-over claims. Use this skill when you build an OpenID4VP presentation definition that asks an EUDI Wallet for identity data, or when you need the exact PID claim path for an age check or an address check. For the EU ARF 2.8.0 PID, read igrantio-dcql-query-pid-v2.'
license: Apache-2.0
metadata:
  categories: [education, dcql-query]
  provider: iGrant.io
  keywords: DCQL, PID, Person Identification Data, urn:eu.europa.ec.eudi:pid:1, eu.europa.ec.eudi.pid.1, age_over_18, is_over_18, presentation definition, OpenID4VP, mso_mdoc, SD-JWT VC, jwt_vc_json, EUDIW, eIDAS2
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/pid
  registry-version: 2025.7.1
  requires-skills: igrantio-api-verifier
---

# DCQL query: Person Identification Data (PID)

## When to use
Use this skill when you ask a wallet for **identity data**. The PID holds the
name, the birth date, the address, the contact data and the age statements of
the holder. It is the base identity credential of the EUDI Wallet.

Common needs:

- Prove a name: `family_name` and `given_name`.
- Prove an age without a birth date: `is_over_18`, `is_over_21` or
  `is_over_65` for `dc+sd-jwt` and `jwt_vc_json`, and `age_over_18`,
  `age_over_21` or `age_over_65` for `mso_mdoc`.
- Prove a place of residence: the `address` object, or the `resident_*`
  data elements of the mDoc.

Ask only for the claims that your use case needs. An age check needs one
boolean claim, not the birth date.

This template follows the earlier PID rules. For the PID of EU ARF 2.8.0,
read `igrantio-dcql-query-pid-v2`.

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
3. **Format** - `dc+sd-jwt`, `jwt_vc_json` or `mso_mdoc`? _Match the format
   the issuer used._
4. **Claims** - which claims does the use case need? _Ask for the minimum._
5. **Channel** - cross-device QR, same-device Digital Credentials API, or
   both? _Recommend QR first; `igrantio-dcapi-android` and
   `igrantio-dcapi-ios` cover the DC API._
6. **Trusted authorities** - accept any issuer, or only issuers on a trust
   list?
7. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## Registry facts

| Fact | Value |
| --- | --- |
| Title | Person Identification Data (PID) |
| Purpose | Person Identification Data (PID) |
| Registry version | 2025.7.1 |
| Formats | `dc+sd-jwt`, `jwt_vc_json`, `mso_mdoc` |
| `dc+sd-jwt` vct | `urn:eu.europa.ec.eudi:pid:1` |
| `jwt_vc_json` type | `urn:eu.europa.ec.eudi:pid:1` |
| `mso_mdoc` doctype | `eu.europa.ec.eudi.pid.1` |
| `mso_mdoc` namespace | `eu.europa.ec.eudi.pid.1` |

The registry holds two metadata files for the mDoc format. The file for
`version_01`, `mso_mdoc.schema.metadata.v1.json`, gives the credential type
`eu.europa.ec.eudi.pid.1`. Use that value as `doctype_value`. It agrees with
the namespace of the claim paths. The older file gives the URN form, which is
the vct of the SD-JWT VC and not an mDoc doctype.

## Claims

### Format `dc+sd-jwt`
The registry file is `2025.7.1/dc+sd-jwt.schema.json`.

```json
{
  "claims": [
    { "path": ["address"] },
    { "path": ["address", "country"] },
    { "path": ["address", "locality"] },
    { "path": ["address", "region"] },
    { "path": ["address", "street_address"] },
    { "path": ["birthdate"] },
    { "path": ["email"] },
    { "path": ["family_name"] },
    { "path": ["given_name"] },
    { "path": ["is_over_18"] },
    { "path": ["is_over_21"] },
    { "path": ["is_over_65"] },
    { "path": ["phone_number"] }
  ]
}
```

### Format `jwt_vc_json`
The registry file is `2025.7.1/jwt_vc_json.schema.json`.

```json
{
  "claims": [
    { "path": ["credentialSubject", "address"] },
    { "path": ["credentialSubject", "address", "country"] },
    { "path": ["credentialSubject", "address", "locality"] },
    { "path": ["credentialSubject", "address", "region"] },
    { "path": ["credentialSubject", "address", "street_address"] },
    { "path": ["credentialSubject", "birthdate"] },
    { "path": ["credentialSubject", "email"] },
    { "path": ["credentialSubject", "family_name"] },
    { "path": ["credentialSubject", "given_name"] },
    { "path": ["credentialSubject", "is_over_18"] },
    { "path": ["credentialSubject", "is_over_21"] },
    { "path": ["credentialSubject", "is_over_65"] },
    { "path": ["credentialSubject", "phone_number"] }
  ]
}
```

### Format `mso_mdoc`
The registry file is `2025.7.1/mso_mdoc.schema.v1.json`. This is the form for
`version_01`.

```json
{
  "claims": [
    { "path": ["eu.europa.ec.eudi.pid.1", "age_over_18"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "age_over_21"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "age_over_65"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "birth_date"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "email"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "family_name"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "given_name"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "phone_number"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_address"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_city"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_country"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_state"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_street"] }
  ]
}
```

The registry also holds `2025.7.1/mso_mdoc.schema.json`. That file gives the
same claims in an older shape, with a `namespace` key and a `claim_name` key
instead of a `path` array. Do not send that shape with `version_01`.

The claim names are not the same in every format. The SD-JWT VC uses
`birthdate` and `is_over_18`, and holds the address as one nested object. The
mDoc uses `birth_date` and `age_over_18`, and holds each address part as a
separate flat data element.

## How to read the `path` arrays
- For `dc+sd-jwt`, the path walks the JSON payload of the credential. One
  element names a top-level claim. `["address"]` asks for the whole address
  object, and `["address", "locality"]` asks for the city only. Ask for the
  member, not the parent, when you need one part.
- For `jwt_vc_json`, the path starts at the root of the credential, so the
  first element is always `credentialSubject`.
- For `mso_mdoc`, **the first element is the namespace and the second element
  is the data element identifier**. Here the namespace is
  `eu.europa.ec.eudi.pid.1`, and it carries the same text as the doctype. An
  mDoc path always holds exactly two elements. An mDoc has no nesting, so
  there is no way to ask for one part of an address object.

## Use with the iGrant.io API
Store the query as a presentation definition, then send the verification
request.

**Step 1.** Create the presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`.
Put one entry in `dcqlQuery.credentials`. Give it an `id`, the `format`, the
`meta` that the format allows, and the `claims` that you need. Set `version`
to `version_01`.

`dc+sd-jwt` takes `vct_values`:

```json
{
  "label": "Prove age over 18",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "pid",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["urn:eu.europa.ec.eudi:pid:1"] },
        "claims": [
          { "path": ["is_over_18"] }
        ]
      }
    ]
  }
}
```

`mso_mdoc` takes `doctype_value` only:

```json
{
  "id": "pid",
  "format": "mso_mdoc",
  "meta": { "doctype_value": "eu.europa.ec.eudi.pid.1" },
  "claims": [
    { "path": ["eu.europa.ec.eudi.pid.1", "age_over_18"] }
  ]
}
```

`jwt_vc_json` takes `type_values` only. The value is an array of type sets,
so it is an array of arrays:
`{ "type_values": [["urn:eu.europa.ec.eudi:pid:1"]] }`.

**Step 2.** Send the request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`. Send the
`presentationDefinitionId` of the record from step 1. Read `vpTokenQrCode`
for the deep link and `presentationExchangeId` for the correlation id.

`label` must hold 3 to 100 characters. The server refuses the labels that
extensions reserve, for example `Age Verification`. Give an age check a
different label, such as `Prove age over 18`.

For the full operation reference, the transport fields and the response
shape, read the `igrantio-api-verifier` skill.

## Source is the registry
This skill mirrors the iGrant.io verifiable data registry. If this skill and
the registry file disagree, **the registry wins**. Check the source before
you rely on a claim path:

- Directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/pid>
- Raw file, for example:
  `https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/pid/2025.7.1/dc+sd-jwt.schema.json`

A newer version directory can appear next to `2025.7.1`. Always take the
latest one.
