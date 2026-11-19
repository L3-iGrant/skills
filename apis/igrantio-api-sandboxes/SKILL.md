---
name: igrantio-api-sandboxes
description: 'Sandboxes group of the iGrant.io OID4VC API: create, read, update, delete, and list sandbox organisations - separate test wallets inside your organisation, each with its own credential definitions, presentation definitions, role configurations and webhooks, that use the keys and the trust sources of the main organisation - plus name, logo image, and cover image updates, and the binding of an API key to a sandbox organisation. This skill is the canonical home for the sandbox call style: an API key that is bound to a sandbox organisation runs every call in that sandbox organisation. Read it before you send any OID4VC request against a sandbox.'
license: Apache-2.0
metadata:
  categories: [ows-api, education]
  provider: iGrant.io
  keywords: sandbox organisation, sandbox org, test wallet, multi-wallet, OpenID4VCI, OpenID4VP, EUDIW, EUBW, eIDAS2, sandbox-bound API key, X-SandboxOrgId
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0
  auth: OWS API key (Authorization "ApiKey <YOUR_API_KEY>"); a key that is bound to a sandbox organisation works in that sandbox organisation; the key is held only by the tenant backend, never the browser
---

# iGrant.io OID4VC API - Sandboxes

## When to use
Use this skill when the task is one of these:

- Make a test wallet that does not touch the data of the main wallet.
- Create, read, update, delete, or list **sandbox organisations**.
- Change the name, the logo image, or the cover image of a sandbox
  organisation.
- Bind an existing API key to a sandbox organisation, or back to the main
  organisation.
- Send **any** OID4VC request against a sandbox organisation, whatever the
  group of that request.

A sandbox organisation is a **separate wallet inside your organisation**. It
has its own credential definitions, presentation definitions, role
configurations and webhooks. It uses the keys and the trust sources of the
main organisation. You can test an issuance flow or a verification flow
without a change to the main wallet.

**Before you start**, the main wallet of the organisation must be deployed. See
`igrantio-api-wallet-provider` for the deploy operation.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.

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
3. **Sandbox API key** - do you have an API key that is bound to the sandbox
   organisation? _A call runs in a sandbox organisation only with a key that
   is bound to it. If not, select the sandbox organisation in the dashboard,
   then create the key under Account > Developer APIs (Create API Key)._
4. **Main wallet too** - do you also call the main wallet? _Then keep a second
   key for the main wallet._

