---
name: igrantio-credential-schema-pid-v2
description: 'Claim path pointer schema for the Person Identification Data (PID) credential of the EUDI Wallet PID Rulebook (version 1.7), the current core identity attestation of the EUDI Wallet. Holds the registry documents for the dc+sd-jwt (vct urn:eudi:pid:1) and mso_mdoc (doctype eu.europa.ec.eudi.pid.1) formats, with names, birth date, place of birth, nationalities, portrait, issuing authority and country, document data, resident address and trust anchor, and it marks which claims are mandatory. Use this skill when you build a PID credential definition for the iGrant.io OpenID4VC API.'
license: Apache-2.0
metadata:
  categories: [credential-schema]
  provider: iGrant.io
  keywords: PID, Person Identification Data, PID Rulebook, ARF, eIDAS2, urn:eudi:pid:1, place of birth, nationalities, trust anchor, credential schema, claim path pointer, SD-JWT VC, mso_mdoc, EUDIW, verifiable data registry
  version: 2026.11.02
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/pidV2
  schema-version: 2026.4.1
  credential-formats: dc+sd-jwt, mso_mdoc
  requires-skills: igrantio-api-issuer
---

# Person Identification Data (PID Rulebook v1.7) - credential schema

## When to use
Use this skill when you issue or verify a **Person Identification Data (PID)**
credential that follows the **PID Rulebook (version 1.7)** of the EUDI Wallet
ARF. It holds names, birth data, place of birth, nationalities, portrait,
document data and trust anchor.

The registry gives two credential types, one per format: `urn:eudi:pid:1` for
SD-JWT VC (`dc+sd-jwt`), and `eu.europa.ec.eudi.pid.1` for mdoc (`mso_mdoc`).
The `jwt_vc_json` format is not part of this template.

The registry keeps this schema under
`credentialSchemas/claimPathPointer/pidV2`. Version **2026.4.1** is the latest
version directory, and this skill uses it. The registry publishes the schema
in two formats: `dc+sd-jwt` and `mso_mdoc`.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- A **signing key** with an X.509 certificate chain in Key Management (see
  `igrantio-api-key-management`). Each credential configuration names one.

## Ask the integrator first
Ask one question at a time. Wait for the answer. Give the recommended
default with each question. Look up facts in the project (framework,
environment variables, an existing backend) instead of asking for them.
Record the answers before you write code.

1. **Environment** - demo, staging or production? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - do you have the OWS API key for that environment? If not,
   request it from [support@igrant.io](mailto:support@igrant.io) before you
   continue.
3. **Format** - `dc+sd-jwt` or `mso_mdoc`? _Recommend `dc+sd-jwt` unless the
   wallets you serve need mdoc._
4. **Claims** - all claims of the schema, or a subset? _Mandatory claims
   stay._
5. **Issuance mode** - `in_time` (claims known now) or `deferred` (claims
   arrive later)?
6. **Revocation** - status list on? _Recommend on for any credential with a
   lifetime._
7. **Signing key** - which key of Key Management signs the credentials?
   _`x509` is the only key format. The key must be an active key of the
   organisation with a certificate chain. Each credential configuration names
   it._
8. **Trust list** - is your issuer certificate (the trust anchor) registered
   in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   wallets show your credentials as unverified.

## What the claims describe
This schema marks only a part of the claims as mandatory. Read the `mandatory`
field of each pointer before you plan your data source.

**Mandatory claims**: `given_name`, `family_name`, `birthdate` (`birth_date` in
`mso_mdoc`), `place_of_birth`, `nationalities` (`nationality` in `mso_mdoc`),
the picture (`picture` in `dc+sd-jwt`, `portrait` in `mso_mdoc`),
`issuing_authority` and `issuing_country`.

**Optional claims**:

- Birth names: `birth_given_name` and `birth_family_name` in `dc+sd-jwt`;
  `given_name_birth` and `family_name_birth` in `mso_mdoc`.
- Document data: `document_number`, `issuing_jurisdiction`, the issuance date
  (`date_of_issuance` or `issuance_date`), the expiry date (`date_of_expiry` or
  `expiry_date`), `personal_administrative_number`,
  `attestation_legal_category` and `trust_anchor`.
- Person data: `sex`.
- Place of birth members: `country`, `region` and `locality` are each
  optional, but `place_of_birth` must hold at least one of them. The
  `dc+sd-jwt` document lists the members. The `mso_mdoc` document does not
  list them; see "Use with the iGrant.io API".
- Contact: `email` and `phone_number` in `dc+sd-jwt`; `email_address` and
  `mobile_phone_number` in `mso_mdoc`.
- Address: `dc+sd-jwt` nests it under `address`, with `formatted`, `country`,
  `region`, `locality`, `postal_code`, `street_address` and `house_number`.
  `mso_mdoc` uses flat claims: `resident_address`, `resident_country`,
  `resident_state`, `resident_city`, `resident_postal_code` and
  `resident_street`. The house number is part of `resident_street`.

