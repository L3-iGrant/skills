---
name: igrantio-dcql-trusted-authority
description: 'DCQL pattern: accept a credential only when its issuer is on a given ETSI list or under a given certificate authority, with the trusted_authorities field (etsi_tl: the URL of an ETSI list trust source of the organisation; aki: an AuthorityKeyIdentifier) in an OpenID4VP verification on the iGrant.io Organisation Wallet Suite. Example: a University Degree SD-JWT VC accepted only from issuers on the EWC trusted list. For EUDI Wallet (EUDIW) and European Business Wallet (EUBW) verifiers under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [dcql-query]
  provider: iGrant.io
  keywords: DCQL, trusted_authorities, etsi_tl, aki, trust source, ETSI trusted list, list of trusted entities, X.509, OpenID4VP, EUDIW, EUBW, eIDAS2
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/dcql-basic-credential-query-with-trusted-authority/
  requires-skills: igrantio-ows-overview, igrantio-verifier-backend
---

# DCQL: trusted authority restriction

## Scenario
A verifier asks for a University Degree credential. It accepts the
credential only when its issuer is on the EWC trusted list. The issuer must
sign with an X.509 certificate chain (`x5c`): a credential without a chain,
or from an issuer that is not on the list, does not satisfy the query.

The verifier supports two types of `trusted_authorities`:
- `etsi_tl`: the URL of an ETSI list (an ETSI TS 119 612 trusted list or an
  ETSI TS 119 602 list of trusted entities). The URL must be the URL of a
  trust source of kind `etsi_trusted_list` or `etsi_lote` of your
  organisation; the verifier refuses another value. The check uses the
  stored copy of that trust source, not the URL.
- `aki`: the authority key identifier (base64url) of a CA in the
  certificate chain of the issuer. An `aki` value is only a filter to find
  the matching credentials. It is no proof of trust.

The API also saves a query with another type, but no credential satisfies
it.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.
- A **signing key** with an X.509 certificate chain in Key Management (see
  `igrantio-api-key-management`). The example signs the request with it.

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
3. **Adjust** - which parts of the query change for you: `vct_values`,
   claim paths, the trust list URL or the `aki` values?
4. **Signing key** - which key of Key Management signs the request? _It must
   have an X.509 certificate chain. The wallet can then check your access
   certificate._
5. **Channel** - cross-device QR, same-device Digital Credentials API, or
   both? _Recommend QR first; `igrantio-dcapi-android` and
   `igrantio-dcapi-ios` cover the DC API._
6. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## Add the list as a trust source
Before you create the presentation definition, add the list as a trust
source of your organisation: `POST /v4/config/ows/trust/sources`. Skip this
call when the organisation already has a trust source with this URL (`GET
/v4/config/ows/trust/sources`). The answer is HTTP 201 with
`{"trustSource": {...}}`. Keep `trustSource.id`.

```json
{
  "kind": "etsi_trusted_list",
  "usedFor": "eaa_provider",
  "url": "https://raw.githubusercontent.com/EWC-consortium/ewc-trust-list/refs/heads/main/EWC-TL.xml"
}
```

- A trust source has one role (`usedFor`). Most services on the EWC trusted
  list are EAA providers, so the example uses `eaa_provider`. For your own
  list, use the role of its entries. The `etsi_tl` check has no role, so
  this value does not change the check of this query.
- The wallet verifies the signature of the list only when the trust source
  has `signerCertificates`. Without them, `list.signatureVerified` is
  `false`. See `igrantio-api-trust-anchor`.

## The DCQL query
The presentation definition below holds the DCQL query in `dcqlQuery`. The
key signs the request (client identifier prefix `x509_hash`, the default for
an `x509` key).

```json
{
  "label": "Example university degree from a trusted list",
  "version": "version_01",
  "cryptographicKeyFormat": "x509",
  "cryptographicKeyIdentifier": "<KEY_ID_WITH_CERTIFICATE_CHAIN>",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "university_degree",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["UniversityDegree"] },
        "claims": [
          { "path": ["name"] },
          { "path": ["registrationNumber"] }
        ],
        "require_cryptographic_holder_binding": true,
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
}
```

## Run it on OWS
1. **Add the trust source** - see "Add the list as a trust source".
2. **Create the presentation definition** - `POST
   /v4/config/ows/verifier/presentation-definitions` with the body above.
   Keep `presentationDefinition.presentationDefinitionId` of the answer.
   The `label` is unique in the organisation: a second create with the same
   label gets HTTP 400. Change the label, or reuse the
   `presentationDefinitionId` of the first run.
3. **Prepare an iGrant.io holder** - an iGrant.io organisation wallet as
   holder accepts an `etsi_tl` item only when the list is in
   `acceptedEtsiTrustedLists` of its holder configuration (`PATCH
   /v4/config/ows/holder/configuration`, with the id of a trust source of
   the holder organisation). Else it refuses the request with
   `access_denied`. See `igrantio-api-holder`.
4. **Send the request** - `POST /v4/config/ows/verifier/verifications` with
   `{"presentationDefinitionId": "<presentationDefinitionId>", "requestByReference": true}`.
   Show `verificationHistory.requestUrl` as a QR code, or open it as a deep
   link. Keep `verificationHistory.presentationExchangeId`. For the Digital
   Credentials API, see `igrantio-dcapi-android` and `igrantio-dcapi-ios`.
5. **Wait for the answer** - the webhook event
   `ows.verifier.verification.presentation_received` (see
   `igrantio-api-webhooks`), or the status stream (see
   `igrantio-api-verifier`).
6. **Read the result** - `GET
   /v4/config/ows/verifier/verifications/{presentationExchangeId}`. Require
   `verificationHistory.status` `presentation_acked` and `isVerified`
   `true`. A credential that does not satisfy `trusted_authorities` gives
   `isVerified` `false`. Read the claims in `presentation`. `vpToken` holds
   one text: the JSON of the VP Token, with only the claims that the query
   asks for.

## Adjust for your deployment
- `trusted_authorities[].values` of `etsi_tl`: the URL of the list that
  your issuers are on. Add that list as a trust source first. The example
  URL is the public EWC trusted list.
- `type` `aki`: base64url AuthorityKeyIdentifier values of a CA. Use it to
  find the credentials; it gives no proof of trust.
- `trusted_authorities` do not turn on the trust rule of the query. To make
  the verification fail for an issuer that your trust sources do not trust,
  add `credentialQueryOptions.university_degree` with
  `requiresTrustedCredentialSigner: true` and `acceptedCredentialSigners`
  (see `igrantio-api-verifier`). The result is then at
  `presentationValidity[].university_degree.credentialSignerTrustedListCheck`.
- `vct_values`: the type of your credential (`UniversityDegree` is an
  example type); change `format` if it is not SD-JWT VC.

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
- `igrantio-api-verifier` - the presentation definition fields, the trust
  rule of each credential query, the send and the verification history.
- `igrantio-api-trust-anchor` - the trust sources that the `etsi_tl` values
  and `acceptedCredentialSigners` name.
- `igrantio-dcql-credential-sets` - combine with alternatives.
- `igrantio-ebw-owner-id` - an LPID verification often goes with a trust
  list restriction.

## Source of truth
This workflow mirrors
<https://docs.igrant.io/docs/dcql-basic-credential-query-with-trusted-authority/>
(the query is explained in
<https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/>,
section 2.4.1). Before implementing, fetch the doc page; if it disagrees with
this skill, the documentation wins - follow it and report the drift so the
skill can be updated.
