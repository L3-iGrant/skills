# igrantio-holder-backend (reference)

A runnable OWS **holder** (wallet-side) tenant backend: a proxy that hides
the API key and forwards only the holder routes, plus the relay of the
notification stream.

```sh
cp .env.example .env      # set OWS_ENV, CORS_ORIGINS, OWS_TENANT_<SLUG>_API_KEY
npm install
npm run dev               # http://localhost:6003
```

## Endpoints
| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/healthz` | liveness |
| `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | `/ows/:tenant/*` | proxy to the OWS holder routes (adds the API key) |
| `GET` | `/ows/:tenant/v4/config/ows/holder/notification-stream` | relayed holder notification stream (SSE) |

Allowed OWS paths (proxy), all under `v4/config/ows/holder/`:
`credentials` and `credentials/{credentialId}` (with `transaction-code`,
`deferred-credential`, `acceptance`, `reissuance`, `revocation-status`),
`authorisation-code-exchanges`, `credential-issuer-metadata`,
`presentations` and `presentations/{presentationId}` (with
`matching-credentials`, `response`), `notifications` and
`notifications/{notificationId}`, `configuration`, `wallet-unit/status`. The
issuer and verifier routes stay out (least privilege).

The holder role needs no webhook URL: the browser gets its events on the
notification stream.

See the parent `SKILL.md`, `holder-api-reference.md` (the holder contract)
and `igrantio-holder-notifications` (the notification decision table).
