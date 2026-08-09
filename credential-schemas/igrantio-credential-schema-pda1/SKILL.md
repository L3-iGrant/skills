---
name: igrantio-credential-schema-pda1
description: 'Claim path pointer schema for the Portable Document A1 (PDA1) credential, the EU social security document that states which member state legislation applies to a worker. Holds the registry documents for the dc+sd-jwt, jwt_vc_json and mso_mdoc formats, with all six PDA1 sections: personal data, applicable legislation, status confirmation, employer or self-employed activity, work places, and the issuing institution. Use this skill when you build a PDA1 credential definition for the iGrant.io OpenID4VC API, or when you need the exact PDA1 claim path.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: PDA1, Portable Document A1, social security, posted worker, EESSI, credential schema, claim path pointer, SD-JWT VC, mso_mdoc, jwt_vc_json, EUDIW, verifiable data registry
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/pda1
  schema-version: 2025.7.1
  credential-formats: dc+sd-jwt, jwt_vc_json, mso_mdoc
  requires-skills: igrantio-api-issuer
---

# Portable Document A1 (PDA1) - credential schema

## When to use
Use this skill when you issue or verify a **Portable Document A1 (PDA1)**
credential. PDA1 is the EU social security document. It states which member
state social security legislation applies to a worker who works in more than one
member state, or who is posted to another member state.

The registry gives the credential type `PortableDocumentA1` and the namespace
`org.iso.18013.5.1.pda1`. The schema supports three formats: SD-JWT VC
(`dc+sd-jwt`), W3C JWT VC (`jwt_vc_json`) and mdoc (`mso_mdoc`).

The registry keeps this schema under
`credentialSchemas/claimPathPointer/pda1`. Version **2025.7.1** is the latest
version directory, and this skill uses it. The registry publishes the schema
in three formats: `dc+sd-jwt`, `jwt_vc_json` and `mso_mdoc`.

## What the claims describe
The PDA1 claims follow the six sections of the paper form. Every claim in this
schema is mandatory.

- **`section1`** - the person. Names (`forenames`, `surname`,
  `surnameAtBirth`), `dateBirth`, `sex`, `nationalities` (an array),
  `personalIdentificationNumber`, `placeBirth` (`countryCode`, `region`,
  `town`), and two addresses: `stateOfResidenceAddress` and
  `stateOfStayAddress`, each with `countryCode`, `postCode`, `streetNo` and
  `town`.
- **`section2`** - the legislation that applies.
  `memberStateWhichLegislationApplies`, `startingDate`, `endingDate`,
  `certificateForDurationActivity`, `determinationProvisional`, and
  `transitionRulesApplyAsEC8832004`.
- **`section3`** - the status that gives the result. Boolean style flags such as
  `postedEmployedPerson`, `postedSelfEmployedPerson`,
  `employedTwoOrMoreStates`, `selfEmployedTwoOrMoreStates`,
  `employedAndSelfEmployed`, `civilServant`, `contractStaff`, `mariner`,
  `flightCrewMember`, `workingInStateUnder21`,
  `civilAndEmployedSelfEmployed`, plus `exception` and `exceptionDescription`.
- **`section4`** - the employer or the self-employed activity. `employee`,
  `selfEmployedActivity`, `nameBusinessName`,
  `employerSelfEmployedActivityCodes` (an array), and `registeredAddress`.
- **`section5`** - the work places. `noFixedAddress`, the `workPlaceNames`
  array (`seqno`, `companyNameVesselName`), and the `workPlaceAddresses` array
  (`seqno` and a nested `address`).
- **`section6`** - the institution that fills the form. `name`,
  `institutionID`, `address`, `date`, `email`, `officePhoneNo`, `officeFaxNo`
  and `signature`.

The `dc+sd-jwt` document also holds a pointer for each section object itself,
for example `["section1"]`. That pointer lets the holder disclose a full
section in one step.

## Claim path pointer documents
Each document below is the file that the registry holds. Copy it without
a change.

### SD-JWT VC (`dc+sd-jwt`)

