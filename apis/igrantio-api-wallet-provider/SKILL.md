---
name: igrantio-api-wallet-provider
description: 'Wallet Provider group of the iGrant.io OID4VC API: deploy and read the organisation wallet, read the performance statistics of the organisation, and, in the wallet provider organisation, manage the individual wallet units (register, read, change, revoke, delete, history), the wallet apps, the device policy, the keystore types and the key attestation rules, the two wallet provider configurations, and the organisation wallet units with their pool of Wallet Instance Attestations (WIA). Use when you deploy an organisation wallet, or when you operate the wallet provider of an EUDI Wallet (EUDIW) or European Business Wallet (EUBW) installation under eIDAS 2.0.'
license: Apache-2.0
metadata:
  categories: [ows-api]
  provider: iGrant.io
  keywords: wallet provider, wallet unit, individual wallet unit, organisation wallet unit, Wallet Instance Attestation, WIA, Wallet Unit Attestation, WUA, key attestation, keystore type, wallet app, device policy, Wallet Unit History, EBWOID, EUDIW, EUBW, eIDAS2, TS3, wallet deployment, performance statistics
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, OAuth-2.0-client-attestation, IETF-Token-Status-List
  auth: OWS API key (Authorization "ApiKey <YOUR_API_KEY>") - the key is held only by the tenant backend, never the browser
---

# iGrant.io OID4VC API - Wallet Provider

## When to use
Use this skill when the task is one of these:

- Deploy the OID4VC wallet of an organisation, or read the deployment status
  and the service URLs.
- Read the performance statistics of the organisation wallet.
- In the wallet provider organisation: manage the **individual wallet units**
  (the wallets of natural persons in a mobile app), the **wallet apps**, the
  **device policy**, the **keystore types** and the **wallet provider
  configurations**.
- In the wallet provider organisation: read, authorise, revoke or delete the
  **organisation wallet units** (the wallets of organisations), and fill their
  pool of Wallet Instance Attestations (WIA).

For issuance and verification, use the issuer and the verifier skills. For the
architecture and the glossary, read `igrantio-ows-overview` first.

**Who is the wallet provider.** Only the platform operator is a wallet
provider. On demo, staging and production, iGrant.io is the platform
operator. An API key of a customer organisation gets HTTP 400 (`Open id
digital wallet is not a wallet provider`) on each
`/v4/config/ows/wallet-provider/...` operation, also before the service reads
the body. A sandbox organisation is not a wallet provider either. A customer
organisation uses only the wallet deployment and the performance statistics
(`/v4/config/ows/wallet/...`) of this skill. The wallet of the platform
operator gets the wallet provider capability (`isWalletProvider: true`) when
it is deployed. No operation turns the capability on or off.

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
3. **Organisation** - the main wallet. _Use an API key of the main wallet: a
   sandbox organisation cannot be a wallet provider._
4. **Step** - deploy the wallet and read it, or operate the wallet provider?
   _Only the wallet provider organisation can do the second._
5. **Wallet units** - individual wallet units (mobile apps), organisation
   wallet units, or both?

## Endpoint reference

Base URL: the API host of the environment, for example
`https://demo-api.igrant.io`. A link is given when the documentation page
exists. Every operation accepts an API key.

