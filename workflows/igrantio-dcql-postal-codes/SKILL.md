---
name: igrantio-dcql-postal-codes
description: 'DCQL pattern: claim VALUE matching - accept a credential only when a claim equals one of an allowed list, using the values array on a claim query in OpenID4VP on the iGrant.io Organisation Wallet Suite. Example: a delivery service accepts a PID/address credential (dc+sd-jwt) only for postal codes inside its delivery zones. Geographic or attribute-gated eligibility checks with EUDI Wallet (EUDIW) under eIDAS 2.0.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, values constraint, claim value matching, postal code, delivery zones, address credential, OpenID4VP, EUDIW, eIDAS2
  version: 2026.07.03
  source-doc: https://docs.igrant.io/docs/dcql-2-4-7-delivery-service-restricted-postal-codes/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: claim value matching (restricted postal codes)

## Scenario
A delivery service requests the holder's residential address credential but
accepts it only when `postal_code` is in its allowed delivery zones. The
`values` array on a claim query makes the wallet match the claim VALUE, not
just its presence.

## The DCQL query
```json
{
  "credentials": [
    {
      "id": "residential_address",
      "format": "dc+sd-jwt",
      "meta": {
        "vct_values": [
          "https://credentials.gov.example/address_credential"
        ]
      },
      "claims": [
        { "id": "full_address", "path": ["street_address"] },
        {
          "id": "postal_code",
          "path": ["postal_code"],
          "values": ["43242", "234234"]
        },
        { "id": "city", "path": ["locality"] },
        { "id": "country", "path": ["country"] }
      ],
      "claim_sets": [
        ["full_address", "postal_code", "city", "country"]
      ]
    }
  ]
}
```

## Run it on OWS
1. Store as a presentation definition; send the verification request (v3).
2. A wallet whose postal code is outside `values` simply has no match - the
   holder cannot present. Design the UX for that outcome (clear "not in
   delivery area" message, not an error).
3. On `presentation_acked` + `verified === true`, STILL re-check the
   disclosed `postal_code` server-side - the wallet match is a UX filter,
   your backend is the enforcement point.

## Adjust for your deployment
- `values`: your real postal-code allow-list (the doc values are dummies).
  Regenerate the presentation definition when zones change.
- `vct_values` and claim `path`s per your address credential profile
  (PID address claims may be nested, e.g. `["address", "postal_code"]`).
- Large allow-lists: consider verifying the code server-side only
  (drop `values`) instead of shipping thousands of codes to the wallet.

## Cross-references
- `igrantio-dcql-claim-sets` - claim presence/fallback rather than value
  matching.
- `igrantio-verifier-backend` - server-side re-validation lives here.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-2-4-7-delivery-service-restricted-postal-codes/>
(query detailed in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
§2.4.7). Before implementing, fetch the doc page; if it disagrees with this
skill, the documentation wins - follow it and report the drift so the skill
can be updated.
