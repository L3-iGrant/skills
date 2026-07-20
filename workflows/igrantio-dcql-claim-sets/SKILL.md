---
name: igrantio-dcql-claim-sets
description: 'DCQL pattern: claim_sets with fallback for selective disclosure - prefer a minimal boolean claim (is_over_21) and fall back to birth_date only when the preferred claim is unavailable, in an OpenID4VP verification of a PID SD-JWT on the iGrant.io Organisation Wallet Suite. Data-minimised age verification for EUDI Wallet (EUDIW) under eIDAS 2.0 and GDPR.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, claim_sets, selective disclosure, age verification, is_over_21, PID, OpenID4VP, EUDIW, eIDAS2, GDPR
  version: 2026.07.04
  source-doc: https://docs.igrant.io/docs/dcql-2-4-2-claim-set-age-verification/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: claim sets (preferred claim with fallback)

## Scenario
A verifier needs an age check. It prefers the minimal boolean `is_over_21`;
if the wallet's PID lacks it, the query falls back to `birth_date`.
`claim_sets` are ordered - the wallet satisfies the first set it can.

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each.

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
