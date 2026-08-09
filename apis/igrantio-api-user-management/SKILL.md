---
name: igrantio-api-user-management
description: 'User Management group of the iGrant.io OID4VC API: the account of the signed-in admin. Read and update the profile, read and update the avatar image, reset the password, read the authentication configuration, and manage the passwordless-login methods - link a PID credential from an EUDI Wallet or an iGrant.io Authenticator credential, monitor both with SSE streams, and remove them. This is the API behind the Manage User page of the dashboard. Use when you build a profile or account-settings flow, or when you wire up passwordless login for the signed-in admin.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: user management, manage user, admin profile, avatar image, reset password, authentication configuration, passwordless login, PID, Person Identification Data, iGrant.io Authenticator, credential offer, SSE, EUDI Wallet, eIDAS2
  version: 2026.08.01
  source-doc: https://docs.igrant.io/docs/openid4vc-api/
  protocols: OAuth-2.0-bearer, JWT, SSE
  auth: Bearer access token of the admin; the operations act on the account that owns the token
---

# iGrant.io OID4VC API - User Management

## When to use
Use this skill when the task is one of these:

- Read or update the profile of the signed-in admin.
- Read or update the avatar image of the signed-in admin.
- Change the password of the signed-in admin.
- Read which login methods the signed-in admin has.
- Link an EUDI Wallet for passwordless login, with a PID (Person
  Identification Data) credential or an iGrant.io Authenticator credential.
- Remove a passwordless-login method.

This group is the API behind the **Manage User** page of the iGrant.io
dashboard. Every operation acts on the account that owns the access token. To
manage the other admins of the organisation, use
**`igrantio-api-team-management`**.

## Endpoint reference

