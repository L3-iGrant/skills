---
name: igrantio-dcql-trusted-authority
description: 'DCQL pattern: accept a credential only when its issuer is anchored in a specific trust list, using the trusted_authorities field (etsi_tl trust list, EBSI, or OpenID Federation trust anchor) in an OpenID4VP verification on the iGrant.io Organisation Wallet Suite. Example: a University Degree SD-JWT accepted only from EU/EWC Trust List issuers. For EUDI Wallet (EUDIW) and European Business Wallet (EUBW) verifiers under eIDAS 2.0.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, trusted_authorities, etsi_tl, trust list, EBSI, OpenID Federation, OpenID4VP, EUDIW, EUBW, eIDAS2
  version: 2026.09.01
  source-doc: https://docs.igrant.io/docs/dcql-basic-credential-query-with-trusted-authority/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: trusted authority restriction

## Scenario
A verifier requests a University Degree credential, accepting it only if
issued by an authority on the EU/EWC Trust List (or EBSI / an OpenID
Federation trust anchor). Credentials from issuers outside the trust
anchor (e.g. a plain `did:key` issuer) are rejected.

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
- `trusted_authorities[].values`: point at YOUR trust list URL (the live
  EU Trust List rather than the EWC pilot list) - the example URL above is
  the EWC pilot list.
- `type`: `etsi_tl` for ETSI trust lists; other anchor types (EBSI, OpenID
  Federation) per the OpenID4VP spec as supported by OWS.
- `vct_values`: your credential's VCT; `format` if not SD-JWT.

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
