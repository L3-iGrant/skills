---
name: igrantio-trustlist-entries
description: 'Add, update, or remove entries (participants) in the NXD Foundation trust lists through the trust-list backend admin API, authenticating as an OAuth2 client with the client_credentials grant. Covers the token endpoint, the scope model (read, write, write:review, combinable), the exact request body for every trust list (QEAA, EAA, Pub-EAA, PID, Wallet, WRPAC, WRPRC, Registrars, and the legacy NXD-TL and EWC-TL) with their exact service type URIs, and the write-with-review model where a 202 means the change waits on the Approvals page for a super admin. Prerequisite: a client id and client secret created on the backoffice OAuth2 Clients page. Use when automation must register a verifier or issuer certificate (for example a WRPAC) in the trust list.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: trust list, NXD Foundation, WRPAC, WRPRC, QEAA, EAA, Pub-EAA, PID, wallet provider, registrars, ETSI TS 119 612, ETSI TS 119 602, participant, trust anchor, OAuth2 client_credentials, approvals, write:review, x509 certificate, eIDAS2
  version: 2026.09.01
  source-doc: https://github.com/NXD-Foundation/nxd-trust-list-backend
  protocols: OAuth-2.0-client-credentials, JWT
  auth: Bearer access token from POST /auth/token with grant_type=client_credentials
---

# NXD trust list - add and manage entries as an OAuth2 client

## When to use
Use this skill when the task is one of these:

- Register a certificate in an NXD trust list (for example a Wallet-Relying
  Party Access Certificate, WRPAC, so wallets trust a verifier).
- Update or remove a trust-list entry from automation, CI, or an agent.
- Wire a backend (for example the iGrant.io OWS) to the trust list so a
  certificate upload can be followed by a trust-list registration.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
  A key works only in its own environment.
- The organisation whose certificate you register must already hold the key
  and certificate chain in OWS (`igrantio-api-key-management`).
- A trust-list client id and secret (next section).

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
3. **Client** - do you have the trust-list client id and secret? _Created on
   the backoffice OAuth2 Clients page; the secret shows once._
4. **List** - which trust list: WRPAC (relying party), QEAA / EAA / Pub-EAA /
   PID (issuer), Wallet, WRPRC, or Registrars?
5. **Scope** - `write` (applies directly) or `write:review` (queued for
   approval)?
6. **Base URL** - which trust-list deployment (for example
   `https://trustlist.nxd.foundation`)?

## Trust-list client prerequisites

1. A **client id** and **client secret** for the trust-list backend. A
   backoffice admin creates them on the **OAuth2 Clients** page of the
   dashboard (`/backoffice`). The secret is shown exactly once.
2. The base URL of the deployment, for example
   `https://trustlist.nxd.foundation`.

A client holds **one or more scopes**, and the scopes decide what a write does:

| Scope | PUT (upsert) | DELETE | Notes |
| --- | --- | --- | --- |
| `read` | refused (403) | refused (403) | list participants and trust lists only |
| `write` | applies directly, lists re-sign | queued for approval | for high-trust automation |
| `write:review` | queued for approval | queued for approval | every action waits for a super admin |

When a client holds both `write` and `write:review`, `write` wins: upserts
apply directly. Deletes queue for approval whatever the scopes.

A queued action answers **`202`** with
`{"status": "queued for approval", "approvalId": "<id>"}` and appears on the
dashboard's **Approvals** page. Only a super admin resolves it; the client
cannot poll the approval, so treat a 202 as "submitted, a human decides".
Every client action is recorded in the activity log as `client:<name>`.

## 1. Get a token

`POST {base}/auth/token`, body `application/x-www-form-urlencoded`:

```
grant_type=client_credentials&client_id=<id>&client_secret=<secret>
```

HTTP Basic (`Authorization: Basic base64(id:secret)`) also works. The answer:

```json
{ "access_token": "<jwt>", "token_type": "Bearer", "expires_in": 3600 }
```

Send it as `Authorization: Bearer <jwt>`. Disabling the client or changing its
scopes takes effect on the next request, not at token expiry. Errors follow
RFC 6749: `{"error": "invalid_client", "error_description": "..."}`.

