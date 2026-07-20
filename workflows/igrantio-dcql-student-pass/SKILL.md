---
name: igrantio-dcql-student-pass
description: 'DCQL pattern: mandatory plus optional credential groups in one OpenID4VP verification on the iGrant.io Organisation Wallet Suite - a student transport pass requiring PID (mso_mdoc) plus Student ID or Enrolment Letter, with an OPTIONAL (required: false) residency group (Utility Bill or Rental Agreement) unlocking an extra discount. Shows required: false credential_sets for EUDI Wallet (EUDIW) verifiers under eIDAS 2.0.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, credential_sets, optional credentials, required false, student ID, transport pass, PID, OpenID4VP, EUDIW, eIDAS2
  version: 2026.07.03
  source-doc: https://docs.igrant.io/docs/dcql-2-4-5-student-transport-pass/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: mandatory + optional groups (student transport pass)

## Scenario
A transport authority sells a discounted student pass. Mandatory: PID
(identity) AND student status (Student ID card OR Enrolment Letter).
Optional (`required: false`): local-residency proof (Utility Bill OR
Rental Agreement) for an additional discount - the wallet presents it only
if the holder has and consents to it.

## The DCQL query
```json
{
  "credentials": [
    {
      "id": "pid",
      "format": "mso_mdoc",
      "meta": {
        "doctype_value": "urn:eu.europa.ec.eudi:pid:1"
      },
      "claims": [
        { "id": "full_name", "path": ["full_name"] },
        { "id": "dob", "path": ["date_of_birth"] }
      ],
      "claim_sets": [["full_name"], ["dob"]]
    },
    {
      "id": "student_id_card",
      "format": "dc+sd-jwt",
      "meta": { "vct_values": ["student_id"] },
      "claims": [
        { "id": "student_id", "path": ["student_id"] },
        { "id": "university_name", "path": ["university_name"] }
      ],
      "claim_sets": [["university_name", "student_id"]]
    },
    {
      "id": "enrolment_letter",
      "format": "dc+sd-jwt",
      "meta": { "vct_values": ["employment_letter"] },
      "claims": [
        { "id": "status", "path": ["status"] },
        { "id": "university_name", "path": ["university_name"] }
      ],
      "claim_sets": [["university_name", "status"]]
    },
    {
      "id": "utility_bill_doc",
      "format": "dc+sd-jwt",
      "meta": { "vct_values": ["utility_bill_doc"] },
      "claims": [{ "id": "address", "path": ["address"] }]
    },
    {
      "id": "rental_agreement_doc",
      "format": "dc+sd-jwt",
      "meta": { "vct_values": ["rental_agreement_doc"] },
      "claims": [{ "id": "address", "path": ["address"] }]
    }
  ],
  "credential_sets": [
    { "options": ["pid"], "required": true },
    { "options": [["student_id_card"], ["enrolment_letter"]], "required": true },
    { "options": [["utility_bill_doc"], ["rental_agreement_doc"]], "required": false }
  ]
}
```

## Run it on OWS
1. Store as a presentation definition; send the verification request (v3).
2. On `presentation_acked` + `verified === true`, the presentation holds 2
   OR 3 credentials. Branch on whether the optional residency group came
   back (check `presentationSubmission`) and price the pass accordingly.

## Adjust for your deployment
- The example `vct_values` are pilot values (note `employment_letter` for
  the enrolment letter) - pin them to your issuers' real VCTs.
- Optional groups must change an OUTCOME (discount tier), never gate the
  flow; treat absence as the normal path.
- Trim claims to what pricing actually needs.

## Cross-references
- `igrantio-dcql-kyc` - the all-mandatory version of this pattern.
- `igrantio-dcql-claim-sets` - fallbacks within one credential.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-2-4-5-student-transport-pass/>
(query detailed in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
§2.4.5). Before implementing, fetch the doc page; if it disagrees with this
skill, the documentation wins - follow it and report the drift so the skill
can be updated.
