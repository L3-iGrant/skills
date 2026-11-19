---
name: igrantio-dcql-postal-codes
description: 'DCQL pattern: claim VALUE matching. Accept a credential only when a claim has one of the values of an allowed list, with the values array of a claim query in OpenID4VP on the iGrant.io Organisation Wallet Suite. Example: a delivery service accepts the address of a PID (dc+sd-jwt) only for the postal codes of its delivery zones. Geographic or attribute-based eligibility checks with the EUDI Wallet (EUDIW) under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, values constraint, claim value matching, postal code, delivery zones, address, PID, OpenID4VP, EUDIW, eIDAS2
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/dcql-2-4-7-delivery-service-restricted-postal-codes/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: claim value matching (allowed postal codes)

## Scenario
A delivery service asks for the address of the holder from the PID. It
accepts the address only when the postal code is in its delivery zones.
The `values` array of a claim query makes the wallet match the claim VALUE,
not only its presence.

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
   claim paths, the allowed postal codes?
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
an `x509` key). The postal codes are placeholders.

```json
{
  "label": "Example delivery zones by postal code",
  "version": "version_01",
  "cryptographicKeyFormat": "x509",
  "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "residential_address",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["urn:eudi:pid:1"] },
        "claims": [
          { "id": "street", "path": ["address", "street_address"] },
          {
            "id": "postal_code",
            "path": ["address", "postal_code"],
            "values": ["12345", "67890"]
          },
          { "id": "city", "path": ["address", "locality"] },
          { "id": "country", "path": ["address", "country"] }
        ],
        "claim_sets": [
          ["street", "postal_code", "city", "country"]
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
3. **Plan for no match** - a wallet whose postal code is not in `values`
   has no matching credential, so the holder cannot present. Show a clear
   "not in the delivery area" message, not an error.
4. **Wait for the answer** - the webhook event
   `ows.verifier.verification.presentation_received` (see
   `igrantio-api-webhooks`), or the status stream (see
   `igrantio-api-verifier`).
5. **Read the result** - `GET
   /v4/config/ows/verifier/verifications/{presentationExchangeId}`. Require
   `verificationHistory.status` `presentation_acked` and `isVerified`
   `true`. The verifier also checks the value: a postal code that is not in
   `values` gives `isVerified` `false`. Read the address in `presentation`.
   `vpToken` holds one text: the JSON of the VP Token, with only the claims
   that the query asks for. Check the disclosed postal code again in your
   backend before you accept the order.

An iGrant.io organisation wallet as holder names the claim set in
`claimIds` (see `igrantio-api-holder`). The query has `claim_sets`, so
`claimIds` is mandatory.

## Adjust for your deployment
- `values`: your list of allowed postal codes. Update the presentation
  definition when the zones change.
- The `vct` and the claim paths are those of the PID SD-JWT VC
  (`igrantio-dcql-query-pid-v2`). Change them for another address
  credential.
- For a long list, check the postal code only on your server (remove
  `values`), and do not send thousands of codes to the wallet.
- To accept only trusted PID providers, add `credentialQueryOptions` with
  `requiresTrustedCredentialSigner` (see `igrantio-api-verifier`). The trust
  check of the issuer is then at
  `presentationValidity[].residential_address.credentialSignerTrustedListCheck`.

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
- `igrantio-dcql-claim-sets` - claim presence with a fallback, not value
  matching.
- `igrantio-verifier-backend` - the check again on your server.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-2-4-7-delivery-service-restricted-postal-codes/>
(the query is explained in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
section 2.4.7). Before implementing, fetch the doc page; if it disagrees with
this skill, the documentation wins - follow it and report the drift so the
skill can be updated.