## 2. Add or update an entry

`PUT {base}/admin/participants` with a participant record. Common rules:

- `participant_id`: `^[a-z0-9][a-z0-9-]{1,63}$`. The upsert is idempotent on
  this id; add `?mode=create` to refuse (409) an id that is already taken.
- `name`, `address` (street, locality, country as 2-letter code;
  `postal_code` optional), at least one `electronic_addresses` entry, an
  `information_uri`, and at least one `services` entry are required.
  `trade_name` is optional.
- One participant may carry several services across several lists.
- `service_type` is optional; when omitted, the list's first (issuance)
  type from the tables below is used. `status` is `granted` (default) or
  `withdrawn`. `status_starting_time` and `service_supply_points` are
  optional.
- Answers: `200 {"status": "participant saved and lists re-signed"}` for a
  direct write, or the `202` approval answer. An expired certificate is
  accepted but flagged as a warning in the dashboard; a syntactically
  invalid record is a `400`.

### Primary (per-type) lists

These lists **require** `digital_ids.x509_certificates`: base64 DER (the same
encoding as a JWS `x5c` element), leaf certificate. Every other digital-id
kind is discarded on these lists.

| `list` key | Documents | Allowed `service_type` URIs (first is the default) |
| --- | --- | --- |
| `qeaa` | `NXD-TL-QEAA.xml` (TS 119 612 TSL) | `http://uri.etsi.org/TrstSvc/Svctype/EAA/Q` |
| `eaa` | `NXD-TL-EAA.xml`, `nxd-eaa-providers-lote.json` | `http://uri.etsi.org/19602/SvcType/PubEAA/Issuance`, `http://uri.etsi.org/19602/SvcType/PubEAA/Revocation` |
| `pub-eaa` | `NXD-TL-PubEAA.xml`, `nxd-pub-eaa-providers-lote.json` | `http://uri.etsi.org/19602/SvcType/PubEAA/Issuance`, `http://uri.etsi.org/19602/SvcType/PubEAA/Revocation` |
| `pid` | `NXD-TL-PID.xml`, `nxd-pid-providers-lote.json` | `http://uri.etsi.org/19602/SvcType/PID/Issuance`, `http://uri.etsi.org/19602/SvcType/PID/Revocation` |
| `wallet` | `NXD-TL-WalletProviders.xml`, `nxd-wallet-providers-lote.json` | `http://uri.etsi.org/19602/SvcType/WalletSolution/Issuance`, `http://uri.etsi.org/19602/SvcType/WalletSolution/Revocation` |
| `wrpac` | `NXD-TL-WRPAC.xml`, `nxd-wrpac-providers-lote.json` | `http://uri.etsi.org/19602/SvcType/WRPAC/Issuance`, `http://uri.etsi.org/19602/SvcType/WRPAC/Revocation` |
| `wrprc` | `NXD-TL-WRPRC.xml`, `nxd-wrprc-providers-lote.json` | `http://uri.etsi.org/19602/SvcType/WRPRC/Issuance`, `http://uri.etsi.org/19602/SvcType/WRPRC/Revocation` |
| `registrars` | `NXD-TL-Registrars.xml`, `nxd-registrars-and-registers-lote.json` | `http://uri.etsi.org/19602/SvcType/Register` |

Exact request bodies, one per list. Replace the organisation fields and the
certificate; keep the `list` and `service_type` values exactly as shown.
Where a list has a Revocation type, use it instead of Issuance when the
service publishes validity status rather than issuing.

**`qeaa` - Qualified EAA provider (TSL):**

```json
{
  "participant_id": "acme-qeaa",
  "name": "Acme Trust Services AB",
  "address": { "street": "Main Street 1", "locality": "Stockholm", "postal_code": "111 11", "country": "SE" },
  "electronic_addresses": ["mailto:ops@acme.example"],
  "information_uri": "https://acme.example",
  "services": [
    {
      "list": "qeaa",
      "name": "Acme QEAA Issuance",
      "service_type": "http://uri.etsi.org/TrstSvc/Svctype/EAA/Q",
      "digital_ids": { "x509_certificates": ["<base64 DER leaf certificate>"] }
    }
  ]
}
```

