---
name: igrantio-eu-age-verification
description: 'EU Age Verification on the iGrant.io Organisation Wallet Suite: issue an age verification attestation as an ISO/IEC 18013-5 mdoc (doctype eu.europa.ec.av.1, boolean age_over_NN claims) via OpenID4VCI InTime, then verify a selectively disclosed age_over_18 proof via OpenID4VP + DCQL - no birthdate or identity revealed. Implements the EU Age Verification solution profile for EUDI Wallet (EUDIW) under eIDAS 2.0. Use for age-restricted content, products, or services.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EU age verification, age_over_18, mso_mdoc, eu.europa.ec.av.1, EUDIW, eIDAS2, OpenID4VCI, OpenID4VP, DCQL, selective disclosure
  version: 2026.07.03
  source-doc: https://docs.igrant.io/docs/eu-age-verification/
  requires-skills: igrantio-ows-overview, igrantio-issuer-backend, igrantio-verifier-backend
---

# EU Age Verification (EUDI Wallet)

## When to use
Prove an age threshold (18, 21, 65, any `age_over_NN`) without revealing
birthdate or identity. The attestation is an **ISO/IEC 18013-5 mdoc**,
doctype **`eu.europa.ec.av.1`**, with boolean `age_over_NN` claims and
selective disclosure.

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
