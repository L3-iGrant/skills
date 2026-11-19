---
name: igrantio-api-key-management
description: 'The Key Management group of the iGrant.io OID4VC API: list the key store types, add, test, change and delete key stores (an external OpenBao or HashiCorp Vault, Google Cloud KMS, AWS KMS, Azure Key Vault, a Thales Luna Cloud HSM partition, or a remote signing key store over the CSC API, for example at a QTSP), create, import, reference, rename and delete (retire) ECDSA P-256 signing keys, read where a key is in use, generate a CSR from a certificate preset, upload or delete the X.509 certificate chain (x5c) of a key, get a test certificate from the built-in test CA, and select the trust anchor of a signing key. Use when you set up or rotate the keys that sign OID4VCI credentials, status lists and OpenID4VP requests.'
license: Apache-2.0
metadata:
  categories: [ows-api, education]
  provider: iGrant.io
  keywords: key management, key store, signing key, JWK, ES256, P-256, CSR, certificate preset, X.509, x5c, certificate chain, trust anchor, subjectKeyIdentifier, test certificate, test CA, PKCS#12, QTSP, CSC API, OpenBao, HashiCorp Vault, Cloud KMS, AWS KMS, Azure Key Vault, HSM, eIDAS2
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: JWK (RFC 7517), ECDSA P-256 / ES256, PKCS#10 CSR, PKCS#12, X.509, CSC API 1.0.4.0 / 2.2.0.0
  auth: OWS API key (Authorization "ApiKey <YOUR_API_KEY>")
---

# iGrant.io OID4VC API - Key Management group

## When to use
Use this skill when you:
- add the **key store** that holds the signing keys of the organisation, or
  check that a key store works;
- create, import, reference, rename, list or delete a signing key, or read
  where a key is in use;
- get a **CSR** for a key from a **certificate preset**, send it to a
  Certificate Authority, and upload the signed chain so that the key carries
  an `x5c` value. `x509` is the only key format, so every key that signs a
  credential, a status list or a request needs a certificate chain;
- get a **test certificate** from the built-in test CA for development;
- select the **trust anchor** of a signing key (`{subject, ski}`);
- sign with a key at a **QTSP** through a remote signing key store (CSC API).

Base URL: the API host of your environment (see Prerequisites).
Auth header: `Authorization: ApiKey <YOUR_API_KEY>` (note the space after
`ApiKey`).

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
3. **Organisation** - the keys belong to the main organisation. _A key of the
   main wallet and a key bound to a sandbox organisation both act on these
   keys; see "Sandbox organisations" below._
4. **Key store** - the local key store of the platform, or a key store of
   your own (external vault, cloud KMS, HSM partition, remote signing
   service)? _Default the local key store; `GET …/key-store-types` tells you
   what you can add._
5. **Certificate** - a certificate of your CA, or a test certificate of the
   built-in test CA? _Every signing key needs a certificate chain. Default a
   test certificate for development, and a CA certificate before production._
6. **QTSP** - remote qualified electronic signatures? _Then add a `csc` key
   store and reference its credential as a key._
7. **Trust list** - is your certificate registered in the trust list (the
   trust anchor for an issuer, the WRPAC for a relying party)? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>.

## Endpoint reference

Every path starts with `/v4/config/ows/key-management`.

