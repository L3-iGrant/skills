---
name: igrantio-api-trust-anchor
description: 'Trust sources of the iGrant.io OID4VC API (the Trust Anchor group): add, read, change, turn off, refresh and delete the trust sources of an organisation - a trust anchor of CA certificates, an ETSI TS 119 612 trusted list, or an ETSI TS 119 602 list of trusted entities, each used for one role - read their entries, usage and statistics, and name them in the accepted lists of credential definitions, presentation definitions and the holder configuration. Explains the TrustedListCheck result of each trust check. Use when you decide which wallet providers an issuer accepts, which issuers a verifier accepts, or which issuers and verifiers a wallet trusts.'
license: Apache-2.0
metadata:
  categories: [ows-api, education]
  provider: iGrant.io
  keywords: trust source, trust anchor, trusted list, list of trusted entities, LoTE, ETSI TS 119 612, ETSI TS 119 602, usedFor, accepted list, acceptedWalletProviders, acceptedCredentialSigners, acceptedStatusIssuers, TrustedListCheck, trust entry, issuer validation, verifier validation, OpenID4VP, OID4VCI, EUDIW, eIDAS2
  version: 2026.11.02
  source-doc: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, ETSI TS 119 612 trusted lists, ETSI TS 119 602 lists of trusted entities, X.509 (RFC 5280)
  auth: OWS API key (Authorization "ApiKey <YOUR_API_KEY>")
---

# iGrant.io OID4VC API - Trust sources

## When to use
Use this skill when you:
- add a **trust source** to the organisation: CA certificates that you give, or
  a published ETSI list that the wallet downloads;
- read, change, turn off, refresh or delete a trust source, or read its
  entries, its usage or the counts by state;
- name trust sources in an **accepted list**, so that a check accepts only the
  signers that they hold;
- read the **trusted list check** of an issuance, a verification or a held
  credential.

A trust check reads only the trust sources of its accepted list. No source is
built in. To trust a public list, for example an EU list of wallet providers,
add its URL as a trust source and name the source in an accepted list.

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
3. **Check** - which signers must pass: the wallet providers of an issuer,
   the issuers of a verifier, or the issuers and verifiers of the holder
   wallet?
4. **Sources** - which lists (their https URLs) or CA certificates hold
   those signers, and which role does each one vouch for?

## Endpoint reference

