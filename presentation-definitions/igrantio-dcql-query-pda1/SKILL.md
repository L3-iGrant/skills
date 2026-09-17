---
name: igrantio-dcql-query-pda1
description: 'DCQL query template for the Portable Document A1 (PDA1), the EU social security attestation that says which member state legislation applies to a posted or multi-state worker. It asks a wallet for the six sections of the form, in dc+sd-jwt, jwt_vc_json or mso_mdoc (doctype org.iso.18013.5.1.pda1). Use this skill when you build labour inspection, posted worker checks or cross-border payroll on an EUDI Wallet, and you need the exact credential type and claim paths from the iGrant.io verifiable data registry.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, PDA1, Portable Document A1, PortableDocumentA1, org.iso.18013.5.1.pda1, social security, posted worker, labour inspection, EESSI, dc+sd-jwt, jwt_vc_json, mso_mdoc, OpenID4VP, presentation definition, EUDIW, eIDAS2
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/pda1
  requires-skills: igrantio-api-verifier
---

# DCQL query: Portable Document A1 (PDA1)

## When to use
Use this template when a worker must show which member state social security
legislation applies to them. The Portable Document A1 is the EU form for posted
workers and for people who work in two or more member states. The query follows
the six sections of the paper form:

- **section1** - the person: surname, surname at birth, forenames, birth date,
  place of birth, sex, nationalities, personal identification number, and the
  addresses in the state of residence and the state of stay;
- **section2** - the legislation that applies: the member state, the starting
  date and the ending date;
- **section3** - the reason: posted employed person, posted self-employed
  person, work in two or more states, mariner, flight crew member, civil
  servant, contract staff, an exception, and the description of the exception;
- **section4** - the employer or the self-employed activity: name or business
  name, registered address, and the activity codes;
- **section5** - the workplaces: the names and the addresses;
- **section6** - the institution that filled the form: name, institution
  identifier, address, date, email, office phone number, office fax number, and
  signature.

Typical uses are labour inspection at a site, contractor onboarding, and
cross-border payroll checks.

An inspection often needs section 1 and section 2 only: who the person is, and
which legislation applies during which period. Ask only for the sections that
your check needs.

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

## Template facts
Registry version: **2025.7.1**.

| Fact | Value |
| --- | --- |
| Title | Portable Document A1 (PDA1) |
| Purpose | Portable Document A1 (PDA1) |
| Credential type (`dc+sd-jwt`, `jwt_vc_json`) | `PortableDocumentA1` |
| Credential type (doctype, `mso_mdoc`) | `org.iso.18013.5.1.pda1` |
| Namespace (`mso_mdoc`) | `org.iso.18013.5.1` |
| Formats | `dc+sd-jwt`, `jwt_vc_json`, `mso_mdoc` |

The doctype and the namespace differ for `mso_mdoc`. The doctype names the
document, `org.iso.18013.5.1.pda1`. The namespace groups the data elements,
`org.iso.18013.5.1`.

## Claims

### Format `dc+sd-jwt`

