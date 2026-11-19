---
name: igrantio-dcql-multiple-statements
description: 'DCQL pattern: ask for more than one credential of the SAME type in one OpenID4VP verification with multiple: true on the iGrant.io Organisation Wallet Suite. A loan provider collects several recent BankStatement SD-JWT VC credentials (period, account number, account holder name) in one flow. Loan applications, income checks and any evidence of more than one instance with the EUDI Wallet (EUDIW) under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, multiple true, bank statements, loan application, credit check, OpenID4VP, EUDIW, EUBW, eIDAS2
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/dcql-2-4-6-loan-application-multiple-bank-statements/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: more than one credential of one type (bank statements)

## Scenario
A loan provider assesses an application and needs several recent
`BankStatement` credentials. `multiple: true` lets the wallet send more
than one credential of the same type in one presentation. DCQL sets no
count: with `multiple: true`, the wallet can send one or more credentials.

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
3. **Adjust** - which parts of the query change for you: `vct_values`,
   claim paths, the number of statements that your rule needs?
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
an `x509` key).

```json
{
  "label": "Example loan application with recent bank statements",
  "version": "version_01",
  "cryptographicKeyFormat": "x509",
  "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "bank_statement",
        "format": "dc+sd-jwt",
        "multiple": true,
        "meta": { "vct_values": ["BankStatement"] },
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
   `true`. `presentation` holds one entry for each bank statement that the
   wallet sent. The `presentationValidity` item of `bank_statement` holds
   them in `credentials`: `{"bank_statement": {"credentials": [...]}}`.
   Read all of them, not only the first. `vpToken` holds one text: the JSON
   of the VP Token, with only the claims that the query asks for.
5. **Check the business rules on your server** - the number of statements,
   periods that follow each other, the same `account_number` in each
   statement.

An iGrant.io organisation wallet as holder sends the credentials in
`credentialIds` and the claim set in `claimIds` (see
`igrantio-api-holder`).

## Adjust for your deployment
- `vct_values`: the type of your bank statement credential. `BankStatement`
  is an example type. A type can also be a URL, for example
  `https://credentials.example.com/bank-statement`: the verifier then reads
  the type metadata at that URL when you save the definition.
- DCQL `multiple` does not set a COUNT. Apply your rule (for example six
  recent months) in your verification logic, and ask again when the wallet
  sends too few statements.
- To accept only statements of trusted banks, add `credentialQueryOptions`
  with `requiresTrustedCredentialSigner` (see `igrantio-api-verifier`), or
  `trusted_authorities` (see `igrantio-dcql-trusted-authority`). Each
  credential of a `multiple` query has its own trust check in
  `presentationValidity[].bank_statement.credentials[].credentialSignerTrustedListCheck`.

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
- `igrantio-api-verifier` - the presentation definition fields, the send,
  the verification history and the transaction data templates.
- `igrantio-dcql-kyc` - one bank statement as an address proof.
- A loan flow often continues with an e-mandate: the transaction data
  template `emandate` of `igrantio-api-verifier`.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-2-4-6-loan-application-multiple-bank-statements/>
(the query is explained in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
section 2.4.6). Before implementing, fetch the doc page; if it disagrees with
this skill, the documentation wins - follow it and report the drift so the
skill can be updated.
