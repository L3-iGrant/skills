---
name: igrantio-api-key-management
description: 'The Key Management group of the iGrant.io OID4VC API: configure and read the secure vaults (iGrant.io, Hashicorp, QTSP, DB-backed) that hold the signing keys, list the keys as JWKs with their DIDs, create and delete ECDSA P-256 keys, generate a CSR, upload an X.509 certificate chain to fill x5c, and select a Qualified Trust Service Provider signing credential over the CSC API. Use when you set up or rotate the keys that sign OID4VCI credentials and OpenID4VP responses.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: key management, secure vault, JWK, ES256, P-256, CSR, X.509, x5c, certificate chain, QTSP, CSC API, Hashicorp Vault, remote qualified electronic signature, eIDAS2
  version: 2026.08.01
  source-doc: https://docs.igrant.io/docs/openid4vc-api/
  protocols: JWK (RFC 7517), ECDSA P-256 / ES256, PKCS#10 CSR, X.509, CSC API 1.0.4.0 / 2.2.0.0
  auth: OWS API key (Authorization "ApiKey <key>") or bearer access token
---

# iGrant.io OID4VC API - Key Management group

## When to use
Use this skill when you:
- choose or configure the **secure vault** that holds the organisation signing
  keys;
- create, list or delete a signing key;
- get a **CSR**, send it to a Certificate Authority, and upload the signed
  chain so that the key carries an `x5c` value (needed for the `x509_san_dns`
  and `x509_hash` client ID schemes and for ISO 18013-7 Annex C);
- attach a **QTSP** signing credential for remote qualified electronic
  signatures.

Base URL for demo: `https://demo-api.igrant.io`.
Auth header: `Authorization: ApiKey <key>` (note the trailing space in the
prefix). A bearer access token also works.

## Endpoint reference

