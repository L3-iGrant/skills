---
name: igrantio-dcql-query-mobile-driving-license
description: 'DCQL query template for the ISO 18013-5 Mobile Driving Licence (mDL), doctype org.iso.18013.5.1.mDL in mso_mdoc. It asks a wallet for the 25 mandatory and optional data elements of the org.iso.18013.5.1 namespace, from family_name and driving_privileges to portrait, age_over_18 and un_distinguishing_sign. Use this skill when you build car rental, roadside checks, vehicle hire or an age gate on an mDL, and you need the exact doctype, namespace and claim paths from the iGrant.io verifiable data registry.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, mDL, mobile driving licence, ISO 18013-5, org.iso.18013.5.1.mDL, driving_privileges, age_over_18, portrait, mso_mdoc, OpenID4VP, presentation definition, EUDIW, eIDAS2
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/mobileDrivingLicense
  requires-skills: igrantio-api-verifier
---

# DCQL query: Mobile Driving Licence (mDL)

## When to use
Use this template when you must check a driving licence that a wallet holds. The
query lists the 25 data elements of the ISO 18013-5 mDL: the holder name and
birth data, the document number and dates, the issuing authority and country,
the driving privileges, the portrait, and the physical description.

Typical uses are car and van rental, vehicle hire desks, roadside checks, and an
age gate that uses the `age_over_18` or `age_over_21` flag of the licence.

The full list is large and holds a portrait and a home address. Ask only for the
data elements that your check needs. A rental desk often needs the name, the
document number, the expiry date and the driving privileges, and nothing else.
For an age gate alone, prefer the Age Verification attestation, which discloses
one boolean flag. See `igrantio-dcql-query-age-verification`.

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
3. **Format** - `dc+sd-jwt`, `jwt_vc_json` or `mso_mdoc`? _Match the format
   the issuer used._
4. **Claims** - which claims does the use case need? _Ask for the minimum._
5. **Channel** - cross-device QR, same-device Digital Credentials API, or
   both? _Recommend QR first; `igrantio-dcapi-android` and
   `igrantio-dcapi-ios` cover the DC API._
6. **Trusted authorities** - accept any issuer, or only issuers on a trust
   list?
7. **Trust list** - is your Wallet-Relying Party Access Certificate (WRPAC)
   registered in the trust list? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>. Until then
   the wallet shows an unverified warning for your request.

## Template facts
Registry version: **2026.4.1**.

| Fact | Value |
| --- | --- |
| Title | Mobile Driving Licence (mDL) |
| Purpose | Mobile Driving Licence (mDL) |
| Credential type (doctype) | `org.iso.18013.5.1.mDL` |
| Namespace | `org.iso.18013.5.1` |
| Format | `mso_mdoc` |

The registry holds one format for this template. There is no SD-JWT VC file and
no JWT VC file. The mDL is an ISO 18013-5 document, and `mso_mdoc` is its
native format.

The doctype and the namespace differ. The doctype names the document,
`org.iso.18013.5.1.mDL`. The namespace groups the data elements,
`org.iso.18013.5.1`.

## Claims

### Format `mso_mdoc`

```json
{
  "claims": [
    { "path": ["org.iso.18013.5.1", "administrative_number"] },
    { "path": ["org.iso.18013.5.1", "age_birth_year"] },
    { "path": ["org.iso.18013.5.1", "age_in_years"] },
    { "path": ["org.iso.18013.5.1", "age_over_18"] },
    { "path": ["org.iso.18013.5.1", "age_over_21"] },
    { "path": ["org.iso.18013.5.1", "birth_date"] },
    { "path": ["org.iso.18013.5.1", "birth_place"] },
    { "path": ["org.iso.18013.5.1", "document_number"] },
    { "path": ["org.iso.18013.5.1", "driving_privileges"] },
    { "path": ["org.iso.18013.5.1", "expiry_date"] },
    { "path": ["org.iso.18013.5.1", "eye_colour"] },
    { "path": ["org.iso.18013.5.1", "family_name"] },
    { "path": ["org.iso.18013.5.1", "given_name"] },
    { "path": ["org.iso.18013.5.1", "hair_colour"] },
    { "path": ["org.iso.18013.5.1", "height"] },
    { "path": ["org.iso.18013.5.1", "issue_date"] },
    { "path": ["org.iso.18013.5.1", "issuing_authority"] },
    { "path": ["org.iso.18013.5.1", "issuing_country"] },
    { "path": ["org.iso.18013.5.1", "issuing_jurisdiction"] },
    { "path": ["org.iso.18013.5.1", "portrait"] },
    { "path": ["org.iso.18013.5.1", "portrait_capture_date"] },
    { "path": ["org.iso.18013.5.1", "resident_address"] },
    { "path": ["org.iso.18013.5.1", "sex"] },
    { "path": ["org.iso.18013.5.1", "un_distinguishing_sign"] },
    { "path": ["org.iso.18013.5.1", "weight"] }
  ]
}
```

## How to read the `path` arrays
For `mso_mdoc`, the `path` array holds exactly two elements:

1. the **namespace**, here `org.iso.18013.5.1`;
2. the **data element name**, here the mDL data element.

An mdoc has no nesting below the data element. `driving_privileges` arrives as
one whole structure with every licence category, the issue date and the expiry
date of each. You cannot ask for one category alone.

## Use with the iGrant.io API
Create a presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`. Put the
claims into one entry of `dcqlQuery.credentials[]`. Give the entry an `id`, set
`format` to `mso_mdoc`, and set `meta.doctype_value` to `org.iso.18013.5.1.mDL`.
`mso_mdoc` allows `doctype_value` only. The server refuses `vct_values` and
`type_values` for this format.

Set `version` to `version_01`.

```json
{
  "label": "Driving licence check at pickup",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "mdl",
        "format": "mso_mdoc",
        "meta": { "doctype_value": "org.iso.18013.5.1.mDL" },
        "claims": [
          { "path": ["org.iso.18013.5.1", "family_name"] },
          { "path": ["org.iso.18013.5.1", "given_name"] },
          { "path": ["org.iso.18013.5.1", "document_number"] },
          { "path": ["org.iso.18013.5.1", "expiry_date"] },
          { "path": ["org.iso.18013.5.1", "driving_privileges"] }
        ]
      }
    ]
  }
}
```

Then send the verification request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`, and pass the
`presentationDefinitionId` of the record that you created. Read the disclosed
data elements from `presentation` on the verification history record.

For a same-device check in a browser, the presentation definition also supports
the ISO 18013-7 Annex C profile. That profile needs a different `version` value,
`trustAnchor` set to `x509`, and `expectedOrigins`. Read `igrantio-api-verifier`
before you use it.

The `igrantio-api-verifier` skill holds the full operation reference: every
field of the presentation definition, every transport option, and the shape of
the verification history record.

## Source is the registry
The iGrant.io verifiable data registry is the source of truth for this
template. If this skill and the registry file disagree, **the registry wins**.
Fetch the source directory before you rely on a claim path:

- <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/mobileDrivingLicense>
- Raw file: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/mobileDrivingLicense/2026.4.1/mso_mdoc.schema.v1.json>

Follow the registry and report the drift so this skill can be corrected.
