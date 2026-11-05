# igrantio-holder-backend (reference)

Runnable OWS **holder** (wallet-side) tenant backend: API-key-hiding proxy
scoped to holder endpoints + notifications SSE relay.

```sh
cp .env.example .env      # set OWS_ENV, CORS_ORIGINS, OWS_TENANT_<SLUG>_API_KEY
npm install
npm run dev               # http://localhost:6003
```

## Endpoints
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/healthz` | liveness |
| GET/POST/PUT/PATCH/DELETE | `/ows/:tenant/*` | proxy to OWS holder routes (injects ApiKey) |
| GET | `/ows/:tenant/v4/config/ows/holder/notification-stream` | relayed holder notifications SSE stream |

Allow-listed OWS paths (proxy), all under `v4/config/ows/holder/`:
`credentials` and `credentials/{id}` (+ `transaction-code`,
`deferred-credential`, `acceptance`, `reissuance`, `revocation-status`),
`authorisation-code-exchanges`, `presentations` and `presentations/{id}`
(+ `matching-credentials`, `response`), `notifications` and
`notifications/{id}`, `configuration`, `wallet-unit/status`. The issuer and
verifier routes are excluded (least privilege).

No webhooks: holder events arrive on the notifications stream.

See the parent `SKILL.md`, `holder-api-reference.md` (endpoint contract), and
`igrantio-holder-notifications` (notification decision table).
