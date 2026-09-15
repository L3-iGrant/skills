---
name: igrantio-eu-age-verification
description: 'EU Age Verification on the iGrant.io Organisation Wallet Suite: issue an age verification attestation as an ISO/IEC 18013-5 mdoc (doctype eu.europa.ec.av.1, boolean age_over_NN claims) via OpenID4VCI InTime, then verify a selectively disclosed age_over_18 proof via OpenID4VP + DCQL - no birthdate or identity revealed. Implements the EU Age Verification solution profile for EUDI Wallet (EUDIW) under eIDAS 2.0. Use for age-restricted content, products, or services.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EU age verification, age_over_18, mso_mdoc, eu.europa.ec.av.1, EUDIW, eIDAS2, OpenID4VCI, OpenID4VP, DCQL, selective disclosure
  version: 2026.09.01
  source-doc: https://docs.igrant.io/docs/eu-age-verification/
  requires-skills: igrantio-ows-overview, igrantio-issuer-backend, igrantio-verifier-backend
---

# EU Age Verification (EUDI Wallet)

## When to use
Prove an age threshold (18, 21, 65, any `age_over_NN`) without revealing
birthdate or identity. The attestation is an **ISO/IEC 18013-5 mdoc**,
doctype **`eu.europa.ec.av.1`**, with boolean `age_over_NN` claims and
selective disclosure.

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
3. **Side** - issuer, verifier, or both?
4. **Threshold** - which `age_over_NN` claims?
5. **Channel** - cross-device QR, same-device Digital Credentials API, or
   both? _Recommend QR first; `igrantio-dcapi-android` and
   `igrantio-dcapi-ios` cover the DC API._
6. **Trust list** - is your certificate registered in the trust list (the
   trust anchor for an issuer, the WRPAC for a relying party)? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>.

## Workflow
**Issuer side (once per user):**
1. Create a credential definition: format `mso_mdoc`, doctype
   `eu.europa.ec.av.1`, claims such as `age_over_18`, `age_over_21`,
   `age_over_65`.
2. Issue **InTime** with the boolean claim values, e.g.
   `{ "age_over_18": true, "age_over_21": false, "age_over_65": false }`.
   The response carries `CredentialExchangeId` + the
   `openid-credential-offer://` QR/deeplink (render with
   `igrantio-qr-code`). Completion signal: webhook
   `openid.credential.credential_acked`.

**Verifier side (per check):**
3. Create a presentation definition (DCQL) for `mso_mdoc` /
   `eu.europa.ec.av.1` requesting only the needed boolean, e.g.
   `age_over_18`.
4. Send the verification request (v3) with that
   `presentationDefinitionId`; render the `openid4vp://` QR / deeplink.
5. Wallet discloses only the boolean; done on
   `openid.presentation.presentation_acked.v3` with `verified === true`.

Endpoints, payload shapes, and response fields: `igrantio-ows-overview`
api-reference §1 and §2.

## Adjust for your deployment
- Pick the `age_over_NN` claims your use case needs; request exactly one
  boolean per verification - requesting more defeats data minimisation.
- Same-device flows can use the Digital Credentials API instead of a QR:
  see `igrantio-dcapi-android` / `igrantio-dcapi-ios`.
- If you only verify (a national issuer provides the attestation), skip the
  issuer steps and keep 3-5.

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
- `igrantio-dcql-claim-sets` - age check with a birthdate fallback when the
  wallet lacks a boolean claim.
- `igrantio-verifier-frontend` - QR + DC API rendering; `igrantio-qr-code`
  for the QR panel.

## Source of truth
This workflow mirrors <https://docs.igrant.io/docs/eu-age-verification/>.
Before implementing, fetch that page; if it disagrees with this skill
(doctype, claim names, endpoints), the documentation wins - follow it and
report the drift so the skill can be updated.