Base URL for the demo environment: `https://demo-api.igrant.io`.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `/v2/onboard/admin` | Read the profile. | [Read admin profile](https://docs.igrant.io/docs/openid4vc-api/config-read-admin-profile/) |
| `PUT` | `/v2/onboard/admin` | Update the profile. | [Update admin profile](https://docs.igrant.io/docs/openid4vc-api/config-update-admin-profile/) |
| `GET` | `/v2/onboard/admin/avatarimage` | Read the avatar image (binary). | [Read admin avatar image](https://docs.igrant.io/docs/openid4vc-api/config-read-admin-avatar/) |
| `PUT` | `/v2/onboard/admin/avatarimage` | Update the avatar image (multipart). | [Update admin avatar image](https://docs.igrant.io/docs/openid4vc-api/config-update-admin-avatar/) |
| `PUT` | `/v2/onboard/password/reset` | Change the password. | [Reset admin password](https://docs.igrant.io/docs/openid4vc-api/config-reset-admin-password/) |
| `GET` | `/v3/config/admin/authentication/user` | Read the authentication configuration. | [Read admin authentication configuration](https://docs.igrant.io/docs/openid4vc-api/config-read-admin-authentication/) |
| `GET` | `/v3/config/admin/authentication/oidc/user/verify` | Start a PID verification to link a wallet. | [Verify admin with PID credential](https://docs.igrant.io/docs/openid4vc-api/config-passwordless-login-verify-pid/) |
| `DELETE` | `/v3/config/admin/authentication/oidc/user/verify` | Remove the PID login method. Gives **HTTP 204**. | [Remove PID passwordless login method](https://docs.igrant.io/docs/openid4vc-api/config-passwordless-login-unlink-pid/) |
| `GET` | `/v3/config/admin/authentication/oidc/user/verify/sse` | Stream the PID verification status (SSE). | [Stream PID verification status](https://docs.igrant.io/docs/openid4vc-api/config-passwordless-login-verify-pid-sse/) |
| `GET` | `/v3/config/admin/authentication/oidc/user/authenticator` | Issue an iGrant.io Authenticator credential. | [Issue iGrant.io Authenticator credential](https://docs.igrant.io/docs/openid4vc-api/config-passwordless-login-issue-authenticator/) |
| `DELETE` | `/v3/config/admin/authentication/oidc/user/authenticator` | Remove the Authenticator login method. Gives **HTTP 204**. | [Remove iGrant.io Authenticator method](https://docs.igrant.io/docs/openid4vc-api/config-passwordless-login-remove-authenticator/) |
| `GET` | `/v3/config/admin/authentication/oidc/user/authenticator/sse` | Stream the Authenticator issuance status (SSE). | [Stream Authenticator issuance status](https://docs.igrant.io/docs/openid4vc-api/config-passwordless-login-issue-authenticator-sse/) |

Twelve operations. Note the version split: the profile, avatar, and password
operations live under `/v2/onboard/...`; the authentication operations live
under `/v3/config/admin/authentication/...`.

## Authentication and permission
Every operation accepts a **bearer access token** and acts on the admin that
owns the token. Send it as `Authorization: Bearer <token>`. There is no
`adminId` path parameter in this group.

For the SSE operations, the dashboard opens the stream with the token in a
query parameter: `?authorization=Bearer <token>`. Use this form when your SSE
client cannot set the `Authorization` header.

## Key fields and operations

### Profile
`GET /v2/onboard/admin` gives `{"organisationAdmin": {...}}` with `id`,
`email`, `name`, `phone`, `roleId`, `roleName`, `avatarImageId`,
`avatarImageUrl`, and `lastVisited`. Update with
`PUT /v2/onboard/admin` and the body
`{"organisationAdmin": {"name": "...", ...}}`.

### Avatar image
`GET /v2/onboard/admin/avatarimage` gives the binary image data; read it as a
byte stream, not as JSON. `PUT` takes `multipart/form-data` with the image in
the `avatarimage` field, and gives the updated `organisationAdmin`.

### Password
`PUT /v2/onboard/password/reset` with the body
`{"currentPassword": "...", "newPassword": "..."}`. Both fields are mandatory.

### Authentication configuration
`GET /v3/config/admin/authentication/user` gives
`{"authentication": {...}}`:

| Field | Type | Notes |
| --- | --- | --- |
| `password.enabled` | boolean | Password login state. |
| `oidcPasswordless.enabled` | boolean | Passwordless login state. An admin of the organisation turns it on or off with the switch in `igrantio-api-team-management`. |
| `oidcPasswordless.linked` | boolean | `true` when the admin has linked a wallet. |
| `oidcPasswordless.authenticatorCredentialExchangeId` | string | Credential exchange identifier of the issued Authenticator credential. |

### Link a wallet with a PID credential
1. `GET .../oidc/user/verify` gives `vpTokenQrCode` (a QR code for the wallet)
   and `presentationExchangeId`.
2. Open `GET .../oidc/user/verify/sse` and wait for
   `data: {"verified": true}`. The connection stays alive with `: keep-alive`
   comments and closes on success or timeout.
3. The admin scans the QR code with the EUDI Wallet and presents the PID
   credential. A successful presentation links the wallet.

`DELETE .../oidc/user/verify` removes the PID login method (HTTP 204).

### Link a wallet with an iGrant.io Authenticator credential
1. `GET .../oidc/user/authenticator` gives `credentialOffer` (a credential
   offer URI), `credentialExchangeId`, and `pin` (a one-time PIN).
2. Open `GET .../oidc/user/authenticator/sse` and wait for
   `data: {"accepted": true}`.
3. The admin scans the credential offer with the wallet and enters the PIN to
   accept the credential.

`DELETE .../oidc/user/authenticator` removes the Authenticator login method
(HTTP 204).

## Validation / done criteria
- You read the avatar as binary data, not as JSON.
- You send both `currentPassword` and `newPassword` on the password change.
- Your PID and Authenticator flows open the SSE stream before the admin scans,
  and they test for `{"verified": true}` or `{"accepted": true}`.
- You test for HTTP 204 on the two remove operations.
- You use `igrantio-api-team-management` to turn passwordless login on or off;
  this group only links or removes the methods of the signed-in admin.

## Documentation is the source of truth
This skill mirrors the iGrant.io OID4VC API documentation. If this skill and
the linked documentation disagree - on a path, a field name, an enum value, or
a mandatory field - **the documentation wins**. Fetch the linked page for the
operation, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, to check for an
update. Follow the documentation, and report the difference so that this skill
can be corrected.

## Cross-references
- `igrantio-api-team-management` - create, delete, and list the admins of the
  organisation, and the passwordless-login switch per admin.
- `igrantio-api-holder` - receive and present credentials in a wallet.
- `igrantio-credential-schema-authenticator` - the iGrant.io Authenticator
  credential schema.