| Method | Path | Purpose | Docs |
| --- | --- | --- | --- |
| GET | `…/key-store-types` | The key store types and the provider catalogue | [config-digital-wallet-open-id-list-key-store-types](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-list-key-store-types/) |
| GET | `…/key-stores` | List the key stores of the organisation | [config-digital-wallet-open-id-list-key-stores](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-list-key-stores/) |
| POST | `…/key-stores` | Add a key store (runs a connection test) | [config-digital-wallet-open-id-create-key-store](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-create-key-store/) |
| GET | `…/key-stores/{keyStoreId}` | Read one key store | [config-digital-wallet-open-id-read-key-store](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-read-key-store/) |
| PUT | `…/key-stores/{keyStoreId}` | Change a key store | [config-digital-wallet-open-id-update-key-store](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-update-key-store/) |
| DELETE | `…/key-stores/{keyStoreId}` | Delete a key store (needs a confirmation body) | [config-digital-wallet-open-id-delete-key-store](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-delete-key-store/) |
| POST | `…/key-stores/{keyStoreId}/test` | Run the connection test | [config-digital-wallet-open-id-test-key-store](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-test-key-store/) |
| GET | `…/key-stores/{keyStoreId}/provider-keys` | List the keys in the provider that a key can reference | [config-digital-wallet-open-id-list-provider-keys](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-list-provider-keys/) |
| GET | `…/keys` | List the keys, with filters and pages | [config-digital-wallet-open-id-list-keys](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-list-keys/) |
| POST | `…/keys` | Create a key, or reference a provider key | [config-digital-wallet-open-id-create-key](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-create-key/) |
| POST | `…/keys/import` | Import a key file (multipart) | [config-digital-wallet-open-id-import-key](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-import-key/) |
| GET | `…/keys/{keyId}` | Read one key | [config-digital-wallet-open-id-read-key](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-read-key/) |
| PUT | `…/keys/{keyId}` | Rename a key, or set the PIN of a QTSP key | [config-digital-wallet-open-id-update-key](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-update-key/) |
| DELETE | `…/keys/{keyId}` | Delete (retire) a key (needs a confirmation body) | [config-digital-wallet-open-id-delete-key](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-delete-key/) |
| GET | `…/keys/{keyId}/usage` | Where the key is in use, and whether it can be deleted | [config-digital-wallet-open-id-read-key-usage](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-read-key-usage/) |
| GET | `…/certificate-presets` | The certificate presets for a CSR | [config-digital-wallet-open-id-list-certificate-presets](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-list-certificate-presets/) |
| POST | `…/keys/{keyId}/csr` | Generate a CSR in PEM | [config-digital-wallet-open-id-generate-csr](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-generate-csr/) |
| POST | `…/keys/{keyId}/certificate-chain` | Upload the signed X.509 chain (multipart) | [config-digital-wallet-open-id-upload-certificate-chain](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-upload-certificate-chain/) |
| DELETE | `…/keys/{keyId}/certificate-chain` | Remove the chain (needs a confirmation body) | [config-digital-wallet-open-id-delete-certificate-chain](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-delete-certificate-chain/) |
| POST | `…/keys/{keyId}/test-certificate` | Get a certificate of the built-in test CA | [config-digital-wallet-open-id-create-test-certificate](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-create-test-certificate/) |
| GET | `…/test-ca` | Read the test CA roots of the organisation | [config-digital-wallet-open-id-read-test-ca](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-read-test-ca/) |
| POST | `…/test-ca` | Make a test CA root for a trust domain | [config-digital-wallet-open-id-create-test-ca](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-create-test-ca/) |

The wallet refuses an unknown field in a JSON body (HTTP 400).

## Key stores

### Types and capabilities
| `type` | What it is |
| --- | --- |
| `local` | The key store of the platform. Every organisation has it; you cannot add, change or delete it. |
| `vault` | An external OpenBao or HashiCorp Vault (Transit engine). |
| `gcp-kms` | A key ring in Google Cloud KMS. |
| `aws-kms` | One region of AWS KMS. |
| `azure-key-vault` | An Azure key vault or managed HSM. |
| `dpod` | A Thales Luna Cloud HSM (DPoD) partition. |
| `csc` | A remote signing key store over the CSC API, for example at a QTSP. The private key stays at the provider. |

Each key store lists its `capabilities`: `create`, `import`, `reference`,
`sign`, `csr`, `certificateChain`, `listProviderKeys`, `test`, `edit`,
`delete`. An operation that the key store cannot do gives HTTP 400. Only the
local key store and `vault` can import a key. A `csc` key store can only
reference keys; its keys get their certificate from the QTSP, so they take
no CSR and no chain upload.

