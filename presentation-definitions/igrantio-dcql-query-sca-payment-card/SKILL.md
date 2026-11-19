---
name: igrantio-dcql-query-sca-payment-card
description: 'DCQL query template for the Payment Card Credential (TS12) from the iGrant.io verifiable data registry. The dc+sd-jwt query asks for pan_last_four, scheme and scheme_logo, and the vct is the card VCT metadata URL of the issuer. Use this skill when you build a Strong Customer Authentication (SCA) flow under the EUDI Wallet technical specification TS12 and the holder must confirm which card pays: the presentation definition must set a transactionDataDefinitionType, and the send request must carry the matching transactionData.'
license: Apache-2.0
metadata:
  categories: [dcql-query, education]
  provider: iGrant.io
  keywords: DCQL, SCA, Strong Customer Authentication, TS12, payment card, pan_last_four, card scheme, PSD2, transaction data, presentation definition, OpenID4VP, SD-JWT VC, EUDIW, eIDAS2
  version: 2026.11.02
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/scaPaymentCard
  registry-version: 2025.7.1
  requires-skills: igrantio-api-verifier
---

# DCQL query: Payment Card Credential (TS12)

## When to use
Use this skill when you ask a holder to **confirm a payment card**. The
Payment Card Credential is one of the three TS12 credentials of a Strong
Customer Authentication flow. It names the card that pays.

The query asks for three claims:

- `pan_last_four` - the last four digits of the primary account number. The
  credential does not disclose the full number.
- `scheme` - the card scheme.
- `scheme_logo` - the logo of the scheme, for the confirmation screen.

These three claims are enough to show a card in a user interface. The holder
sees which card the payment uses, and the verifier never holds the full
number.

The other two TS12 credentials are the Payment Account Credential, in
`igrantio-dcql-query-sca-payment-account`, and the Payment User Credential,
in `igrantio-dcql-query-sca-payment-user`.

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
| Title | Payment Card Credential (TS12) |
| Purpose | Payment Card Credential (TS12) |
| Registry version | 2025.7.1 |
| Formats | `dc+sd-jwt` |
| `dc+sd-jwt` vct | `{baseUrl}/service/vct-metadata/card` |
| SCA credential | yes (`isScaCredential: true`) |

The registry gives no `mso_mdoc` file and no `jwt_vc_json` file for this
template. The Payment Card Credential is an SD-JWT VC only.

**`{baseUrl}` is a placeholder.** Replace it with the wallet service URL of
the issuer. For a credential that an iGrant.io organisation issues, the values
are:

| Environment | `{baseUrl}` | `vct` |
| --- | --- | --- |
| Demo | `https://oid4vc.igrant.io` | `https://oid4vc.igrant.io/service/vct-metadata/card` |
| Staging | `https://staging-oid4vc.igrant.io` | `https://staging-oid4vc.igrant.io/service/vct-metadata/card` |
| Production | `https://wallet.igrant.io` | `https://wallet.igrant.io/service/vct-metadata/card` |

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
  "claims": [
    {
      "path": [
        "pan_last_four"
      ]
    },
    {
      "path": [
        "scheme"
      ]
    },
    {
      "path": [
        "scheme_logo"
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
`POST /v4/config/ows/verifier/presentation-definitions`.
Set `version` to `version_01`. Set `transactionDataDefinitionType`. Put one
entry in `dcqlQuery.credentials` with the `dc+sd-jwt` format and the
`vct_values` meta. The example uses the demo `vct`. Take the value of
your environment from the table above.

```json
{
  "label": "Confirm the card payment",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "cryptographicKeyFormat": "x509",
  "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
  "transactionDataDefinitionType": "payment",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "payment-card",
        "format": "dc+sd-jwt",
        "meta": {
          "vct_values": [
            "https://oid4vc.igrant.io/service/vct-metadata/card"
          ]
        },
        "claims": [
          { "path": ["pan_last_four"] },
          { "path": ["scheme"] },
          { "path": ["scheme_logo"] }
        ]
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

`dc+sd-jwt` takes only `vct_values` in `meta`. It refuses `type_values`
(W3C formats) and `doctype_value` (`mso_mdoc`).

To accept the cards of one scheme only, add a `values` array to the `scheme`
claim. The wallet then answers only with a card of a listed scheme.

**Pick the transaction data type that matches your action.** The field is
mandatory when the DCQL query asks for an SCA attestation. A TS12 type
(`payment`, `login_risk_transaction`, `account_access` or `emandate`) must be
one that the VCT metadata of the credential lists in `transaction_data_types`.
For this credential the platform metadata lists `payment` (a card payment)
and `emandate` (a mandate for later card payments).
`payment_data` belongs to the Payment Wallet Attestation and `qes_data` to the
QESAC, so the API refuses them here. Read the JSON Schema of each type with
`GET /v4/config/ows/verifier/transaction-data-templates`,
because the schema decides which fields the request must carry.

**Step 2.** Send the request with the send operation,
`POST /v4/config/ows/verifier/verifications`. Send the
`presentationDefinitionId`, and send `transactionData` that follows the JSON
Schema of the chosen type. The amount, the payee and the currency of the
payment travel there, not in the DCQL query. The server answers HTTP 400 when
the presentation definition sets a `transactionDataDefinitionType` and the
request carries no `transactionData`, and also in the opposite case.

**Step 3.** The answer is `{"verificationHistory": {...}}`. Read `requestUrl`
for the QR code or the deep link, and `presentationExchangeId` for the
correlation id. When the wallet has answered, read the verification with
`GET /v4/config/ows/verifier/verifications/{verificationId}`, where
`{verificationId}` is the `presentationExchangeId`. `isVerified` is `true`
when every check passed, also the check of the transaction data. The finished
record holds `presentation`, `transactionData` and `transactionDataBase64`.

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

- Directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/scaPaymentCard>
- Raw file:
  `https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/scaPaymentCard/2025.7.1/dc+sd-jwt.schema.json`

A newer version directory can appear next to `2025.7.1`. Always take the
latest one.
