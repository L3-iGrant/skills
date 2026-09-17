---
name: igrantio-dcql-query-student-id
description: 'DCQL query template for the Student ID credential from the iGrant.io verifiable data registry. Holds the claim list for three formats: dc+sd-jwt (vct VerifiableStudentID), jwt_vc_json (type VerifiableStudentIDJWT) and mso_mdoc (doctype eu.europa.ec.eudi.studentid.1). Carries the SCHAC and eduPerson attributes, for example schacHomeOrganization, eduPersonPrincipalName, eduPersonAffiliation and eduPersonScopedAffiliation. Use this skill when you build an OpenID4VP presentation definition that proves student status for a discount, a campus service or a library account.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, Student ID, VerifiableStudentID, eu.europa.ec.eudi.studentid.1, eduPerson, SCHAC, schacHomeOrganization, eduPersonScopedAffiliation, student status, presentation definition, OpenID4VP, mso_mdoc, SD-JWT VC, jwt_vc_json, EUDIW
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/studentId
  registry-version: 2025.7.1
  requires-skills: igrantio-api-verifier
---

# DCQL query: Student ID

## When to use
Use this skill when you ask a wallet to **prove student status**. Typical
cases are a student discount, access to a campus service, a library account
or a transport pass.

The claim list comes from two schemas of the education sector:

- **SCHAC** attributes name the home organisation and the unique codes of the
  student: `schacHomeOrganization`, `schacPersonalUniqueCode`,
  `schacPersonalUniqueID`.
- **eduPerson** attributes name the role of the person:
  `eduPersonPrincipalName`, `eduPersonPrimaryAffiliation`,
  `eduPersonAffiliation`, `eduPersonScopedAffiliation`, `eduPersonAssurance`.
- The rest are person data: `identifier`, `familyName`, `firstName`,
  `displayName`, `dateOfBirth`, `commonName`, `mail`.

For most discounts, two claims are enough: `eduPersonScopedAffiliation` to
show the role and the school, and `schacHomeOrganization` to show the
institution. Do not ask for the birth date or the mail address when you do
not need them.

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
| Title | Student ID |
| Purpose | Student ID |
| Registry version | 2025.7.1 |
| Formats | `dc+sd-jwt`, `jwt_vc_json`, `mso_mdoc` |
| `dc+sd-jwt` vct | `VerifiableStudentID` |
| `jwt_vc_json` type | `VerifiableStudentIDJWT` |
| `mso_mdoc` doctype | `eu.europa.ec.eudi.studentid.1` |
| `mso_mdoc` namespace | `eu.europa.ec.eudi` |

The credential type is **not** the same in the three formats. The SD-JWT VC
uses `VerifiableStudentID`, the JWT VC uses `VerifiableStudentIDJWT`, and the
mDoc uses `eu.europa.ec.eudi.studentid.1`. Take the value that matches the
format of your query.

Note also that the mDoc namespace is `eu.europa.ec.eudi` and not
`eu.europa.ec.eudi.studentid.1`. The namespace and the doctype are different
here.

## Claims

### Format `dc+sd-jwt`
The registry file is `2025.7.1/dc+sd-jwt.schema.json`.

```json
{
  "claims": [
    { "path": ["identifier"] },
    { "path": ["schacPersonalUniqueCode"] },
    { "path": ["schacPersonalUniqueID"] },
    { "path": ["schacHomeOrganization"] },
    { "path": ["familyName"] },
    { "path": ["firstName"] },
    { "path": ["displayName"] },
    { "path": ["dateOfBirth"] },
    { "path": ["commonName"] },
    { "path": ["mail"] },
    { "path": ["eduPersonPrincipalName"] },
    { "path": ["eduPersonPrimaryAffiliation"] },
    { "path": ["eduPersonAffiliation"] },
    { "path": ["eduPersonScopedAffiliation"] },
    { "path": ["eduPersonAssurance"] }
  ]
}
```

### Format `jwt_vc_json`
The registry file is `2025.7.1/jwt_vc_json.schema.json`.

```json
{
  "claims": [
    { "path": ["credentialSubject", "identifier"] },
    { "path": ["credentialSubject", "schacPersonalUniqueCode"] },
    { "path": ["credentialSubject", "schacPersonalUniqueID"] },
    { "path": ["credentialSubject", "schacHomeOrganization"] },
    { "path": ["credentialSubject", "familyName"] },
    { "path": ["credentialSubject", "firstName"] },
    { "path": ["credentialSubject", "displayName"] },
    { "path": ["credentialSubject", "dateOfBirth"] },
    { "path": ["credentialSubject", "commonName"] },
    { "path": ["credentialSubject", "mail"] },
    { "path": ["credentialSubject", "eduPersonPrincipalName"] },
    { "path": ["credentialSubject", "eduPersonPrimaryAffiliation"] },
    { "path": ["credentialSubject", "eduPersonAffiliation"] },
    { "path": ["credentialSubject", "eduPersonScopedAffiliation"] },
    { "path": ["credentialSubject", "eduPersonAssurance"] }
  ]
}
```