| Fact | Value |
| --- | --- |
| Title | Portable Document A1 (PDA1) |
| Format | `dc+sd-jwt` |
| `credentialType` | `PortableDocumentA1` |
| `vct` to send | `PortableDocumentA1` |
| Namespace in the metadata | `org.iso.18013.5.1.pda1` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

```json
{
  "claims": [
    {
      "path": [
        "section1"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "dateBirth"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "forenames"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "nationalities",
        null
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "personalIdentificationNumber"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "placeBirth",
        "countryCode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "placeBirth",
        "region"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "placeBirth",
        "town"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "sex"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "stateOfResidenceAddress",
        "countryCode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "stateOfResidenceAddress",
        "postCode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "stateOfResidenceAddress",
        "streetNo"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "stateOfResidenceAddress",
        "town"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "stateOfStayAddress",
        "countryCode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "stateOfStayAddress",
        "postCode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "stateOfStayAddress",
        "streetNo"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "stateOfStayAddress",
        "town"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "surname"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section1",
        "surnameAtBirth"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section2"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section2",
        "certificateForDurationActivity"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section2",
        "determinationProvisional"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section2",
        "endingDate"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section2",
        "memberStateWhichLegislationApplies"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section2",
        "startingDate"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section2",
        "transitionRulesApplyAsEC8832004"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "civilAndEmployedSelfEmployed"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "civilServant"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "contractStaff"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "employedAndSelfEmployed"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "employedTwoOrMoreStates"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "exception"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "exceptionDescription"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "flightCrewMember"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "mariner"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "postedEmployedPerson"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "postedSelfEmployedPerson"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "selfEmployedTwoOrMoreStates"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section3",
        "workingInStateUnder21"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section4"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section4",
        "employee"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section4",
        "employerSelfEmployedActivityCodes",
        null
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section4",
        "nameBusinessName"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section4",
        "registeredAddress",
        "countryCode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section4",
        "registeredAddress",
        "postCode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section4",
        "registeredAddress",
        "streetNo"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section4",
        "registeredAddress",
        "town"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section4",
        "selfEmployedActivity"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section5"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section5",
        "noFixedAddress"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section5",
        "workPlaceAddresses",
        null,
        "address",
        "countryCode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section5",
        "workPlaceAddresses",
        null,
        "address",
        "postCode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section5",
        "workPlaceAddresses",
        null,
        "address",
        "streetNo"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section5",
        "workPlaceAddresses",
        null,
        "address",
        "town"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section5",
        "workPlaceAddresses",
        null,
        "seqno"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section5",
        "workPlaceNames",
        null,
        "companyNameVesselName"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section5",
        "workPlaceNames",
        null,
        "seqno"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6",
        "address",
        "countryCode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6",
        "address",
        "postCode"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6",
        "address",
        "streetNo"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6",
        "address",
        "town"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6",
        "date"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6",
        "email"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6",
        "institutionID"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6",
        "name"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6",
        "officeFaxNo"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6",
        "officePhoneNo"
      ],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": [
        "section6",
        "signature"
      ],
      "mandatory": true,
      "limitDisclosure": true
    }
  ]
}
```

### W3C JWT VC (`jwt_vc_json`)

| Fact | Value |
| --- | --- |
| Title | Portable Document A1 (PDA1) |
| Format | `jwt_vc_json` |
| `credentialType` | `PortableDocumentA1` |
| `type` to send | an array that holds `PortableDocumentA1` |
| Namespace in the metadata | `org.iso.18013.5.1.pda1` |
| `validationPath` | `$.vc` |
| Claim carrier in the request | `credentialDefinition` |

This document has no section-level pointers and no `limitDisclosure` field,
because `jwt_vc_json` has no selective disclosure.