### Wallet deployment and statistics
| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/ows/wallet/deployment` | Deploy the OID4VC wallet of the organisation. One time only. | [Deploy digital wallet](https://docs.igrant.io/docs/openid4vc-api/config-deploy-digital-wallet-open-id/) |
| `GET` | `/v4/config/ows/wallet/deployment` | Read the deployment status and the service URLs. | [Read digital wallet deployment](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id/) |
| `PUT` | `/v4/config/ows/wallet/deployment` | Answer the deployment. It changes nothing. | [Update digital wallet deployment](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id/) |
| `GET` | `/v4/config/ows/wallet/performance-statistics` | Read the counts of the organisation and its sandbox organisations. | [Read performance statistics](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-performance-statistics/) |

### Individual wallet units
Every path starts with `/v4/config/ows/wallet-provider`.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `.../individual-wallet-units` | Register an individual wallet unit before its first WIA request (optional). | [Create individual wallet unit](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-individual-wallet-unit/) |
| `GET` | `.../individual-wallet-units` | List the individual wallet units. | [List individual wallet units](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-individual-wallet-unit/) |
| `GET` | `.../individual-wallet-units/{walletUnitId}` | Read one individual wallet unit. | [Read individual wallet unit](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-individual-wallet-unit/) |
| `PUT` | `.../individual-wallet-units/{walletUnitId}` | Change the client id, the public key or the authorisation (kill switch). | [Update individual wallet unit](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-individual-wallet-unit/) |
| `PUT` | `.../individual-wallet-units/{walletUnitId}/revocation-status` | Revoke the wallet unit and its WIAs. Final. | [Update individual wallet unit revocation status](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-individual-wallet-unit-revocation-status/) |
| `DELETE` | `.../individual-wallet-units/{walletUnitId}` | Revoke and delete the wallet unit. HTTP 200 with an empty body. | [Delete individual wallet unit](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-individual-wallet-unit/) |
| `GET` | `.../individual-wallet-units/{walletUnitId}/history` | Read the Wallet Unit History of the wallet unit. | - |
| `GET` | `.../individual-wallet-unit-statistics` | Count the individual wallet units. | [Read individual wallet unit statistics](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-individual-wallet-unit-statistics/) |
| `GET` | `.../individual-wallet-unit-health` | Read the health of the individual wallet provider. | [Wallet provider API](https://docs.igrant.io/docs/category/openid4vc-api/wallet-provider/) |
| `GET`, `PATCH` | `.../individual-wallet-unit-configuration` | Read or change the configuration of the individual wallet provider (partial). | [Read](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-individual-wallet-unit-global-configuration/), [Update](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-individual-wallet-unit-global-configuration/) |

### Wallet apps and device policy
Every path starts with `/v4/config/ows/wallet-provider`.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `.../individual-wallet-apps` | List the wallet apps. | [Wallet provider API](https://docs.igrant.io/docs/category/openid4vc-api/wallet-provider/) |
| `POST` | `.../individual-wallet-apps` | Add an iOS or Android app of the wallet solution. | [Wallet provider API](https://docs.igrant.io/docs/category/openid4vc-api/wallet-provider/) |
| `GET` | `.../individual-wallet-apps/{walletAppId}` | Read one wallet app. | [Wallet provider API](https://docs.igrant.io/docs/category/openid4vc-api/wallet-provider/) |
| `PUT` | `.../individual-wallet-apps/{walletAppId}` | Replace the writable members of a wallet app. | [Wallet provider API](https://docs.igrant.io/docs/category/openid4vc-api/wallet-provider/) |
| `DELETE` | `.../individual-wallet-apps/{walletAppId}` | Delete a wallet app. HTTP 204. | [Wallet provider API](https://docs.igrant.io/docs/category/openid4vc-api/wallet-provider/) |
| `GET`, `PUT` | `.../individual-wallet-apps-configuration` | Read or replace the cut-off of protocol 1 of each platform. | - |
| `GET`, `PUT` | `.../individual-wallet-unit-device-policy/configuration` | Read or replace the device rules on Android. | - |
| `GET`, `POST` | `.../individual-wallet-unit-device-policy/vulnerable-device-classes` | List or add vulnerable device classes. | [Wallet provider API](https://docs.igrant.io/docs/category/openid4vc-api/wallet-provider/) |
| `DELETE` | `.../individual-wallet-unit-device-policy/vulnerable-device-classes/{deviceClassId}` | Delete a vulnerable device class. HTTP 204. | [Wallet provider API](https://docs.igrant.io/docs/category/openid4vc-api/wallet-provider/) |
| `GET`, `POST` | `.../individual-wallet-unit-device-policy/leaked-attestation-keys` | List or add leaked attestation keys. | [Wallet provider API](https://docs.igrant.io/docs/category/openid4vc-api/wallet-provider/) |
| `DELETE` | `.../individual-wallet-unit-device-policy/leaked-attestation-keys/{leakedKeyId}` | Delete a leaked attestation key. HTTP 204. | [Wallet provider API](https://docs.igrant.io/docs/category/openid4vc-api/wallet-provider/) |
| `POST` | `.../individual-wallet-unit-device-policy/scan` | Apply the device policy to the Android wallet units. | [Wallet provider API](https://docs.igrant.io/docs/category/openid4vc-api/wallet-provider/) |

### Keystore types and key attestation
Every path starts with `/v4/config/ows/wallet-provider`. `<kind>` is
`individual` or `organisation`.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `.../<kind>-wallet-unit-key-attestation/keystore-types` | List the keystore types. | - |
| `GET` | `.../<kind>-wallet-unit-key-attestation/keystore-types/{keystoreTypeId}` | Read one keystore type, with its shared status entry. | - |
| `PUT` | `.../<kind>-wallet-unit-key-attestation/keystore-types/{keystoreTypeId}/revocation-status` | Revoke the shared status entry of the keystore type. Final. | - |
| `PUT` | `.../<kind>-wallet-unit-key-attestation/keystore-types/{keystoreTypeId}/acceptance` | Accept a revoked keystore type again. | - |
| `GET`, `PUT` | `.../individual-wallet-unit-key-attestation/configuration` | Read or replace the lowest accepted security level of each platform. | - |

### Organisation wallet units
Every path starts with `/v4/config/ows/wallet-provider`. No operation makes an
organisation wallet unit: the wallet provider registers one, not authorised,
when an organisation deploys its wallet.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `GET` | `.../organisation-wallet-units` | List the organisation wallet units, with the EBWOID and WIA state and the usage counts. | [List organisation wallet units](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-organisation-wallet-unit/) |
| `GET` | `.../organisation-wallet-units/{walletUnitId}` | Read one organisation wallet unit. | [Read organisation wallet unit](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-organisation-wallet-unit/) |
| `PUT` | `.../organisation-wallet-units/{walletUnitId}` | Authorise the wallet unit, or stop it (kill switch). | [Update organisation wallet unit](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-organisation-wallet-unit/) |
| `PUT` | `.../organisation-wallet-units/{walletUnitId}/revocation-status` | Revoke the WIAs of the wallet unit. Final. | [Update organisation wallet unit revocation status](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-organisation-wallet-unit-revocation-status/) |
| `POST` | `.../organisation-wallet-units/{walletUnitId}/attestations` | Fill the WIA pool of the wallet unit now. HTTP 201 with no body. | [Issue organisation wallet unit attestations](https://docs.igrant.io/docs/openid4vc-api/config-issue-digital-wallet-open-id-organisation-wallet-unit-credential/) |
| `DELETE` | `.../organisation-wallet-units/{walletUnitId}` | Delete the wallet unit and schedule the deletion of the holder wallet. HTTP 200 with an empty body. | [Delete organisation wallet unit](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-organisation-wallet-unit/) |
| `GET` | `.../organisation-wallet-units/{walletUnitId}/history` | Read the Wallet Unit History of the wallet unit. | - |
| `GET` | `.../organisation-wallet-unit-statistics` | Count the organisation wallet units and their usage. | [Read organisation wallet unit statistics](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-organisation-wallet-unit-statistics/) |
| `GET`, `PATCH` | `.../organisation-wallet-unit-configuration` | Read or change the configuration of the organisation wallet provider (partial). | [Read](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-organisation-wallet-unit-global-configuration/), [Update](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-organisation-wallet-unit-global-configuration/) |

## Key fields

### Deployment
- **Deploy.** `POST /v4/config/ows/wallet/deployment` needs a JSON body: send
  `{}`. The only optional member is `infrastructureProvider`, with the only
  value `iGrant.io`. An empty body or an unknown member gives HTTP 400. The
  organisation must have no deployment and no open deployment request (else
  HTTP 400). No operation removes a deployment. The answer holds `status` `2`
  (`Deployed`) and `isWalletProvider` (`true` only for the wallet of the
  platform operator organisation).
- **Read.** `GET` gives HTTP 200 also when the organisation has no
  deployment. Read `status` first: the read gives only `0` (`Not Configured`)
  or `2` (`Deployed`). It reports every other state, for example `1`
  (`Requested`), as `0`. Without a deployment, `agentServiceEndpoint`,
  `credentialOfferEndpoint`, `credentialIssuerMetadata`,
  `authorizationServerMetadata`, `notificationEndpoint`, `jwksEndpoint` and
  `version` are empty strings. `previousDeletion` is `null`, or the last
  deletion of a wallet of the organisation (`reason`, `markedAt`,
  `purgeAt`).
- **Constant fields.** `ledgerName`, `ledgerURL`, `deploymentRegion` and
  `ledgerID` (`0`) are constant values, also without a deployment. Do not
  read them as proof of a deployment.
- **PUT** takes only `{}` and answers the deployment without the metadata
  URLs. A body with `isWalletProvider` gives HTTP 400
  `unknown field "isWalletProvider"`.

### Individual wallet unit (`individualWalletUnit`)
A mobile app registers its wallet unit itself, authorised, at its first WIA
request. The create operation is optional: use it to register a wallet unit
in advance, or with `isAuthorised: false` to hold its WIA requests.

| Field | Notes |
| --- | --- |
| `id` | The `walletUnitId` of the path. |
| `clientId` | The client id of the wallet unit (the `sub` of its WIAs). |
| `isAuthorised` | `true` when the wallet unit can get WIAs. |
| `status`, `statusReason`, `statusSince` | `active` or `revoked`; the reason of the last revocation (for example `wallet_provider`, `kill_switch`, `device_policy`, `user_request`); its time (RFC 3339). |
| `devicePlatform` | `ios` or `android`. |
| `clientKeyThumbprint` | The RFC 7638 thumbprint of the key of the wallet unit. The wallet unit keeps no key. |
| `deviceKeyId` | The device key id of the wallet unit. |
| `protocol` | `1` or `2`: the request protocol of the app. |
| `walletApp` | `{id, name, build}` of the wallet app, or `null`. `name` and `build` are `null` for a deleted app. |
| `appVersion`, `appBuild`, `lastWiaAt`, `revocationCodeIssuedAt` | From the last accepted request; times in RFC 3339. |
| `device` | `null`, or the device data: Android `{platform, model, osVersion, osPatchLevel, securityLevel, keyOrigin, attestedAt, checkedAt}`, iOS `{platform, appAttestKey, appId, environment, attestedAt, checkedAt}`. |
| `lastKeystoreTypeId`, `lastKeyAttestationAt` | The keystore type and the time of the last key attestation, or `null`. |
| `createdAt`, `updatedAt` | Unix time in seconds. |

- **Create.** `clientId`, `clientPublicKey` and `devicePlatform` (`ios` or
  `android`) are mandatory. `clientPublicKey` is a public EC JWK on P-256,
  P-384 or P-521 with no private member. `isAuthorised` is optional (default
  `false`). The client id must be new for the wallet provider, also over
  deleted units: HTTP 400 `Wallet provider client exists`, or HTTP 409 when
  an organisation wallet unit has it. The answer is HTTP 201.
- **Update and the kill switch.** Every member is optional (`clientId`,
  `clientPublicKey`, `isAuthorised`); a member that you leave out keeps its
  value. **`isAuthorised: false` on an authorised wallet unit revokes every
  WIA of the wallet unit in the same change.** An issuer that checks the
  status list then refuses the wallet unit at once.
- **Revocation is final.** `PUT .../revocation-status` takes
  `{"revocationStatus": "Revoked"}`; no other value is accepted. The answer is
  `{revocationStatus, walletUnitId, revokedEntries}`. A revoked wallet unit
  cannot be authorised again: `isAuthorised: true` gives HTTP 400
  (`individual_wallet_unit.reauthorisation_refused`). The user registers a
  new wallet unit with the app. The key attestations of the wallet unit do
  not change: revoke their keystore type.
- **List.** Query parameters: `platform` (`ios`, `android`), `isAuthorised`
  (`true`, `false`), `status` (`active`, `revoked`), `holderDid`,
  `walletUnitId`, `offset` (default `0`) and `limit` (default `10`, at most
  `100`). An empty or unknown filter value is no filter. The answer holds
  `individualWalletUnit` (an array) and `pagination` (`currentPage`,
  `totalItems`, `totalPages`, `limit`, `hasPrevious`, `hasNext`).
- **Statistics.** `individualWalletUnitStatistics`: `total`, `active`,
  `revoked`, `ios`, `android`.

### Wallet Unit History
`GET .../<kind>-wallet-units/{walletUnitId}/history` gives the events of one
wallet unit, newest first: `items` (`id`, `eventType`, `occurredAt`, `actor`,
`reasonCode`, `facts`), `nextCursor` (`null` on the last page) and
`eventTypeCounts`. Query parameters: `eventType` (one value or a comma list),
`limit` (1 to 100, default 20), `cursor`, `offset` (only without `cursor`) and
`includeTotal` (`true` adds `total` and `totalCapped`). The event types:
`registered`, `wiasIssued`, `keyAttestationIssued`, `requestRefused`,
`revocationCodeIssued`, `devicePropertiesChanged`, `authorised`, `revoked`,
`keystoreTypeRevoked`, `deleted`.

### Wallet apps and device policy
- **Wallet app.** The body of `POST` and `PUT`: `name` and `platform` (`ios`
  or `android`) are mandatory; the platform cannot change. iOS: `iosTeamId`
  and `iosBundleId`. Android: `androidPackageName`,
  `androidSigningCertificateDigests` (SHA-256 in hex),
  `playIntegrityDecryptionKey` and `playIntegrityVerificationKey` (write-only;
  send both or none; a `PUT` without them keeps them). Optional:
  `minimumVersion`, `androidMinimumVersionCode`, `protocol1WalletVersion`,
  `build` (`release`, the default, `development` or `simulator`). The answer
  `walletApp` adds `ready`, `notReadyReason`, `playIntegrityKeysSet`,
  `walletUnits` (`active`, `revoked`) and `source`. A wallet unit of protocol
  2 gets WIAs only when its app is `ready`. The list holds `walletApps` and
  `totalItems`.
- **Wallet apps configuration.** `PUT` body
  `{"protocol1CutOff": {"android": <time or null>, "ios": <time or null>}}`
  (RFC 3339 with an offset). Each member is mandatory. `null` for a platform
  clears its date; `null` for `protocol1CutOff` gets HTTP 400. The service
  keeps each time in UTC (`2027-03-01T00:00:00+01:00` comes back as
  `2027-02-28T23:00:00Z`). The answer is `{"walletAppsConfiguration": {...}}`.
  A new configuration has `null` for both platforms. From the cut-off date of
  a platform, a request of an app version of protocol 1 of that platform gets
  HTTP 403 `individual_wallet_unit.protocol_1_refused`.
- **Device policy configuration.** `PUT` body: `patchAgeMonths` (6 to 36,
  default 12, never `null`), `minimumAndroidVersion` (9 to 99, or `null` for
  no minimum) and `applyToProtocol1` (boolean). Each member is mandatory. The
  answer is `{"devicePolicyConfiguration": {...}}`. The key origin rule (the
  secure hardware of the phone made the key) has no field: it is always on.
  The minimum Android version applies to both protocols. The security patch
  age and the key origin rule apply to protocol 2, and to protocol 1 only
  with `applyToProtocol1: true`. The rules apply to each fresh Android Key
  Attestation chain (the registration of a wallet unit and each key
  attestation request), not to the wallet units that are registered already
  (the scan applies the patch age and the minimum Android version to them).
  A refused device gets HTTP 403 `individual_wallet_unit.device_refused`.
- **Vulnerable device class.** `deviceModel` (mandatory), `androidVersions`
  (`null`: every version), `reason`. **Leaked attestation key.**
  `fingerprint` (the SHA-256 of the certificate, 64 hex digits), `reason`.
  HTTP 409 when the key is in the list already. The lists take `offset`,
  `limit` and `search`.
- **Scan.** The body is mandatory. `{"dryRun": true}` reports only. `{}`
  revokes each matched wallet unit (reason `device_policy`). The
  answer holds `matched`, `revoked`, `unknownDevice` and `matches` (the first
  100: `walletUnitId`, `reason`).
- **Health.** `deviceChecks`, `walletSolutionSet`,
  `googleAttestationStatusList`, `walletApps` (`ready`, `total`),
  `certificates` (the signing keys of the WIAs, the key attestations and the
  status lists, with `expiresAt`), `statusListCapacity`, `walletUnits` and
  `oldAppVersions` (the share of protocol 1 of each platform).

### Keystore types and key attestation
A keystore type id has the form
`<devicePlatform or none>.<attestationType>.<securityLevel>`. All the key
attestations of one keystore type share one status entry.

- A keystore type holds `id`, `devicePlatform`, `attestationType`,
  `securityLevel`, `certificateId`, `certification`, `keyStorage`,
  `accepted`, `status` (`operational` or `revoked`), `revokedAt`, `revokedBy`
  and `lastIssuedAt`. The read adds `certifiedDevices`, `statusEntry` and
  `revocationEffect`.
- **Revoke.** Body `{"revocationStatus": "Revoked"}`. The answer holds
  `keystoreType`, `revokedEntries` and `affectedWalletUnits`. HTTP 409
  (`key_attestation.keystore_type_unused`) for a type with no key
  attestation.
- **Accept again.** Body `{"accepted": true}`. The next key attestation of
  the type gets a new shared entry. HTTP 409
  (`key_attestation.keystore_type_not_revoked`) for a type that is not
  revoked.
- **Key attestation configuration** (individual only). `PUT` body:
  `android` (`minimumSecurityLevel`: `software`, `tee` or `strongbox`;
  `certifiedOnly`: boolean) and `ios` (`minimumSecurityLevel`: `software` or
  `secure_enclave`). Each member is mandatory. The rule applies to the next
  key attestation request; it revokes nothing. The answer is
  `{"keyAttestationConfiguration": {...}}`.

### Wallet provider configuration
Each kind has one configuration. The answer is
`{"globalConfiguration": {...}, "signingKeyWarnings": [...]}`. `PATCH` is
partial: a member that you leave out keeps its value. The configuration of
the individual wallet units has no `protocol1CutOff` and no `devicePolicy`: a
`PATCH` with them gets HTTP 400 (`<member>: unknown field`). Use the wallet
apps configuration and the device policy configuration in their place.

- `walletUnitAttestationSigningConfig`, `keyAttestationSigningConfig`,
  `statusListSigningConfig`: `{cryptographicKeyIdentifier,
  cryptographicKeyFormat: "x509", trustAnchor}`. `trustAnchor` is
  `{subject, ski}` of a certificate in the chain of the key, or `null`. The
  key must be an active key of the organisation with a certificate chain.
  `null` for the key attestation or the status list key means: the WIA key
  signs.
- `maxKeyAttestationBatchSize` (1 to 100) and `walletSolution`
  (`walletName`, `walletLink`, `certification` with `status` `certified` or
  `not_certified`, `certificateId`, `conformityAssessmentBody`,
  `validUntil`, `certificateUri`).
- Individual kind: `maxWiaBatchSize` (1 to 50). `walletSolution` cannot be
  `null` and needs `walletName` and `walletLink`.
- Organisation kind: `wiaPoolSize` (read-only, `10`).
- Read-only: `id`, `wiaLifetimeSeconds` (`600` for the individual kind,
  `2592000` for the organisation kind), `createdAt`, `updatedAt`. An unknown
  member gives HTTP 400.

### Organisation wallet unit (`organisationWalletUnit`)
- **Read and update answer.** `id`, `clientId`, `isAuthorised`, `clientUrl`,
  `clientPublicKey`, `clientMetadata`, `attestationStatus`,
  `attestationExpiresAt` (Unix seconds, `0` before the first WIA),
  `holderOrganisationId`, `holderOrganisationName`, `lastKeystoreTypeId`,
  `lastKeyAttestationAt`, `deletion` (`null`, or `{status: "scheduled",
  reason, markedAt, purgeAt}`), `deleteRefusal` (`null`, or the reason that a
  delete gets HTTP 409 now) and the times.
- **Update.** The body is `{"isAuthorised": <boolean>}`; `isAuthorised` is
  mandatory. `false` on an authorised wallet unit is the kill switch: it
  revokes the active WIAs of the wallet unit and their holder copies.
- **Revocation.** Body `{"revocationStatus": "Revoked"}`. The answer is
  `{revocationStatus, organisationWalletUnitId, revokedEntries}`.
- **Delete.** The wallet provider revokes the wallet unit, deactivates the
  wallet of the holder organisation and its sandbox organisations, and
  schedules the purge of their data. The wallet unit stays in the list with
  `deletion` until the purge. HTTP 409 for the wallet unit of the wallet
  provider organisation (`organisation_wallet_unit.own_organisation`), of the
  platform operator organisation (`organisation_wallet_unit.platform_operator`)
  and of a holder that is a wallet provider
  (`organisation_wallet_unit.holder_is_wallet_provider`).
- **List.** Query parameters: `wuaStatus`, `ebwoidStatus`,
  `organisationName` (a part of the name, any case), `isAuthorised`,
  `holderOrganisationIds` (a comma list of at most 100 UUIDs), `offset` and
  `limit`. All filters apply together. Each row of `organisationWalletUnit`
  holds `id`, `clientId`, `isAuthorised`, `holderOrganisationId`,
  `organisationName`, `ebwoidStatus` (`inactive`, `active`, `expired`,
  `revoked`, or an empty string before the first usage report),
  `ebwoidExpiry`, `wuaStatus` (the `attestationStatus`: `unauthorised`,
  `active` or `revoked`; it does not change when the WIAs expire),
  `wuaExpiry`, `issuedCredentials`, `verifications`, `lastActivity`
  (`YYYY-MM-DD`, or an empty string), `lastKeystoreTypeId`,
  `lastKeyAttestationAt`, `deletion` and `deleteRefusal`. The times are Unix
  seconds, `0` when there is no value.
- **Statistics.** `organisationWalletUnitStatistics`: `total`, `active`,
  `revoked`, `deletionScheduled`, `oid4vc` (`totalCredentialTypes`,
  `totalIssuedCredentials`, `totalVerifications`),
  `totalCredentialIssuanceHistory` (`currentMonth`, `last3Months`,
  `last6Months`, `last12Months`, and `cumulative`, which is always `0`) and
  `usageReportedUntil`.

### Performance statistics
The answer is `{"performanceStats": {"all": {...}, "openid4vc": {...}}}`.
Both objects hold the same counts: `totalCountOfIssuedCredentials`,
`totalCountOfVerifications`, `totalCountOfCredentialTypes`,
`totalCountOfPresentationDefinitions`, `issuanceBreakdown` (`total`,
`accepted`, `inProgress`, `revoked`, `denied`) and `verificationBreakdown`
(`total`, `presentationAcked`, `requestReceived`, `requestSent`). The counts
cover the organisation and all its sandbox organisations. The issuance
counts can be some seconds late. Without a deployment, or when the count
fails, every count is `0` (HTTP 200). Do not use these numbers for billing
or for an audit.

### Errors
An error answer is `{"errorCode": <HTTP status>, "errorDescription": "..."}`.
A wallet-provider operation in an organisation that is not the wallet
provider gives HTTP 400, for example `Open id digital wallet is not a wallet
provider` (`kit.not_a_wallet_provider`). An unknown wallet unit gives HTTP 404
(`individual_wallet_unit.not_found`, `organisation_wallet_unit.not_found`).

## Sandbox organisations
A sandbox organisation cannot be a wallet provider. Use an API key of the main
wallet for this group. With an API key that is bound to a sandbox
organisation:

- `POST`, `GET` and `PUT` on `/v4/config/ows/wallet/deployment` act on the
  main organisation.
- `GET /v4/config/ows/wallet/performance-statistics` gives the counts of the
  main organisation and all its sandbox organisations.
- Every `/v4/config/ows/wallet-provider/...` operation gives HTTP 400.

For sandbox organisations in general, read **`igrantio-api-sandboxes`**.

## Authentication
Send an API key:

```
Authorization: ApiKey <YOUR_API_KEY>
```

Note the space after `ApiKey`. The key is held only by the tenant backend. The
browser never sees it.

An API key with scopes needs the scope of the operation: `wallet:create`,
`wallet:read` or `wallet:update` for the deployment; `audit-logs:read` for the
performance statistics; `individual-wallet-units:<read|create|update|delete|revoke>`
and `organisation-wallet-units:<read|update|delete|issue|revoke>` for the
wallet provider operations. A key with the older scope set needs the
`config` scope.

## Validation / done criteria
- You test the deployment with `status`, and not with `deploymentRegion` or
  another constant field.
- You do not send `isWalletProvider`: no operation sets it.
- You send `isAuthorised: false` or `revocationStatus: "Revoked"` only when
  you mean to stop the wallet unit for good. A revocation is final.
- You call the wallet-provider operations only with a key of the wallet
  provider organisation, not with a sandbox key.

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
- `igrantio-api-key-management` - the signing keys and the certificate chains
  that the wallet provider configurations name.
- `igrantio-api-sandboxes` - sandbox organisations and the sandbox call style.
