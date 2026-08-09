---
name: igrantio-api-api-keys
description: 'API Key group of the iGrant.io OID4VC API: create, update, delete, and list the API keys of an organisation, and bind a key to a sandbox organisation. Covers the scope enum (config, audit, service, onboard), the 30-day expiry fallback, the fact that every answer carries the full signed token, and the token rotation that create, update, and bind each cause. Use when you provision server-side credentials for the OpenID4VCI and OpenID4VP endpoints, or when a key must run against a sandbox wallet.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: API key, apikey, scopes, config scope, bearer token, RBAC, organisation administrator, token rotation, expiryInDays, sandbox organisation binding, OpenID4VCI, OpenID4VP, eIDAS2
  version: 2026.08.01
  source-doc: https://docs.igrant.io/docs/openid4vc-api/
  protocols: OAuth-2.0-bearer, JWT
  auth: Bearer access token for the CRUD operations (organisation administrator only); the keys that you create are used as Authorization "ApiKey <key>"
---

# iGrant.io OID4VC API - API Keys

## When to use
Use this skill when the task is one of these:

- Make an API key so that a server can call the OID4VCI and OpenID4VP
  endpoints without a user session.
- Change the name, the scopes, or the lifetime of a key.
- Delete a key, or list the keys of the organisation.
- Point a key at a sandbox organisation, or back at the main wallet.

An API key replaces a bearer access token on the OID4VC endpoints. Send it as
`Authorization: ApiKey <apiKey>`. The key lives only on the server side, in an
environment variable or a secret manager. The browser never sees it.

## Endpoint reference