## Endpoint reference

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/platform/sandbox-org` | Create a sandbox organisation and deploy its wallet. | [Create sandbox organisation](https://docs.igrant.io/docs/openid4vc-api/config-create-sandbox-org/) |
| `GET` | `/v4/config/platform/sandbox-org/{sandboxOrgId}` | Read one sandbox organisation with the OpenID endpoints of its wallet. | [Read sandbox organisation](https://docs.igrant.io/docs/openid4vc-api/config-read-sandbox-org/) |
| `PUT` | `/v4/config/platform/sandbox-org/{sandboxOrgId}` | Update the name, the description and the location. | [Update sandbox organisation](https://docs.igrant.io/docs/openid4vc-api/config-update-sandbox-org/) |
| `DELETE` | `/v4/config/platform/sandbox-org/{sandboxOrgId}` | Delete the sandbox organisation and turn off its wallet. | [Delete sandbox organisation](https://docs.igrant.io/docs/openid4vc-api/config-delete-sandbox-org/) |
| `PUT` | `/v4/config/platform/sandbox-org/{sandboxOrgId}/name` | Update the name only. The name is mandatory here. | [Update sandbox organisation name](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-sandbox-org-name/) |
| `PUT` | `/v4/config/platform/sandbox-org/{sandboxOrgId}/logoimage` | Upload a new logo image (multipart form data). | [Update sandbox organisation logo image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-sandbox-org-logo/) |
| `PUT` | `/v4/config/platform/sandbox-org/{sandboxOrgId}/coverimage` | Upload a new cover image (multipart form data). | [Update sandbox organisation cover image](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-sandbox-org-cover/) |
| `GET` | `/v4/config/platform/sandbox-orgs` | List the sandbox organisations, with search, sort, and pages. | [List sandbox organisations](https://docs.igrant.io/docs/openid4vc-api/config-list-sandbox-orgs/) |
| `PUT` | `/v4/config/platform/admin/apikey/{apiKeyId}/sandbox-org` | Bind an API key to a sandbox organisation, or back to the main organisation. The key gets a new value. | [Bind API key to sandbox organisation](https://docs.igrant.io/docs/openid4vc-api/config-update-api-key-sandbox-org/) |

Each operation accepts an API key. The API key scopes are `sandboxes:create`,
`sandboxes:read`, `sandboxes:update` (also for the images and the key
binding) and `sandboxes:delete`.

## Sandbox call style

This is the canonical description. Other iGrant.io API skills point here.

### Use an API key that is bound to the sandbox organisation
To work in a sandbox organisation through the API, **call the API with an API
key that is bound to the sandbox organisation**. The service takes the sandbox
organisation from the key itself. The request needs no extra header. A key that
is not bound to a sandbox organisation works on the main organisation.

To get such a key, select the sandbox organisation in the iGrant.io dashboard,
then create the API key under **Account > Developer APIs** (**Create API Key**).
The key is bound to that sandbox organisation, and every call with it runs
there. To move a key that you already have, use the key binding operation (see
"Bind an API key").

To use the main wallet and a sandbox organisation from the same server, keep
one key for each.

The `X-SandboxOrgId` header is optional with an API key. When you send it, it
must name the sandbox organisation of the key. Another value, or the header
with a key that is not bound to a sandbox organisation, gives HTTP 403
`Access denied: the sandbox organisation in the X-SandboxOrgId header is not
the sandbox organisation of the API key`. So a call never falls back to the
main organisation by mistake. The dashboard uses this header with its login
token to select a sandbox organisation.

### What belongs to the sandbox organisation
A bound key works in its sandbox organisation across the OID4VC configuration
surface: credential definitions, issuances, presentation definitions,
verifications, transaction data, files, scopes, the role configurations
(issuer, verifier and holder), notifications, and webhooks.

Exceptions:

- **Keys** belong to the main organisation. A bound key reads and manages the
  key stores and the keys of the main organisation (create, change, delete,
  CSR, certificate chain, test CA), and the definitions of the sandbox
  organisation sign with them. A change through a bound key changes the keys of
  the main organisation and of all its sandbox organisations (see
  `igrantio-api-key-management`).
- **Trust sources** belong to the main organisation. A bound key reads and
  changes the trust sources of the main organisation, and the accepted lists of
  the sandbox organisation name them (see `igrantio-api-trust-anchor`).
- **Data agreements, individuals, and consent records** belong to the
  organisation. A bound key works on the same ones as a key of the main wallet.
- The sandbox operations in the table above work on the sandbox collection of
  the whole organisation, whatever the key. The wallet deployment operations
  (`/v4/config/ows/wallet/deployment`) always work on the main wallet, and the
  performance statistics (`GET /v4/config/ows/wallet/performance-statistics`)
  count the main organisation together with its sandbox organisations.
- A sandbox organisation **cannot be a wallet provider**. The wallet provider
  operations give HTTP 400. See `igrantio-api-wallet-provider`.
- **The held credential operations reject a sandbox context** with HTTP 400
  and the error "Holder functionalities for sandbox organisation is
  disabled". This covers receive, deferred credential, transaction code,
  authorisation code exchange, acceptance, reissuance, list, read, and delete
  of held credentials, the issuer metadata read, and the matching credentials
  and the delete of a presentation. The revocation status read of a held
  credential, the other presentation operations (receive, read, list,
  response), the holder configuration, and the notifications take the sandbox
  context. See `igrantio-api-holder`.

### After a delete
When you delete a sandbox organisation, an API key that is bound to it no
longer resolves a wallet. Bind the key to another sandbox organisation or to
the main organisation, or create a new key in the dashboard, and replace the
old key in every client.

## Key fields

### Sandbox organisation (`sandboxOrg`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Identifier of the sandbox organisation. |
| `name` | string | Display name. Mandatory at creation, and unique in the organisation. |
| `description` | string | Free text. |
| `location` | string | The location that wallets show for the sandbox organisation as an issuer or a verifier. Empty: the wallet shows the location of the organisation. |
| `openIdDeploymentId` | string | Identifier of the wallet of the sandbox organisation. |
| `status` | integer | `0` not configured, `1` requested, `2` deployed. |
| `ledgerId` | integer | Always `0`. |
| `infrastructureProvider` | string | `iGrant.io`. |
| `version` | string | Version of the configuration. |
| `role` / `trustAnchor` | string | Always present, and an empty string for a sandbox organisation. |
| `isWalletProvider` | boolean | `false`: a sandbox organisation cannot be a wallet provider. |
| `logoImageId` | string | **Absent** from the answer when there is no logo image. |
| `coverImageId` | string | **Absent** from the answer when there is no cover image. |
| `logoImageUrl` / `coverImageUrl` | string | Public URLs of the images. Always present; empty when there is no image. |
| `createdAt` / `updatedAt` | integer | Unix timestamps in seconds. |
| `isMain` | boolean | `false` for a sandbox organisation. |

**`logoImageId` and `coverImageId` are absent, not empty**, when the sandbox
organisation has no image, so read them with a presence test.

### Requests and errors
Every JSON body is strict: an unknown member gives HTTP 400 with
`unknown field ...`. An error answer is
`{"errorCode": <HTTP status>, "errorDescription": "..."}`. An unknown
`sandboxOrgId` gives HTTP 404 on read, update, delete, and the image and name
updates. The update, delete, name and image operations give HTTP 400 when the
identifier names the main wallet.

### Create
Body: `{"sandboxOrg": {"name": "...", "description": "...", "location":
"..."}}`. Only `name` is mandatory, and it must be unique in the organisation.
`location` has at most 100 characters. The answer is **HTTP 201** with
`{"sandboxOrg": ...}`.

The main wallet must be deployed first. The service deploys a new wallet for
the sandbox organisation, which starts with the logo image and the cover image
of the organisation. HTTP 400 comes back when the main wallet is not deployed,
when `name` is missing, or when the name is already taken. An organisation has
at most 20 sandbox organisations: one more gives **HTTP 409** with the
`errorKey` `sandbox_organisation_limit_reached`. When the wallet cannot be
made, the answer carries the status of the wallet (or HTTP 502 or 504), and no
sandbox organisation stays. To work in the new sandbox organisation through the
API, use an API key that is bound to it (see "Sandbox call style").

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
Body: `{"sandboxOrg": {"name": "...", "description": "...", "location":
"..."}}`. Every field is optional. For `name` and `description`, **an empty
string means "keep the current value"**, so there is no way to clear the
description through this API. For `location`, a field that you leave out keeps
the value, and an empty string removes it. The new name must be unique
(HTTP 400). The answer is HTTP 200 with `{"sandboxOrg": ...}`. When the sandbox
organisation is deployed, the service also sends the new values to its wallet.

### Update the name only
`PUT .../name` behaves differently from the general update. Body:
`{"sandboxOrg": {"name": "Example Test Issuer"}}`. Note the wrapper key
`sandboxOrg` with a small first letter; another key gives HTTP 400
`unknown field ...`.

`name` is **mandatory** here, and an empty name is an error, not an instruction
to keep the current name. The name must be unique in the organisation. The
answer is HTTP 200 with `{"sandboxOrg": ...}`. HTTP 400 comes back when `name`
is missing or empty, or when another sandbox organisation has that name.

### Delete
HTTP 204 with no body. The service deletes the sandbox organisation, and then
turns off its wallet.

### Images
`PUT .../logoimage` and `PUT .../coverimage` take **multipart form data**, and
not JSON. The form field has the same name as the path segment: `logoimage`
and `coverimage`. The file is mandatory: a PNG, JPEG, GIF, or WebP image of at
most 5 MiB and 4096 x 4096 pixels. A larger file gives HTTP 413; a missing,
unreadable, or other type of file gives HTTP 400.

The service stores the image, sets the new image identifier and the new image
URL, and sends the change to the wallet when the sandbox organisation is
deployed.

**Both operations answer HTTP 200 with a body**: `{"sandboxOrg": {...}}`, the
full sandbox organisation after the update. Read `logoImageId` and
`logoImageUrl` (or `coverImageId` and `coverImageUrl`) from it, rather than
reading the record again.

### List
Query parameters: `offset` (default `0`), `limit` (default `10`; a value above
100 gives 100), `search` (part of the name or the description, not
case-sensitive), and `sortOrder` (`desc` or `asc`, default `desc`). The service
sorts by the time of the last update and leaves out deleted sandbox
organisations. The answer holds `sandboxOrgs` (an array) and `pagination`
(`currentPage`, `totalItems`, `totalPages`, `limit`, `hasPrevious`, `hasNext`).

### Bind an API key
`PUT /v4/config/platform/admin/apikey/{apiKeyId}/sandbox-org` with
`{"sandboxOrgId": "<id>"}` binds the key `apiKeyId` of the organisation to
that sandbox organisation. An empty string binds it to the main organisation.
`sandboxOrgId` is mandatory: a body without it gives HTTP 400, so that a
mistake never moves a key to the main organisation. The sandbox organisation
must exist (else HTTP 400) and be deployed (else HTTP 400). An unknown
`apiKeyId` gives HTTP 404.

The key gets a **new value**, and the old value stops working at once. The
answer is HTTP 200 `{"apiKey": {...}}` with `id`, `name`, `scopes`, `apiKey`
(the new value: store it now, no other answer gives it), `expiryInDays`,
`timestamp`, `expiryTimestamp` (now plus `expiryInDays` days), `type`,
`sandboxOrgId`, `createdBy`, `keyFormat` and `allowedIps`. When you move the
key that makes the call, use the new value for the next call.

## Authentication
Send an API key:

```
Authorization: ApiKey <YOUR_API_KEY>
```

Note the space after `ApiKey`. The key is held only by the tenant backend. The
browser never sees it.

## Validation / done criteria
- To work in a sandbox organisation, you call the API with a key that is bound
  to it. You send no extra header, or the `X-SandboxOrgId` of that same
  sandbox organisation.
- Your client tests for the presence of `logoImageId` and `coverImageId`.
- A key change through a bound key changes the keys of the main organisation.
- After a key binding, your server stores the new key value.

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
- `igrantio-api-wallet-provider` - deploy the main wallet before you make a
  sandbox organisation.
- `igrantio-api-key-management` - the keys that a sandbox organisation uses.
- `igrantio-api-trust-anchor` - the trust sources that a sandbox organisation
  uses.
