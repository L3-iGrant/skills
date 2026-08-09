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
| GET/POST/PUT/DELETE | `/ows/:tenant/*` | proxy to OWS holder endpoints (injects ApiKey) |
| GET | `/ows/:tenant/v2/config/digital-wallet/openid/notifications/sse` | relayed holder notifications SSE stream |

Allow-listed OWS paths (proxy): `…/sdjwt/credential/receive|exchange-code`,
`…/sdjwt/credential/{id}` (+ `user-pin`, `receive-deferred`, `accept`,
`configure`), `…/sdjwt/credentials`, `…/sdjwt/verification/receive|{id}|{id}/send`
(v3) and `{id}/filter` + delete (v2), `…/sdjwt/verifications`, notifications
REST, `…/holder/global-configuration(s)`, `…/wallet-unit/status`. The issuer's
`credential/issue|history` and the verifier's `verification/send|history` are
excluded (least privilege).

No webhooks: holder events arrive on the notifications stream.

See the parent `SKILL.md`, `holder-api-reference.md` (endpoint contract), and
`igrantio-holder-notifications` (notification decision table).