`GET …/key-store-types` gives `keyStoreTypes` (`type`, `name`, `canAdd`,
`capabilities`, `keyOrigins`, `authenticationMethods`, `apiVersions`, `qscd`,
`protection`) and `providers`, the catalogue in display order (`id`, `type`,
`name`, `category`, `order`, `qualified`, `protection`, `region`,
`defaults`, `apiVersions`, `logo`, `logoUrl`, `canAdd`,
`notAvailableReason`). Read it before you add a key store: `canAdd` is
`false` when the platform does not offer the type, or when the organisation
already has a key store of that provider.

### Add a key store
Body: `type`, `provider` (an `id` from `providers`, of the same type;
required), `name` (1 to 100 characters, unique in the organisation),
`settings`, and `credentials`.

| `type` | `settings` | `credentials` |
| --- | --- | --- |
| `vault` | `address` (https), `authentication.method` (`userpass` with `username`, `approle` with `roleId`, `cert` with an optional `role`, or `token`; optional `authentication.mount`); optional `namespace`, `transitMount` (default `transit`), `caCertificate`; `clientCertificate` (PEM, required for `cert`) | `password`, `secretId`, `clientPrivateKey` or `token`, as the method needs |
| `gcp-kms` | `project`, `location`, `keyRing`; optional `protectionLevel` (`HSM`, the default, or `SOFTWARE`) | `serviceAccountKey` (the JSON of the key file, as a string) |
| `aws-kms` | `region`; optional `authentication.method` (`accessKey`) | `accessKeyId`, `secretAccessKey` |
| `azure-key-vault` | `vaultUrl`, `tenantId`, `clientId`, `authentication.method` (`clientSecret` or `clientCertificate`); optional `keyType` (`EC-HSM`, the default, or `EC`; a managed HSM needs `EC-HSM`) | `clientSecret`, or `clientCertificate` and `clientPrivateKey` |
| `dpod` | `tokenLabel` (the partition label); optional `serialNumber` | `authTokenConfigUri`, `authTokenClientId`, `authTokenClientSecret`, `pin` |
| `csc` | `cscUrl` (https), `clientId`, `userId`; optional `apiVersion` (`v1` = CSC 1.0.4.0, the default; `v2` = CSC 2.2.0.0) | `clientSecret`; optional `userPin` |

The wallet checks the settings, runs a connection test, and saves the key
store only when the test passes: otherwise HTTP 400 `The connection test
failed: …`. Success is **`201`** with the key store. HTTP 409 when the
organisation already has a key store of that name or of that provider, or
already has 20 key stores. HTTP 403 when the platform does not offer the
type.

**The credentials are write-only.** No answer gives them back:
`credentialsConfigured` tells you which credential fields are stored.

### Key store fields
`id`, `type`, `provider`, `name`, `local`, `status` (`active` or `error`),
`protection` (`software`, `hsm-backed`, `hsm`, `dedicated-hsm`, `provider`),
`settings`, `credentialsConfigured`, `capabilities`, `qscd`, `keyCount`,
`retiredKeyCount` (the deleted keys, see "Rename, delete, usage"),
`qualifiedStatus` (`qualified`, `not-qualified` or `unknown`; only for a
qualified provider, else `null`), `lastCheckedAt`, `lastCheckResult` (`ok`,
`message`, `checkedAt`), `createdAt`, `updatedAt`.

### Change, test, delete
- `PUT …/key-stores/{keyStoreId}` changes only the members you send.
  `settings` replaces all the settings; an omitted credential field keeps the
  stored value; `provider` cannot change; `name` cannot be `null`. A change
  of the settings or the credentials runs the connection test first. When it
  fails (HTTP 400), the key store keeps its earlier settings and
  credentials. The local key store cannot change (HTTP 400).
- `POST …/test` answers **`200` also when the test fails**. Read `ok` and
  `message`. The test sets `status` of a key store that you added to
  `active` or `error`. For a qualified provider, it also checks the keys
  against the EU trusted lists again (`trust` of each key).
- `GET …/provider-keys` gives `providerKeys`: the keys in the provider that
  you can reference, each with `providerKeyName`, `algorithm`, `jwk`,
  `linked`, `keyId` (the key that links it, or `null`), and for a QTSP
  credential its `certificate` (`subjectDN`, `issuerDN`, `serialNumber`,
  `validFrom`, `validTo`, `certificates`). A cloud KMS or a QTSP gives at
  most 50.
