---
name: igrantio-api-key-management
description: 'The Key Management group of the iGrant.io OID4VC API: list the key store types, add, test, change and delete key stores (an external OpenBao or HashiCorp Vault, Google Cloud KMS, AWS KMS, Azure Key Vault, a Thales Luna Cloud HSM partition, or a remote signing key store over the CSC API, for example at a QTSP), create, import, reference, rename and delete ECDSA P-256 signing keys, read where a key is in use, generate a CSR from a certificate preset, upload or delete the X.509 certificate chain (x5c) of a key, and get a test certificate from the built-in test CA. Use when you set up or rotate the keys that sign OID4VCI credentials and OpenID4VP requests.'
license: Apache-2.0
metadata:
  categories: [ows-api, education]
  provider: iGrant.io
  keywords: key management, key store, signing key, JWK, ES256, P-256, CSR, certificate preset, X.509, x5c, certificate chain, test certificate, test CA, PKCS#12, QTSP, CSC API, OpenBao, HashiCorp Vault, Cloud KMS, AWS KMS, Azure Key Vault, HSM, eIDAS2
  version: 2026.10.02
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
  an `x5c` value (needed for the `x509` key format, the `x509_san_dns` and
  `x509_hash` client identifier prefixes, and ISO 18013-7 Annex C);
- get a **test certificate** from the built-in test CA for development;
- sign with a key at a **QTSP** through a remote signing key store (CSC API).

Base URL for demo: `https://demo-api.igrant.io`.
Auth header: `Authorization: ApiKey <YOUR_API_KEY>` (note the space after
`ApiKey`).

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
3. **Organisation** - the keys belong to the main organisation. _A key of the
   main wallet and a key bound to a sandbox organisation both act on these
   keys; see "Sandbox organisations" below._
4. **Key store** - the local key store of the platform, or a key store of
   your own (external vault, cloud KMS, HSM partition, remote signing
   service)? _Default the local key store; `GET …/key-store-types` tells you
   what you can add._
5. **X.509** - do you need a certificate chain (`x5c`)? _Needed for the
   `x509` key format, `x509_san_dns`, mdoc, and the trust list. For tests, a
   test certificate is enough._
6. **QTSP** - remote qualified electronic signatures? _Then add a `csc` key
   store and reference its credential as a key._
7. **Trust list** - is your certificate registered in the trust list (the
   trust anchor for an issuer, the WRPAC for a relying party)? If not, contact
   [support@igrant.io](mailto:support@igrant.io) and follow
   <https://docs.igrant.io/docs/trust-relying-party-registration/>.

## Endpoint reference

Every path starts with `/v2/config/digital-wallet/openid/key-management`.

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
| DELETE | `…/keys/{keyId}` | Delete a key (needs a confirmation body) | [config-digital-wallet-open-id-delete-key](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-delete-key/) |
| GET | `…/keys/{keyId}/usage` | Where the key is in use, and whether it can be deleted | [config-digital-wallet-open-id-read-key-usage](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-read-key-usage/) |
| GET | `…/certificate-presets` | The certificate presets for a CSR | [config-digital-wallet-open-id-list-certificate-presets](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-list-certificate-presets/) |
| POST | `…/keys/{keyId}/csr` | Generate a CSR in PEM | [config-digital-wallet-open-id-generate-csr](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-generate-csr/) |
| POST | `…/keys/{keyId}/certificate-chain` | Upload the signed X.509 chain (multipart) | [config-digital-wallet-open-id-upload-certificate-chain](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-upload-certificate-chain/) |
| DELETE | `…/keys/{keyId}/certificate-chain` | Remove the chain (needs a confirmation body) | [config-digital-wallet-open-id-delete-certificate-chain](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-delete-certificate-chain/) |
| POST | `…/keys/{keyId}/test-certificate` | Get a certificate of the built-in test CA | [config-digital-wallet-open-id-create-test-certificate](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-create-test-certificate/) |
| GET | `…/test-ca` | Read the test CA roots of the organisation | [config-digital-wallet-open-id-read-test-ca](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-read-test-ca/) |
| POST | `…/test-ca` | Make a test CA root for a trust domain | [config-digital-wallet-open-id-create-test-ca](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-create-test-ca/) |
| POST | `…/trust-lookup` | Check a key against the trust authorities of the organisation | [config-digital-wallet-open-id-key-trust-lookup](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-key-trust-lookup/) |

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
`delete`. An operation that the key store cannot do gives HTTP 400. A `csc`
key store can only reference keys; its keys get their certificate from the
QTSP, so they take no CSR and no chain upload.