```json
{
  "claims": [
    {
      "path": [
        "credentialSubject",
        "section1",
        "dateBirth"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "forenames"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "nationalities",
        null
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "personalIdentificationNumber"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "placeBirth",
        "countryCode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "placeBirth",
        "region"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "placeBirth",
        "town"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "sex"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "stateOfResidenceAddress",
        "countryCode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "stateOfResidenceAddress",
        "postCode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "stateOfResidenceAddress",
        "streetNo"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "stateOfResidenceAddress",
        "town"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "stateOfStayAddress",
        "countryCode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "stateOfStayAddress",
        "postCode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "stateOfStayAddress",
        "streetNo"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "stateOfStayAddress",
        "town"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "surname"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section1",
        "surnameAtBirth"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section2",
        "certificateForDurationActivity"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section2",
        "determinationProvisional"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section2",
        "endingDate"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section2",
        "memberStateWhichLegislationApplies"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section2",
        "startingDate"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section2",
        "transitionRulesApplyAsEC8832004"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "civilAndEmployedSelfEmployed"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "civilServant"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "contractStaff"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "employedAndSelfEmployed"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "employedTwoOrMoreStates"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "exception"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "exceptionDescription"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "flightCrewMember"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "mariner"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "postedEmployedPerson"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "postedSelfEmployedPerson"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "selfEmployedTwoOrMoreStates"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section3",
        "workingInStateUnder21"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section4",
        "employee"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section4",
        "employerSelfEmployedActivityCodes",
        null
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section4",
        "nameBusinessName"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section4",
        "registeredAddress",
        "countryCode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section4",
        "registeredAddress",
        "postCode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section4",
        "registeredAddress",
        "streetNo"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section4",
        "registeredAddress",
        "town"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section4",
        "selfEmployedActivity"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section5",
        "noFixedAddress"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section5",
        "workPlaceAddresses",
        null,
        "address",
        "countryCode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section5",
        "workPlaceAddresses",
        null,
        "address",
        "postCode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section5",
        "workPlaceAddresses",
        null,
        "address",
        "streetNo"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section5",
        "workPlaceAddresses",
        null,
        "address",
        "town"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section5",
        "workPlaceAddresses",
        null,
        "seqno"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section5",
        "workPlaceNames",
        null,
        "companyNameVesselName"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section5",
        "workPlaceNames",
        null,
        "seqno"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section6",
        "address",
        "countryCode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section6",
        "address",
        "postCode"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section6",
        "address",
        "streetNo"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section6",
        "address",
        "town"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section6",
        "date"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section6",
        "email"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section6",
        "institutionID"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section6",
        "name"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section6",
        "officeFaxNo"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section6",
        "officePhoneNo"
      ],
      "mandatory": true
    },
    {
      "path": [
        "credentialSubject",
        "section6",
        "signature"
      ],
      "mandatory": true
    }
  ]
}
```

### mdoc (`mso_mdoc`)

| Fact | Value |
| --- | --- |
| Title | Portable Document A1 (PDA1) |
| Format | `mso_mdoc` |
| `credentialType` | `PortableDocumentA1` |
| `doctype` to send | `org.iso.18013.5.1.pda1` |
| Namespace in the metadata | `org.iso.18013.5.1.pda1` |
| `validationPath` | `$` |
| Claim carrier in the request | `claims` |

The first element of every path is `org.iso.18013.5.1`. That value is the mDoc
namespace of the claims. It is not the same string as the doctype
`org.iso.18013.5.1.pda1`. Send the doctype in the `doctype` field, and keep
`org.iso.18013.5.1` as the first path element, as the registry has it.