```json
{
  "claims": [
    { "path": ["section1"] },
    { "path": ["section1", "dateBirth"] },
    { "path": ["section1", "forenames"] },
    { "path": ["section1", "nationalities"] },
    { "path": ["section1", "personalIdentificationNumber"] },
    { "path": ["section1", "placeBirth"] },
    { "path": ["section1", "sex"] },
    { "path": ["section1", "stateOfResidenceAddress"] },
    { "path": ["section1", "stateOfStayAddress"] },
    { "path": ["section1", "surname"] },
    { "path": ["section1", "surnameAtBirth"] },
    { "path": ["section2"] },
    { "path": ["section2", "endingDate"] },
    { "path": ["section2", "memberStateWhichLegislationApplies"] },
    { "path": ["section2", "startingDate"] },
    { "path": ["section3"] },
    { "path": ["section3", "civilAndEmployedSelfEmployed"] },
    { "path": ["section3", "civilServant"] },
    { "path": ["section3", "contractStaff"] },
    { "path": ["section3", "employedAndSelfEmployed"] },
    { "path": ["section3", "employedTwoOrMoreStates"] },
    { "path": ["section3", "exception"] },
    { "path": ["section3", "exceptionDescription"] },
    { "path": ["section3", "flightCrewMember"] },
    { "path": ["section3", "mariner"] },
    { "path": ["section3", "postedEmployedPerson"] },
    { "path": ["section3", "postedSelfEmployedPerson"] },
    { "path": ["section3", "selfEmployedTwoOrMoreStates"] },
    { "path": ["section3", "workingInStateUnder21"] },
    { "path": ["section4"] },
    { "path": ["section4", "employerSelfEmployedActivityCodes"] },
    { "path": ["section4", "nameBusinessName"] },
    { "path": ["section4", "registeredAddress"] },
    { "path": ["section5"] },
    { "path": ["section5", "workPlaceAddresses"] },
    { "path": ["section5", "workPlaceNames"] },
    { "path": ["section6"] },
    { "path": ["section6", "address"] },
    { "path": ["section6", "date"] },
    { "path": ["section6", "email"] },
    { "path": ["section6", "institutionID"] },
    { "path": ["section6", "name"] },
    { "path": ["section6", "officeFaxNo"] },
    { "path": ["section6", "officePhoneNo"] },
    { "path": ["section6", "signature"] }
  ]
}
```

### Format `jwt_vc_json`

```json
{
  "claims": [
    { "path": ["credentialSubject", "section1"] },
    { "path": ["credentialSubject", "section1", "dateBirth"] },
    { "path": ["credentialSubject", "section1", "forenames"] },
    { "path": ["credentialSubject", "section1", "nationalities"] },
    { "path": ["credentialSubject", "section1", "personalIdentificationNumber"] },
    { "path": ["credentialSubject", "section1", "placeBirth"] },
    { "path": ["credentialSubject", "section1", "sex"] },
    { "path": ["credentialSubject", "section1", "stateOfResidenceAddress"] },
    { "path": ["credentialSubject", "section1", "stateOfStayAddress"] },
    { "path": ["credentialSubject", "section1", "surname"] },
    { "path": ["credentialSubject", "section1", "surnameAtBirth"] },
    { "path": ["credentialSubject", "section2"] },
    { "path": ["credentialSubject", "section2", "endingDate"] },
    { "path": ["credentialSubject", "section2", "memberStateWhichLegislationApplies"] },
    { "path": ["credentialSubject", "section2", "startingDate"] },
    { "path": ["credentialSubject", "section3"] },
    { "path": ["credentialSubject", "section3", "civilAndEmployedSelfEmployed"] },
    { "path": ["credentialSubject", "section3", "civilServant"] },
    { "path": ["credentialSubject", "section3", "contractStaff"] },
    { "path": ["credentialSubject", "section3", "employedAndSelfEmployed"] },
    { "path": ["credentialSubject", "section3", "employedTwoOrMoreStates"] },
    { "path": ["credentialSubject", "section3", "exception"] },
    { "path": ["credentialSubject", "section3", "exceptionDescription"] },
    { "path": ["credentialSubject", "section3", "flightCrewMember"] },
    { "path": ["credentialSubject", "section3", "mariner"] },
    { "path": ["credentialSubject", "section3", "postedEmployedPerson"] },
    { "path": ["credentialSubject", "section3", "postedSelfEmployedPerson"] },
    { "path": ["credentialSubject", "section3", "selfEmployedTwoOrMoreStates"] },
    { "path": ["credentialSubject", "section3", "workingInStateUnder21"] },
    { "path": ["credentialSubject", "section4"] },
    { "path": ["credentialSubject", "section4", "employerSelfEmployedActivityCodes"] },
    { "path": ["credentialSubject", "section4", "nameBusinessName"] },
    { "path": ["credentialSubject", "section4", "registeredAddress"] },
    { "path": ["credentialSubject", "section5"] },
    { "path": ["credentialSubject", "section5", "workPlaceAddresses"] },
    { "path": ["credentialSubject", "section5", "workPlaceNames"] },
    { "path": ["credentialSubject", "section6"] },
    { "path": ["credentialSubject", "section6", "address"] },
    { "path": ["credentialSubject", "section6", "date"] },
    { "path": ["credentialSubject", "section6", "email"] },
    { "path": ["credentialSubject", "section6", "institutionID"] },
    { "path": ["credentialSubject", "section6", "name"] },
    { "path": ["credentialSubject", "section6", "officeFaxNo"] },
    { "path": ["credentialSubject", "section6", "officePhoneNo"] },
    { "path": ["credentialSubject", "section6", "signature"] }
  ]
}
```