`GET …/key-store-types` gives `keyStoreTypes` (`type`, `name`, `canAdd`,
`capabilities`, `keyOrigins`, `authenticationMethods`, `apiVersions`, `qscd`,
`protection`) and `providers`, the catalogue in display order (`id`, `type`,
`name`, `category`, `qualified`, `defaults`, `canAdd`, `notAvailableReason`,
and more). Read it before you add a key store: `canAdd` is `false` when the
platform does not offer the type, or when the organisation already has a key
store of that provider.

### Add a key store
Body: `type`, `provider` (an `id` from `providers`, of the same type;
required), `name` (1 to 100 characters, unique in the organisation),
`settings`, and `credentials`.

| `type` | `settings` | `credentials` |
| --- | --- | --- |
| `vault` | `address` (https), `authentication.method` (`userpass` with `username`, `approle` with `roleId`, `cert` with `role` and `clientCertificate`, or `token`); optional `namespace`, `transitMount` (default `transit`), `caCertificate` | `password`, `secretId`, `clientPrivateKey` or `token`, as the method needs |
| `gcp-kms` | `project`, `location`, `keyRing`; optional `protectionLevel` (`HSM`, the default, or `SOFTWARE`) | `serviceAccountKey` (the JSON of the key file, as a string) |
| `aws-kms` | `region` | `accessKeyId`, `secretAccessKey` |
| `azure-key-vault` | `vaultUrl`, `tenantId`, `clientId`, `authentication.method` (`clientSecret` or `clientCertificate`); optional `keyType` (`EC-HSM`, the default, or `EC`) | `clientSecret`, or `clientCertificate` and `clientPrivateKey` |
| `dpod` | `tokenLabel` (the partition label); optional `serialNumber` | `authTokenConfigUri`, `authTokenClientId`, `authTokenClientSecret`, `pin` |
| `csc` | `cscUrl` (https), `clientId`, `userId`; optional `apiVersion` (`v1` = CSC 1.0.4.0, the default; `v2` = CSC 2.2.0.0) | `clientSecret`; optional `userPin` |

The wallet checks the settings, runs a connection test, and saves the key
store only when the test passes: otherwise HTTP 400 `The connection test
failed: …`. Success is **`201`** with the key store. An organisation has at
most one key store of each provider (HTTP 409).

**The credentials are write-only.** No answer gives them back:
`credentialsConfigured` tells you which credential fields are stored.

### Key store fields
`id`, `type`, `provider`, `name`, `local`, `status` (`active` or `error`),
`protection` (`software`, `hsm-backed`, `hsm`, `dedicated-hsm`, `provider`),
`settings`, `credentialsConfigured`, `capabilities`, `qscd`, `keyCount`,
`qualifiedStatus` (only for a qualified provider), `lastCheckedAt`,
`lastCheckResult`, `createdAt`, `updatedAt`.

### Change, test, delete
- `PUT …/key-stores/{keyStoreId}` changes only the members you send.
  `settings` replaces all the settings; an omitted credential field keeps the
  stored value; `provider` cannot change. A change of the settings or the
  credentials runs the connection test first.
- `POST …/test` answers **`200` also when the test fails**. Read `ok` and
  `message`. The test sets `status` of a key store that you added to
  `active` or `error`.
- `GET …/provider-keys` lists the keys in the provider that you can
  reference: `providerKeyRef`, `algorithm`, `jwk`, `linked`, `keyId`, and for
  a QTSP credential its `certificate`. A cloud KMS or a QTSP gives at most 50.
- Delete needs the body `{ "confirm": "DELETE" }` and answers **`204`**. The
  wallet refuses it (HTTP 409) while the key store has keys. The keys in the
  provider stay.

## Keys

### List and read
`GET …/keys` query parameters: `keyStoreId`, `search` (the key id or name,
or the label or id of a definition that signs with the key),
`withCertificateChain` (`true`: only keys with a chain), `sortBy` (`name`,
`createdAt`, `updatedAt`), `sortOrder` (`asc`, `desc`), `offset`, `limit`.
Without `sortBy` the last updated key comes first. The answer holds `keys`
and `pagination` (`totalItems`, `limit`, `offset`, `hasNext`). Each key of
the list also has `usage`: the number of `credentialDefinitions` and
`presentationDefinitions` that sign with it.