```json
{
  "claims": [
    {
      "path": ["org.iso.18013.5.1", "section1"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "dateBirth"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "forenames"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "nationalities", null],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "personalIdentificationNumber"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "placeBirth", "countryCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "placeBirth", "region"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "placeBirth", "town"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "sex"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "stateOfResidenceAddress", "countryCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "stateOfResidenceAddress", "postCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "stateOfResidenceAddress", "streetNo"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "stateOfResidenceAddress", "town"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "stateOfStayAddress", "countryCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "stateOfStayAddress", "postCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "stateOfStayAddress", "streetNo"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "stateOfStayAddress", "town"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "surname"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section1", "surnameAtBirth"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section2"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section2", "certificateForDurationActivity"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section2", "determinationProvisional"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section2", "endingDate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section2", "memberStateWhichLegislationApplies"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section2", "startingDate"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section2", "transitionRulesApplyAsEC8832004"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "civilAndEmployedSelfEmployed"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "civilServant"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "contractStaff"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "employedAndSelfEmployed"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "employedTwoOrMoreStates"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "exception"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "exceptionDescription"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "flightCrewMember"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "mariner"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "postedEmployedPerson"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "postedSelfEmployedPerson"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "selfEmployedTwoOrMoreStates"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section3", "workingInStateUnder21"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section4"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section4", "employee"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section4", "employerSelfEmployedActivityCodes", null],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section4", "nameBusinessName"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section4", "registeredAddress", "countryCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section4", "registeredAddress", "postCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section4", "registeredAddress", "streetNo"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section4", "registeredAddress", "town"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section4", "selfEmployedActivity"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section5"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section5", "noFixedAddress"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section5", "workPlaceAddresses", null, "address", "countryCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section5", "workPlaceAddresses", null, "address", "postCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section5", "workPlaceAddresses", null, "address", "streetNo"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section5", "workPlaceAddresses", null, "address", "town"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section5", "workPlaceAddresses", null, "seqno"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section5", "workPlaceNames", null, "companyNameVesselName"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section5", "workPlaceNames", null, "seqno"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6", "address", "countryCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6", "address", "postCode"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6", "address", "streetNo"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6", "address", "town"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6", "date"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6", "email"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6", "institutionID"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6", "name"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6", "officeFaxNo"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6", "officePhoneNo"],
      "mandatory": true,
      "limitDisclosure": true
    },
    {
      "path": ["org.iso.18013.5.1", "section6", "signature"],
      "mandatory": true,
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
`POST /v2/config/digital-wallet/openid/sdjwt/credential-definition`. Put the
`claims` array of the registry document into the configuration entry, and set
the format fields that the table above gives.

```json
{
  "label": "Issue Portable Document A1",
  "version": "version_01",
  "credentialDefinitions": [
    {
      "credentialFormat": "dc+sd-jwt",
      "vct": "PortableDocumentA1",
      "validationPath": "$",
      "claims": {
        "claims": [
          {
            "path": [
              "section1"
            ],
            "mandatory": true,
            "limitDisclosure": true
          },
          {
            "path": [
              "section1",
              "dateBirth"
            ],
            "mandatory": true,
            "limitDisclosure": true
          }
        ]
      }
    }
  ]
}
```

Notes on the request.

- `label` must hold at least 3 characters. The platform reserves the labels
  `Payment User Credential`, `Payment Card Credential`, `Payment Account
  Credential`, `PID Issuance` and `Photo ID Issuance`, so pick another label.
- Always send `version` with the value `version_01`. The issuer falls back to an
  earlier version of the specification when you leave the field out, and you
  cannot change the value after you create the credential definition.
- Add one entry of `credentialDefinitions[]` for each format that you want to
  publish. You can publish more than one format from one credential definition.
- Keep the `id` that the response returns for each entry. The issue operation
  uses that value to match the claims to a configuration.
- Add `supportRevocation`, `revocationMethod`, `expirationInDays`, `display` and
  the other entry fields as your use case needs them.

Read `igrantio-api-issuer` for the full operation reference, the other request
fields, and the issue operation that follows.

## Source is the registry
The verifiable data registry is the source of truth. If this skill and the
registry file disagree, **the registry wins**. Fetch the source before you
rely on a claim path, and report the difference so this skill can be
corrected.

- Template directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/credentialSchemas/claimPathPointer/pda1>
- Raw dc+sd-jwt document:
  <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/credentialSchemas/claimPathPointer/pda1/2025.7.1/dc+sd-jwt.schema.json>
- The metadata file sits next to each schema file, with the suffix
  `.schema.metadata.json`. It carries the title, the credential type, the
  doctype and the format flags.

## Cross-references
- `igrantio-api-issuer` - the create credential definition and issue credential
  operations.
- `igrantio-api-verifier` - the DCQL query that asks a holder for a PDA1
  credential.
- `igrantio-ows-overview` - architecture and glossary.