`nationalities` is an array in `dc+sd-jwt`, so its pointer ends with `null` to
cover every entry. In the registry document, an mdoc pointer holds only the
namespace and the data element name, so `nationality` and `place_of_birth` are
each one data element in `mso_mdoc`. A credential definition of the API also
needs a member path of `place_of_birth`; see "Use with the iGrant.io API".

## Claim path pointer documents
Each document below is the file that the registry holds. Copy it without
a change.

### SD-JWT VC (`dc+sd-jwt`)

| Fact | Value |
| --- | --- |
| Title | Person Identification Data (PID Rulebook v1.7) |
| Format | `dc+sd-jwt` |
| `credentialType` | `urn:eudi:pid:1` |
| `vct` to send | `urn:eudi:pid:1` |
| Namespace in the metadata | `urn:eudi` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

```json
{
  "claims": [
    {
      "path": ["address"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "country"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "formatted"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "house_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "locality"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "postal_code"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "region"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["address", "street_address"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["attestation_legal_category"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["birth_family_name"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["birth_given_name"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["birthdate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["date_of_expiry"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["date_of_issuance"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["document_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["email"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["family_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["given_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["issuing_authority"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["issuing_country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["issuing_jurisdiction"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["nationalities", null],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["personal_administrative_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["phone_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["picture"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["place_of_birth"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["place_of_birth", "country"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["place_of_birth", "locality"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["place_of_birth", "region"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["sex"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["trust_anchor"],
      "mandatory": false,
      "limitDisclosure": true
    }
  ]
}
```

### mdoc (`mso_mdoc`)

| Fact | Value |
| --- | --- |
| Title | Person Identification Data (PID Rulebook v1.7) |
| Format | `mso_mdoc` |
| `credentialType` | `eu.europa.ec.eudi.pid.1` |
| `doctype` to send | `eu.europa.ec.eudi.pid.1` |
| Namespace in the metadata | `eu.europa.ec.eudi.pid.1` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

The first element of every path is `eu.europa.ec.eudi.pid.1`, which is also the
doctype.

```json
{
  "claims": [
    {
      "path": ["eu.europa.ec.eudi.pid.1", "attestation_legal_category"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "birth_date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "document_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "email_address"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "expiry_date"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "family_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "family_name_birth"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "given_name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "given_name_birth"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "issuance_date"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "issuing_authority"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "issuing_country"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "issuing_jurisdiction"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "mobile_phone_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "nationality"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "personal_administrative_number"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "place_of_birth"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "portrait"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_address"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_city"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_country"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_postal_code"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_state"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "resident_street"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "sex"],
      "mandatory": false,
      "limitDisclosure": true
    },
    {
      "path": ["eu.europa.ec.eudi.pid.1", "trust_anchor"],
      "mandatory": false,
      "limitDisclosure": true
    }
  ]
}
```

## How to read a claim path pointer
A claim path pointer selects one claim in the credential. Each item of the
`claims` array holds these fields.

- `path` is mandatory and holds at least one element. Read the elements from
  left to right. A string element selects an object key. An integer element
  selects one array index. A `null` element selects every element of an array,
  so `["nationalities", null]` covers each entry of the `nationalities` array.
- `mandatory` says whether the issuer must supply a value for the claim. The
  issuer reads a missing `mandatory` field as `true`.
- `limitDisclosure` says that the holder can disclose the claim on its own. Set
  it only inside the `claims` object of a `dc+sd-jwt` or `mso_mdoc`
  configuration. The `jwt_vc_json` format has no selective disclosure, so its
  documents leave the field out.

A path that names a parent object, such as `["address"]`, and a path that names
a child, such as `["address", "country"]`, can both appear. The parent pointer
lets the holder disclose the full object. The child pointers let the holder
disclose one field at a time.

For `mso_mdoc`, the **first element of the path is the mDoc namespace**, every
path holds at least two elements, and every path of one configuration uses the
same first element.

For `jwt_vc_json`, the first element of the path is always `credentialSubject`.

## Use with the iGrant.io API
Create a credential definition with
`POST /v4/config/ows/issuer/credential-definitions`. Put the
`claims` array of the registry document into the configuration entry, and set
the format fields that the table above gives.

**The PID Rulebook check.** A configuration of a PID type (`vct` in the
`urn:eudi:pid:` namespace, or `doctype` `eu.europa.ec.eudi.pid.1`) must list
each mandatory attribute of PID Rulebook v1.7 and mark it mandatory. Else the
create gets HTTP 400. Keep these claims, each with `mandatory: true`:

| `dc+sd-jwt` | `mso_mdoc` (namespace `eu.europa.ec.eudi.pid.1`) |
| --- | --- |
| `family_name` | `family_name` |
| `given_name` | `given_name` |
| `birthdate` | `birth_date` |
| `place_of_birth` | `place_of_birth` |
| `nationalities` (or `["nationalities", null]`) | `nationality` |
| `picture` | `portrait` |
| `issuing_authority` | `issuing_authority` |
| `issuing_country` | `issuing_country` |

The check has two more rules:

