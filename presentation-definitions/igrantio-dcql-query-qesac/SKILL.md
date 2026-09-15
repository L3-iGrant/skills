---
name: igrantio-dcql-query-qesac
description: 'DCQL query template for the QESAC credential (Qualified Electronic Signature Authorisation Credential, credential type QESAC) from the iGrant.io verifiable data registry. The dc+sd-jwt query asks for one claim, credentialId, which names the signing credential that the holder authorises. Use this skill when you build a remote signing flow: the presentation definition must set transactionDataDefinitionType to qes_data, and the send request must carry the matching transactionData with the document hashes.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, QESAC, qualified electronic signature, remote signing, QES, qes_data, transaction data, credentialId, presentation definition, OpenID4VP, SD-JWT VC, EUDIW, eIDAS2
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/qesac
  registry-version: 2025.7.1
  requires-skills: igrantio-api-verifier
---

# DCQL query: QESAC

## When to use
Use this skill when you ask a holder to **authorise a qualified electronic
signature**. QESAC is the Qualified Electronic Signature Authorisation
Credential. The holder keeps it in the wallet, and it points to a signing
credential that a qualified trust service provider holds.

The query is small on purpose. It asks for one claim, `credentialId`, which
names the signing credential to use. The document that the holder signs does
not travel in the DCQL query. It travels in the **transaction data** of the
verification request, as a hash.

Use this skill when you build:

- a "sign this contract" flow in a browser or an app;
- a signed PDF flow, where the server stamps the returned signature into the
  document.

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
| Title | QESAC |
| Purpose | QESAC |
| Registry version | 2025.7.1 |
| Formats | `dc+sd-jwt` |
| `dc+sd-jwt` vct | `QESAC` |

The registry gives no `mso_mdoc` file and no `jwt_vc_json` file for this
template. QESAC is an SD-JWT VC only.

## Claims

### Format `dc+sd-jwt`
The registry file is `2025.7.1/dc+sd-jwt.schema.json`.

```json
{
  "claims": [
    { "path": ["credentialId"] }
  ]
}
```

## How to read the `path` arrays
For `dc+sd-jwt`, the path walks the JSON payload of the credential. One
element names a top-level claim, so `["credentialId"]` asks for the
`credentialId` claim of the QESAC payload. There is no nesting here.

This template has no `mso_mdoc` file. In an mDoc query the first element of
the path would be the namespace, but that rule does not apply to this
template.

## Use with the iGrant.io API
A QESAC query needs one more field than a plain query: the presentation
definition must name a transaction data template.

**Step 1.** Create the presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`.
Set `version` to `version_01`. Set `transactionDataDefinitionType` to
`qes_data`. Put one entry in `dcqlQuery.credentials` with the `dc+sd-jwt`
format and the `vct_values` meta.

```json
{
  "label": "Sign the loan contract",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "transactionDataDefinitionType": "qes_data",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "qesac",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["QESAC"] },
        "claims": [
          { "path": ["credentialId"] }
        ]
      }
    ]
  }
}
```

`dc+sd-jwt` takes `vct_values` or `type_values` in `meta`. It refuses
`doctype_value`, because that key belongs to `mso_mdoc`.

**Step 2.** Send the request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`. Send the
`presentationDefinitionId`, and send `transactionData` that follows the JSON
Schema of the `qes_data` type. The server answers HTTP 400 when the
presentation definition sets a `transactionDataDefinitionType` and the
request carries no `transactionData`, and also in the opposite case.

Read the schema of the type with
`GET /v2/config/digital-wallet/openid/sdjwt/transaction-data-definitions`
before you build the payload.

The send operation also takes `signatureStamp` and `signatureCoordinate` for
a signed PDF. `signatureCoordinate` holds exactly four integers,
`[x1, y1, x2, y2]`, in points. The finished record holds a `files` array,
with `signedFile`, `unsignedFile` and any error for each credential.

**Step 3.** Read `vpTokenQrCode` for the deep link and
`presentationExchangeId` for the correlation id, then poll the V3 read
operation or wait for the webhook.

`label` must hold 3 to 100 characters. The server refuses the labels that
extensions reserve, for example `Document Signing`. Name the contract instead.

For the full operation reference, the transaction data rules and the response
shape, read the `igrantio-api-verifier` skill.

## Source is the registry
This skill mirrors the iGrant.io verifiable data registry. If this skill and
the registry file disagree, **the registry wins**. Check the source before
you rely on a claim path:

- Directory: <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/qesac>
- Raw file:
  `https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/qesac/2025.7.1/dc+sd-jwt.schema.json`

A newer version directory can appear next to `2025.7.1`. Always take the
latest one.
