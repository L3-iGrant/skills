---
name: igrantio-dcql-kyc
description: 'DCQL pattern: KYC request combining two required credential groups in one OpenID4VP verification on the iGrant.io Organisation Wallet Suite - a Photo ID (mso_mdoc) for identity plus proof of address where either a Utility Bill or a Bank Statement (dc+sd-jwt) is acceptable. Know-your-customer onboarding for banks, fintechs, and regulated services with EUDI Wallet (EUDIW) under eIDAS 2.0.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, KYC, know your customer, Photo ID, proof of address, utility bill, bank statement, credential_sets, OpenID4VP, EUDIW, eIDAS2
  version: 2026.07.04
  source-doc: https://docs.igrant.io/docs/dcql-2-4-4-kyc-request-photo-id-address-proof/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: KYC (photo ID + address proof)

## Scenario
KYC onboarding needs BOTH: a Photo ID (identity) AND a proof of address,
where either a Utility Bill or a Bank Statement satisfies the address
requirement. Two required `credential_sets` in one request.

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each.

## The DCQL query
```json
{
  "credentials": [
    {
      "id": "photo_id",
      "format": "mso_mdoc",
      "claims": [
        {
          "path": [
            "family_name"
          ]
        }
      ]
    },
    {
      "id": "utility_bill",
      "format": "dc+sd-jwt",
      "claims": [
        {
          "path": [
            "address"
          ]
        }
      ]
    },
    {
      "id": "bank_statement",
      "format": "dc+sd-jwt",
      "claims": [
        {
          "path": [
            "address"
          ]
        }
      ]
    }
  ],
  "credential_sets": [
    {
      "options": [
        "photo_id"
      ],
      "required": true
    },
    {
      "options": [
        [
          "utility_bill"
        ],
        [
          "bank_statement"
        ]
      ],
      "required": true
    }
  ]
}
```

## Run it on OWS
1. Store as a presentation definition; keep the `presentationDefinitionId`.
2. Send the verification request (v3); QR or DC API.
3. On `presentation_acked` + `verified === true`: the presentation carries
   TWO credentials - map each via `presentationSubmission`, cross-check the
   name on the Photo ID against the address document holder.

## Adjust for your deployment
- Add the identity claims KYC actually needs to `photo_id` (`given_name`,
  `birth_date`, `document_number`, portrait) - the example discloses only
  `family_name`.
- Add `meta` (`doctype_value` / `vct_values`) pinned to your issuers'
  types, and `trusted_authorities` for regulated onboarding.
- Extend the address group's `options` with other accepted evidence
  (rental agreement, bank letter).

## Cross-references
- `igrantio-dcql-student-pass` - the same two-group pattern plus an
  OPTIONAL third group.
- `igrantio-dcql-credential-sets` - single-group alternatives.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-2-4-4-kyc-request-photo-id-address-proof/>
(query detailed in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
§2.4.4). Before implementing, fetch the doc page; if it disagrees with this
skill, the documentation wins - follow it and report the drift so the skill
can be updated.
