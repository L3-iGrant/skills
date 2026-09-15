---
name: igrantio-dcql-query-pid-v2
description: 'DCQL query template for the Person Identification Data (PID) credential of EU ARF 2.8.0 (vct urn:eudi:pid:1, mDoc doctype eu.europa.ec.eudi.pid.1) from the iGrant.io verifiable data registry. Holds the claim list for dc+sd-jwt and mso_mdoc, with the name, birth name, place of birth, address parts, document number, issuing data, nationalities, portrait and trust anchor. Use this skill when you build an OpenID4VP presentation definition against the ARF 2.8.0 PID rule book, or when you need the exact claim path of a PID attribute.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, PID, Person Identification Data, EU ARF 2.8.0, urn:eudi:pid:1, eu.europa.ec.eudi.pid.1, place_of_birth, nationalities, personal_administrative_number, presentation definition, OpenID4VP, mso_mdoc, SD-JWT VC, EUDIW, eIDAS2
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/pidV2
  registry-version: 2026.4.1
  requires-skills: igrantio-api-verifier
---

# DCQL query: PID (EU ARF 2.8.0)

## When to use
Use this skill when you ask a wallet for **identity data under EU ARF 2.8.0**.
This is the second PID rule book. It carries more attributes than the earlier
PID, and it uses a shorter vct, `urn:eudi:pid:1`.

The credential holds:

- The name now and the name at birth: `family_name`, `given_name`,
  `birth_family_name`, `birth_given_name`.
- The birth data: `birthdate` and the `place_of_birth` object.
- The address, as one object with eight members.
- The document data: `document_number`, `personal_administrative_number`,
  `date_of_issuance`, `date_of_expiry`, `issuing_authority`,
  `issuing_country`, `issuing_jurisdiction`.
- The person data: `nationalities`, `sex`, `picture`, `email`,
  `phone_number`.
- Two policy claims: `attestation_legal_category` and `trust_anchor`.

This version holds **no age-over claims**. The earlier PID template holds
`is_over_18`, `is_over_21` and `is_over_65`. If you need a plain age check
without a birth date, read `igrantio-dcql-query-pid`, or ask for a dedicated
age verification attestation.

Ask only for the claims that your use case needs.

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
| Title | Person Identification Data (PID) (EU ARF 2.8.0) |
| Purpose | Person Identification Data (PID) (EU ARF 2.8.0) |
| Registry version | 2026.4.1 |
| Formats | `dc+sd-jwt`, `mso_mdoc` |
| `dc+sd-jwt` vct | `urn:eudi:pid:1` |
| `mso_mdoc` doctype | `eu.europa.ec.eudi.pid.1` |
| `mso_mdoc` namespace | `eu.europa.ec.eudi.pid.1` |

The registry gives no `jwt_vc_json` file for this template. Use `dc+sd-jwt`
or `mso_mdoc`.

## Claims

### Format `dc+sd-jwt`
The registry file is `2026.4.1/dc+sd-jwt.schema.json`.

```json
{
  "claims": [
    { "path": ["address"] },
    { "path": ["address", "country"] },
    { "path": ["address", "formatted"] },
    { "path": ["address", "house_number"] },
    { "path": ["address", "locality"] },
    { "path": ["address", "postal_code"] },
    { "path": ["address", "region"] },
    { "path": ["address", "street_address"] },
    { "path": ["attestation_legal_category"] },
    { "path": ["birth_family_name"] },
    { "path": ["birth_given_name"] },
    { "path": ["birthdate"] },
    { "path": ["date_of_expiry"] },
    { "path": ["date_of_issuance"] },
    { "path": ["document_number"] },
    { "path": ["email"] },
    { "path": ["family_name"] },
    { "path": ["given_name"] },
    { "path": ["issuing_authority"] },
    { "path": ["issuing_country"] },
    { "path": ["issuing_jurisdiction"] },
    { "path": ["nationalities"] },
    { "path": ["personal_administrative_number"] },
    { "path": ["phone_number"] },
    { "path": ["picture"] },
    { "path": ["place_of_birth"] },
    { "path": ["place_of_birth", "country"] },
    { "path": ["place_of_birth", "locality"] },
    { "path": ["place_of_birth", "region"] },
    { "path": ["sex"] },
    { "path": ["trust_anchor"] }
  ]
}
```

