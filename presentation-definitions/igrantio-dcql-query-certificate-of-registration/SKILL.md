---
name: igrantio-dcql-query-certificate-of-registration
description: 'DCQL query template for the Certificate Of Registration credential, the company registration extract of a legal entity. It asks a wallet for the registered name, legal form, activity, registration date, legal status, organisation number and the registered address, in dc+sd-jwt, jwt_vc_json or mso_mdoc (doctype org.iso.18013.5.1.cor). Use this skill when you onboard a business with a European Business Wallet and you need the exact credential type and claim paths from the iGrant.io verifiable data registry.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: DCQL, Certificate of Registration, company registration, legal entity, org.iso.18013.5.1.cor, registeredAddress, orgNumber, KYB, dc+sd-jwt, jwt_vc_json, mso_mdoc, OpenID4VP, presentation definition, EUBW, eIDAS2
  version: 2026.09.01
  source-doc: https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/certificateOfRegistration
  requires-skills: igrantio-api-verifier
---

# DCQL query: Certificate Of Registration

## When to use
Use this template when you must know that a company exists and who it is. The
Certificate Of Registration credential is the digital form of the registration
extract that a business register issues. The query asks for the registered name,
the legal form, the business activity, the registration date, the legal status,
the organisation number, and the registered address.

Typical uses are know-your-business (KYB) checks, supplier onboarding, business
account opening, and tender or procurement portals.

Ask only for the claims that your check needs. Drop the rest from the query.

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
Registry version: **2025.7.1**.

| Fact | Value |
| --- | --- |
| Title | Certificate Of Registration |
| Purpose | Certificate Of Registration |
| Credential type (`dc+sd-jwt`, `jwt_vc_json`) | `CertificateOfRegistration` |
| Credential type (doctype, `mso_mdoc`) | `org.iso.18013.5.1.cor` |
| Namespace (`mso_mdoc`) | `org.iso.18013.5.1` |
| Formats | `dc+sd-jwt`, `jwt_vc_json`, `mso_mdoc` |

The doctype and the namespace differ for `mso_mdoc`. The doctype names the
document, `org.iso.18013.5.1.cor`. The namespace groups the data elements,
`org.iso.18013.5.1`.

## Claims

### Format `dc+sd-jwt`

```json
{
  "claims": [
    {
      "path": ["name"]
    },
    {
      "path": ["legalForm"]
    },
    {
      "path": ["activity"]
    },
    {
      "path": ["registrationDate"]
    },
    {
      "path": ["legalStatus"]
    },
    {
      "path": ["registeredAddress"]
    },
    {
      "path": ["registeredAddress", "adminUnitLevel1"]
    },
    {
      "path": ["registeredAddress", "fullAddress"]
    },
    {
      "path": ["registeredAddress", "locatorDesignator"]
    },
    {
      "path": ["registeredAddress", "postCode"]
    },
    {
      "path": ["registeredAddress", "postName"]
    },
    {
      "path": ["registeredAddress", "thoroughFare"]
    },
    {
      "path": ["orgNumber"]
    }
  ]
}
```

### Format `jwt_vc_json`

```json
{
  "claims": [
    {
      "path": ["credentialSubject", "name"]
    },
    {
      "path": ["credentialSubject", "legalForm"]
    },
    {
      "path": ["credentialSubject", "activity"]
    },
    {
      "path": ["credentialSubject", "registrationDate"]
    },
    {
      "path": ["credentialSubject", "legalStatus"]
    },
    {
      "path": ["credentialSubject", "registeredAddress"]
    },
    {
      "path": ["credentialSubject", "registeredAddress", "adminUnitLevel1"]
    },
    {
      "path": ["credentialSubject", "registeredAddress", "fullAddress"]
    },
    {
      "path": ["credentialSubject", "registeredAddress", "locatorDesignator"]
    },
    {
      "path": ["credentialSubject", "registeredAddress", "postCode"]
    },
    {
      "path": ["credentialSubject", "registeredAddress", "postName"]
    },
    {
      "path": ["credentialSubject", "registeredAddress", "thoroughFare"]
    },
    {
      "path": ["credentialSubject", "orgNumber"]
    }
  ]
}
```

### Format `mso_mdoc`

