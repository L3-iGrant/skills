---
name: igrantio-dcql-query-sca-payment-user
description: 'DCQL query template for the Payment User Credential (TS12) from the iGrant.io verifiable data registry. The registry template holds an empty claims array, so the dc+sd-jwt query leaves claims out and asks for the whole credential of the payment service user. The vct is the payment_service_user VCT metadata URL of the issuer. Use this skill when you build a Strong Customer Authentication (SCA) flow under the EUDI Wallet technical specification TS12 and the holder must prove who authorises the payment: the presentation definition must set a transactionDataDefinitionType, and the send request must carry the matching transactionData.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, SCA, Strong Customer Authentication, TS12, payment service user, PSU, PSD2, whole credential, empty claims, transaction data, presentation definition, OpenID4VP, SD-JWT VC, EUDIW, eIDAS2
  version: 2026.11.02
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
A query without `claims` asks for the whole credential, so the wallet returns
every claim that the credential holds. The registry does not fix a claim list
here, because the issuer decides which attributes describe the user.

The other two TS12 credentials are the Payment Account Credential, in
`igrantio-dcql-query-sca-payment-account`, and the Payment Card Credential,
in `igrantio-dcql-query-sca-payment-card`.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- A **signing key** with an X.509 certificate chain in Key Management (see
  `igrantio-api-key-management`). Every signed request needs one.

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
3. **Format** - the registry publishes this template in `dc+sd-jwt` only, so
   use `dc+sd-jwt`.
4. **Claims** - which claims does the use case need? _Ask for the minimum._
5. **Channel** - cross-device QR, same-device Digital Credentials API, or
   both? _Recommend QR first; `igrantio-dcapi-android` and
   `igrantio-dcapi-ios` cover the DC API._
6. **Trusted issuers** - accept any issuer, or only the issuers of a trust
   source of the organisation? _Default any issuer: no check runs. For live
   use, set `requiresTrustedCredentialSigner` in `credentialQueryOptions` (see
   `igrantio-api-verifier`)._
7. **Signing key** - which key of Key Management signs the requests? _It must
   be an active key of the organisation with a certificate chain. The verifier
   signs with no other key._
8. **Transaction data** - does the wallet sign over transaction details
   (payment, e-mandate, QES)? _Only when the use case needs it._
9. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

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

**`{baseUrl}` is a placeholder.** Replace it with the wallet service URL of
the issuer. For a credential that an iGrant.io organisation issues, the values
are:

| Environment | `{baseUrl}` | `vct` |
| --- | --- | --- |
| Demo | `https://oid4vc.igrant.io` | `https://oid4vc.igrant.io/service/vct-metadata/payment_service_user` |
| Staging | `https://staging-oid4vc.igrant.io` | `https://staging-oid4vc.igrant.io/service/vct-metadata/payment_service_user` |
| Production | `https://wallet.igrant.io` | `https://wallet.igrant.io/service/vct-metadata/payment_service_user` |

The templates operation
`GET /v4/config/ows/verifier/presentation-definition-templates` returns the
value with `{baseUrl}` already replaced. Do not send the literal text
`{baseUrl}` in a query.

The registry metadata marks the template with `isScaCredential: true`. The
verifier finds an SCA attestation by its type metadata: it reads the document
at the `vct` URL, and the category `urn:eu:europa:ec:eudi:sua:sca` of that
document makes the definition need a transaction data type.

## Claims

### Format `dc+sd-jwt`
The registry file is `2025.7.1/dc+sd-jwt.schema.json`.

```json
{
  "claims": []
}
```

To see what the credential holds, fetch the VCT metadata at the vct URL. Its
`schema_uri` points at the JSON Schema of the credential.

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
`POST /v4/config/ows/verifier/presentation-definitions`. Set `version` to
`version_01`. Set `transactionDataDefinitionType`. Put one entry in
`dcqlQuery.credentials` with the `dc+sd-jwt` format and the `vct_values` meta.
The example uses the demo `vct`. Take the value of your environment from the
table above. **Leave `claims` out** to ask for the whole credential.

```json
{
  "label": "Identify the payment service user",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "cryptographicKeyFormat": "x509",
  "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
  "transactionDataDefinitionType": "login_risk_transaction",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "payment-user",
        "format": "dc+sd-jwt",
        "meta": {
          "vct_values": [
            "https://oid4vc.igrant.io/service/vct-metadata/payment_service_user"
          ]
        }
      }
    ]
  }
}
```

`cryptographicKeyIdentifier` names the key that signs the request. It must be
an active key of the organisation with an X.509 certificate chain
(`igrantio-api-key-management`). A create without it gets HTTP 400: the
verifier signs with no default key. `cryptographicKeyFormat` is `x509`, the
only format, and `clientIdScheme` defaults to `x509_hash`.

Leaving `claims` out is not the same as sending an empty array. Leave the key
out when you want the whole credential. Send a `claims` array only when you
name at least one path: the API refuses an empty `claims` array.

Asking for the whole credential is the widest request that DCQL allows. Ask
for named claims when you know which attributes you need. The consent screen
of the wallet then shows a short list, and you hold less data.

**Pick the transaction data type that matches your action.** The field is
mandatory when the DCQL query asks for an SCA attestation. A TS12 type
(`payment`, `login_risk_transaction`, `account_access` or `emandate`) must be
one that the VCT metadata of the credential lists in `transaction_data_types`.
For this credential the platform metadata lists `login_risk_transaction` (a
login or a risk-based authentication step).
`payment_data` belongs to the Payment Wallet Attestation and `qes_data` to the
QESAC, so the API refuses them here. Read the JSON Schema of each type with
`GET /v4/config/ows/verifier/transaction-data-templates`,
because the schema decides which fields the request must carry.

**Step 2.** Send the request with the send operation,
`POST /v4/config/ows/verifier/verifications`. Send the
`presentationDefinitionId`, and send `transactionData` that follows the JSON
Schema of the chosen type. The server answers HTTP 400 when the presentation
definition sets a `transactionDataDefinitionType` and the request carries no
`transactionData`, and also in the opposite case.

**Step 3.** The answer is `{"verificationHistory": {...}}`. Read `requestUrl`
for the QR code or the deep link, and `presentationExchangeId` for the
correlation id. When the wallet has answered, read the verification with
`GET /v4/config/ows/verifier/verifications/{verificationId}`, where
`{verificationId}` is the `presentationExchangeId`. `isVerified` is `true`
when every check passed, also the check of the transaction data. The finished
record holds `presentation`, `transactionData` and `transactionDataBase64`.

One DCQL query can hold only one SCA attestation. The API refuses a query
that asks for two, for example a Payment Account Credential and a Payment User
Credential together.

`label` has 3 to 100 characters and is unique in the organisation: a second
create with the same label gets HTTP 400. Before you run the sample again,
change the label, or reuse the `presentationDefinitionId` of the first run.
The server also refuses the labels that extensions reserve.

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
