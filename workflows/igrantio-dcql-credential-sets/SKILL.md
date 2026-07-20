---
name: igrantio-dcql-credential-sets
description: 'DCQL pattern: credential_sets with alternatives - accept any one of several identity credentials (PID, Passport, or Photo ID, all dc+sd-jwt with cryptographic holder binding) in a single OpenID4VP verification on the iGrant.io Organisation Wallet Suite. Proof of identity for EUDI Wallet (EUDIW) relying parties under eIDAS 2.0 when multiple credential types are acceptable.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, credential_sets, alternatives, proof of identity, PID, Passport, Photo ID, OpenID4VP, EUDIW, eIDAS2
  version: 2026.07.03
  source-doc: https://docs.igrant.io/docs/dcql-2-4-3-credential-set-proof-of-identity-alternatives/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: credential sets (identity alternatives)

## Scenario
A verifier needs proof of identity and accepts any one of PID, Passport,
or Photo ID. The wallet presents whichever the holder has; options are
tried in order.

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