- Delete needs the body `{ "confirm": "DELETE" }` and answers **`204`**. The
  local key store cannot be deleted (HTTP 400). The wallet refuses the
  delete (HTTP 409) while the key store has keys, and a deleted (retired)
  key counts too. The keys in the provider stay.

## Keys

### List and read
`GET …/keys` query parameters: `keyStoreId`, `search` (the key id or name,
or the label or id of a definition that signs with the key),
`withCertificateChain` (`true`: only keys with a chain), `purpose` (the
suggested keys of a use: keys with a chain and a certificate preset that the
use accepts, or no preset), `certificatePreset` (a preset id, or `none` for
keys with a chain and no preset; another value gives HTTP 400), `sortBy`
(`name`, `createdAt`, `updatedAt`), `sortOrder` (`asc`, `desc`), `offset`,
`limit` (default 10, at most 100). `purpose` and `certificatePreset` are
filters for a key picker, not rules of a save. The `purpose` values:
`credential-pid`, `credential-eaa`, `credential-qeaa`, `credential-pub-eaa`,
`credential-pid-mdoc`, `credential-eaa-mdoc`, `credential-qeaa-mdoc`,
`credential-pub-eaa-mdoc`, `credential-mdl`, `status-list`,
`status-list-mdoc`, `wallet-provider`, `verifier-x509-hash`,
`verifier-x509-san-dns`, `verifier-attestation`, `annex-c-reader`,
`issuer-metadata`.

Without `sortBy` the last updated key comes first. The answer holds `keys`
and `pagination` (`totalItems`, `limit`, `offset`, `hasNext`). Each key of
the list also has `usage`: the number of `credentialDefinitions` and
`presentationDefinitions` that sign with it, and `definitions` (`id`,
`kind`, `label`, `extensionId`, `systemManaged`). The wallet key that the
platform makes for the organisation wallet is not in the list while it has
no certificate chain. A deleted key is not in the list.

| Key field | Meaning |
| --- | --- |
| `keyId` | The key identifier. It is also the `kid` of the JWK. |
| `name` | Your label for the key. Can be `null`. |
| `keyStore` | `id`, `type` and `name` of the key store. |
| `origin` | `created`, `imported` or `referenced`. |
| `algorithm`, `status` | `ES256`, and the state of the key (`active`). |
| `jwk` | The public key (see below). |
| `hasCertificateChain`, `certificateSource` | Whether the key has a chain, and where it came from: `uploaded`, `imported`, `test-ca`, `qtsp`, or `null`. |
| `testCertificate` | `true` when the built-in test CA issued the certificate. For tests only. |
| `certificatePreset` | The certificate preset of the certificate, or `null`. |
| `certificateAssessment` | What the platform reads from the certificate (see below). Present also without a chain. |
| `trust` | For a key of a qualified provider only: the qualified status of its certificate against the EU trusted lists (`status`: `qualified`, `not-qualified` or `unknown`; `checkedAt`; `detail`). Else `null`. |
| `qscd`, `createdAt`, `updatedAt` | As named. |

JWK members: `kid`, `kty` (`EC`), `crv` (`P-256`), `x`, `y`, `alg` (`ES256`).
With a chain the JWK also has `x5c` (base64 DER certificates, leaf first),
`x5t`, `x5t#S256` (**note the `#`**, quote it in code) and `x5c_expiry` (the
end of validity of the leaf). **No answer holds the private member `d`.**

`certificateAssessment` is the certificate assessment of the key:
`keyUsageType` (`A` to `F`, ETSI EN 319 412-2), `fitsCredentialCategories`
(the credential categories `pid`, `eaa`, `qeaa`, `pub-eaa`, `mdl` that the
certificate fits), `qcPsb`, the rule texts for each credential category in
`categoryMessages` (`[]` when the key fits), and the same for an
`mso_mdoc` configuration in `fitsMdocCredentialCategories` and
`mdocCategoryMessages`. Read it before you pick the signing key of a
credential configuration: the credential definition compares the key with
its credential category (the signing key check).