| Method | Path | Purpose | Documentation |
| --- | --- | --- | --- |
| `POST` | `/v4/config/ows/trust/sources` | Add a trust source. A list is downloaded in the request. | [Add trust source](https://docs.igrant.io/docs/openid4vc-api/config-create-digital-wallet-open-id-trust-source/) |
| `GET` | `/v4/config/ows/trust/sources` | List the trust sources, last change first. | [List trust sources](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-trust-source/) |
| `GET` | `/v4/config/ows/trust/sources/{trustSourceId}` | Read one trust source. | [Read trust source](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-trust-source/) |
| `PATCH` | `/v4/config/ows/trust/sources/{trustSourceId}` | Change a trust source (partial), or turn it off or on. | [Update trust source](https://docs.igrant.io/docs/openid4vc-api/config-update-digital-wallet-open-id-trust-source/) |
| `DELETE` | `/v4/config/ows/trust/sources/{trustSourceId}` | Delete a trust source that is not in use. | [Delete trust source](https://docs.igrant.io/docs/openid4vc-api/config-delete-digital-wallet-open-id-trust-source/) |
| `POST` | `/v4/config/ows/trust/sources/{trustSourceId}/refresh` | Download the list of a list source now. | [Refresh trust source](https://docs.igrant.io/docs/openid4vc-api/config-refresh-digital-wallet-open-id-trust-source/) |
| `GET` | `/v4/config/ows/trust/sources/{trustSourceId}/usage` | Where the trust source is used, and whether you can delete or turn it off. | [Read trust source usage](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-trust-source-usage/) |
| `GET` | `/v4/config/ows/trust/entries` | List the entries of the trust sources, by role or for one source. | [List trust source entries](https://docs.igrant.io/docs/openid4vc-api/config-list-digital-wallet-open-id-trust-entry/) |
| `GET` | `/v4/config/ows/trust/sources/{trustSourceId}/entries/{entryId}` | Read one whole entry of a trust source. | [Read trust source entry](https://docs.igrant.io/docs/openid4vc-api/config-read-digital-wallet-open-id-trust-source-entry/) |
| `GET` | `/v4/config/ows/trust/statistics` | The number of trust sources in each state. | - |

API key scopes: `trust-sources:read`, `trust-sources:create`,
`trust-sources:update` (also for a refresh) and `trust-sources:delete`.

## Key fields

### Add a trust source
`POST /v4/config/ows/trust/sources`:

```json
{
  "kind": "etsi_lote",
  "url": "https://lists.example.com/wallet-providers.json",
  "usedFor": "wallet_provider",
  "name": "Example wallet providers"
}
```

| `kind` | What it is | Required | Optional | Refused |
| --- | --- | --- | --- | --- |
| `trust_anchor` | CA certificates that you give | `certificates`, `usedFor` | `name` | `url`, `signerCertificates` |
| `etsi_trusted_list` | An ETSI TS 119 612 trusted list (XML) | `url`, `usedFor` | `name`, `signerCertificates` | `certificates` |
| `etsi_lote` | An ETSI TS 119 602 list of trusted entities (XML or JSON) | `url`, `usedFor` | `name`, `signerCertificates` | `certificates` |

- `url`: an https URL of at most 2048 characters.
- `certificates`: PEM text with 1 to 10 CA certificates (basicConstraints
  `cA=TRUE`, not expired) and up to 10 CRLs that these CAs signed, at most
  65536 characters. A private key is refused. Each CA certificate is one
  entry of the source.
- `signerCertificates`: PEM text with at least one certificate that signs the
  list. The wallet then refuses a copy whose signature does not verify.
  Without it, `list.signatureVerified` is `false`.
- `name`: default for a list, the scheme name of the list, else the last part
  of its URL; for a trust anchor, the common name of its first certificate.
- `usedFor` (required): the one role that the source vouches for:

| `usedFor` | Signs or vouches for |
| --- | --- |
| `wallet_provider` | Wallet Unit Attestations and key attestations |
| `pid_provider` | a PID |
| `qeaa_provider` | a QEAA |
| `pub_eaa_provider` | a PuB-EAA |
| `eaa_provider` | a non-qualified EAA |
| `mdl_issuer` | an mDL (the IACA of the Document Signer) |
| `status_issuer` | the Status List Token of a credential |
| `access_certificate_provider` | wallet-relying party access certificates (WRPAC), and signed issuer metadata |
| `registration_certificate_provider` | wallet-relying party registration certificates |

A list gives the roles of its entries (its list type and the service type of
each entry); `usedFor` can only narrow them. `status_issuer` comes only from a
service type that gives it (a revocation service of a PID or PuB-EAA provider).
A national list that serves several roles needs one trust source for each
role; the wallet still downloads each URL once.

The wallet reads a list in the request. When the content is not a list of the
kind, has no entry, or its signature fails, the answer is HTTP 400 `The list
cannot be used: <reason>` and nothing is saved. Success is **`201`** with
`{"trustSource": {...}}`. An organisation has at most 100 trust sources
(HTTP 409).

### Trust source object
`id` (the value for an accepted list), `kind`, `name`, `usedFor`, `enabled`,
`url`, `certificates` and `signerCertificates` (each `subject`, `issuer`,
`serialNumber`, `notValidBefore`, `notValidAfter`, `ski`,
`sha256Fingerprint`), `list` (`null` for a trust anchor), `createdAt` and
`updatedAt`. The times are ISO 8601 UTC texts.

`list` holds `listType`, `sequenceNumber`, `issuedAt`, `nextUpdate`, `state`,
`signatureVerified`, `entryCount`, `lastFetchedAt`, `lastChangedAt`,
`nextRefreshAt`, `usedUntil` and `lastError` (`at`, `message`).

### State
The state of a source is `off` when it is turned off. Else, for a list, the
state of its copy: `not_downloaded`, `current`, `out_of_date` (after its next
update, for a grace period) or `expired` (the checks still use the last copy,
and a match gets a warning). For a trust anchor: `expired` when one of its CA
certificates is past its end of validity, else `current`.

### List, read, statistics
`GET .../sources` filters: `kind`, `role` (one role, a comma-separated list, or
`issuer` for every issuer role), `nameContains` and `state`. The answer is a
cursor page: `items`, `nextCursor` (`null` on the last page), and with
`includeTotal=true` also `total` and `totalCapped`. Page members: `limit`
(default 20; a value above 100 gives 100), `cursor` (the `nextCursor` of the
page before), `offset` (0 to 10000, not with `cursor`). A bad value gives
HTTP 400.

Read and the other operations on one source answer
`{"trustSource": {...}}`; an unknown id, also a value that is not a UUID, gives
HTTP 404.

`GET .../statistics` answers `{"trustSources": {"total", "current",
"outOfDate", "expired", "notDownloaded", "off"}}`.

### Change, turn off, refresh, delete
- `PATCH` is partial: `name`, `enabled`, `usedFor`, `url`, `certificates`
  (trust anchor only) and `signerCertificates` (lists only). `enabled: false`
  turns the source off. A new `url` or `signerCertificates`, or a change of a
  list to `status_issuer`, reads the list again with the rule of the add.
- A source **in use** cannot be turned off, change its `url` or its `usedFor`,
  or be deleted: HTTP 400 `The trust source is in use: ...`. Read the usage
  first.
- `POST .../refresh` downloads the list now and answers the source with its
  new `list`. A failed download keeps the last good copy and sets
  `list.lastError`. A refresh less than 5 minutes after the last download of the
  URL gives HTTP 429 with `Retry-After`. A trust anchor gives HTTP 400. The
  wallet also downloads each list at its next update, and at least once each
  24 hours.
- `DELETE` answers **`204`** with no body.

### Usage
`GET .../usage` answers `usage` (`credentialDefinitions`,
`presentationDefinitions`, `holderConfiguration`, `holderConfigurations`),
`canDelete` and `canDisable`. Each user holds `uses` (the lists that name the
source, for example `acceptedWalletProviders`, `acceptedCredentialSigners`,
`etsiTrustedAuthority`) and `organisation` (`id`, `name`, `isSandbox`); a
definition also holds `id` and `label`.

### Entries
`GET /v4/config/ows/trust/entries` filters: `role`, `sourceId`, `textContains`
(provider name, service name, certificate subject or key identifier) and
`status` (for example `granted` or `granted,withdrawn`), with the same page
members. Without `sourceId`, the page holds the entries of the sources that the
checks use (on, with a good copy). With `sourceId`, it holds the entries of that
copy whatever its state, and `source` (`id`, `name`, `kind`, `url`, `enabled`,
`state`, `usable`) tells whether the checks use them.

An item holds `sourceId`, `sourceName`, `sourceKind`, `sourceUrl`, `entryId`,
`roles`, `status`, `warning` (only for an odd status), `provider.name`,
`service` (`name`, `typeIdentifier`) and `certificate` (`subject`, `aki`,
`notValidAfter`). Use `certificate.aki` for a DCQL `aki` value and `sourceUrl`
for an `etsi_tl` value.

`GET .../sources/{trustSourceId}/entries/{entryId}` answers `{"trustEntry":
{...}}`: the item members, `usable` and `reason` (`source_disabled`,
`list_not_downloaded`, `not_granted`, `certificate_not_valid`), the provider
and service details, `certificateDetail`, `history` (former states of the
service) and `identities` (`kind`: `certificate`, `key_value`, `ski` or
`subject_name`, and `value`).

### Accepted lists
An accepted list holds the `id` values of trust sources of the organisation.
It names whole sources, never one entry. A Require switch that is on needs a
list that is not empty. Each source must be enabled and used for a role that
fits the list. Else the save gives HTTP 400 (for example `<field>[0]: ... is
not the id of a trust source ...`, `... is disabled`, `... is used for
<role>; ...`, `<field> must not be empty when its Require switch is on`).

| Setting | Members | Role of the sources |
| --- | --- | --- |
| Credential definition (`igrantio-api-issuer`) | `requiresTrustedWalletProvider`, `acceptedWalletProviders` | `wallet_provider` |
| Presentation definition (`igrantio-api-verifier`), for each credential query id in `credentialQueryOptions` | `requiresTrustedCredentialSigner`, `acceptedCredentialSigners` | a PID: `pid_provider`; an mDL: `mdl_issuer`; another credential: any issuer role |
| The same | `requiresTrustedStatusIssuer`, `acceptCredentialSignerAsStatusIssuer` (default `true`), `acceptedStatusIssuers` | `status_issuer` |
| The same, DCQL `trusted_authorities` of type `etsi_tl` | the URL of the list | an `etsi_trusted_list` or `etsi_lote` source of the organisation |
| Holder configuration (`igrantio-api-holder`) | `acceptedCredentialSigners`, `acceptedIssuers`, `acceptedRelyingParties`, `acceptedStatusIssuers`, `acceptedEtsiTrustedLists` | issuer roles; `access_certificate_provider`; `access_certificate_provider`; `status_issuer`; ETSI list sources |

The trust options of a presentation definition are never sent to a wallet.

### The trusted list check
Every trust check has the type `TrustedListCheck`, with all members present:

| Member | Meaning |
| --- | --- |
| `verified` | `true` when the signer passed. |
| `result` | `trusted`, `not_trusted` (entries match, but none is valid), `not_found`, `not_applicable` (the Require switch is off; `reason` is `not_required`), or `error` (the check cannot decide). |
| `role` | The role that the check asked for. |
| `entry` | The used entry (`trusted`), or the entry of the reason (`not_trusted`). |
| `reason`, `warning` | Why it did not pass; an odd status, an expired list, or the decision between several entries (`code`, `status`, `message`). |
| `presentedCertificates` | The certificates of the signer, leaf first, or `null`. |
| `matches`, `pathChecks`, `acceptedSources`, `decision` | Every matching entry with its result, the checks of the path to the anchor (`signature`, `validity`, `caRules`, `keyUsage`, `revocation`, `entryStatus`, `role`, `objectSignature`), the sources of the accepted list, and why one entry was picked. `null` when no check ran. |

Where you read it: `walletProviderTrustedListCheck` (issuance history),
`presentationValidity[].<credential query id>.credentialSignerTrustedListCheck`
and `statusIssuerTrustedListCheck` (verification),
`credentialSignerTrustedListCheck`, `issuerTrustedListCheck` and
`statusIssuerTrustedListCheck` (held credential), and
`relyingPartyTrustedListCheck` (holder presentation). The checks of your own
keys do not use trust sources.

## Sandbox call style
A sandbox organisation has no trust sources of its own. It uses and manages the
trust sources of its main organisation. With an API key that is bound to a
sandbox organisation, every operation of this group reads and changes the trust
sources of the main organisation, and the statistics count them. The settings
of the main organisation and of each sandbox organisation can name them, and
the usage report names the organisation of each user (`isSandbox`).

To get such a key, select the sandbox organisation in the iGrant.io dashboard,
then create the API key under **Account > Developer APIs** (**Create API Key**).

See `igrantio-api-sandboxes` for creating and deploying a sandbox organisation.

## Documentation is the source of truth
If this skill and the linked documentation disagree, **the documentation wins**.
Fetch the linked page, or the raw specification at
<https://docs.igrant.io/openapispecifications/oid4vc.yaml>, to check for
updates before you build. Report the drift so the skill can be corrected.

## Cross-references
- `igrantio-ows-overview` - architecture and glossary.
- `igrantio-api-issuer` - the accepted wallet providers of a credential
  definition.
- `igrantio-api-verifier` - the accepted credential signers and status issuers
  of a presentation definition, and the trust check of a verification.
- `igrantio-api-holder` - the trust settings of the holder configuration.
- `igrantio-dcql-trusted-authority` - use a trust list in a DCQL query so that
  a verifier accepts only trust-list-anchored issuers.
- `igrantio-api-key-management` - the signing keys and certificate chains that
  the organisation signs with.
- `igrantio-api-sandboxes` - sandbox organisations and their API keys.
- `igrantio-trustlist-entries` - register an issuer or verifier certificate in
  the NXD Foundation trust lists.
