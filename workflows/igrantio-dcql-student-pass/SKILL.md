---
name: igrantio-dcql-student-pass
description: 'DCQL pattern: mandatory plus optional credential groups in one OpenID4VP verification on the iGrant.io Organisation Wallet Suite - a student transport pass requiring PID (mso_mdoc) plus Student ID or Enrolment Letter, with an OPTIONAL (required: false) residency group (Utility Bill or Rental Agreement) unlocking an extra discount. Shows required: false credential_sets for EUDI Wallet (EUDIW) verifiers under eIDAS 2.0.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, credential_sets, optional credentials, required false, student ID, transport pass, PID, OpenID4VP, EUDIW, eIDAS2
  version: 2026.09.01
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
3. **Adjust** - which parts of the query change for you: `vct_values` or
   doctype, claim paths, trust list values?
4. **Channel** - cross-device QR, same-device Digital Credentials API, or
   both? _Recommend QR first; `igrantio-dcapi-android` and
   `igrantio-dcapi-ios` cover the DC API._
5. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

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

## Register your certificate in the trust list
Wallets show your organisation as verified only when your certificate is in
the trust list. Do this before you go live on any environment:

1. Prepare the certificate. An issuer registers its trust anchor (the root
   CA certificate). A relying party registers its Wallet-Relying Party
   Access Certificate (WRPAC). `igrantio-api-key-management` shows how to
   get the CSR and upload the signed chain (`x5c`).
2. Contact [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>.
3. Confirm the verified badge in the wallet after the trust list refreshes.

Until the entry is in place the wallet shows an unverified warning.
`igrantio-trustlist-entries` covers registration from automation.

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
