---
name: igrantio-trustlist-entries
description: 'Add, update, or remove entries (participants) in the NXD Foundation trust lists through the trust-list backend admin API, authenticating as an OAuth2 client with the client_credentials grant. Covers the token endpoint, the participant record shape, the per-list digital-id rules (x509_certificates for typed lists such as WRPAC and EAA), and the write-with-review model where a 202 means the change waits on the Approvals page for a super admin. Prerequisite: a client id and client secret created on the backoffice OAuth2 Clients page. Use when automation must register a verifier or issuer certificate (for example a WRPAC) in the trust list.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: trust list, NXD Foundation, WRPAC, EAA, QEAA, ETSI TS 119 612, ETSI TS 119 602, participant, trust anchor, OAuth2 client_credentials, approvals, write:review, x509 certificate, eIDAS2
  version: 2026.08.11
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

1. A **client id** and **client secret** for the trust-list backend. A
   backoffice admin creates them on the **OAuth2 Clients** page of the
   dashboard (`/backoffice`). The secret is shown exactly once.
2. The base URL of the deployment, for example
   `https://trustlist.nxd.foundation`.

The client's **scope** decides what a write does:

| Scope | PUT (upsert) | DELETE | Notes |
| --- | --- | --- | --- |
| `read` | refused (403) | refused (403) | list participants and trust lists only |
| `write` | applies directly, lists re-sign | queued for approval | for high-trust automation |
| `write:review` | queued for approval | queued for approval | every action waits for a super admin |

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

`PUT {base}/admin/participants` with the participant record:

```json
{
  "participant_id": "bygg-ab",
  "name": "Bygg AB",
  "trade_name": "Bygg AB",
  "address": {
    "street": "Main Street 1",
    "locality": "Stockholm",
    "postal_code": "111 11",
    "country": "SE"
  },
  "electronic_addresses": ["mailto:ops@byggab.se"],
  "information_uri": "https://byggab.example",
  "services": [
    {
      "list": "wrpac",
      "name": "Bygg AB Business Wallet (Relying Party)",
      "digital_ids": { "x509_certificates": ["<base64 DER leaf certificate>"] }
    }
  ]
}
```

Field rules:

- `participant_id`: `^[a-z0-9][a-z0-9-]{1,63}$`. The upsert is idempotent on
  this id; add `?mode=create` to refuse (409) an id that is already taken.
- `electronic_addresses` and `services` need at least one entry each.
- `services[].list` is one of the per-type lists `qeaa`, `eaa`, `pub-eaa`,
  `pid`, `wallet`, `wrpac`, `wrprc`, `registrars`, or the legacy lists
  `nxd-tl` and `ewc-tl`.
- Per-type lists **require** `digital_ids.x509_certificates` - base64 DER
  (the same encoding as a JWS `x5c` element), leaf certificate. Every other
  digital-id kind is discarded on these lists. Only the legacy lists accept
  DIDs, KIDs, JWKS URIs, SKIs, or subject names.
- `service_type` is optional; the backend defaults it per list (for `wrpac`:
  `http://uri.etsi.org/TrstSvc/Svctype/WRPAC`).

Answers: `200 {"status": "participant saved and lists re-signed"}` for a
direct write (`write` scope), or the `202` approval answer (`write:review`).
An expired or malformed certificate is accepted but flagged as a warning in
the dashboard; a syntactically invalid record is a `400`.

## 3. Remove an entry

`DELETE {base}/admin/participants/{participant_id}`. For a service client this
**always** answers `202` and queues a `participant.delete` approval, whatever
the scope - the same rule human admins live under.

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

## Cross-references
- `igrantio-api-key-management` - create the CSR and upload the certificate
  chain in OWS that this skill then registers in the trust list.
- `igrantio-api-trust-anchor` - the OWS-side trust lists that consume what
  this skill publishes.
