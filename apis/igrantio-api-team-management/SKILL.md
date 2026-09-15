---
name: igrantio-api-team-management
description: 'Team Management group of the iGrant.io OID4VC API: create, read, delete, and list the admins of an organisation, and enable or disable passwordless login with EUDI Wallet for one admin. This is the API behind the Manage Team page of the dashboard. Covers the admin record fields (roleName, pendingInvitation, authentication.oidcPasswordless), the search filter on the list, and the split between the v2 onboard endpoints and the v3 passwordless-login endpoint. Use when you add or remove admins of an organisation, or when you turn wallet-based login on or off for an admin.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: team management, manage team, organisation admin, admin invitation, pendingInvitation, roleName, passwordless login, EUDI Wallet, oidcPasswordless, RBAC, eIDAS2
  version: 2026.09.01
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OAuth-2.0-bearer, JWT
  auth: Bearer access token from an organisation administrator
---

# iGrant.io OID4VC API - Team Management

## When to use
Use this skill when the task is one of these:

- Add an admin to an organisation, with or without passwordless login.
- Remove an admin from an organisation.
- List or search the admins of an organisation.
- Turn passwordless login with EUDI Wallet on or off for one admin.

This group is the API behind the **Manage Team** page of the iGrant.io
dashboard. For the account of the signed-in admin (profile, avatar, password,
own login methods), use **`igrantio-api-user-management`**.

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
3. **Operation** - create, read, delete or list admins, or toggle passwordless
   login?
4. **Passwordless** - which admins sign in with an EUDI Wallet?

## Endpoint reference

Base URL for the demo environment: `https://demo-api.igrant.io`.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/onboard/organisation/admin` | Create an admin. Gives **HTTP 201**. | [Create organisation admin](https://docs.igrant.io/docs/openid4vc-api/config-create-organisation-admin/) |
| `GET` | `/v2/onboard/organisation/admin/{adminId}` | Read one admin. | [Read organisation admin](https://docs.igrant.io/docs/openid4vc-api/config-read-organisation-admin/) |
| `DELETE` | `/v2/onboard/organisation/admin/{adminId}` | Delete an admin. Gives the admin as it was at the moment of the delete. | [Delete organisation admin](https://docs.igrant.io/docs/openid4vc-api/config-delete-organisation-admin/) |
| `GET` | `/v2/onboard/organisation/admins` | List the admins, with pages and a search filter. | [List organisation admins](https://docs.igrant.io/docs/openid4vc-api/config-list-organisation-admins/) |
| `PUT` | `/v3/config/admin/authentication/oidc/user/{adminId}` | Enable or disable passwordless login for an admin. | [Enable or disable passwordless login for an admin](https://docs.igrant.io/docs/openid4vc-api/config-set-passwordless-login-for-admin/) |

Five operations. Note the version split: the four admin CRUD operations live
under `/v2/onboard/...`, but the passwordless-login switch lives under
`/v3/config/admin/authentication/oidc/user/{adminId}`.

## Authentication and permission
All five operations accept a **bearer access token** from an organisation
administrator. Send it as `Authorization: Bearer <token>`.

## Key fields

### Admin record

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Identifier of the admin. Use it as the `adminId` path parameter. |
| `email` | string | Email address. |
| `name` | string | Full name. |
| `roleId`, `roleName` | integer, string | Role of the admin. The dashboard shows `SuperAdmin` as "Super Admin" and `NormalAdmin` as "Administrator". |
| `authentication` | object | Authentication configuration. `authentication.oidcPasswordless.enabled` tells if passwordless login is on; `authentication.oidcPasswordless.linked` tells if the admin has linked a wallet. |
| `pendingInvitation` | boolean | `true` until the admin logs in for the first time. The dashboard shows this as the "Invited" status. |

### Create
Body: `{"email": "...", "name": "...", "passwordlessLoginEnabled": true}`.
`email` and `name` are mandatory. Set `passwordlessLoginEnabled` to `true` to
let the new admin log in with an EUDI Wallet in place of a password. The
dashboard also sends `"password": ""` in the body; an empty value is accepted.

The answer is **HTTP 201** with the new admin. The new admin has
`pendingInvitation: true`.

On an error, the answer body carries the reason in `errorDescription` or
`message`.

### List
Query parameters: `offset` (default `0`), `limit` (default `10`), and
`search`. The `search` parameter filters the admins. The answer holds
`admins` (an array) and `pagination`.

### Enable or disable passwordless login
Body: `{"enabled": true}` or `{"enabled": false}`. The answer gives
`{"enabled": <new state>}`. This changes the login method of the admin; it
does not link or unlink a wallet. The admin links their own wallet with the
operations in **`igrantio-api-user-management`**.

## Validation / done criteria
- You send `email` and `name` on create, and you test for HTTP 201.
- You use the admin `id` from the list as `adminId` in read, delete, and the
  passwordless-login switch.
- You read the invitation state from `pendingInvitation`, and the wallet-login
  state from `authentication.oidcPasswordless`.
- You use `/v3/config/admin/authentication/oidc/user/{adminId}` for the
  passwordless-login switch, not a `/v2/onboard/...` path.

## Documentation is the source of truth
This skill mirrors the iGrant.io OID4VC API documentation. If this skill and
the linked documentation disagree - on a path, a field name, an enum value, or
a mandatory field - **the documentation wins**. Fetch the linked page for the
operation, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, to check for an
update. Follow the documentation, and report the difference so that this skill
can be corrected.

## Cross-references
- `igrantio-api-user-management` - the account of the signed-in admin:
  profile, avatar, password, and their own passwordless-login methods.
- `igrantio-api-api-keys` - API keys for server to server calls.
- `igrantio-api-sandboxes` - sandbox organisations and the sandbox call style.
