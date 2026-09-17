---
name: igrantio-dcql-postal-codes
description: 'DCQL pattern: claim VALUE matching - accept a credential only when a claim equals one of an allowed list, using the values array on a claim query in OpenID4VP on the iGrant.io Organisation Wallet Suite. Example: a delivery service accepts a PID/address credential (dc+sd-jwt) only for postal codes inside its delivery zones. Geographic or attribute-gated eligibility checks with EUDI Wallet (EUDIW) under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, values constraint, claim value matching, postal code, delivery zones, address credential, OpenID4VP, EUDIW, eIDAS2
  version: 2026.09.01
  source-doc: https://docs.igrant.io/docs/dcql-2-4-7-delivery-service-restricted-postal-codes/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: claim value matching (restricted postal codes)

## Scenario
A delivery service requests the holder's residential address credential but
accepts it only when `postal_code` is in its allowed delivery zones. The
`values` array on a claim query makes the wallet match the claim VALUE, not
just its presence.

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