The signing key check is information. A save does not refuse a key because
of its certificate or its certificate preset: the credential definition
shows the result of each configuration in `signingKeyCheck` (`result`:
`fits`, `does-not-fit` or `no-key`, and `messages`), and the other saves
give `signingKeyWarnings`. A save refuses a signing key only when it cannot
sign (HTTP 400): no key is selected, the key is not an active key of the
organisation, or it has no certificate chain. The key format is always
`x509`; another value gives HTTP 400.

### Trust anchor of a signing key
Where you select a signing key, you can also select its trust anchor: the
certificate of the chain of that key that the receivers (wallets,
verifiers) list in their trust sources. The value is
`{ "subject": "<subject DN>", "ski": "<subjectKeyIdentifier>" }`:

- `subject`: the subject DN of the anchor certificate, in RFC 4514
  (`CN=Example Org Issuing CA,O=Example Org AB,C=SE`) or in the display
  form `C=SE, O=Example Org AB, CN=Example Org Issuing CA`.
- `ski`: the subjectKeyIdentifier of that certificate, lowercase hex with no
  separators, or `null` when the certificate has none.

Read both values from the certificates of `jwk.x5c` of the key. The members
that take it: `cryptographicKeyTrustAnchor` (the key of
`cryptographicKeyIdentifier` of a credential configuration or of a
presentation definition), `statusListCryptographicKeyTrustAnchor` (the key
of `statusListCryptographicKeyIdentifier`),
`credentialIssuer.metadata.signingKeyTrustAnchor` (the signed issuer
metadata), and `trustAnchor` in the signing configurations of a wallet
provider. Each signature then sends the certificates below the anchor (the
leaf alone when the leaf is the anchor). Without a selection (`null` or
absent), a self-signed root at the end of the chain is not sent.

A save refuses an anchor (HTTP 400, with `errorType` and `errorField` in
the error answer) when it has no key, when it is not one certificate of the
chain of the key, or when the chain is not leaf first or not linked. When a
new chain no longer holds the anchor certificate, select the anchor again:
the wallet never signs with another anchor.

### Create, reference, import
`POST …/keys`:
- **Create**: `{ "keyStoreId": "<id>", "name": "Issuer signing key" }`. All
  members are optional; `{}` creates a key in the first key store of the key
  store list (the local key store that takes new keys). The key is ECDSA
  P-256 with `ES256` (`algorithm` accepts only `ES256`).
- **Reference** a key that the provider already has: `keyStoreId` and
  `providerKeyName` (from `…/provider-keys`), and `name`. For a key of a
  `csc` key store, `providerSecret` is the PIN of the CSC credential; without
  it the wallet uses `userPin` of the key store.
- The answer is **`201`** with `keyId`, `jwk`, and `key` (the full key).
  HTTP 409 when the provider key is already linked, when the key store has
  200 keys, or when the organisation has 1000 keys.

`POST …/keys/import` takes **`multipart/form-data`**: `file` (a PKCS#12 file,
or an encrypted PKCS#8 P-256 private key in PEM with the certificate chain
after it), `password` (required), and optional `keyStoreId` and `name`. The
key store must have the `import` capability (the local key store that takes
new keys, or `vault`). The answer is **`201`** with the key. HTTP 409 when the
key or its certificate is already a key of the organisation.

### Rename, delete, usage
- `PUT …/keys/{keyId}`: `name` (`null` removes it) and, for a `csc` key only,
  `providerSecret`. The answer is the key.
- `DELETE …/keys/{keyId}` needs the body `{ "confirm": "DELETE" }` and
  answers **`204`**. A delete retires the key: it signs nothing more and
  leaves the key list. Its record keeps the public key and the chain, and it
  stays in its key store, so that key store cannot be deleted. The wallet
  destroys the private key in the key store, as the key store allows it. A
  key at a QTSP stays there: the wallet only stops its use. The wallet
  refuses (HTTP 400) the wallet key of the organisation and a key in use: by
  a credential definition, a presentation definition, a status list, the
  signed issuer metadata, a wallet provider configuration, or an issuance or
  a verification in flight.
