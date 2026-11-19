---
name: igrantio-ebw-owner-id
description: 'Issue a European Business Wallet Owner ID (EBWOID, earlier name Legal Person Identification Data, LPID) to an organisation wallet with OpenID4VCI deferred issuance on the iGrant.io Organisation Wallet Suite, per European Wallet Consortium (EWC) RFC005. A dc+sd-jwt credential with the vct LegalPersonIdentificationData (data schema identifier LPID): create the credential definition (one credential configuration with its X.509 signing key), issue a deferred credential offer (one issuance history, identified by its credential exchange id), and give the claims after the validation of the legal person. Use when an application must issue the EUBW owner identity credential to a business wallet under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [recipe]
  provider: iGrant.io
  keywords: EUBW, European Business Wallet, EBWOID, LPID, EWC RFC005, OpenID4VCI, deferred issuance, issuance history, credential exchange id, SD-JWT, eIDAS2, EUDIW
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/european-business-wallet-owner-id/
  requires-skills: igrantio-ows-overview, igrantio-issuer-backend
---

# European Business Wallet Owner ID (EBWOID / LPID)

## When to use
Issue the owner identity credential of a European Business Wallet (EBW
Owner ID): Legal Person Identification Data (LPID) per EWC RFC005. The data
schema identifier is `LPID`; the vct is `LegalPersonIdentificationData`.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- A **signing key** with an X.509 certificate chain in Key Management (see
  `igrantio-api-key-management`). The credential configuration names it.

## Ask the integrator first
Ask one question at a time. Wait for the answer. Give the recommended
default with each question. Look up facts in the project (framework,
environment variables, an existing backend) instead of asking for them.
Record the answers before you write code.

1. **Environment** - demo, staging or production? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - do you have the OWS API key for that environment? If not,
   request it from [support@igrant.io](mailto:support@igrant.io) before you
   continue.
3. **Signing key** - which key of Key Management signs the credentials?
   _`x509` is the only key format. The key must be an active key of the
   organisation with a certificate chain._
4. **Holder** - how does the holder organisation get the offer? _Default:
   from the QR code or the link of the offer. When its wallet has a
   credential offer endpoint, the issuer can also send the offer there
   (`credentialOfferEndpoint`, optional)._
5. **Legal-person data** - where do the validated claims come from (a
   register API, or manual entry)?
6. **Trust list** - is your issuer certificate (the trust anchor) registered
   in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   wallets show your credentials as unverified.

## Workflow (OpenID4VCI, deferred)
1. **Create the credential definition** - `POST
   /v4/config/ows/issuer/credential-definitions`. The signing key is in
   the credential configuration: `cryptographicKeyFormat: "x509"` and
   `cryptographicKeyIdentifier`. The claims follow EWC RFC005. Keep
   `credentialDefinition.id` (the `credentialDefinitionId`) of the answer.
   The `label` is unique in the organisation: a second create with the same
   label gets HTTP 400. Change the label, or reuse the
   `credentialDefinitionId` of the first run.

   ```json
   {
     "label": "Example EBW Owner ID",
     "version": "version_01",
     "credentialConfigurations": [
       {
         "credentialFormat": "dc+sd-jwt",
         "vct": "LegalPersonIdentificationData",
         "cryptographicKeyFormat": "x509",
         "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
         "expirationInDays": 365,
         "revocation": {
           "enabled": true,
           "method": "status_list",
           "revokeWhenHolderDeletes": true
         },
         "display": {
           "name": "Legal Person Identification Data",
           "description": "Legal Person Identification Data",
           "backgroundColor": "#ffffff",
           "textColor": "#000000"
         },
         "claims": {
           "claims": [
             { "path": ["legal_person_id"], "mandatory": true, "limitDisclosure": true },
             { "path": ["legal_person_name"], "mandatory": true, "limitDisclosure": true },
             { "path": ["issuer_name"], "mandatory": true, "limitDisclosure": true },
             { "path": ["issuer_id"], "mandatory": true, "limitDisclosure": true },
             { "path": ["issuer_country"], "mandatory": true, "limitDisclosure": true },
             { "path": ["authentic_source_id"], "mandatory": true, "limitDisclosure": true },
             { "path": ["authentic_source_name"], "mandatory": true, "limitDisclosure": true }
           ]
         }
       }
     ]
   }
   ```