| Key field | Meaning |
| --- | --- |
| `keyId` | The key identifier. It is also the `kid` of the JWK. |
| `name` | Your label for the key. Can be `null`. |
| `keyStore` | `id`, `type` and `name` of the key store. |
| `origin` | `created`, `imported` or `referenced`. |
| `algorithm`, `status` | `ES256`, and the state of the key. |
| `isDefault` | `true` when the wallet signs with this key by default. |
| `jwk` | The public key (see below). |
| `dids` | The `did:key` of the public key. |
| `hasCertificateChain`, `certificateSource` | Whether the key has a chain, and where it came from: `uploaded`, `imported`, `test-ca`, `qtsp`, or `null`. |
| `testCertificate` | `true` when the built-in test CA issued the certificate. For tests only. |
| `certificatePreset` | The certificate preset of the certificate, or `null`. |
| `certificateAssessment` | What the platform reads from the certificate (see below). Present also without a chain. |
| `trustedListExemption` | Read only; `null` without one. The platform operator sets it when the certificate is already in a trusted list; `applies` is `false` when the key has another leaf certificate now. |
| `trust` | For a key of a qualified provider only: the qualified status of its certificate against the EU trusted lists (`status`, `checkedAt`, `detail`). |
| `qscd`, `createdAt`, `updatedAt` | As named. |

JWK members: `kid`, `kty` (`EC`), `crv` (`P-256`), `x`, `y`, `alg` (`ES256`).
With a chain the JWK also has `x5c` (base64 DER certificates, leaf first),
`x5t`, `x5t#S256` (**note the `#`**, quote it in code) and `x5c_expiry` (the
end of validity of the leaf). **No answer holds the private member `d`.**

`certificateAssessment` is the certificate assessment of the key:
`keyUsageType` (`A` to `F`, ETSI EN 319 412-2), `fitsCredentialCategories`
and `fitsCredentialCategoriesForMdl` (the credential categories that the
certificate fits), `mdlDocumentSigner`, `qcPsb`, and the rule texts for each
credential category in `categoryMessages` and `mdlConfigurationMessages`
(`[]` when the key fits). Read it before you pick the signing key of a
credential configuration: the credential definition checks the key against
its credential category (the signing key check).

### Create, reference, import
`POST …/keys`:
- **Create**: `{ "keyStoreId": "<id>", "name": "Issuer signing key" }`. All
  members are optional; `{}` creates a key in the local key store that takes
  new keys. The key is ECDSA P-256 with `ES256` (`algorithm` accepts only
  `ES256`).
- **Reference** a key that the provider already has: `keyStoreId` and
  `providerKeyRef` (from `…/provider-keys`), and `name`. For a key of a `csc`
  key store, `providerSecret` is the PIN of the CSC credential; without it
  the wallet uses `userPin` of the key store.
- The answer is **`201`** with `keyId`, `jwk`, and `key` (the full key).
  HTTP 409 when the provider key is already linked, or when the organisation
  has 1000 keys.

`POST …/keys/import` takes **`multipart/form-data`**: `file` (a PKCS#12 file,
or an encrypted PKCS#8 P-256 private key in PEM with the certificate chain
after it), `password` (required), and optional `keyStoreId` and `name`. The
key store must have the `import` capability (the local key store that takes
new keys, or `vault`). The answer is **`201`** with the key.

### Rename, delete, usage
- `PUT …/keys/{keyId}`: `name` (`null` removes it) and, for a `csc` key only,
  `providerSecret`. The answer is the key.
- `DELETE …/keys/{keyId}` needs the body `{ "confirm": "DELETE" }` and
  answers **`204`**. The wallet refuses (HTTP 400) the default key and a key
  in use: by a credential definition, a presentation definition, a status
  list, or an issuance or a verification in flight. It deletes only its
  record: the key in an external key store or at a QTSP stays.
- `GET …/keys/{keyId}/usage` (optional `search`) gives `isDefault`,
  `hasCertificates`, `credentialDefinitions`, `presentationDefinitions` and
  `statusLists` (each `count` and `items`), `issuanceRecordsInFlight` and
  `verificationRecordsInFlight` (`count`), and `canDelete`. Read it before a
  delete.

## Certificates (X.509)

### Certificate presets
`GET …/certificate-presets` gives `presets` and `testCaEnabled`. Each preset
targets one certificate profile and holds `id`, `name`, `description`,
`purpose`, `fixed` (the values the preset sets), `required` (the field paths
the request must give; `a|b` means one of them), `prefill` (values from the
organisation), `maxValidityDays`, `testCertificateValidityDays`,
`etsiSyntax`, `testCaDomain` and `sources`. The preset ids:
`wrpac-legal`, `wrpac-natural`, `pid-provider`, `wallet-provider`,
`wallet-status-list-signer`, `eaa-provider`, `qeaa-provider`,
`pub-eaa-provider`, `mdoc-document-signer`, `mdoc-reader`,
`mdoc-status-list-signer`, `status-list-signer`, `credential-issuer`,
`request-signer-san-dns`, and `custom` (no preset).

