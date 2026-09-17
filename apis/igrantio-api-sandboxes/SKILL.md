---
name: igrantio-api-sandboxes
description: 'Sandboxes group of the iGrant.io OID4VC API: create, read, update, delete, and list sandbox organisations - separate test wallets inside your organisation, each with its own credential definitions, presentation definitions, webhooks, and keys - plus name, logo image, and cover image updates. This skill is the canonical home for the sandbox call style: how the X-SandboxOrgId header works, why it works only with a bearer token, how X-SubwalletId falls back, and how to bind an API key to a sandbox organisation. Read it before you send any OID4VC request against a sandbox.'
license: Apache-2.0
metadata:
  categories: [education, ows-api]
  provider: iGrant.io
  keywords: sandbox organisation, sandbox org, X-SandboxOrgId, X-SubwalletId, subwallet, test wallet, multi-wallet, OpenID4VCI, OpenID4VP, EUDIW, EUBW, eIDAS2, API key binding
  version: 2026.09.01
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0
  auth: OWS API key (Authorization "ApiKey <key>") or a bearer access token - the key is held only by the tenant backend, never the browser
---

# iGrant.io OID4VC API - Sandboxes

## When to use
Use this skill when the task is one of these:

- Make a test wallet that does not touch the data of the main wallet.
- Create, read, update, delete, or list **sandbox organisations**.
- Change the name, the logo image, or the cover image of a sandbox
  organisation.
- Send **any** OID4VC request against a sandbox organisation, whatever the
  group of that request. The call style below applies to about 180 endpoints.

A sandbox organisation is a **separate wallet inside your organisation**. It
has its own credential definitions, presentation definitions, webhooks, and
keys. You can test an issuance flow or a verification flow without a change to
the main wallet.

**Before you start**, the main wallet of the organisation must be deployed. See
`igrantio-api-wallet-provider` for the deploy operation.

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
3. **Bearer token** - do you have an admin access token? _The sandbox header
   works only with a bearer token, not with an API key._
4. **Bind** - should an API key be bound to the sandbox for server-side use?

## Endpoint reference

