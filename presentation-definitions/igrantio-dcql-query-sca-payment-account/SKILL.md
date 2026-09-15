---
name: igrantio-dcql-query-sca-payment-account
description: 'DCQL query template for the Payment Account Credential (TS12) from the iGrant.io verifiable data registry. The dc+sd-jwt query asks for iban, bic and currency, and the vct is the payment_account VCT metadata URL of the issuer. Use this skill when you build a Strong Customer Authentication (SCA) flow under ETSI TS 119 462 (TS12): the presentation definition must set a transactionDataDefinitionType, and the send request must carry the matching transactionData.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, SCA, Strong Customer Authentication, TS12, ETSI TS 119 462, payment account, IBAN, BIC, currency, PSD2, transaction data, presentation definition, OpenID4VP, SD-JWT VC, EUDIW, eIDAS2
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/scaPaymentAccount
  registry-version: 2025.7.1
  requires-skills: igrantio-api-verifier
---

# DCQL query: Payment Account Credential (TS12)

## When to use
Use this skill when you ask a holder for a **payment account**. The Payment
Account Credential is one of the three TS12 credentials of a Strong Customer
Authentication flow. It names the account that pays.

The query asks for three claims:

- `iban` - the international bank account number.
- `bic` - the bank identifier code.
- `currency` - the currency of the account.

The other two TS12 credentials are the Payment Card Credential, in
`igrantio-dcql-query-sca-payment-card`, and the Payment User Credential, in
`igrantio-dcql-query-sca-payment-user`. A payment flow often asks for more
than one of them in a single request.

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
7. **Transaction data** - does the wallet sign over transaction details
   (payment, e-mandate, QES)? _Only when the use case needs it._
8. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## Registry facts

| Fact | Value |
| --- | --- |
| Title | Payment Account Credential (TS12) |
| Purpose | Payment Account Credential (TS12) |
| Registry version | 2025.7.1 |
| Formats | `dc+sd-jwt` |
| `dc+sd-jwt` vct | `{baseUrl}/service/vct-metadata/payment_account` |
| SCA credential | yes (`isScaCredential: true`) |

The registry gives no `mso_mdoc` file and no `jwt_vc_json` file for this
template. The Payment Account Credential is an SD-JWT VC only.

**`{baseUrl}` is a placeholder.** The vct is not a fixed string. It is the
VCT metadata URL of the issuer. Replace `{baseUrl}` with the base URL of the
service that issues the credential, for example
`https://demo-api.igrant.io/service/vct-metadata/payment_account`. Do not
send the literal text `{baseUrl}` in a query.

The metadata flag `isScaCredential: true` tells the platform that this
template belongs to an SCA flow, and that the request needs transaction data.

## Claims

### Format `dc+sd-jwt`
The registry file is `2025.7.1/dc+sd-jwt.schema.json`.

```json
{
  "claims": [
    {
      "path": [
        "iban"
      ]
    },
    {
      "path": [
        "bic"
      ]
    },
    {
      "path": [
        "currency"
      ]
    }
  ]
}
```

## How to read the `path` arrays
For `dc+sd-jwt`, the path walks the JSON payload of the credential. Every
claim here is a top-level claim, so every path holds one element. There is no
nesting.

This template has no `mso_mdoc` file. In an mDoc query the first element of
the path would be the namespace, but that rule does not apply to this
template.

## Use with the iGrant.io API
An SCA query needs one more field than a plain query: the presentation
definition must name a transaction data template.

**Step 1.** Create the presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`.
Set `version` to `version_01`. Set `transactionDataDefinitionType`. Put one
entry in `dcqlQuery.credentials` with the `dc+sd-jwt` format and the
`vct_values` meta.

```json
{
  "label": "Confirm the payment account",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "transactionDataDefinitionType": "payment_data",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "payment-account",
        "format": "dc+sd-jwt",
        "meta": {
          "vct_values": [
            "https://demo-api.igrant.io/service/vct-metadata/payment_account"
          ]
        },
        "claims": [
          { "path": ["iban"] },
          { "path": ["bic"] },
          { "path": ["currency"] }
        ]
      }
    ]
  }
}
```

`dc+sd-jwt` takes `vct_values` or `type_values` in `meta`. It refuses
`doctype_value`, because that key belongs to `mso_mdoc`.

**Pick the transaction data type that matches your action.** The field is
mandatory when the DCQL query asks for an SCA attestation. The API offers
`payment_data`, `payment`, `login_risk_transaction`,
`login_risk_transaction_non_ts12`, `account_access`, `emandate`,
`data_agreement_record`, `data_disclosure_agreement_record` and `qes_data`.
A payment uses a payment type. Read-only access to an account uses
`account_access`. A standing order uses `emandate`. Read the JSON Schema of
each type with
`GET /v2/config/digital-wallet/openid/sdjwt/transaction-data-definitions`
and take the one that fits, because the schema decides which fields the
request must carry.

**Step 2.** Send the request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`. Send the
`presentationDefinitionId`, and send `transactionData` that follows the JSON
Schema of the chosen type. The server answers HTTP 400 when the presentation
definition sets a `transactionDataDefinitionType` and the request carries no
`transactionData`, and also in the opposite case.

**Step 3.** Read `vpTokenQrCode` for the deep link and
`presentationExchangeId` for the correlation id. The finished record holds
`transactionData` and `transactionDataBase64`.

To ask for the account and the payer in one request, put a second entry in
`credentials` for the Payment User Credential, and mark both as needed with a
`credential_sets` option that lists the two identifiers.

`label` must hold 3 to 100 characters. The server refuses the labels that
extensions reserve.

For the full operation reference, the transaction data rules and the response
shape, read the `igrantio-api-verifier` skill.

## Source is the registry
This skill mirrors the iGrant.io verifiable data registry. If this skill and
the registry file disagree, **the registry wins**. Check the source before
you rely on a claim path:

- Directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/scaPaymentAccount>
- Raw file:
  `https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/scaPaymentAccount/2025.7.1/dc+sd-jwt.schema.json`

A newer version directory can appear next to `2025.7.1`. Always take the
latest one.
