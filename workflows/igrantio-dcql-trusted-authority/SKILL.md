---
name: igrantio-dcql-trusted-authority
description: 'DCQL pattern: accept a credential only when its issuer is anchored in a specific trust list, using the trusted_authorities field (etsi_tl trust list, EBSI, or OpenID Federation trust anchor) in an OpenID4VP verification on the iGrant.io Organisation Wallet Suite. Example: a University Degree SD-JWT accepted only from EU/EWC Trust List issuers. For EUDI Wallet (EUDIW) and European Business Wallet (EUBW) verifiers under eIDAS 2.0.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, trusted_authorities, etsi_tl, trust list, EBSI, OpenID Federation, OpenID4VP, EUDIW, EUBW, eIDAS2
  version: 2026.07.04
  source-doc: https://docs.igrant.io/docs/dcql-basic-credential-query-with-trusted-authority/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: trusted authority restriction

## Scenario
A verifier requests a University Degree credential, accepting it only if
issued by an authority on the EU/EWC Trust List (or EBSI / an OpenID
Federation trust anchor). Credentials from issuers outside the trust
anchor (e.g. a plain `did:key` issuer) are rejected.

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each.

## The DCQL query
```json
{
  "credentials": [
    {
      "id": "university_degree_credential",
      "format": "dc+sd-jwt",
      "multiple": false,
      "meta": {
        "vct_values": [
          "https://credentials.example.com/identity_credential"
        ]
      },
      "trusted_authorities": [
        {
          "type": "etsi_tl",
          "values": [
            "https://raw.githubusercontent.com/EWC-consortium/ewc-trust-list/refs/heads/main/EWC-TL.xml"
          ]
        }
      ]
    }
  ]
}
```

## Run it on OWS
1. Store the query as a presentation definition (`igrantio-ows-overview`
   api-reference §3), keep the `presentationDefinitionId`.
2. Send the verification request (v3) with `requestByReference: true`
   (api-reference §2.1); render the QR or use the DC API
   (`igrantio-dcapi-android` / `igrantio-dcapi-ios`).
3. On `presentation_acked`, require `verified === true` and check
   `isVerifiedWithTrustList` / `trustServiceProvider` in the history.

## Adjust for your deployment
- `trusted_authorities[].values`: point at YOUR trust list URL (production
  EU Trust List rather than the EWC pilot list) - the example URL above is
  the EWC pilot list.
- `type`: `etsi_tl` for ETSI trust lists; other anchor types (EBSI, OpenID
  Federation) per the OpenID4VP spec as supported by OWS.
- `vct_values`: your credential's VCT; `format` if not SD-JWT.

## Cross-references
- `igrantio-dcql-credential-sets` - combine with alternatives.
- `igrantio-ebw-owner-id` - LPID verification typically pairs with a trust
  list restriction.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-basic-credential-query-with-trusted-authority/>
(query detailed in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
§2.4.1). Before implementing, fetch the doc page; if it disagrees with this
skill, the documentation wins - follow it and report the drift so the skill
can be updated.
