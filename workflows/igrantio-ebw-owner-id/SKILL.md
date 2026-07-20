---
name: igrantio-ebw-owner-id
description: 'Issue a European Business Wallet Owner ID (Legal Person Identification Data, LPID) to an organisation wallet using OpenID4VCI deferred issuance on the iGrant.io Organisation Wallet Suite, per European Wallet Consortium (EWC) RFC005. SD-JWT credential; the schema identifier stays LPID for backwards compatibility. Use when an application must issue the EUBW owner identity credential to a business wallet under eIDAS 2.0.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUBW, European Business Wallet, EBWOID, LPID, EWC RFC005, OpenID4VCI, SD-JWT, eIDAS2, EUDIW
  version: 2026.07.03
  source-doc: https://docs.igrant.io/docs/european-business-wallet-owner-id/
  requires-skills: igrantio-ows-overview, igrantio-issuer-backend
---

# European Business Wallet Owner ID (EBWOID / LPID)

## When to use
Issue the owner identity credential of a European Business Wallet: Legal
Person Identification Data (LPID) per EWC RFC005. The credential type was
renamed to EBW Owner ID; the schema identifier remains `LPID`.

## Workflow (OpenID4VCI, deferred)
1. **API key** - organisation API key from iGrant.io
   ([support@igrant.io](mailto:support@igrant.io)); held server-side only
   (see `igrantio-backend-proxy`).
2. **Create the credential definition** - `credentialFormat: SD-JWT`,
   `credentialType: LPID`, OpenID4VCI version 01. Keep the returned
   `credentialDefinitionId` and the `credentialDefinitions[].id`.
3. **Issue (Deferred)** - start deferred issuance with the
   `credentialDefinitionId`; the holder organisation's wallet endpoint
   receives the offer. Exact issue payloads: `igrantio-ows-overview`
   api-reference §1.1.
4. **Holder receives the offer** in its Organisation Wallet Suite.
5. **Complete the deferred issue** - `PUT` the credential history with the
   legal-person claims once validated (api-reference §1.2), passing the
   `credential.id` from step 2.

Track progress over webhooks/SSE exactly as in `igrantio-issuer-backend`.

## Adjust for your deployment
- Replace the LPID claim values with your organisation's registry data
  (legal name, registration number, jurisdiction).
- Deferred is the norm here because legal-person validation happens between
  offer and claims; switch to `InTime` only if the data is pre-validated.
- Tenant/base URLs and API-key handling follow `igrantio-backend-proxy`.

## Cross-references
- `igrantio-issuer-backend` / `igrantio-issuer-frontend` - the generic
  issuance building blocks this workflow runs on.
- `igrantio-dcql-trusted-authority` - verify an LPID against a trust list.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/european-business-wallet-owner-id/>.
Before implementing, fetch that page; if it disagrees with this skill
(endpoints, payload fields, credential type naming), the documentation wins -
follow it and report the drift so the skill can be updated.