### Format `mso_mdoc`
The registry file is `2026.4.1/mso_mdoc.schema.v1.json`. This is the form for
`version_01`.

```json
{
  "claims": [
    { "path": ["eu.europa.ec.eudi.pid.1", "attestation_legal_category"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "birth_date"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "document_number"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "email_address"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "expiry_date"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "family_name"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "family_name_birth"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "given_name"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "given_name_birth"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "issuance_date"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "issuing_authority"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "issuing_country"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "issuing_jurisdiction"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "mobile_phone_number"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "nationality"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "personal_administrative_number"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "place_of_birth"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "portrait"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_address"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_city"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_country"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_house_number"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_postal_code"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_state"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_street"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "sex"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "trust_anchor"] }
  ]
}
```

The two formats do not use the same names. Read the table before you write a
query:

| Meaning | `dc+sd-jwt` | `mso_mdoc` |
| --- | --- | --- |
| Date of birth | `birthdate` | `birth_date` |
| Family name at birth | `birth_family_name` | `family_name_birth` |
| Given name at birth | `birth_given_name` | `given_name_birth` |
| Date of issue | `date_of_issuance` | `issuance_date` |
| Date of expiry | `date_of_expiry` | `expiry_date` |
| E-mail | `email` | `email_address` |
| Telephone | `phone_number` | `mobile_phone_number` |
| Nationality | `nationalities` | `nationality` |
| Portrait | `picture` | `portrait` |
| Street | `["address", "street_address"]` | `resident_street` |
| City | `["address", "locality"]` | `resident_city` |
| Postal code | `["address", "postal_code"]` | `resident_postal_code` |
| Country | `["address", "country"]` | `resident_country` |

The registry gives no older `namespace` and `claim_name` file for this
template. The `path` form is the only mDoc form here.

## How to read the `path` arrays
- For `dc+sd-jwt`, the path walks the JSON payload of the credential. One
  element names a top-level claim. `["address"]` asks for the whole address
  object, and `["address", "postal_code"]` asks for the postal code only.
  `place_of_birth` works the same way.
- For `mso_mdoc`, **the first element is the namespace and the second element
  is the data element identifier**. Here the namespace is
  `eu.europa.ec.eudi.pid.1`, and it carries the same text as the doctype. An
  mDoc path always holds exactly two elements. An mDoc has no nesting, so the
  address parts are separate flat data elements.

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
  "label": "Confirm name and country",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "pid-v2",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["urn:eudi:pid:1"] },
        "claims": [
          { "path": ["family_name"] },
          { "path": ["given_name"] },
          { "path": ["address", "country"] }
        ]
      }
    ]
  }
}
```

`mso_mdoc` takes `doctype_value` only:

```json
{
  "id": "pid-v2",
  "format": "mso_mdoc",
  "meta": { "doctype_value": "eu.europa.ec.eudi.pid.1" },
  "claims": [
    { "path": ["eu.europa.ec.eudi.pid.1", "family_name"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "given_name"] },
    { "path": ["eu.europa.ec.eudi.pid.1", "resident_country"] }
  ]
}
```

The mDoc doctype is the same for this template and for the earlier PID
template. Only the claim list tells the two apart. Check the claim names
against the table above when the wallet returns nothing.

To accept both PID versions in one request, put two entries in
`credentials`, one for each vct, and join them with a `credential_sets`
option that lists the two identifiers.

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

- Directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/pidV2>
- Raw file, for example:
  `https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/pidV2/2026.4.1/dc+sd-jwt.schema.json`

A newer version directory can appear next to `2026.4.1`. Always take the
latest one.