```json
{
  "claims": [
    {
      "path": ["org.iso.18013.5.1", "name"]
    },
    {
      "path": ["org.iso.18013.5.1", "legalForm"]
    },
    {
      "path": ["org.iso.18013.5.1", "activity"]
    },
    {
      "path": ["org.iso.18013.5.1", "registrationDate"]
    },
    {
      "path": ["org.iso.18013.5.1", "legalStatus"]
    },
    {
      "path": ["org.iso.18013.5.1", "registeredAddress"]
    },
    {
      "path": ["org.iso.18013.5.1", "orgNumber"]
    }
  ]
}
```

The registry also holds an older `mso_mdoc` file that names each claim with a
`namespace` and a `claim_name` pair. It lists the same seven claims. Use the
`path` form above for a `version_01` presentation definition.

## How to read the `path` arrays
The `path` array names one claim, one element per level.

- **`dc+sd-jwt`**: the path starts at the top level of the SD-JWT VC payload.
  `["registeredAddress", "postCode"]` reads the `postCode` member inside the
  `registeredAddress` object.
- **`jwt_vc_json`**: the path starts with `credentialSubject`, because a W3C VC
  keeps the subject claims under that key. Every path is one element longer than
  the `dc+sd-jwt` path for the same claim.
- **`mso_mdoc`**: the path holds exactly two elements. The **first element is the
  namespace**, here `org.iso.18013.5.1`. The second element is the data element
  name. An mdoc has no nesting below the data element, so the address arrives as
  one `registeredAddress` object. The six single address members that the other
  two formats list have no `mso_mdoc` counterpart.

`registeredAddress` appears twice in the SD-JWT VC and W3C VC lists: once as the
whole object, and once per member. Ask for the whole object when you want the
full address. Ask for single members when you want less, for example the post
code only.

## Use with the iGrant.io API
Create a presentation definition with
`POST /v2/config/digital-wallet/openid/sdjwt/presentation-definition`. Put the
claims of one format into one entry of `dcqlQuery.credentials[]`. Give the entry
an `id`, set `format`, and set `meta` for that format:

| `format` | `meta` |
| --- | --- |
| `dc+sd-jwt` | `{ "vct_values": ["CertificateOfRegistration"] }` |
| `jwt_vc_json` | `{ "type_values": [["CertificateOfRegistration"]] }` |
| `mso_mdoc` | `{ "doctype_value": "org.iso.18013.5.1.cor" }` |

The format gates the `meta` keys. The server refuses `vct_values` on
`jwt_vc_json` and refuses anything but `doctype_value` on `mso_mdoc`.

Set `version` to `version_01`.

```json
{
  "label": "Company registration check",
  "version": "version_01",
  "responseType": "vp_token",
  "responseMode": "direct_post",
  "dcqlQuery": {
    "credentials": [
      {
        "id": "certificate-of-registration",
        "format": "dc+sd-jwt",
        "meta": { "vct_values": ["CertificateOfRegistration"] },
        "claims": [
          { "path": ["name"] },
          { "path": ["legalForm"] },
          { "path": ["legalStatus"] },
          { "path": ["orgNumber"] },
          { "path": ["registeredAddress"] }
        ]
      }
    ]
  }
}
```

Then send the verification request with the V3 send operation,
`POST /v3/config/digital-wallet/openid/sdjwt/verification/send`, and pass the
`presentationDefinitionId` of the record that you created. Read the disclosed
claims from `presentation` on the verification history record.

The `igrantio-api-verifier` skill holds the full operation reference: every
field of the presentation definition, every transport option, and the shape of
the verification history record.

## Source is the registry
The iGrant.io verifiable data registry is the source of truth for this
template. If this skill and the registry file disagree, **the registry wins**.
Fetch the source directory before you rely on a claim path:

- <https://github.com/decentralised-dataexchange/verifiable-data-registry/tree/main/presentationDefinitions/dcqlQuery/certificateOfRegistration>
- Raw file: <https://raw.githubusercontent.com/decentralised-dataexchange/verifiable-data-registry/main/presentationDefinitions/dcqlQuery/certificateOfRegistration/2025.7.1/dc%2Bsd-jwt.schema.json>

Follow the registry and report the drift so this skill can be corrected.