**`eaa` - EAA provider:**

```json
{
  "participant_id": "acme-eaa",
  "name": "Acme Attestations AB",
  "address": { "street": "Main Street 1", "locality": "Stockholm", "postal_code": "111 11", "country": "SE" },
  "electronic_addresses": ["mailto:ops@acme.example"],
  "information_uri": "https://acme.example",
  "services": [
    {
      "list": "eaa",
      "name": "Acme EAA Issuance",
      "service_type": "http://uri.etsi.org/19602/SvcType/PubEAA/Issuance",
      "digital_ids": { "x509_certificates": ["<base64 DER leaf certificate>"] }
    }
  ]
}
```

**`pub-eaa` - Pub-EAA provider:**

```json
{
  "participant_id": "acme-pub-eaa",
  "name": "Acme Public Attestations AB",
  "address": { "street": "Main Street 1", "locality": "Stockholm", "postal_code": "111 11", "country": "SE" },
  "electronic_addresses": ["mailto:ops@acme.example"],
  "information_uri": "https://acme.example",
  "services": [
    {
      "list": "pub-eaa",
      "name": "Acme Pub-EAA Issuance",
      "service_type": "http://uri.etsi.org/19602/SvcType/PubEAA/Issuance",
      "digital_ids": { "x509_certificates": ["<base64 DER leaf certificate>"] }
    }
  ]
}
```

**`pid` - PID provider:**

```json
{
  "participant_id": "acme-pid",
  "name": "Acme Identity AB",
  "address": { "street": "Main Street 1", "locality": "Stockholm", "postal_code": "111 11", "country": "SE" },
  "electronic_addresses": ["mailto:ops@acme.example"],
  "information_uri": "https://acme.example",
  "services": [
    {
      "list": "pid",
      "name": "Acme PID Issuance",
      "service_type": "http://uri.etsi.org/19602/SvcType/PID/Issuance",
      "digital_ids": { "x509_certificates": ["<base64 DER leaf certificate>"] }
    }
  ]
}
```

**`wallet` - Wallet provider:**

```json
{
  "participant_id": "acme-wallet",
  "name": "Acme Wallet AB",
  "address": { "street": "Main Street 1", "locality": "Stockholm", "postal_code": "111 11", "country": "SE" },
  "electronic_addresses": ["mailto:ops@acme.example"],
  "information_uri": "https://acme.example",
  "services": [
    {
      "list": "wallet",
      "name": "Acme Wallet Solution",
      "service_type": "http://uri.etsi.org/19602/SvcType/WalletSolution/Issuance",
      "digital_ids": { "x509_certificates": ["<base64 DER leaf certificate>"] }
    }
  ]
}
```

**`wrpac` - Wallet-Relying Party Access Certificate provider (verifiers):**

```json
{
  "participant_id": "acme-shop",
  "name": "Acme Shop AB",
  "address": { "street": "Main Street 1", "locality": "Stockholm", "postal_code": "111 11", "country": "SE" },
  "electronic_addresses": ["mailto:ops@acme.example"],
  "information_uri": "https://shop.acme.example",
  "services": [
    {
      "list": "wrpac",
      "name": "Acme Shop (Relying Party)",
      "service_type": "http://uri.etsi.org/19602/SvcType/WRPAC/Issuance",
      "digital_ids": { "x509_certificates": ["<base64 DER leaf certificate>"] }
    }
  ]
}
```

**`wrprc` - Wallet-Relying Party Registration Certificate provider:**

```json
{
  "participant_id": "acme-wrprc",
  "name": "Acme Registration Services AB",
  "address": { "street": "Main Street 1", "locality": "Stockholm", "postal_code": "111 11", "country": "SE" },
  "electronic_addresses": ["mailto:ops@acme.example"],
  "information_uri": "https://acme.example",
  "services": [
    {
      "list": "wrprc",
      "name": "Acme WRPRC Issuance",
      "service_type": "http://uri.etsi.org/19602/SvcType/WRPRC/Issuance",
      "digital_ids": { "x509_certificates": ["<base64 DER leaf certificate>"] }
    }
  ]
}
```

