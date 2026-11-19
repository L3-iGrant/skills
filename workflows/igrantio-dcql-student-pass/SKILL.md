---
name: igrantio-dcql-student-pass
description: 'DCQL pattern: mandatory and optional credential groups in one OpenID4VP verification on the iGrant.io Organisation Wallet Suite. A student transport pass needs a PID (mso_mdoc) and a Student ID or an Enrolment Letter, with an OPTIONAL (required: false) residency group (Utility Bill or Rental Agreement) that unlocks an extra discount. Shows credential_sets with required: false for EUDI Wallet (EUDIW) verifiers under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, credential_sets, optional credentials, required false, student ID, transport pass, PID, OpenID4VP, EUDIW, eIDAS2
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/dcql-2-4-5-student-transport-pass/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: mandatory and optional groups (student transport pass)

## Scenario
A public transport operator sells a student pass at a lower price.
Mandatory: a PID (the identity) AND a proof of student status (a Student ID
card OR an Enrolment Letter). Optional (`required: false`): a proof of local
residency (a Utility Bill OR a Rental Agreement) for an extra discount. The
wallet presents it only when the holder has it and agrees to share it.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- A **signing key** with an X.509 certificate chain in Key Management (see
  `igrantio-api-key-management`). The example signs the request with it.

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
3. **Adjust** - which parts of the query change for you: `vct_values` or
   doctype, claim paths, the optional group?
4. **Signing key** - which key of Key Management signs the request? _It must
   have an X.509 certificate chain. The wallet can then check your access
   certificate._
5. **Channel** - cross-device QR, same-device Digital Credentials API, or
   both? _Recommend QR first; `igrantio-dcapi-android` and
   `igrantio-dcapi-ios` cover the DC API._
6. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## The DCQL query
The presentation definition below holds the DCQL query in `dcqlQuery`. The
key signs the request (client identifier prefix `x509_hash`, the default for
an `x509` key). Each claim `id` is unique in the whole query.

```json
{
  "label": "Example student transport pass",
  "version": "version_01",
  "cryptographicKeyFormat": "x509",
  "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "pid",
        "format": "mso_mdoc",
        "meta": { "doctype_value": "eu.europa.ec.eudi.pid.1" },
        "claims": [
          { "id": "given_name", "path": ["eu.europa.ec.eudi.pid.1", "given_name"] },
          { "id": "dob", "path": ["eu.europa.ec.eudi.pid.1", "birth_date"] }
        ],
        "claim_sets": [["given_name"], ["dob"]]
      },
      {
        "id": "student_id_card",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["VerifiableStudentID"] },
        "claims": [
          { "id": "student_id", "path": ["schacPersonalUniqueID"] },
          { "id": "university_org_name", "path": ["schacHomeOrganization"] }
        ],
        "claim_sets": [["university_org_name", "student_id"]]
      },
      {
        "id": "enrolment_letter",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["EnrolmentLetter"] },
        "claims": [
          { "id": "status", "path": ["statusActive"] },
          { "id": "university_name", "path": ["universityName"] }
        ],
        "claim_sets": [["university_name", "status"]]
      },
      {
        "id": "utility_bill_doc",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["UtilityBill"] },
        "claims": [{ "id": "address", "path": ["address"] }]
      },
      {
        "id": "rental_agreement_doc",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["RentalAgreement"] },
        "claims": [{ "id": "full_address", "path": ["address"] }]
      }
    ],
    "credential_sets": [
      { "options": [["pid"]], "required": true },
      { "options": [["student_id_card"], ["enrolment_letter"]], "required": true },
      { "options": [["utility_bill_doc"], ["rental_agreement_doc"]], "required": false }
    ]
  }
}
```

## Run it on OWS
1. **Create the presentation definition** - `POST
   /v4/config/ows/verifier/presentation-definitions` with the body above.
   Keep `presentationDefinition.presentationDefinitionId` of the answer.
   The `label` is unique in the organisation: a second create with the same
   label gets HTTP 400. Change the label, or reuse the
   `presentationDefinitionId` of the first run.
2. **Send the request** - `POST /v4/config/ows/verifier/verifications` with
   `{"presentationDefinitionId": "<presentationDefinitionId>", "requestByReference": true}`.
   Show `verificationHistory.requestUrl` as a QR code, or open it as a deep
   link. Keep `verificationHistory.presentationExchangeId`.
3. **Wait for the answer** - the webhook event
   `ows.verifier.verification.presentation_received` (see
   `igrantio-api-webhooks`), or the status stream (see
   `igrantio-api-verifier`).
4. **Read the result** - `GET
   /v4/config/ows/verifier/verifications/{presentationExchangeId}`. Require
   `verificationHistory.status` `presentation_acked` and `isVerified`
   `true`. The presentation holds 2 OR 3 credentials. The members of the
   `presentationValidity` items name the credential queries that the wallet
   answered. Find out if the optional residency group came back, and set
   the price. Read the claims in `presentation`. `vpToken` holds one text:
   the JSON of the VP Token, with only the claims that the query asks for.

An iGrant.io organisation wallet as holder names the claim set of each
credential in `claimIds` (see `igrantio-api-holder`).

## Adjust for your deployment
- The PID doctype, the Student ID `vct` and their claim paths come from the
  iGrant.io registry (`igrantio-dcql-query-pid-v2`,
  `igrantio-dcql-query-student-id`). `EnrolmentLetter`, `UtilityBill` and
  `RentalAgreement` are example types: set them to the types of your
  issuers.
- An optional group changes an OUTCOME (the discount), never the flow. The
  absence of the group is the normal path.
- Ask only for the claims that the price needs.
- To accept only trusted issuers, add `credentialQueryOptions` with
  `requiresTrustedCredentialSigner` for each query id (see
  `igrantio-api-verifier`). The trust check of the issuer is then at
  `presentationValidity[].<credential query id>.credentialSignerTrustedListCheck`.

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
- `igrantio-api-verifier` - the presentation definition fields, the send
  and the verification history.
- `igrantio-dcql-kyc` - the version of this pattern where all groups are
  mandatory.
- `igrantio-dcql-claim-sets` - fallbacks inside one credential.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-2-4-5-student-transport-pass/>
(the query is explained in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
section 2.4.5). Before implementing, fetch the doc page; if it disagrees with
this skill, the documentation wins - follow it and report the drift so the
skill can be updated.
