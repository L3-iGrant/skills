---
name: igrantio-api-trust-anchor
description: 'The Trust Anchor group of the iGrant.io OID4VC API: manage the ETSI trust lists (trust authorities) that the service uses to validate issuers and verifiers in OID4VCI and OpenID4VP flows. Create, read, update, enable or disable, delete and list trust authorities, and work with the two built-in trust lists that every organisation gets. Use when you decide which issuers a verifier accepts, or which verifiers a wallet trusts.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: trust anchor, trust authority, trust list, ETSI_TL, ETSI TS 119 612, issuer validation, verifier validation, OpenID4VP, OID4VCI, EUDIW, eIDAS2
  version: 2026.08.01
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, ETSI TS 119 612 trust lists
  auth: OWS API key (Authorization "ApiKey <key>") or bearer access token
---

# iGrant.io OID4VC API - Trust Anchor group

## When to use
Use this skill when you:
- add an **ETSI trust list** to the organisation so that the service validates
  the issuers and verifiers it meets in a flow;
- read, update, enable, disable or delete a trust authority;
- must know why the list starts with 2 records that you did not create.

Base URL for demo: `https://demo-api.igrant.io`.
Auth header: `Authorization: ApiKey <key>` (note the trailing space in the
prefix). A bearer access token also works.

A trust authority points to a trust list. The service uses the trust lists to
validate issuers and verifiers in OID4VCI and OpenID4VP flows.

## Endpoint reference

| Method | Path | Purpose | Docs |
| --- | --- | --- | --- |
| POST | `/v2/config/digital-wallet/openid/trust-authority` | Create a trust authority | [config-create-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-trust-authority/) |
| GET | `/v2/config/digital-wallet/openid/trust-authorities` | List trust authorities, with the 2 built-in trust lists first | [config-list-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-trust-authority/) |
| GET | `/v2/config/digital-wallet/openid/trust-authority/{trustAuthorityId}` | Read 1 trust authority | [config-read-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-trust-authority/) |
| PUT | `/v2/config/digital-wallet/openid/trust-authority/{trustAuthorityId}` | Update a trust authority (send all 3 fields) | [config-update-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-trust-authority/) |
| PUT | `/v2/config/digital-wallet/openid/trust-authority/{trustAuthorityId}/disable` | Enable or disable a trust authority | [config-toggle-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-toggle-digital-wallet-open-id-trust-authority/) |
| DELETE | `/v2/config/digital-wallet/openid/trust-authority/{trustAuthorityId}` | Delete a trust authority | [config-delete-digital-wallet-open-id-trust-authority](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-trust-authority/) |

The list operation takes the `offset` and `limit` query parameters.

## Key fields

### Trust authority object
```json
{
  "type": "ETSI_TL",
  "value": "https://raw.githubusercontent.com/EWC-consortium/ewc-trust-list/refs/heads/main/EWC-TL.xml",
  "name": "EU Trust List"
}
```

- `type` has one allowed value: **`ETSI_TL`**.
- `value` is the URL of the trust list.
- On create, `type` and `value` are required and `name` is optional. On update,
  **all 3 fields are required**; the service forwards each field and rejects an
  empty one.
- Create answers with **`201`**. The stored object adds `id` (a UUID),
  `disabled` (boolean), `createdAt` and `updatedAt` (numbers, Unix seconds),
  wrapped as `{ "trustAuthority": { … } }`. Read and update answer with the
  same wrapped object and `200`.
- The toggle operation takes `{ "disabled": true }` - give the **wanted end
  state**, not a flip - and answers with the full updated object. A disabled
  trust authority is not used for credential or verifier trust validation.
- Delete answers with `200` and **no response body**. After the delete the
  service no longer uses that trust list to validate issuers and verifiers.

### The 2 built-in trust lists
`GET …/trust-authorities` starts with 2 built-in trust lists that the service
returns for every organisation. They have the IDs **`0`** and **`1`**, and
`disabled`, `createdAt` and `updatedAt` always hold `false`, `0` and `0` for
them. The trust authorities that the organisation created come after them.
`pagination.totalItems` counts the 2 built-in records, and they fill the first
page.

The read, update, toggle and delete operations need a **UUID** in the path, so
none of them touches the 2 built-in trust lists.

The largest `limit` is **100**. A larger value gives HTTP 400.

The list answers with a `trustAuthority` **array** (singular field name, plural
content) plus `pagination`.

## Sandbox call style
**Every operation in this group** takes the optional `X-SandboxOrgId` header.
With that header the service runs the operation against the wallet of the named
sandbox organisation and not against the main wallet of the organisation.

**The service reads `X-SandboxOrgId` only when you authenticate with a bearer
access token.** With API-key auth the service takes the sandbox organisation
from the key and ignores the header. To run an API-key call in a sandbox
organisation, bind the key with
`PUT /v2/config/admin/apikey/{apiKeyId}/sandbox-org` instead.

`X-SubwalletId` is the deprecated name of the header. The service still accepts
it, but `X-SandboxOrgId` wins if you send both.

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
- `igrantio-api-sandboxes` - sandbox organisations and the API-key binding.
