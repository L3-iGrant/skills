---
name: igrantio-dcql-multiple-statements
description: 'DCQL pattern: request several instances of the SAME credential type in one OpenID4VP verification using multiple: true on the iGrant.io Organisation Wallet Suite - a loan provider collecting six recent BankStatement SD-JWT credentials (period, account number, holder name) in a single flow. Loan applications, income checks, and any multi-instance evidence gathering with EUDI Wallet (EUDIW) under eIDAS 2.0.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, multiple true, bank statements, loan application, credit check, OpenID4VP, EUDIW, EUBW, eIDAS2
  version: 2026.09.01
  source-doc: https://docs.igrant.io/docs/dcql-2-4-6-loan-application-multiple-bank-statements/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: multiple instances of one credential (bank statements)

## Scenario
A loan provider assesses an application and needs six recent
`BankStatement` credentials. `multiple: true` lets the wallet return
several instances of the same credential type in one presentation.

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
      "id": "bank_statement",
      "format": "dc+sd-jwt",
      "multiple": true,
      "meta": {
        "vct_values": [
          "https://credentials.bank.com/bank_statement"
        ]
      },
      "claims": [
        { "id": "statement_period", "path": ["period"] },
        { "id": "account_number", "path": ["account_number"] },
        { "id": "account_holder_name", "path": ["account_holder_name"] }
      ],
      "claim_sets": [
        ["statement_period", "account_number", "account_holder_name"]
      ]
    }
  ]
}
```

## Run it on OWS
1. Store as a presentation definition; send the verification request (v3).
2. On `presentation_acked` + `verified === true`, `vpTokenResponse` /
   `presentation` carry SEVERAL entries for the one query id - iterate all
   of them, do not read only `presentation[0]`.
3. Validate business rules server-side: count received, contiguous
   `period` values, same `account_number` across instances.

## Adjust for your deployment
- `vct_values`: your bank-statement credential VCT.
- DCQL's `multiple` does not fix a COUNT - enforce "six recent months" in
  your verification logic and re-prompt if short.
- Combine with `trusted_authorities` to only accept statements issued by
  regulated banks.

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
- `igrantio-dcql-kyc` - single bank statement as address proof.
- The TS12 e-mandate transaction data (`igrantio-ows-overview`
  api-reference §2.1) often follows this check in a loan flow.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-2-4-6-loan-application-multiple-bank-statements/>
(query detailed in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
§2.4.6). Before implementing, fetch the doc page; if it disagrees with this
skill, the documentation wins - follow it and report the drift so the skill
can be updated.