| Method | Path | Purpose | Docs |
| --- | --- | --- | --- |
| GET | `/v2/config/digital-wallet/openid/key-managements` | List the vault types the platform supports | [config-list-digital-wallet-open-id-list-secure-vaults](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-list-secure-vaults/) |
| POST | `/v2/config/digital-wallet/openid/key-management` | Configure the secure vaults of the organisation | [config-digital-wallet-open-id-configure-secure-vault](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-configure-secure-vault/) |
| GET | `/v2/config/digital-wallet/openid/key-management` | Read the vault configuration of the organisation | [config-digital-wallet-open-id-read-secure-vault](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-read-secure-vault/) |
| PUT | `/v2/config/digital-wallet/openid/key-management` | Update the vault configuration | [config-digital-wallet-open-id-update-secure-vault](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-update-secure-vault/) |
| GET | `/v2/config/digital-wallet/openid/key-management/keys` | List all keys of all vaults, as JWKs with their DIDs | [config-digital-wallet-open-id-list-keys](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-list-keys/) |
| POST | `/v2/config/digital-wallet/openid/key-management/keys` | Create an ECDSA P-256 key in a vault | [config-digital-wallet-open-id-create-key](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-create-key/) |
| DELETE | `/v2/config/digital-wallet/openid/key-management/keys/{keyId}` | Delete a key (needs a confirmation body) | [config-digital-wallet-open-id-delete-key](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-delete-key/) |
| POST | `/v2/config/digital-wallet/openid/key-management/keys/{keyId}/csr` | Generate a Certificate Signing Request in PEM | [config-digital-wallet-open-id-generate-csr](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-generate-csr/) |
| POST | `/v2/config/digital-wallet/openid/key-management/keys/{keyId}/certificate-chain` | Upload the signed X.509 chain and link it to the key | [config-digital-wallet-open-id-upload-certificate-chain](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-upload-certificate-chain/) |
| GET | `/v2/config/digital-wallet/openid/key-management/qtsp/credentials` | List the QTSP signing credentials available | [config-digital-wallet-open-id-list-qtsp-credential](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-list-qtsp-credential/) |
| GET | `/v2/config/digital-wallet/openid/key-management/qtsp/{credentialId}` | Read the details of 1 QTSP signing credential | [config-digital-wallet-open-id-read-qtsp-credential](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-read-qtsp-credential/) |
| POST | `/v2/config/digital-wallet/openid/key-management/qtsp` | Select the QTSP signing credential to use | [config-digital-wallet-open-id-configure-qtsp-credential](https://docs.igrant.io/docs/openid4vc-api/config-digital-wallet-open-id-configure-qtsp-credential/) |

## Key fields

### The 4 vault IDs
| ID | Configuration field | Display name |
| --- | --- | --- |
| 1 | `igrantioVault` | iGrant.io Secure Vault |
| 2 | `hashicorpVault` | Hashicorp Secure Vault |
| 3 | `qtsp` | Qualified Trust Service Provider |
| 4 | `dbBackedVault` | DB-Backed Secure Vault |

`GET …/key-managements` (plural, no sandbox header) lists these 4 types. It is
the same for every organisation: it tells you which vaults the **platform**
supports, not which vaults the **organisation** uses. Read the organisation
configuration with `GET …/key-management` (singular). The organisation must
have a deployed OpenID digital wallet. This operation answers with **`201`**,
not `200`.

### Configure and update the vaults
`POST` and `PUT …/key-management` take the same body. Required top-level
objects: `hashicorpVault`, `igrantioVault`, `qtsp`. `dbBackedVault` is
optional. Each object has a required `enabled` boolean.

```json
{
  "hashicorpVault": { "enabled": false },
  "igrantioVault":  { "enabled": true },
  "qtsp":           { "enabled": false },
  "dbBackedVault":  { "enabled": false }
}
```

- **The iGrant.io vault must stay enabled.** The request fails if you send
  `igrantioVault.enabled: false`.
- With `hashicorpVault.enabled: true` you must also give `vaultUsername`,
  `vaultPassword`, `vaultAddress` and `vaultNamespace`.
- With `qtsp.enabled: true` you must also give `cscUrl`, `clientId`,
  `clientSecret` and `userID`. `cscApiVersion` is `v1` (CSC 1.0.4.0) or `v2`
  (CSC 2.2.0.0); the service uses `v1` when you do not send it.
- **Send the full configuration on every call.** The service forwards only the
  `enabled` flag of a vault that has `enabled: false`, so it **erases the
  stored credentials of that vault**. To keep the credentials of a vault, keep
  the vault enabled.
- Both operations answer with **`201`** and `{ "secureVault": [<ids>] }`.

`GET …/key-management` answers with **`201`**, not `200`. It gives
`hashicorpVault`, `igrantioVault`, `qtsp` and `dbBackedVault`, and it omits a
field that has no value. The `qtsp` object also carries `credentialId`, the
QTSP signing credential in use.

**The read response holds the stored vault credentials in clear text**,
including `hashicorpVault.vaultPassword` and `qtsp.clientSecret`. Protect the
response as you protect the credentials. The QTSP user PIN is the only secret
that the service never sends back.

### List keys - the JWK members
`GET …/key-management/keys` has **no query parameters and no pagination**. It
returns every key of every vault, grouped by vault:

```
keyManagementServices[]
  id      1 | 2 | 3 | 4
  name    "igrantioVault" | "hashicorpVault" | "qtsp" | "dbBackedVault"
  keys[]
    isDefault  boolean - true when the wallet signs with this key by default
    jwk        the public key
    dids[]     the decentralised identifiers of the key
```

JWK members. Only `kty` is always present:

| Member | Meaning |
| --- | --- |
| `kty` | Key type. Always sent. The vault creates elliptic curve keys, so the value is `EC`. |
| `crv` | Curve. Usually `P-256`. An imported key can also use `secp256k1`. |
| `x`, `y` | Coordinates of the elliptic curve point, base64url. |
| `kid` | Key identifier. |
| `alg` | Signature algorithm. The vault sets `ES256` for a P-256 key. |
| `x5c` | Array of base64 encoded DER certificates - the uploaded chain. |
| `x5t` | SHA-1 thumbprint of the leaf certificate. Present only when a chain is linked to the key. |
| `x5t#S256` | SHA-256 thumbprint of the leaf certificate. **Note the `#` in the member name** - quote it in code. |

**These responses never include the private member `d`.** This operation
returns public key material only. The private part never leaves the vault
through this API.

### Create and delete a key
Create takes an optional `vaultType` (1, 2, 3 or 4) and nothing else: the vault
sets the key type, the curve and the algorithm, so there is no parameter for
them. **Enable the vault before you create a key in it.** The answer is
**`201`** with `keyId` and a `jwk` whose `kid` is the same value as `keyId`.

Delete **needs a request body**:

```json
{ "confirm": "DELETE" }
```

`confirm` has one allowed value, `DELETE`. The service refuses the request when
the body is missing. Success is **`204`** with an empty body.

### CSR and certificate chain (X.509)
`POST …/keys/{keyId}/csr` body: `commonName` is required; `organization`,
`country` (2 letter code), `sanDns` (array) and `sanUri` (array) are optional.
The answer is `{ "csr": "-----BEGIN CERTIFICATE REQUEST-----…" }` in PEM.

Send the CSR to a Certificate Authority, then upload the signed chain with
`POST …/keys/{keyId}/certificate-chain`. That request is
**`multipart/form-data`** with the file field **`certificate_file`**. The file
must be UTF-8 text in PEM format, with the **leaf certificate first, then the
intermediate certificates, then the root certificate**.

The service refuses the file when it holds a private key, when the leaf
certificate does not use the P-256 curve, when a certificate is expired or not
yet valid, or when a chain signature is not correct.

The answer holds `key_id`, `certificates_count`, `x5t` and `x5t_s256` (snake
case here; the same thumbprints appear as `x5t` and `x5t#S256` in the list-keys
JWK). After the upload the wallet adds the chain as the `x5c` value of the key.

### QTSP signing credentials
Configure and **enable the QTSP vault before** you call any QTSP operation.

- `GET …/qtsp/credentials` answers with `{ "credentials": ["<id>", …] }`, the
  IDs available to the organisation. The service reads them from the QTSP over
  the Cloud Signature Consortium (CSC) API.
- `GET …/qtsp/{credentialId}` answers with a `credentialInfo` object that holds
  `cert` (with `certificates`, `issuerDN`, `subjectDN`, `serialNumber`,
  `status`, `validFrom`, `validTo`), `key` (`algo`, `curve`, `len`, `status`),
  `PIN`, `OTP`, `authMode`, `description` and `multisign`. **The QTSP controls
  the members of `credentialInfo`, so they can change between providers.**
  You cannot read a credential whose ID is the literal string `credentials`;
  that path goes to the list operation.
- `POST …/qtsp` selects the credential. Body: `credentialId` and `userPin`,
  both required. The answer is **`201`** with an **empty body**. The service
  stores `userPin` and never sends it back. To see the selected credential ID,
  read the secure vault and look at `qtsp.credentialId`.

## Sandbox call style
Every operation in this group takes the optional `X-SandboxOrgId` header,
except `GET /v2/config/digital-wallet/openid/key-managements` (the platform
vault-type list), which is the same for every organisation. With that header
the service runs the operation against the wallet of the named sandbox
organisation and not against the main wallet of the organisation.

**The service reads `X-SandboxOrgId` only when you authenticate with a bearer
access token.** With API-key auth the service takes the sandbox organisation
from the key and ignores the header. To run an API-key call in a sandbox
organisation, bind the key with
`PUT /v2/config/admin/apikey/{apiKeyId}/sandbox-org` instead.

`X-SubwalletId` is the deprecated name of the header. The service still accepts
it, but `X-SandboxOrgId` wins if you send both.

See `igrantio-api-sandboxes` for creating and deploying a sandbox organisation.

## Documentation is the source of truth
If this skill and the linked documentation disagree, **the documentation wins**.
Fetch the linked page, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, to check for
updates before you build. Report the drift so the skill can be corrected.

## Cross-references
- `igrantio-ows-overview` - architecture and glossary.
- `igrantio-api-trust-anchor` - the trust lists that validate the issuers and
  verifiers your keys meet in a flow.
- `igrantio-dcapi-ios` - ISO 18013-7 Annex C, which needs the `x509` trust
  anchor and so needs an uploaded certificate chain.
- `igrantio-api-sandboxes` - sandbox organisations and the API-key binding.