2. **Issue (deferred)** - `POST /v4/config/ows/issuer/issuance-history`.
   The call makes one credential offer and one issuance history for the
   configuration. Send no claims now: you give them after the validation.

   ```json
   {
     "credentialDefinitionId": "<credentialDefinitionId>",
     "mode": "deferred"
   }
   ```

   To also send the offer to the wallet of the holder, add
   `"credentialOfferEndpoint": "<credential offer endpoint of the holder wallet>"`.
   Do not send a placeholder: the API refuses a value that is not a URI.
   The answer is HTTP 201. Give `offer.uri` to the holder as a QR code or a
   link. Keep `issuanceHistory[0].credentialExchangeId`.
3. **The holder takes the offer** in its Organisation Wallet Suite. The
   wallet asks for the credential and waits at the Deferred Credential
   Endpoint (status `credential_deferred`).
4. **Give the claims** - when the legal-person data is validated, `PUT
   /v4/config/ows/issuer/issuance-history/{credentialExchangeId}/claims`
   with the claims of the configuration. The sample values are fictional.

   ```json
   {
     "claims": {
       "legal_person_id": "EX-LPID-000123",
       "legal_person_name": "Example Org AB",
       "issuer_name": "Example Business Register",
       "issuer_id": "EX-REG-001",
       "issuer_country": "SE",
       "authentic_source_id": "EX-REG-001",
       "authentic_source_name": "Example Business Register"
     }
   }
   ```

   The answer is HTTP 200 with the issuance history. The wallet then gets
   the credential at its next call to the Deferred Credential Endpoint.
5. **Follow the issuance** - subscribe to the webhook events
   `ows.issuer.issuance_history.credential_deferred`,
   `ows.issuer.issuance_history.claims_supplied`,
   `ows.issuer.issuance_history.credential_issued` and
   `ows.issuer.issuance_history.credential_accepted` (see
   `igrantio-api-webhooks`), or read `GET
   /v4/config/ows/issuer/issuance-history/{credentialExchangeId}`. The
   events and the SSE push follow `igrantio-issuer-backend`.

## Adjust for your deployment
- Fill the LPID claim values from your organisation register (the legal
  name and the registration number of the legal person).
- The registry LPID template (`igrantio-credential-schema-lpid`) uses other
  claim names (`identifier`, `legalName`). A verifier query must use the
  claim names of the credential that you issue.
- Set `credentialCategory` in the configuration (`eaa`, `qeaa` or
  `pub-eaa`) to the eIDAS category under which you issue. When you do not
  set it, it is `eaa`. The platform compares the certificate of the signing
  key with the category, and the answer shows when the key does not fit
  (`signingKeyCheck` with the result `does-not-fit`). The save is not
  refused.
- `revokeWhenHolderDeletes: true` revokes the credential when the wallet
  sends the notification `credential_deleted`. Check this rule with your
  compliance owner.
- Deferred is the normal mode here, because the validation of the legal
  person happens between the offer and the claims. Use `in_time` only when
  the data is validated before the offer: then send the claims in
  `credentials` of the issue call (see `igrantio-api-issuer`).

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
- `igrantio-api-issuer` - the credential definition fields, the issue call,
  the deferred claims and the issuance history.
- `igrantio-issuer-backend` / `igrantio-issuer-frontend` - the issuance
  building blocks that this workflow runs on.
- `igrantio-dcql-trusted-authority` - verify an LPID against a trust list.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/european-business-wallet-owner-id/>.
Before implementing, fetch that page; if it disagrees with this skill
(endpoints, payload fields, credential type naming), the documentation wins -
follow it and report the drift so the skill can be updated.
