---
name: igrantio-api-wallet-provider
description: 'Wallet Provider group of the iGrant.io OID4VC API: deploy the organisation wallet, turn on the wallet provider capability, register and manage wallet units (the records behind a Wallet Unit Attestation, WUA), list organisation wallet units with their LPID and WUA status, and read wallet provider performance statistics. Use when you act as an EUDI Wallet (EUDIW) or European Business Wallet (EUBW) wallet provider under eIDAS 2.0, or when you must read or change the OID4VC deployment of an organisation.'
license: Apache-2.0
metadata:
  categories: [ows-api]
  provider: iGrant.io
  keywords: wallet provider, wallet unit, Wallet Unit Attestation, WUA, LPID, assertionToken, client assertion, EUDIW, EUBW, eIDAS2, OpenID4VCI, OpenID4VP, wallet deployment, performance statistics
  version: 2026.10.01
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, OAuth-2.0-client-assertion
  auth: OWS API key (Authorization "ApiKey <YOUR_API_KEY>") - the key is held only by the tenant backend, never the browser
---

# iGrant.io OID4VC API - Wallet Provider

## When to use
Use this skill when the task is one of these:

- Deploy the OID4VC wallet of an organisation, or read the deployment status
  and the well-known metadata URLs.
- Turn on the **wallet provider** capability of the organisation.
- Register a wallet instance as a **wallet unit**, so that the wallet provider
  can give it a **Wallet Unit Attestation (WUA)**.
- Read, update, delete, or list wallet units.
- Read the status of the organisation wallet units (LPID and WUA), or read the
  performance statistics of the wallet provider.

For issuance and verification, use the issuer and the verifier skills. For the
architecture and the glossary, read `igrantio-ows-overview` first.

**Order of work.** Deploy the wallet, then turn on the wallet provider
capability, then register wallet units. Every wallet unit operation and the
statistics operation give HTTP 400 when the organisation is not a wallet
provider.

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
3. **Organisation** - the wallet provider capability belongs to the main
   wallet. _Use an API key of the main wallet: a sandbox organisation cannot
   be a wallet provider._
4. **Step** - deploy the wallet, turn on the wallet provider capability, or
   manage wallet units? _Do them in that order._
5. **Wallet units** - how are wallet instances registered, and by whom?

## Endpoint reference