Base URL for the demo environment: `https://demo-api.igrant.io`.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/sandbox-org` | Create a sandbox organisation and deploy its wallet. | [Create sandbox organisation](https://docs.igrant.io/docs/openid4vc-api/config-create-sandbox-org/) |
| `GET` | `/v2/config/sandbox-org/{sandboxOrgId}` | Read one sandbox organisation with the OpenID endpoints of its wallet. | [Read sandbox organisation](https://docs.igrant.io/docs/openid4vc-api/config-read-sandbox-org/) |
| `PUT` | `/v2/config/sandbox-org/{sandboxOrgId}` | Update the name and the description. | [Update sandbox organisation](https://docs.igrant.io/docs/openid4vc-api/config-update-sandbox-org/) |
| `DELETE` | `/v2/config/sandbox-org/{sandboxOrgId}` | Delete the sandbox organisation and all the data in its wallet. | [Delete sandbox organisation](https://docs.igrant.io/docs/openid4vc-api/config-delete-sandbox-org/) |
| `PUT` | `/v2/config/sandbox-org/{sandboxOrgId}/name` | Update the name only. The name is mandatory here. | [Update sandbox organisation name](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-sandbox-org-name/) |
| `PUT` | `/v2/config/sandbox-org/{sandboxOrgId}/logoimage` | Upload a new logo image (multipart form data). | [Update sandbox organisation logo image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-sandbox-org-logo/) |
| `PUT` | `/v2/config/sandbox-org/{sandboxOrgId}/coverimage` | Upload a new cover image (multipart form data). | [Update sandbox organisation cover image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-sandbox-org-cover/) |
| `GET` | `/v2/config/sandbox-orgs` | List the sandbox organisations, with search, sort, and pages. | [List sandbox organisations](https://docs.igrant.io/docs/openid4vc-api/config-list-sandbox-orgs/) |

Eight operations. Each one accepts an API key or a bearer access token.

## Sandbox call style

This is the canonical description. Other iGrant.io API skills point here.

### The header
Send the identifier of the sandbox organisation in the `X-SandboxOrgId`
request header:

```
X-SandboxOrgId: 6889e1a4c5b2f30001a3d710
```

The service then runs the operation against the wallet of that sandbox
organisation, and not against the main wallet. Leave the header out to use the
main wallet.

### The header works only with a bearer access token
The service reads `X-SandboxOrgId` **only when you authenticate with a bearer
access token**, which is what the dashboard uses. **When you authenticate with
an API key, the service takes the sandbox organisation from the key itself and
ignores the header.** This is the most common error: an API-key client that
sends the header sees no change, because its calls stay on the wallet that the
key names.

To run API-key calls in a sandbox organisation, bind the key to it. See "Bind
an API key" below.

### `X-SubwalletId` is the old name
`X-SubwalletId` is the deprecated name of the same header. The service still
accepts it. **If you send both headers, `X-SandboxOrgId` wins**, and
`X-SubwalletId` is only the fallback. Use `X-SandboxOrgId` in new code.

### Which operations honour it
The header is effectively universal across the OID4VC configuration surface:
credential definitions, presentation definitions, verifications,
notifications, transaction data, trust authorities, files, scopes, key
management, webhooks, and data agreements.

Exceptions:

- The eight sandbox operations in the table above do **not** honour the
  header: they always work on the sandbox collection of the whole
  organisation. The wallet deploy and the deployment read
  (`POST` and `GET /v2/config/digital-wallet/openid`) also do not accept it.
- **The v2 holder credential operations reject a sandbox context** with the
  error "Holder functionalities for sandbox organisation is disabled". This
  covers receive, receive-deferred, user PIN, exchange-code, accept,
  auto-present, list, read, delete, reissuance, the credential offer, the
  issuer metadata read, and the holder-side filter and verification delete.
  The v3 presentation operations, the holder global configuration, and the
  notifications do support the sandbox context. See `igrantio-api-holder`.

### Errors
The sandbox organisation must exist, must belong to your organisation, and must
be **deployed**. Each of these makes the call fail with **HTTP 400**, not 401
and not 404:

- an unknown identifier;
- an identifier of a sandbox organisation that is not deployed;
- an identifier that belongs to a different organisation. The lookup is scoped
  by organisation, so a foreign identifier reads as "not found". There is no
  leak across tenants.

A bad `X-SandboxOrgId` therefore turns an otherwise correct request into an
HTTP 400 on every one of the endpoints that honour it.

### Bind an API key
`PUT /v2/config/admin/apikey/{apiKeyId}/sandbox-org` with the body
`{"sandboxOrgId": "6889e1a4c5b2f30001a3d710"}` binds the key to that sandbox
organisation. **An empty string, or no field at all, binds the key back to the
main wallet.**

Two points that break clients:

1. **The service signs a new token.** The `apiKey` field of the answer holds a
   new value. The token that you had before the call stops working. Store the
   new value and replace the old one in every client.
2. **The service moves the expiry forward.** It sets a new `expiryTimestamp` at
   the moment of the call plus the current `expiryInDays`, so each binding call
   extends the lifetime of the key.

At **creation** time, use the `sandboxOrgId` field in the body of
`POST /v2/config/admin/apikey`. That body field is the only way to bind a key
at creation; the `X-SandboxOrgId` header has no effect on that operation.

After the binding, every call with that key runs in the sandbox organisation.
The key reads and writes the credential definitions, the presentation
definitions, the webhooks, and the keys of that sandbox organisation.

Full detail of the API key operations: `igrantio-api-api-keys`.

### After a delete
When you delete a sandbox organisation, an API key that is bound to it no
longer resolves a wallet. Bind that key to a different sandbox organisation, or
back to the main wallet, with the same `PUT .../sandbox-org` operation.

## Key fields

### Sandbox organisation (`sandboxOrg`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Identifier of the sandbox organisation. This is the value for `X-SandboxOrgId`. |
| `name` | string | Display name. Mandatory at creation, and unique in the organisation. |
| `description` | string | Free text. |
| `openIdDeploymentId` | string | Identifier of the OpenID deployment. |
| `status` | integer | `0` not configured, `1` requested, `2` deployed. |
| `ledgerId` | integer | Identifier of the ledger. |
| `infrastructureProvider` | string | Name of the infrastructure provider. |
| `version` | string | Version of the configuration. |
| `role` | string | Role in the ecosystem. **Always present**, and an empty string when there is no value. |
| `trustAnchor` | string | Trust anchor identifier or DID. **Always present**, and an empty string when there is no value. |
| `isWalletProvider` | boolean | `true` when this sandbox organisation acts as a wallet provider. |
| `secureVault` | integer | Identifier of the primary secure vault. |
| `secureVaults` | **array of integer**, nullable | Identifiers of the secure vaults. The field holds `null`, not `[]`, when there is none. It is **not** an object. |
| `logoImageId` | string | **Absent** from the answer when there is no logo image. |
| `coverImageId` | string | **Absent** from the answer when there is no cover image. |
| `logoImageUrl` / `coverImageUrl` | string | Public URLs of the images. Always present. |
| `createdAt` / `updatedAt` | integer | Timestamps. |
| `isMain` | boolean | `true` for the main organisation. |

Two field traps to code against: **`secureVaults` is an integer array and can
be `null`**, so a client that reads it as an object or as a list breaks; and
**`logoImageId` and `coverImageId` are absent, not empty**, when the sandbox
organisation has no image, so read them with a presence test.

`role` and `trustAnchor` go the other way: they are always in the answer, even
as an empty string, so a presence test on them tells you nothing.

### Create
Body: `{"sandboxOrg": {"name": "...", "description": "..."}}`. Only `name` is
mandatory, and it must be unique in the organisation. The answer is **HTTP
201** with `{"sandboxOrg": ...}`.

The main wallet must be deployed first. The service deploys a new wallet for
the sandbox organisation and copies the logo image and the cover image of the
organisation to it. HTTP 400 comes back when the main wallet is not deployed,
when `name` is missing, when the name is already taken, or when the wallet
deployment failed.

### Read
The read answer is **not** the same shape as the other answers. It gives the
sandbox organisation together with five OpenID endpoint fields, **nested inside
the `sandboxOrg` object**: `agentServiceEndpoint`, `credentialIssuerMetadata`,
`authorizationServerMetadata`, `notificationEndpoint`, and `jwksEndpoint`. Use
them to point a holder wallet or another IT system at this sandbox
organisation. **All five hold an empty string when the sandbox organisation has
no OpenID deployment.**

The list operation does not give these endpoint fields. Read one sandbox
organisation to get them.

### Update
Body: `{"sandboxOrg": {"name": "...", "description": "..."}}`. Both fields are
optional. **An empty string means "keep the current value"**, so there is no
way to clear the description through this API. The new name must be unique. The
service gives HTTP 400 when the identifier is the main wallet. When the sandbox
organisation is deployed, the service also sends the new values to its wallet.

### Update the name only
`PUT .../name` behaves differently from the general update. Body:
`{"sandboxOrg": {"name": "Acme Test Issuer"}}`. Note the wrapper key
`sandboxOrg` with a small first letter; the service ignores a body that uses
another key, so a wrong wrapper looks like a missing name.

`name` is **mandatory** here, and an empty name is an error, not an instruction
to keep the current name. The name must be unique in the organisation. The
answer is HTTP 200 with `{"sandboxOrg": ...}`. HTTP 400 comes back when the
identifier names the main wallet, when `name` is missing or empty, when another
sandbox organisation has that name, or when the service could not send the
change to the wallet. HTTP 404 comes back when the organisation has no sandbox
organisation with that identifier.

### Delete
HTTP 204 with no body. The service removes the wallet of the sandbox
organisation and all the data in it. You cannot delete the main wallet: the
service gives HTTP 400.

### Images
`PUT .../logoimage` and `PUT .../coverimage` take **multipart form data**, and
not JSON. The form field has the same name as the path segment: `logoimage`
and `coverimage`. The file is mandatory.

The service stores the image, sets the new image identifier and the new image
URL, and sends the change to the wallet when the sandbox organisation is
deployed.

**Both operations answer HTTP 200 with a body**: `{"sandboxOrg": {...}}`, the
full sandbox organisation after the update. Read `logoImageId` and
`logoImageUrl` (or `coverImageId` and `coverImageUrl`) from it, rather than
reading the record again. Remember that `logoImageId` and `coverImageId` are
absent when there is no image, so use a presence test.

HTTP 400 comes back when the identifier names the main wallet, when the request
has no image form field, or when the service could not send the change to the
wallet. HTTP 404 comes back when the organisation has no sandbox organisation
with that identifier.

### List
Query parameters: `offset` (default `0`), `limit` (default `10`), `search`, and
`sortOrder` (`desc` or `asc`, default `desc`). The service sorts by the time of
the last update and leaves out deleted sandbox organisations. The answer holds
`sandboxOrgs` (an array) and `pagination`. The list has no upper bound on
`limit`.

## Authentication
Send an API key:

```
Authorization: ApiKey <your-api-key>
```

Note the space after `ApiKey`. A bearer access token also works on every
operation of this group. The key is held only by the tenant backend. The
browser never sees it.

## Validation / done criteria
- You know that `X-SandboxOrgId` has no effect on an API-key call, and you bind
  the key instead.
- You store the new token value after each `PUT .../apikey/{apiKeyId}/sandbox-org`.
- Your client reads `secureVaults` as a nullable integer array, and tests for
  the presence of `logoImageId` and `coverImageId`.
- You know that a bad sandbox identifier gives HTTP 400, and you do not look
  for a 404.

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
- `igrantio-api-api-keys` - create, update, delete, and list API keys, and bind
  a key to a sandbox organisation.
- `igrantio-api-wallet-provider` - deploy the main wallet before you make a
  sandbox organisation.
