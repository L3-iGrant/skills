---
name: igrantio-dcql-claim-sets
description: 'DCQL pattern: claim_sets with fallback for selective disclosure - prefer a minimal boolean claim (is_over_21) and fall back to birth_date only when the preferred claim is unavailable, in an OpenID4VP verification of a PID SD-JWT on the iGrant.io Organisation Wallet Suite. Data-minimised age verification for EUDI Wallet (EUDIW) under eIDAS 2.0 and GDPR.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, claim_sets, selective disclosure, age verification, is_over_21, PID, OpenID4VP, EUDIW, eIDAS2, GDPR
  version: 2026.09.01
  source-doc: https://docs.igrant.io/docs/dcql-2-4-2-claim-set-age-verification/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: claim sets (preferred claim with fallback)

## Scenario
A verifier needs an age check. It prefers the minimal boolean `is_over_21`;
if the wallet's PID lacks it, the query falls back to `birth_date`.
`claim_sets` are ordered - the wallet satisfies the first set it can.

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
      "id": "pid",
      "format": "dc+sd-jwt",
      "meta": {
        "vct_values": [
          "eu.europa.ec.eudi:pid.1"
        ]
      },
      "claims": [
        {
          "id": "over_21",
          "path": [
            "is_over_21"
          ]
        },
        {
          "id": "birthdate",
          "path": [
            "birth_date"
          ]
        }
      ],
      "claim_sets": [
        [
          "over_21"
        ],
        [
          "birthdate"
        ]
      ]
    }
  ]
}
```

## Run it on OWS
1. Store the query as a presentation definition, keep the
   `presentationDefinitionId` (`igrantio-ows-overview` api-reference §3).
2. Send the verification request (v3), render QR / DC API, await
   `presentation_acked` with `verified === true` (api-reference §2).
3. Read the disclosed claim from `presentation[0]` - handle BOTH shapes:
   the boolean, or a birthdate you must compare yourself.

## Adjust for your deployment
- Change the threshold claim (`is_over_18`, `is_over_65`) and `path` to
  match your PID profile; `vct_values` to your PID VCT.
- Order `claim_sets` most-minimal first - that is the point of the pattern.
- If regulators forbid receiving birthdate, drop the fallback set and
  handle "no match" in UX instead.

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
- `igrantio-eu-age-verification` - the mdoc age attestation profile
  (boolean-only, no fallback).
- `igrantio-dcql-credential-sets` - alternatives across credentials rather
  than claims.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-2-4-2-claim-set-age-verification/>
(query detailed in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
§2.4.2). Before implementing, fetch the doc page; if it disagrees with this
skill, the documentation wins - follow it and report the drift so the skill
can be updated.