Base URL for the demo environment: `https://demo-api.igrant.io`.

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v2/config/digital-wallet/openid` | Deploy the OID4VC wallet of the organisation. One time only. | [Deploy digital wallet](https://docs.igrant.io/docs/openid4vc-api/config-deploy-digital-wallet-open-id/) |
| `GET` | `/v2/config/digital-wallet/openid` | Read the deployment status, the service endpoints, and the metadata URLs. | [Read digital wallet deployment](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id/) |
| `PUT` | `/v2/config/digital-wallet/openid` | Turn on the wallet provider capability. | [Enable wallet provider](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id/) |
| `POST` | `/v2/config/digital-wallet/openid/wallet-provider/wallet-unit` | Register a new wallet unit. | [Create wallet unit](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-wallet-unit/) |
| `GET` | `/v2/config/digital-wallet/openid/wallet-provider/wallet-unit/{walletUnitId}` | Read one wallet unit. | [Read wallet unit](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-wallet-unit/) |
| `PUT` | `/v2/config/digital-wallet/openid/wallet-provider/wallet-unit/{walletUnitId}` | Update one wallet unit. | [Update wallet unit](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-wallet-unit/) |
| `DELETE` | `/v2/config/digital-wallet/openid/wallet-provider/wallet-unit/{walletUnitId}` | Delete one wallet unit. HTTP 200 with an empty body. | [Delete wallet unit](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-wallet-unit/) |
| `GET` | `/v2/config/digital-wallet/openid/wallet-provider/wallet-units` | List wallet units, with filters and pages. | [List wallet units](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-wallet-unit/) |
| `GET` | `/v2/config/digital-wallet/openid/wallet-provider/organisation-wallet-units` | List organisation wallet units with LPID status, WUA status, and usage counts. | [List organisation wallet units](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-organisation-wallet-unit/) |
| `GET` | `/v2/config/digital-wallet/openid/wallet-provider/statistics` | Read the performance statistics of the wallet provider. | [Performance statistics of a wallet provider](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-performance-statistics/) |

Ten operations. Each one accepts an API key.

## Key fields

### Wallet unit (`walletUnit`)
The service always sends every field. A field with no value holds an empty
string, `0`, `false`, or `null`.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Identifier of the record. Use it as the `walletUnitId` path parameter. |
| `clientId` | string | Client identifier of the wallet instance: a DID or a URL. |
| `clientUrl` | string | URL endpoint of the wallet instance. |
| `clientPublicKey` | object, nullable | Public key of the wallet instance in JWK format. The wallet provider uses it to check the Wallet Unit Attestation Proof of Possession. |
| `isAuthorised` | boolean | `true` when the wallet unit can get a Wallet Unit Attestation. |
| `assertionToken` | string | **Secret.** The client assertion JWT of the wallet unit for OAuth 2.0 client authentication. |
| `assertionTokenType` | string | Type of the client assertion token. |
| `createdAt` / `updatedAt` | integer (int64) | Unix time in seconds. |
| `walletUnitDevicePlatform` | string | The known values are `ios`, `android`, and `organisation`. The service does not check the value. |
| `walletUnitIntegrityToken` | string | Device integrity token, for example an App Attest or a Play Integrity token. |
| `walletUnitKeyId` | string | Identifier of the attestation key of the wallet unit. |
| `walletUnitMetadata` | object, nullable | More data that the wallet unit gave at registration. |

**`assertionToken` is a credential. Never send it to a browser, never write it
to a log, and never keep it in version control.** Send it only to the wallet
instance that owns it. Read, update, create, and list all give this field, so
treat the full answer of every wallet unit operation as a secret.

### Create a wallet unit
`POST .../wallet-unit` body: `clientId` (mandatory), `clientPublicKey`
(mandatory; a public JWK of `kty` `EC`, `RSA` or `OKP`; the service refuses an
empty object and a JWK with a private member such as `d` with HTTP 400),
`clientUrl` (optional), `isAuthorised` (optional, default `false`). The
service refuses a `clientId` that another wallet unit of the organisation
has (HTTP 400 `Wallet provider client exists`). The answer is HTTP 201 with
the new record, and it holds the `assertionToken`.

### Update a wallet unit - the kill switch
On `PUT .../wallet-unit/{walletUnitId}` every field is optional. A field that
you leave out, or send empty, keeps the stored value; this is also true for
`isAuthorised`.

**`isAuthorised: false` on an authorised wallet unit revokes every active
Wallet Unit Attestation of that unit**, in the same change. Issuers that
check the status list then refuse the unit at once, and the unit gets no new
attestation until you set `isAuthorised: true` again. Send `false` only when
you mean to stop the unit.

### Deployment read - the status collapse
`GET /v2/config/digital-wallet/openid` gives HTTP 200 even when the
organisation has no deployment. Read `status` before you use any URL.

- `status` gives **only `0` (Not Configured) or `2` (Deployed)**. The operation
  reports every other state, for example Requested, as `0`. `statusStr` gives
  only `Not Configured` or `Deployed`, for the same reason. Only `PUT` on the
  same path gives the full set `0` Not Configured, `1` Requested, `2` Deployed.
- When there is no deployment: `secureVaults` is `null`, and
  `agentServiceEndpoint`, `credentialIssuerMetadata`,
  `authorizationServerMetadata`, `notificationEndpoint`, and `jwksEndpoint` all
  hold an empty string.

### Deployment read - the constants trap
Some fields hold a constant value that the service gives **also when the
organisation has no deployment**. Do not read them as proof of a deployment:

- `deploymentRegion` - a constant region name.
- `ledgerName` and `ledgerURL` - constant ledger values.
- `infrastructureProvider` - always `iGrant.io`.
- `ledgerID` - the service does not set this field and always gives `0`.

`status` is the only correct test for "is the wallet deployed".

### Deploy
`POST /v2/config/digital-wallet/openid` needs a JSON object as its body: send
`{}` for a deployment without a seed. The optional members are
`cryptographicSeed` and `infrastructureProvider` (only the value `iGrant.io`);
the service refuses an empty body and an unknown member with HTTP 400. The
service uses the seed only when it holds one character or more. **The seed is
a secret**: keep it out of logs and out of version control. The organisation
must have no deployment: if a deployment exists, or a deployment request is
open, the service gives HTTP 400. There is no operation
that removes a deployment, so you cannot deploy a second time. A good deploy
always gives `status` `2` and `statusStr` `Deployed`, and `isWalletProvider`
`false`.

### Turn on the wallet provider capability
`PUT /v2/config/digital-wallet/openid` with `{"isWalletProvider": true}`. The
service ignores the value `false` and keeps the current setting, so this
operation cannot turn the capability off.

**One organisation in an environment can be the wallet provider.** The
service gives HTTP 400 `Wallet provider already exists` when another
organisation of the environment has the capability, and also for an API key
that is bound to a sandbox organisation. A second call for the organisation
that has the capability succeeds.

### List wallet units
Query parameters: `holderDid`, `platform` (`ios`, `android`, `organisation`;
the service does not check the value, so an unknown value matches nothing),
`offset` (default `0`), `limit` (default `10`). The service replaces an
`offset` below 0 and a `limit` of 0 or less with the default. The answer holds
`walletUnit` (an array) and `pagination` (`currentPage`, `totalItems`,
`totalPages`, `limit`, `hasPrevious`, `hasNext`). Each item also carries
`totalCountOfCredentialHistory`.

### List organisation wallet units
Query parameters: `lpidStatus` (`inactive`, `active`, `expired`, `revoked`),
`wuaStatus` (`unauthorised`, `authorised`, `active`, `expired`, `revoked`),
`organisationName`, `offset`, `limit`. The service compares a status value
exactly, so an unknown value matches nothing.

Each item of `organisationWalletUnit` holds `organisationName`, `lpidStatus`,
`lpidExpiry`, `wuaStatus`, `wuaExpiry`, `issuedCredentials`, `verifications`,
and `lastActivity`. `lpidStatus` and `wuaStatus` add an **empty string** to
their value sets: the service gives an empty string when the lookup fails.
`lpidExpiry` and `wuaExpiry` are Unix times in seconds, and hold `0` when there
is no credential or no attestation. `lastActivity` is an ISO 8601 time, or an
empty string when the service recorded no activity.

### Performance statistics
The answer holds one object, `performanceStatistics`, with four members:

- `oid4vc` - `totalCredentialTypes`, `totalIssuedCredentials`,
  `totalVerifications`.
- `totalCredentialIssuanceHistory` - `currentMonth`, `last3Months`,
  `last6Months`, `last12Months` (arrays of monthly records, newest first, each
  with `month` as the short month name in lower case and the year, for
  example `jan-2026`), and `cumulative`. **The service does not calculate
  `cumulative` today, so every count in it is `0`.** Add the monthly records
  yourself if you need a total.
- `individualWalletUnit` (the `ios` and `android` units) and
  `organisationWalletUnit` - each with `total`, `active`, and `revoked`. A
  unit is `active` while it holds an attestation that is not revoked, and
  `revoked` when every attestation it got is revoked. A unit that never got
  an attestation is in `total` only.

The service keeps the statistics in a cache and refreshes them in the
background, so a value can be some minutes old. When the calculation fails,
the service answers with zero values and tries again in the background. Do not
use these numbers for billing or for an audit.

## Sandbox organisations
A sandbox organisation cannot be a wallet provider. Use an API key of the main
wallet for this group. With an API key that is bound to a sandbox
organisation, `POST` and `GET` on `/v2/config/digital-wallet/openid` work on
the main wallet, and the `PUT` and the wallet unit operations give HTTP 400.
For sandbox organisations in general, read **`igrantio-api-sandboxes`**.

## Authentication
Send an API key:

```
Authorization: ApiKey <YOUR_API_KEY>
```

Note the space after `ApiKey`. The key is held only by the tenant backend. The
browser never sees it, and it never sees an `assertionToken`.

## Validation / done criteria
- You can name the path and the method for deploy, read deployment, turn on the
  wallet provider capability, and each of the six wallet unit operations,
  without a guess.
- You test the deployment with `status`, and not with `deploymentRegion` or
  another constant field.
- Your update of a wallet unit sends `isAuthorised: false` only when you
  mean to revoke the attestations of that unit.
- No `assertionToken` reaches a browser, a log, or version control.

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
- `igrantio-api-sandboxes` - sandbox organisations and the sandbox call style.