- `place_of_birth` needs one or more of its members `country`, `region` and
  `locality` as claims, each with `mandatory: false`. A mandatory member gets
  HTTP 400. The `dc+sd-jwt` document lists the three members. The `mso_mdoc`
  document lists `place_of_birth` only, so the API refuses it as it is. Add
  one or more member paths to it, for example
  `{"path": ["eu.europa.ec.eudi.pid.1", "place_of_birth", "locality"], "mandatory": false, "limitDisclosure": true}`.
- The `address` of a `dc+sd-jwt` PID and its members stay optional. A
  mandatory address claim gets HTTP 400.

The templates operation
`GET /v4/config/ows/issuer/credential-definition-templates` gives a PID
template that passes the check (`pid`, version `2026.10.1`).

The example lists the mandatory claims and one member of `place_of_birth`, so
it passes the check. Add the optional claims of the registry document that
your PID carries.

```json
{
  "label": "Issue PID Rulebook v1.7",
  "version": "version_01",
  "credentialConfigurations": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "urn:eudi:pid:1",
      "cryptographicKeyFormat": "x509",
      "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
      "credentialCategory": "pid",
      "revocation": { "enabled": true, "method": "status_list", "revokeWhenHolderDeletes": true },
      "claims": {
        "claims": [
          { "path": ["family_name"], "mandatory": true, "limitDisclosure": true },
          { "path": ["given_name"], "mandatory": true, "limitDisclosure": true },
          { "path": ["birthdate"], "mandatory": true, "limitDisclosure": true },
          { "path": ["place_of_birth"], "mandatory": true, "limitDisclosure": true },
          { "path": ["place_of_birth", "country"], "mandatory": false, "limitDisclosure": true },
          { "path": ["nationalities", null], "mandatory": true, "limitDisclosure": true },
          { "path": ["picture"], "mandatory": true, "limitDisclosure": true },
          { "path": ["issuing_authority"], "mandatory": true, "limitDisclosure": true },
          { "path": ["issuing_country"], "mandatory": true, "limitDisclosure": true }
        ]
      }
    }
  ]
}
```

The two formats use different credential type values, so an entry for
`dc+sd-jwt` sends `vct: urn:eudi:pid:1`, and an entry for `mso_mdoc` sends
`doctype: eu.europa.ec.eudi.pid.1`.

`revokeWhenHolderDeletes: true` revokes the PID when the wallet reports that
the holder deleted it. Check this rule with your compliance owner before you
keep it.

Notes on the request.

- `label` has 3 to 100 characters and is unique in the organisation. A second
  create with the same label gets HTTP 400. Before you run the sample again,
  change the label, or reuse the `id` of the first run. The platform reserves
  the labels `Payment User Credential`, `Payment Card Credential`, `Payment
  Account Credential`, `PID Issuance` and `Photo ID Issuance` (in any letter
  case), so pick another label.
- `version` is required. Its only value is `version_01` (OpenID4VCI 1.0), and
  you cannot change it after you create the credential definition.
- Each entry of `credentialConfigurations[]` names its signing key:
  `cryptographicKeyFormat: "x509"` (the only format) and
  `cryptographicKeyIdentifier`, the id of an active key of the organisation
  with an X.509 certificate chain. Upload the chain to the key first
  (`igrantio-api-key-management`). A key at the top level of the request gets
  HTTP 400.
- `validationPath` is optional. The issuer sets `$` for `dc+sd-jwt` and
  `mso_mdoc`, and `$.vc` for `jwt_vc_json`.
- A PID provider sets `credentialCategory` to `pid` in each configuration. The
  certificate of the signing key must then be a PID provider certificate (ETSI
  TS 119 412-6: QcType `id-etsi-qct-pid`). The create call accepts another
  key, and the definition shows that the key does not fit (`signingKeyCheck`
  with the result `does-not-fit`). Request the certificate with the
  certificate preset `pid-provider`.
  `GET /v4/config/ows/issuer/credential-categories` lists the
  categories and their certificate rules.
- Add one entry of `credentialConfigurations[]` for each format that you want
  to publish. You can publish more than one format from one credential
  definition.
- Keep the `credentialConfigurationId` that the answer gives for each entry.
  The issue call, `POST /v4/config/ows/issuer/issuance-history`, gives the
  claims of each configuration in `credentials[]`: one
  `{"credentialConfigurationId", "claims"}` entry for each configuration. One
  call offers every configuration of the definition.
- Add `revocation`, `expirationInDays`, `display` and the other entry fields
  as your use case needs them.

Read `igrantio-api-issuer` for the full operation reference, the other request
fields, and the issue operation that follows.

## Source is the registry
The verifiable data registry is the source of truth. If this skill and the
registry file disagree, **the registry wins**. Fetch the source before you
rely on a claim path, and report the difference so this skill can be
corrected.

- Template directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/pidV2>
- Raw dc+sd-jwt document:
  <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/pidV2/2026.4.1/dc+sd-jwt.schema.json>
- The metadata file sits next to each schema file, with the suffix
  `.schema.metadata.json`. It carries the title, the credential type, the
  doctype and the format flags.

## Cross-references
- `igrantio-api-issuer` - the create credential definition and issue credential
  operations.
- `igrantio-api-verifier` - the DCQL query that asks a holder for a PID
  credential.
- `igrantio-ows-overview` - architecture and glossary.