### Generate a CSR
`POST …/keys/{keyId}/csr` takes a CsrRequest. A member that you leave out
takes the prefill and the fixed values of the preset:

```json
{
  "preset": "eaa-provider",
  "subject": {
    "country": "SE",
    "organization": "Example AB",
    "organizationIdentifier": "VATSE-556677889901",
    "commonName": "Example AB Attestation Provider"
  }
}
```

Members: `preset`; `subject` (`country`, `stateOrProvince`, `locality`,
`organization`, `organizationalUnit`, `commonName`,
`organizationIdentifier`, `serialNumber`, `givenName`, `surname`);
`subjectAltName` (arrays `dns`, `uri`, `email`, `phone`); `keyUsage` and
`extendedKeyUsage` (`values`, `critical`); `certificatePolicies`;
`qcStatements` (`qcType`, `qcCompliance`, `qcSscd`, and `qcPsb` with
`countryOfLegislation`, `authSourceIdentification`,
`legislationIdentification`).

The answer is **`200`**: `csr` (PEM), `csrId`, `preset`, and `warnings`
(`code` and `message`; `preset-override` when you change a fixed value,
`purpose-reuse` when the key already has a certificate of another preset). An
invalid value gives HTTP 400 `<field>: <problem>`. Use one key for each
purpose.

### Upload or remove the chain
Send the CSR to a Certificate Authority, then upload the signed chain with
`POST …/keys/{keyId}/certificate-chain`. That request is
**`multipart/form-data`** with the file field **`certificate_file`**: UTF-8
PEM text, with the **leaf certificate first, then the intermediate
certificates, then the root certificate**. The leaf must hold the public key
of the key. The wallet refuses the file when it holds a private key, when the
leaf does not use P-256, when a certificate is expired or not yet valid, or
when a chain signature is not correct.

The answer holds `key_id`, `certificates_count`, `x5t` and `x5t_s256` (snake
case here; the JWK has `x5t` and `x5t#S256`), `csrId` and `preset` (of the
newest CSR of the key), `warnings` (`profile-mismatch` when the certificate
differs from the preset; a warning, not an error), and
`affectedCredentialConfigurations`: the credential configurations that sign
with the key and no longer fit their credential category with this chain
(`credentialDefinitionId`, `credentialConfigurationId`, `name`,
`credentialCategory`, `messages`). The upload still succeeds; fix those
configurations.

`DELETE …/keys/{keyId}/certificate-chain` needs `{ "confirm": "DELETE" }`
and answers **`200`** with `affectedCredentialConfigurations`. HTTP 409 while
a definition signs with the key in the `x509` format.

### Test certificates and the test CA
A test certificate is for development and testing only, never for
production.

- `POST …/keys/{keyId}/test-certificate` takes a CsrRequest and an optional
  `validityDays` (1 to 3650). The test CA of the organisation issues the leaf
  with the preset profile, and the key gets the chain `[leaf, root]`. The
  answer is **`200`** with `key`, `warnings` (the first is
  `test-certificate`) and `affectedCredentialConfigurations`. HTTP 409 when
  the key has a chain of another CA. HTTP 403 when the platform has the test
  CA switched off (`testCaEnabled` `false`).
- `GET …/test-ca` gives `testCas` (`id`, `domain`, `certificate` (the root in
  PEM), `subject`, `notBefore`, `notAfter`, `crlUrl`, `certificateUrl`) and
  `warnings`. Give the root to a test verifier as its trust anchor.
- `POST …/test-ca` with `domain` (`mdoc-iaca`, the default, `provider` or
  `access`) and `country` (ISO 3166-1 alpha-2; required for `mdoc-iaca`)
  makes the root of a trust domain: **`201`** with `testCa` and `warnings`.
  HTTP 409 when the domain has a root. The first test certificate of a
  domain also makes its root.

### Trust lookup
`POST …/trust-lookup` with `{ "kid": "<keyId>", "format": "x509" }` checks
whether a trust authority of the organisation (see
`igrantio-api-trust-anchor`) holds the key. `format` is `x509` (the key needs
a chain), `did:key` (also send `did`), or `kid`. The answer holds `kid`,
`format`, `query`, `verified`, `selected` and `sources`.

## Errors
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
- `igrantio-api-issuer` - credential definitions, their credential category
  and their signing key.
- `igrantio-api-trust-anchor` - the trust lists that validate the issuers and
  verifiers your keys meet in a flow.
- `igrantio-dcapi-ios` - ISO 18013-7 Annex C, which needs the `x509` trust
  anchor and so needs an uploaded certificate chain.
- `igrantio-api-sandboxes` - sandbox organisations and their API keys.
