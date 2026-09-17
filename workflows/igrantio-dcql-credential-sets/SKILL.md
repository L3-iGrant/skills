---
name: igrantio-dcql-credential-sets
description: 'DCQL pattern: credential_sets with alternatives - accept any one of several identity credentials (PID, Passport, or Photo ID, all dc+sd-jwt with cryptographic holder binding) in a single OpenID4VP verification on the iGrant.io Organisation Wallet Suite. Proof of identity for EUDI Wallet (EUDIW) relying parties under eIDAS 2.0 when multiple credential types are acceptable.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, credential_sets, alternatives, proof of identity, PID, Passport, Photo ID, OpenID4VP, EUDIW, eIDAS2
  version: 2026.09.01
  source-doc: https://docs.igrant.io/docs/dcql-2-4-3-credential-set-proof-of-identity-alternatives/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: credential sets (identity alternatives)

## Scenario
A verifier needs proof of identity and accepts any one of PID, Passport,
or Photo ID. The wallet presents whichever the holder has; options are
tried in order.

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
      "format": "dc+sd-jwt",
      "id": "Passport",
      "meta": {
        "vct_values": [
          "Passport"
        ]
      },
      "require_cryptographic_holder_binding": true
    },
    {
      "format": "dc+sd-jwt",
      "id": "PID",
      "meta": {
        "vct_values": [
          "urn:eu.europa.ec.eudi:pid:1"
        ]
      },
      "require_cryptographic_holder_binding": true
    },
    {
      "format": "dc+sd-jwt",
      "id": "Photo ID",
      "meta": {
        "vct_values": [
          "eu.europa.ec.eudi.photoid.1"
        ]
      },
      "require_cryptographic_holder_binding": true
    }
  ],
  "credential_sets": [
    {
      "options": [
        [
          "PID"
        ],
        [
          "Passport"
        ],
        [
          "Photo ID"
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
3. On `presentation_acked` + `verified === true`, inspect
   `presentationSubmission` to learn WHICH alternative was presented, then
   read its claims from `presentation[0]`.

## Adjust for your deployment
- Order `options` by preference - wallets try them in order.
- Set each `vct_values` to the VCTs your issuers actually use; add `claims`
  entries per credential if you need specific attributes disclosed.
- Keep `require_cryptographic_holder_binding: true` unless you have a
  reason not to; it prevents replay of copied credentials.

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
- `igrantio-dcql-kyc` - two required groups (identity + address) instead of
  one group of alternatives.
- `igrantio-dcql-trusted-authority` - add issuer trust restrictions per
  credential.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-2-4-3-credential-set-proof-of-identity-alternatives/>
(query detailed in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
§2.4.3). Before implementing, fetch the doc page; if it disagrees with this
skill, the documentation wins - follow it and report the drift so the skill
can be updated.