- `GET …/keys/{keyId}/usage` (optional `search`) gives `keyId`,
  `hasCertificates`, `credentialDefinitions` and `presentationDefinitions`
  (each `count` and `items` with `id`, `label` and `organisation`),
  `statusLists` (`count` and `items`), `signedIssuerMetadata`,
  `walletProviderConfigurations`, `issuanceRecordsInFlight` and
  `verificationRecordsInFlight` (each `count`), `canDelete`,
  `systemManagedDefinitions`, `canDeleteCertificateChain` and
  `certificateChainUses`. Read it before a delete.

## Certificates (X.509)

### Certificate presets
`GET …/certificate-presets` gives `presets` and `testCaEnabled`. Each preset
targets one certificate profile and holds `id`, `name`, `description`,
`purpose`, `signingPurposes` (the uses that accept a key with the preset:
the `purpose` values of the key list), `fixed` (the values the preset sets),
`required` (the field paths the request must give; `a|b` means one of them),
`prefill` (a CSR request with the values of the organisation),
`maxValidityDays`, `testCertificateValidityDays`, `etsiSyntax`,
`testCaDomain` and `sources`. The preset ids, in their order:
`wrpac-legal`, `wrpac-natural`, `pid-provider`, `wallet-provider`,
`eaa-provider`, `qeaa-provider`, `pub-eaa-provider`, `mdoc-document-signer`,
`pid-provider-mdoc`, `eaa-provider-mdoc`, `qeaa-provider-mdoc`,
`pub-eaa-provider-mdoc`, `mdoc-reader`, `mdoc-status-list-signer`,
`status-list-signer`, `request-signer-san-dns`. For a CSR with no preset,
leave `preset` out: an unknown preset id gives HTTP 400.

### Generate a CSR
`POST …/keys/{keyId}/csr` takes a CsrRequest. A member that you leave out
takes the prefill and the fixed values of the preset:

```json
{
  "preset": "eaa-provider",
  "subject": {
    "country": "SE",
    "organization": "Example Org AB",
    "organizationIdentifier": "VATSE-000000000001",
    "commonName": "Example Org AB Attestation Provider"
  }
}
```

Members: `preset`; `subject` (`country`, `stateOrProvince`, `locality`,
`organization`, `organizationalUnit`, `commonName`,
`organizationIdentifier`, `serialNumber`, `givenName`, `surname`; an
`emailAddress` gives HTTP 400, use `subjectAltName.email`);
`subjectAltName` (arrays `dns`, `uri`, `email`, `phone`); `keyUsage` and
`extendedKeyUsage` (`values`, `critical`); `certificatePolicies`;
`qcStatements` (`qcType`, `qcCompliance`, `qcSscd`, and `qcPsb` with
`countryOfLegislation`, `authSourceIdentification`,
`legislationIdentification`).

The answer is **`200`**: `csr` (PEM), `csrId`, `preset`, and `warnings`
(`code` and `message`; `preset-override` when you change a fixed value,
`purpose-reuse` when the key already has a certificate of another preset). An
invalid value gives HTTP 400 `<field>: <problem>`. A key of a `csc` key store
gives HTTP 400. Use one key for each purpose.

### Upload or remove the chain
Send the CSR to a Certificate Authority, then upload the signed chain with
`POST …/keys/{keyId}/certificate-chain`. That request is
**`multipart/form-data`** with the file field **`certificate_file`**: UTF-8
PEM text (at most 64 KiB and 10 certificates), with the **leaf certificate
first, then the intermediate certificates, then the root certificate**. The
leaf must hold the public key of the key. The wallet refuses the file when it
holds a private key, when the leaf does not use P-256, when a certificate is
expired or not yet valid, or when a chain signature is not correct.

The answer is **`200`** and holds `key_id`, `certificates_count`, `x5t` and
`x5t_s256` (snake case here; the JWK has `x5t` and `x5t#S256`), `csrId` and
`preset` (of the newest CSR of the key), `warnings` (`profile-mismatch` when
the certificate differs from the preset; a warning, not an error), and
`affectedCredentialConfigurations`: the credential configurations that sign
with the key and no longer fit their credential category with this chain
(`credentialDefinitionId`, `credentialConfigurationId`, `name`,
`credentialCategory`, `messages`). The upload still succeeds; fix those
configurations.

