---
name: igrantio-api-trust-anchor
description: 'The Trust Anchor group of the iGrant.io OID4VC API: manage the trust authorities that the service uses, in addition to the NXD Foundation trust lists, to validate issuers and verifiers in OID4VCI and OpenID4VP flows. A trust authority is an ETSI TS 119 612 trusted list (XML), an ETSI TS 119 602 list of trusted entities (JSON), or inline X.509 CA certificates. Create, read, update, enable or disable, delete and list trust authorities. Use when you decide which issuers a verifier accepts, or which verifiers a wallet trusts.'
license: Apache-2.0
metadata:
  categories: [ows-api, education]
  provider: iGrant.io
  keywords: trust anchor, trust authority, trust list, ETSI_TL, ETSI_TL_JSON, X509_CA, ETSI TS 119 612, ETSI TS 119 602, LoTE, X.509 CA, issuer validation, verifier validation, OpenID4VP, OID4VCI, EUDIW, eIDAS2
  version: 2026.10.01
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, ETSI TS 119 612 trust lists, ETSI TS 119 602 lists of trusted entities
  auth: OWS API key (Authorization "ApiKey <YOUR_API_KEY>")
---

# iGrant.io OID4VC API - Trust Anchor group

## When to use
Use this skill when you:
- add a **trust list** or a **CA certificate** to the organisation so that the
  service validates the issuers and verifiers it meets in a flow;
- read, update, enable, disable or delete a trust authority.

Base URL for demo: `https://demo-api.igrant.io`.
Auth header: `Authorization: ApiKey <YOUR_API_KEY>` (note the space after
`ApiKey`).

The service always checks the NXD Foundation trust lists (see
`igrantio-trustlist-entries`); that source needs no trust authority. The
enabled trust authorities of the organisation are checked in addition.

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
3. **Organisation** - the main wallet, or a sandbox organisation? _A sandbox
   needs an API key that is bound to it; see `igrantio-api-sandboxes`._
4. **Trust sources** - which trust lists or CA certificates must the
   organisation accept in addition to the NXD Foundation trust lists?
5. **Role** - restrict issuers (as a verifier) or verifiers (as a wallet)?

## Endpoint reference

| Method | Path | Purpose | Docs |
| --- | --- | --- | --- |
| POST | `/v2/config/digital-wallet/openid/trust-authority` | Create a trust authority | [config-create-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-trust-authority/) |
| GET | `/v2/config/digital-wallet/openid/trust-authorities` | List the trust authorities of the organisation | [config-list-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-trust-authority/) |
| GET | `/v2/config/digital-wallet/openid/trust-authority/{trustAuthorityId}` | Read 1 trust authority | [config-read-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-trust-authority/) |
| PUT | `/v2/config/digital-wallet/openid/trust-authority/{trustAuthorityId}` | Update a trust authority (partial) | [config-update-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-trust-authority/) |
| PUT | `/v2/config/digital-wallet/openid/trust-authority/{trustAuthorityId}/disable` | Enable or disable a trust authority | [config-toggle-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-toggle-digital-wallet-open-id-trust-authority/) |
| DELETE | `/v2/config/digital-wallet/openid/trust-authority/{trustAuthorityId}` | Delete a trust authority | [config-delete-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-trust-authority/) |

## Key fields

### Trust authority object
```json
{
  "type": "ETSI_TL",
  "value": "https://raw.githubusercontent.com/EWC-consortium/ewc-trust-list/refs/heads/main/EWC-TL.xml",
  "name": "EWC Trust List"
}
```

`type` takes three values (the service changes the value to upper case):

| `type` | `value` |
| --- | --- |
| `ETSI_TL` | The HTTP or HTTPS URL of an ETSI TS 119 612 trusted list (XML). At most 2048 characters. |
| `ETSI_TL_JSON` | The HTTP or HTTPS URL of an ETSI TS 119 602 list of trusted entities (JSON). At most 2048 characters. |
| `X509_CA` | PEM text with 1 to 10 CA certificates (basicConstraints `cA=TRUE`, not expired) and, optionally, up to 10 CRLs that these CAs signed. At most 65536 characters. A private key is refused. The service stores the PEM text in a normalised form. |

An `X509_CA` trust authority trusts a presented certificate chain when its
leaf is one of the CA certificates, or when it validates to one of them
(RFC 5280). Its CRLs are the only revocation source, and the service fetches
nothing.

- On create, `type` and `value` are required and `name` is optional (at most
  255 characters). Create answers with **`201`**.
- The update is **partial**: send only the fields to change. The service
  checks the new `value` against the type after the update. Read and update
  answer with `200`.
- Every answer wraps one record as `{ "trustAuthority": { … } }`. The stored
  object adds `id` (a UUID), `disabled` (boolean), `createdAt` and `updatedAt`
  (numbers, Unix seconds). `name` is an empty string when none was given.
- The toggle operation takes `{ "disabled": true }` - give the **wanted end
  state** as a JSON boolean, not a flip - and answers with the full updated
  object. A disabled trust authority is not used for credential or verifier
  trust validation.
- Delete answers with `200` and **no response body**. After the delete the
  service no longer uses that trust authority to validate issuers and
  verifiers.
- Read, update, toggle and delete answer `404` when the organisation has no
  trust authority with that identifier, and `400` when the identifier is not a
  UUID.

### List
The list holds only the trust authorities that the organisation created.
Query parameters: `offset`, `limit` (at most **100**; a larger value gives
HTTP 400), `type`, and `name_contains` and `value_contains` (parts of the name
or the value, case-insensitive).

The list answers with a `trustAuthority` **array** (singular field name, plural
content) plus `pagination`.

## Sandbox call style
To run **every operation in this group** in a sandbox organisation, call the
API with an API key that is bound to that sandbox organisation. The service
takes the sandbox organisation from the key and runs the operation against the
wallet of that sandbox organisation, and not against the main wallet of the
organisation. You send no extra header.

To get such a key, select the sandbox organisation in the iGrant.io dashboard,
then create the API key under **Account > Developer APIs** (**Create API Key**).
The key is bound to that sandbox organisation, and every call with it runs
there.

See `igrantio-api-sandboxes` for creating and deploying a sandbox organisation.

## Documentation is the source of truth
If this skill and the linked documentation disagree, **the documentation wins**.
Fetch the linked page, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, to check for
updates before you build. Report the drift so the skill can be corrected.

## Cross-references
- `igrantio-ows-overview` - architecture and glossary.
- `igrantio-dcql-trusted-authority` - use a trust list in a DCQL query so that
  a verifier accepts only trust-list-anchored issuers.
- `igrantio-api-key-management` - the signing keys and certificate chains that
  the organisation signs with.
- `igrantio-api-sandboxes` - sandbox organisations and their API keys.
- `igrantio-trustlist-entries` - register an issuer or verifier certificate in
  the NXD Foundation trust lists.