### Format `mso_mdoc`

```json
{
  "claims": [
    { "path": ["org.iso.18013.5.1", "section1"] },
    { "path": ["org.iso.18013.5.1", "section2"] },
    { "path": ["org.iso.18013.5.1", "section3"] },
    { "path": ["org.iso.18013.5.1", "section4"] },
    { "path": ["org.iso.18013.5.1", "section5"] },
    { "path": ["org.iso.18013.5.1", "section6"] }
  ]
}
```

The registry also holds an older `mso_mdoc` file that names each claim with a
`namespace` and a `claim_name` pair. It lists the same six claims. Use the
`path` form above for a `version_01` presentation definition.

## How to read the `path` arrays
The `path` array names one claim, one element per level.

- **`dc+sd-jwt`**: the path starts at the top level of the SD-JWT VC payload.
  `["section2", "startingDate"]` reads the `startingDate` member inside the
  `section2` object. Each section appears twice in the list: once as the whole
  object, and once per member. Ask for the whole section when you want every
  field of it. Ask for single members when you want less.
- **`jwt_vc_json`**: the path starts with `credentialSubject`, because a W3C VC
  keeps the subject claims under that key. Every path is one element longer than
  the `dc+sd-jwt` path for the same claim.
- **`mso_mdoc`**: the path holds exactly two elements. The **first element is the
  namespace**, here `org.iso.18013.5.1`. The second element is the data element
  name. An mdoc has no nesting below the data element, so each section arrives
  as one whole object. You cannot ask for `startingDate` alone in `mso_mdoc`.
  You ask for `section2`, and you get every field of it.

This difference matters for data minimisation. The SD-JWT VC and W3C VC forms
let you ask for single fields. The mdoc form does not.

## Use with the iGrant.io API
Create a presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`. Put the
claims of one format into one entry of `dcqlQuery.credentials[]`. Give the entry
an `id`, set `format`, and set `meta` for that format:

| `format` | `meta` |
| --- | --- |
| `dc+sd-jwt` | `{ "vct_values": ["PortableDocumentA1"] }` |
| `jwt_vc_json` | `{ "type_values": [["PortableDocumentA1"]] }` |
| `mso_mdoc` | `{ "doctype_value": "org.iso.18013.5.1.pda1" }` |

The format gates the `meta` keys. The server refuses `vct_values` on
`jwt_vc_json` and refuses anything but `doctype_value` on `mso_mdoc`.

Set `version` to `version_01`.

```json
{
  "label": "Posted worker check",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "pda1",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["PortableDocumentA1"] },
        "claims": [
          { "path": ["section1", "surname"] },
          { "path": ["section1", "forenames"] },
          { "path": ["section1", "dateBirth"] },
          { "path": ["section2"] }
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

- <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/pda1>
- Raw file: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/pda1/2025.7.1/dc%2Bsd-jwt.schema.json>

Follow the registry and report the drift so this skill can be corrected.