Base URL for the demo environment: `https://demo-api.igrant.io`.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/admin/apikey` | Create an API key. Gives **HTTP 200**, not 201. | [Create API key](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-api-key/) |
| `PUT` | `/v2/config/admin/apikey/{apiKeyId}` | Update the name, the scopes, and the lifetime. Signs a new token. | [Update API key](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-api-key/) |
| `DELETE` | `/v2/config/admin/apikey/{apiKeyId}` | Delete a key. Gives the key as it was at the moment of the delete. | [Delete API key](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-api-key/) |
| `PUT` | `/v2/config/admin/apikey/{apiKeyId}/sandbox-org` | Bind the key to a sandbox organisation, or back to the main wallet. Signs a new token. | [Bind API key to sandbox organisation](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-api-key-sandbox-org/) |
| `GET` | `/v2/config/admin/apikeys` | List the keys of the organisation, with pages. | [List API keys](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-api-key/) |

Five operations.

## Authentication and permission

**Four of the five operations are bearer-only.** Create, update, delete, and
list accept a **bearer access token only**. An API key cannot manage API keys.
Only an organisation administrator can call them; the service answers **HTTP
403** to any other caller. Plan the provisioning flow around a human
administrator session or a service account with an access token, and not around
an existing key.

The one exception is `PUT .../apikey/{apiKeyId}/sandbox-org`, which accepts an
API key **or** a bearer token.

The keys that you make from these operations are sent on the OID4VC endpoints
like this:

```
Authorization: ApiKey <your-api-key>
```

Note the space after `ApiKey`.

## Key fields

### API key (`apiKey`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Identifier of the record. Use it as the `apiKeyId` path parameter. |
| `name` | string | Free text to tell your keys apart. The service does not check it for uniqueness. |
| `scopes` | array of string | See the scope enum below. |
| `apiKey` | string | **The signed JSON Web Token itself.** This is the secret that you send in the `Authorization` header. |
| `expiryInDays` | integer, default `30` | Lifetime in days, counted from the last write of the key. |
| `timestamp` | string (date-time, UTC) | Moment of the last write. The service sets it on create and on every update, the delete included. |
| `expiryTimestamp` | string (date-time, UTC) | Moment when the key expires. |
| `type` | string, enum `igrantio` \| `aip10` | The list operation gives only keys of type `igrantio`. Those are the keys that you make with this group. |
| `sandboxOrgId` | string | Identifier of the bound sandbox organisation. **Absent** when the key belongs to the main wallet. |
| `createdBy` | object | Log metadata: `id`, `email`, `at` (date-time, UTC). `id` is an empty string for a key that an API key created. |

### Every answer holds the full signed token
`apiKey.apiKey` holds the whole token in the answer of **every** operation of
this group: create, update, delete, bind, and each item of the list. There is
no "show once" behaviour, but there is also no masking. **Treat the whole
answer body as a secret.** Never log it, never send it to a browser, and never
put it in an error report or a support ticket.

### Scope enum
`scopes` accepts only these four values:

| Scope | Opens |
| --- | --- |
| `config` | The configuration endpoints of the digital wallet: credential definitions, presentation definitions, webhooks, keys. Use this one for OID4VCI and OpenID4VP configuration work. |
| `audit` | Audit endpoints. |
| `service` | Service endpoints. |
| `onboard` | Onboarding endpoints. |

`scopes` is mandatory on create and on update. **The service refuses any other
value with HTTP 400.** On update, the service **replaces** the current scopes
with the list that you send; it does not merge them.

### The 30-day expiry fallback
`expiryInDays` is optional. **The service uses 30 days when you leave the field
out, when you send `0`, or when you send a negative value.** The count starts
at the moment of the write: on create, at creation; on update, at the update.
So an update with no `expiryInDays` silently resets the lifetime of the key to
30 days from now.

### Create
Body: `{"apiKey": {"name": "...", "scopes": ["config"], "expiryInDays": 30, "sandboxOrgId": "..."}}`.
Only `scopes` is mandatory.

**The answer is HTTP 200, not 201.** Do not test for 201.

`sandboxOrgId` binds the new key to a sandbox organisation. Leave it out, or
send an empty string, to bind the key to the main wallet. **The body field is
the only way to bind a key at creation: the `X-SandboxOrgId` header has no
effect on this operation.** The sandbox organisation must belong to your
organisation and must be deployed, or the service gives HTTP 400.

### Update
Body: `{"apiKey": {"name": "...", "scopes": [...], "expiryInDays": N}}`. The
service reads only these three fields.

- **The service signs a new token on every update.** The token that you had
  before the update stops working. Store the new value and replace the old one
  in every client.
- The service keeps the current name when `name` is absent or holds spaces
  only.
- The update does **not** change the sandbox organisation of the key. Use
  `PUT .../sandbox-org` for that.
- A missing or deleted `apiKeyId` gives **HTTP 500**, not 404.

### Delete
The service marks the key as deleted and stops accepting it. The key leaves the
list. The token stays valid in form until its expiry, but the service refuses
it, so move every client to another key first. The answer gives the key as it
was at the moment of the delete, token included. A missing or already deleted
`apiKeyId` gives **HTTP 500**, not 404.

### Bind to a sandbox organisation
Body: `{"sandboxOrgId": "6889e1a4c5b2f30001a3d710"}`. **An empty string, or no
field at all, binds the key back to the main wallet.**

Three effects to code against:

1. **The service signs a new token.** The `apiKey` field of the answer holds
   the new value. The old token stops working. Store the new value and replace
   the old one in every client.
2. **The service moves the expiry forward.** It sets a new `expiryTimestamp` at
   the moment of the call plus the current `expiryInDays`, so every binding
   call extends the lifetime of the key.
3. After the binding, every call with this key runs in that sandbox
   organisation. The key then reads and writes the credential definitions, the
   presentation definitions, the webhooks, and the keys of that sandbox
   organisation, and not those of the main wallet. The service takes the
   sandbox organisation from the key, so the request needs no `X-SandboxOrgId`
   header, and the service ignores that header.

Status codes: HTTP 400 when the sandbox organisation does not exist in your
organisation or is not deployed; HTTP 404 when the API key does not exist or is
deleted; HTTP 500 when the service could not sign the new token.

### List
Query parameters: `offset` (default `0`) and `limit` (default `10`). A negative
or unreadable `offset` falls back to `0`. The service sorts with the most
recently written key first, and gives only the keys that you make with this
group; it leaves out the internal keys of the platform.

**The list depends on the sandbox organisation of the request.** Without the
`X-SandboxOrgId` header, the service gives the keys of the main wallet only.
With the header, it gives the keys that are bound to that sandbox organisation.
When you authenticate with an API key, the service takes the sandbox
organisation from the key. So a key that you bound to a sandbox organisation
**does not show** in a plain list of the main wallet.

The answer holds `apiKeys` (an array) and `pagination`. Every item holds a
signed token, so the whole answer is a secret.

## Sandbox call style
`GET /v2/config/admin/apikeys` is the only operation of this group that accepts
the `X-SandboxOrgId` header, and it only filters the list. Create and bind take
the sandbox organisation from a **body** field instead, and the header has no
effect on them.

For the full rules - how the header behaves, why it works only with a bearer
token, and how `X-SubwalletId` falls back - read **`igrantio-api-sandboxes`**.

## Validation / done criteria
- Your provisioning flow uses a bearer access token from an organisation
  administrator, and not an existing API key.
- You test for HTTP 200 on create, not 201.
- You store the new token value after every update and after every bind.
- You always send `expiryInDays` on update, unless you want the 30-day reset.
- No answer body from this group reaches a log, a browser, or a ticket.

## Documentation is the source of truth
This skill mirrors the iGrant.io OID4VC API documentation. If this skill and
the linked documentation disagree - on a path, a field name, an enum value, or
a mandatory field - **the documentation wins**. Fetch the linked page for the
operation, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, to check for an
update. Follow the documentation, and report the difference so that this skill
can be corrected.

## Cross-references
- `igrantio-ows-overview` - architecture, glossary, and the shared contracts.
- `igrantio-api-sandboxes` - sandbox organisations and the full sandbox call
  style.
- `igrantio-api-wallet-provider` - deploy the wallet and manage wallet units.
