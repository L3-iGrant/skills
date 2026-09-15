---
name: igrantio-dcql-kyc
description: 'DCQL pattern: KYC request combining two required credential groups in one OpenID4VP verification on the iGrant.io Organisation Wallet Suite - a Photo ID (mso_mdoc) for identity plus proof of address where either a Utility Bill or a Bank Statement (dc+sd-jwt) is acceptable. Know-your-customer onboarding for banks, fintechs, and regulated services with EUDI Wallet (EUDIW) under eIDAS 2.0.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, KYC, know your customer, Photo ID, proof of address, utility bill, bank statement, credential_sets, OpenID4VP, EUDIW, eIDAS2
  version: 2026.09.01
  source-doc: https://docs.igrant.io/docs/dcql-2-4-4-kyc-request-photo-id-address-proof/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: KYC (photo ID + address proof)

## Scenario
KYC onboarding needs BOTH: a Photo ID (identity) AND a proof of address,
where either a Utility Bill or a Bank Statement satisfies the address
requirement. Two required `credential_sets` in one request.

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