`DELETE …/keys/{keyId}/certificate-chain` needs `{ "confirm": "DELETE" }`
and answers **`200`** with `affectedCredentialConfigurations`. HTTP 409 while
a definition, a status list, the signed issuer metadata or a wallet provider
configuration signs with the key: select another key for these uses first.
HTTP 400 when the key has no chain, or when the key is at a QTSP.

### Test certificates and the test CA
A test certificate is for development and testing only, never for
production.

- `POST …/keys/{keyId}/test-certificate` takes a CsrRequest and an optional
  `validityDays` (1 to 3650, and at most `maxValidityDays` of the preset).
  The test CA of the organisation issues the leaf with the preset profile,
  and the key gets the chain `[leaf, root]`. The answer is **`200`** with
  `key`, `warnings` (the first is `test-certificate`) and
  `affectedCredentialConfigurations`. HTTP 409 when the key has a chain of
  another CA: delete that chain first. HTTP 403 when the platform has the
  test CA switched off (`testCaEnabled` `false`).
- `GET …/test-ca` gives `testCas` (`id`, `domain`, `certificate` (the root in
  PEM), `subject`, `notBefore`, `notAfter`, `crlUrl`, `certificateUrl`) and
  `warnings`. Give the root to a test verifier as its trust anchor.
- `POST …/test-ca` with `domain` (`mdoc-iaca`, the default, `provider` or
  `access`) and `country` (ISO 3166-1 alpha-2; required for `mdoc-iaca`)
  makes the root of a trust domain: **`201`** with `testCa` and `warnings`.
  HTTP 409 when the domain has a root. The first test certificate of a
  domain also makes its root.

## Errors
An error answer is `{"errorCode": <HTTP status>, "errorDescription": "..."}`.
HTTP 400 for an invalid body or an operation that the key store cannot do;
403 for a key store type that the platform does not offer, or a switched-off
test CA; 404 for an unknown key or key store; 409 for the conflicts named
above; 503 (with `Retry-After`) when the key store is not reachable; 507 when
an HSM partition has no room for a new key.

## Sandbox organisations
The key stores and the keys belong to the main organisation. A sandbox
organisation has no keys of its own: the definitions of the sandbox
organisation sign with the keys of the main organisation. With an API key that
is bound to a sandbox organisation, every operation of this skill (read, create,
change and delete of key stores and keys, import, CSR, certificate chain, test
certificate and test CA) acts on the key stores and keys of the main
organisation, as with a key of the main wallet. A change through a sandbox
therefore changes the keys of the main organisation and of all its sandbox
organisations. The delete of a key that a definition of the main organisation
or of any sandbox organisation uses gives **HTTP 400**. See
`igrantio-api-sandboxes`.

## Register your certificate in the trust list
Wallets show your organisation as verified only when your certificate is in
the trust list. Do this before you go live on any environment:

1. Prepare the certificate. An issuer registers its trust anchor (the root
   CA certificate). A relying party registers its Wallet-Relying Party
   Access Certificate (WRPAC). "Certificates (X.509)" above shows how to
   get the CSR and upload the signed chain (`x5c`).
2. Contact [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>.
3. Confirm the verified badge in the wallet after the trust list refreshes.

Until the entry is in place the wallet shows an unverified warning.
`igrantio-trustlist-entries` covers registration from automation.

## Documentation is the source of truth
If this skill and the linked documentation disagree, **the documentation wins**.
Fetch the linked page, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, to check for
updates before you build. Report the drift so the skill can be corrected.

## Cross-references
- `igrantio-ows-overview` - architecture and glossary.
- `igrantio-api-issuer` - credential definitions, their credential category,
  their signing key and its trust anchor.
- `igrantio-api-verifier` - presentation definitions and their signing key.
- `igrantio-api-trust-anchor` - the trust sources that validate the issuers
  and verifiers your keys meet in a flow.
- `igrantio-dcapi-ios` - ISO 18013-7 Annex C, which needs a key with an
  uploaded certificate chain.
- `igrantio-api-sandboxes` - sandbox organisations and their API keys.
