---
name: igrantio-api-user-management
description: 'User Management group of the iGrant.io OID4VC API: the admin account that an API key acts for. Read and update the profile, read and update the avatar image, and read the authentication configuration (the password and passwordless-login state). The admin changes the password, the passwordless-login methods and the team in the dashboard; those operations need a dashboard login and do not accept an API key. Use when you build a profile or account-settings flow.'
license: Apache-2.0
metadata:
  categories: [ows-api]
  provider: iGrant.io
  keywords: user management, admin profile, avatar image, authentication configuration, passwordless login state, admin-profile scope, eIDAS2
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: HTTP, multipart/form-data
  auth: OWS API key (Authorization "ApiKey <YOUR_API_KEY>") with the admin-profile:read or admin-profile:update scope (a key with the older scope set needs onboard, or config for the authentication configuration); the operations act on the admin that the key acts for
---

# iGrant.io OID4VC API - User Management

## When to use
Use this skill when the task is one of these:

- Read or update the profile of the admin account.
- Read or update the avatar image of the admin account.
- Read which login methods the admin account has.

With an API key, these operations act on the admin that the key acts for: the
first admin of the organisation at the time the key was created or last
changed. This is not always the admin who uses the key, so use them with care.
There is no `adminId` path parameter in this group.

The admin changes the password and the passwordless-login methods on the
**Manage User** page of the iGrant.io dashboard. The admin adds and removes the
other admins on the **Manage Team** page. These operations need a dashboard
login: an API key cannot call them.

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
3. **Operation** - profile, avatar, or authentication configuration?

## Endpoint reference

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v4/onboard/platform/admin` | Read the profile. | [Read admin profile](https://docs.igrant.io/docs/openid4vc-api/config-read-admin-profile/) |
| `PUT` | `/v4/onboard/platform/admin` | Update the profile. | [Update admin profile](https://docs.igrant.io/docs/openid4vc-api/config-update-admin-profile/) |
| `GET` | `/v4/onboard/platform/admin/avatarimage` | Read the avatar image (binary). | [Read admin avatar image](https://docs.igrant.io/docs/openid4vc-api/config-read-admin-avatar/) |
| `PUT` | `/v4/onboard/platform/admin/avatarimage` | Update the avatar image (multipart). | [Update admin avatar image](https://docs.igrant.io/docs/openid4vc-api/config-update-admin-avatar/) |
| `GET` | `/v4/config/platform/admin/authentication/user` | Read the authentication configuration. | [Read admin authentication configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-admin-authentication/) |

Five operations. Each one accepts an API key and a dashboard login.

## Authentication and permission
Send an API key:

```
Authorization: ApiKey <YOUR_API_KEY>
```

Note the space after `ApiKey`. The read operations need the
`admin-profile:read` scope, and the update operations need the
`admin-profile:update` scope. A key with the older scope set needs the
`onboard` scope for the profile and the avatar, and the `config` scope for the
authentication configuration.

## Key fields and operations

### Profile
`GET /v4/onboard/platform/admin` gives the profile as a **flat object**, with
no wrapper: `id`, `email`, `name`, `phone`, `roleId`, `roleName`,
`avatarImageId`, `avatarImageUrl`, `lastSignIn` (RFC 3339, UTC; empty when not
recorded), `externalId`, `identityProviderId`, `organizationName`, and
`apiKey` (not in use: an empty string).

`PUT /v4/onboard/platform/admin` takes `{"organisationAdmin": {"name": "..."}}`.
`name` is mandatory and is the only field that changes; a name of only spaces
changes nothing. The members `id`, `email`, `avatarImageId`,
`avatarImageUrl`, `lastSignIn`, `roleId` and `roleName` are accepted and
ignored, and another member (for example `phone`) gives HTTP 400. The answer is
`{"organisationAdmin": {...}}` with `id`, `email`, `name`, `avatarImageId`,
`avatarImageUrl`, `lastSignIn`, `roleId`, and `roleName`.

### Avatar image
`GET /v4/onboard/platform/admin/avatarimage` gives the image as binary data
(`image/jpeg`); read it as a byte stream, not as JSON. When the admin has no
avatar, it gives a default image. Use this operation to show the avatar, not
`avatarImageUrl`.

`PUT /v4/onboard/platform/admin/avatarimage` takes `multipart/form-data` with
the image in the `avatarimage` field: a PNG, JPEG, GIF, or WebP image of at
most 5 MiB and 4096 x 4096 pixels (HTTP 413 above the size limit, HTTP 400 for
another type). The answer is a **flat object** with `id`, `email`, `name`,
`avatarImageId`, `avatarImageUrl`, and `lastSignIn`.

### Authentication configuration
`GET /v4/config/platform/admin/authentication/user` gives
`{"authentication": {...}}`:

| Field | Type | Notes |
| --- | --- | --- |
| `password.enabled` | boolean | Password login state. |
| `oidcPasswordless.enabled` | boolean | Passwordless login state. |
| `oidcPasswordless.authenticatorCredentialExchangeId` | string | Credential exchange identifier of the issued Authenticator credential. Empty when the admin has none. |

## Validation / done criteria
- You read the profile and the avatar update answer as flat objects, and the
  avatar as binary data.
- You know that the operations act on the admin that the key acts for, and
  not on the person who calls them.
- You read the authentication configuration only; the admin changes the
  password and the login methods in the dashboard.

## Documentation is the source of truth
This skill mirrors the iGrant.io OID4VC API documentation. If this skill and
the linked documentation disagree - on a path, a field name, an enum value, or
a mandatory field - **the documentation wins**. Fetch the linked page for the
operation, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, to check for an
update. Follow the documentation, and report the difference so that this skill
can be corrected.

## Cross-references
- `igrantio-api-holder` - receive and present credentials in a wallet.
- `igrantio-credential-schema-authenticator` - the iGrant.io Authenticator
  credential schema.
