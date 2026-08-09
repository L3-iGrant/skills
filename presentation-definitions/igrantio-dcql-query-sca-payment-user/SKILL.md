---
name: igrantio-dcql-query-sca-payment-user
description: 'DCQL query template for the Payment User Credential (TS12) from the iGrant.io verifiable data registry. The dc+sd-jwt query holds an empty claims array, so it asks for the whole credential of the payment service user, and the vct is the payment_service_user VCT metadata URL of the issuer. Use this skill when you build a Strong Customer Authentication (SCA) flow under ETSI TS 119 462 (TS12) and the holder must prove who authorises the payment: the presentation definition must set a transactionDataDefinitionType, and the send request must carry the matching transactionData.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, SCA, Strong Customer Authentication, TS12, ETSI TS 119 462, payment service user, PSU, PSD2, whole credential, empty claims, transaction data, presentation definition, OpenID4VP, SD-JWT VC, EUDIW, eIDAS2
  version: 2026.08.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/scaPaymentUser
  registry-version: 2025.7.1
  requires-skills: igrantio-api-verifier
---

# DCQL query: Payment User Credential (TS12)

## When to use
Use this skill when you ask a holder to **prove who authorises a payment**.
The Payment User Credential names the payment service user. It is one of the
three TS12 credentials of a Strong Customer Authentication flow.

This template is different from the other two. Its claims array is **empty**.
An empty claims array asks for the whole credential, so the wallet returns
every claim that the credential holds. The registry does not fix a claim list
here, because the issuer decides which attributes describe the user.

The other two TS12 credentials are the Payment Account Credential, in
`igrantio-dcql-query-sca-payment-account`, and the Payment Card Credential,
in `igrantio-dcql-query-sca-payment-card`.

## Registry facts

| Fact | Value |
| --- | --- |
| Title | Payment User Credential (TS12) |
| Purpose | Payment User Credential (TS12) |
| Registry version | 2025.7.1 |
| Formats | `dc+sd-jwt` |
| `dc+sd-jwt` vct | `{baseUrl}/service/vct-metadata/payment_service_user` |
| SCA credential | yes (`isScaCredential: true`) |
| Claims | none listed; the query asks for the whole credential |

The registry gives no `mso_mdoc` file and no `jwt_vc_json` file for this
template. The Payment User Credential is an SD-JWT VC only.

**`{baseUrl}` is a placeholder.** The vct is not a fixed string. It is the
VCT metadata URL of the issuer. Replace `{baseUrl}` with the base URL of the
service that issues the credential, for example
`https://demo-api.igrant.io/service/vct-metadata/payment_service_user`. Do
not send the literal text `{baseUrl}` in a query.

The metadata flag `isScaCredential: true` tells the platform that this
template belongs to an SCA flow, and that the request needs transaction data.

## Claims

### Format `dc+sd-jwt`
The registry file is `2025.7.1/dc+sd-jwt.schema.json`.

```json
{
  "claims": []
}
```

To read the claims that the credential really holds, fetch the VCT metadata
of the issuer at the vct URL. The metadata lists the attributes and their
display names.

## How to read the `path` arrays
This template lists no path. When you add paths later, follow the
`dc+sd-jwt` rule: the path walks the JSON payload of the credential, one
element names a top-level claim, and a second element names a member inside
that claim.

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
`vct_values` meta. **Leave `claims` out** to ask for the whole credential.

```json
{
  "label": "Identify the payment service user",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "transactionDataDefinitionType": "payment_data",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "payment-user",
        "format": "dc+sd-jwt",
        "meta": {
          "vct_values": [
            "https://demo-api.igrant.io/service/vct-metadata/payment_service_user"
          ]
        }
      }
    ]
  }
}
```

Leaving `claims` out is not the same as sending an empty array. Leave the key
out when you want the whole credential. Send a `claims` array only when you
name at least one path, because `claim_sets` needs a non-empty `claims`
array.

Asking for the whole credential is the widest request that DCQL allows. Ask
for named claims when you know which attributes you need. The consent screen
of the wallet then shows a short list, and you hold less data.

**Pick the transaction data type that matches your action.** The field is
mandatory when the DCQL query asks for an SCA attestation. The API offers
`payment_data`, `payment`, `login_risk_transaction`,
`login_risk_transaction_non_ts12`, `account_access`, `emandate`,
`data_agreement_record`, `data_disclosure_agreement_record` and `qes_data`.
A payment uses a payment type. A login step uses a login risk type. Read the
JSON Schema of each type with
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

To ask for the user and the paying account in one request, put a second entry
in `credentials` for the Payment Account Credential, and mark both as needed
with a `credential_sets` option that lists the two identifiers.

`label` must hold 3 to 100 characters. The server refuses the labels that
extensions reserve.

For the full operation reference, the transaction data rules and the response
shape, read the `igrantio-api-verifier` skill.

## Source is the registry
This skill mirrors the iGrant.io verifiable data registry. If this skill and
the registry file disagree, **the registry wins**. Check the source before
you rely on a claim path:

- Directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/scaPaymentUser>
- Raw file:
  `https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/scaPaymentUser/2025.7.1/dc+sd-jwt.schema.json`

A newer version directory can appear next to `2025.7.1`. Always take the
latest one.