**`registrars` - Registrars and registers:**

```json
{
  "participant_id": "acme-registry",
  "name": "Acme Business Registry",
  "address": { "street": "Main Street 1", "locality": "Stockholm", "postal_code": "111 11", "country": "SE" },
  "electronic_addresses": ["mailto:ops@acme.example"],
  "information_uri": "https://registry.acme.example",
  "services": [
    {
      "list": "registrars",
      "name": "Acme Register",
      "service_type": "http://uri.etsi.org/19602/SvcType/Register",
      "digital_ids": { "x509_certificates": ["<base64 DER leaf certificate>"] }
    }
  ]
}
```

### Secondary (legacy) lists

The legacy lists accept any subset of six digital-id kinds; at least one must
be non-empty. `service_type` is free-form here and usually omitted.

| `list` key | Document | Digital-id kinds |
| --- | --- | --- |
| `nxd-tl` | `legacy/NXD-TL.xml` | `x509_certificates`, `x509_skis`, `x509_subject_names`, `dids`, `kids`, `jwks_uris` |
| `ewc-tl` | `legacy/EWC-TL.xml` | same six kinds |

**`nxd-tl` - legacy NXD trust list:**

```json
{
  "participant_id": "acme-legacy",
  "name": "Acme Legacy Services AB",
  "address": { "street": "Main Street 1", "locality": "Stockholm", "postal_code": "111 11", "country": "SE" },
  "electronic_addresses": ["mailto:ops@acme.example"],
  "information_uri": "https://acme.example",
  "services": [
    {
      "list": "nxd-tl",
      "name": "Acme Issuer",
      "digital_ids": {
        "x509_certificates": ["<base64 DER leaf certificate>"],
        "dids": ["did:web:acme.example#key-1"],
        "kids": ["<kid>"],
        "jwks_uris": ["https://acme.example/.well-known/jwks.json"]
      }
    }
  ]
}
```

**`ewc-tl` - legacy EWC trust list:**

```json
{
  "participant_id": "acme-ewc",
  "name": "Acme EWC Pilot AB",
  "address": { "street": "Main Street 1", "locality": "Stockholm", "postal_code": "111 11", "country": "SE" },
  "electronic_addresses": ["mailto:ops@acme.example"],
  "information_uri": "https://acme.example",
  "services": [
    {
      "list": "ewc-tl",
      "name": "Acme EWC Issuer",
      "digital_ids": { "dids": ["did:web:acme.example#key-1"] }
    }
  ]
}
```

## 3. Remove an entry

`DELETE {base}/admin/participants/{participant_id}`. For a service client this
**always** answers `202` and queues a `participant.delete` approval, whatever
the scopes - the same rule human admins live under.

## 4. Read back

- `GET {base}/admin/participants` - every entry, with per-service certificate
  expiry warnings (needs any scope).
- `GET {base}/admin/trust-lists` - the signed documents and their sequence
  numbers; a successful write bumps the sequence.
- `POST {base}/trust-list/lookup` with `{"x5c": ["<base64 DER>"]}` - public,
  no auth; the definitive check that a certificate is granted by a list.

## Pitfalls

- The secret is shown once at creation or rotation; there is no read-back.
- A `401` on a token that worked a moment ago usually means the client was
  disabled or deleted - the backend re-reads the client row on every request.
- Do not retry a `202` - resubmitting creates nothing new (a pending approval
  for the same participant and action is refused with `400`) but the queue
  only drains when a super admin acts.
- The approvals queue re-validates the payload at approval time, so a record
  that was valid when queued can still be rejected if the rules tightened.
- On the per-type lists every digital-id kind except `x509_certificates` is
  silently discarded; only the legacy lists keep DIDs, KIDs, JWKS URIs, SKIs,
  and subject names.

## Cross-references
- `igrantio-api-key-management` - create the CSR and upload the certificate
  chain in OWS that this skill then registers in the trust list.
- `igrantio-api-trust-anchor` - the OWS-side trust lists that consume what
  this skill publishes.