### Format `mso_mdoc`
The registry file is `2025.7.1/mso_mdoc.schema.v1.json`. This is the form for
`version_01`.

```json
{
  "claims": [
    { "path": ["eu.europa.ec.eudi", "identifier"] },
    { "path": ["eu.europa.ec.eudi", "schacPersonalUniqueCode"] },
    { "path": ["eu.europa.ec.eudi", "schacPersonalUniqueID"] },
    { "path": ["eu.europa.ec.eudi", "schacHomeOrganization"] },
    { "path": ["eu.europa.ec.eudi", "familyName"] },
    { "path": ["eu.europa.ec.eudi", "firstName"] },
    { "path": ["eu.europa.ec.eudi", "displayName"] },
    { "path": ["eu.europa.ec.eudi", "dateOfBirth"] },
    { "path": ["eu.europa.ec.eudi", "commonName"] },
    { "path": ["eu.europa.ec.eudi", "mail"] },
    { "path": ["eu.europa.ec.eudi", "eduPersonPrincipalName"] },
    { "path": ["eu.europa.ec.eudi", "eduPersonPrimaryAffiliation"] },
    { "path": ["eu.europa.ec.eudi", "eduPersonAffiliation"] },
    { "path": ["eu.europa.ec.eudi", "eduPersonScopedAffiliation"] },
    { "path": ["eu.europa.ec.eudi", "eduPersonAssurance"] }
  ]
}
```

The registry also holds `2025.7.1/mso_mdoc.schema.json`. That file gives the
same claims in an older shape, with a `namespace` key and a `claim_name` key
instead of a `path` array. Do not send that shape with `version_01`.

The claim names are the same in all three formats. Only the prefix of the
path changes.

## How to read the `path` arrays
- For `dc+sd-jwt`, the path walks the JSON payload of the credential. Every
  claim here is a top-level claim, so every path holds one element.
- For `jwt_vc_json`, the path starts at the root of the credential, so the
  first element is always `credentialSubject`.
- For `mso_mdoc`, **the first element is the namespace and the second element
  is the data element identifier**. Here the namespace is
  `eu.europa.ec.eudi`. An mDoc path always holds exactly two elements.

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
  "label": "Student discount check",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "student-id",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["VerifiableStudentID"] },
        "claims": [
          { "path": ["schacHomeOrganization"] },
          { "path": ["eduPersonScopedAffiliation"] }
        ]
      }
    ]
  }
}
```

`jwt_vc_json` takes `type_values` only. The value is an array of type sets,
so it is an array of arrays:
`{ "type_values": [["VerifiableStudentIDJWT"]] }`.

`mso_mdoc` takes `doctype_value` only:

```json
{
  "id": "student-id",
  "format": "mso_mdoc",
  "meta": { "doctype_value": "eu.europa.ec.eudi.studentid.1" },
  "claims": [
    { "path": ["eu.europa.ec.eudi", "schacHomeOrganization"] },
    { "path": ["eu.europa.ec.eudi", "eduPersonScopedAffiliation"] }
  ]
}
```

To accept a Student ID in more than one format, put one entry per format in
`credentials`, and join them with a `credential_sets` option that lists the
identifiers.

To accept only the students of named institutions, add a `values` array to
the claim. For example, a `values` array on `schacHomeOrganization` limits
the accepted schools.

**Step 2.** Send the request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`. Send the
`presentationDefinitionId` of the record from step 1. Read `vpTokenQrCode`
for the deep link and `presentationExchangeId` for the correlation id.

`label` must hold 3 to 100 characters. The server refuses the labels that
extensions reserve, for example `Age Verification`.

For the full operation reference, the transport fields and the response
shape, read the `igrantio-api-verifier` skill. For a Student ID inside a
larger query with alternatives, read the `igrantio-dcql-student-pass`
workflow skill.

## Source is the registry
This skill mirrors the iGrant.io verifiable data registry. If this skill and
the registry file disagree, **the registry wins**. Check the source before
you rely on a claim path:

- Directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/studentId>
- Raw file, for example:
  `https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/studentId/2025.7.1/dc+sd-jwt.schema.json`

A newer version directory can appear next to `2025.7.1`. Always take the
latest one.
