# igrantio-verifier-backend (reference)

Runnable OWS **verifier** tenant backend: API-key-hiding proxy + webhook receiver + SSE.

```sh
cp .env.example .env      # set OWS_ENV, WEBHOOK_SECRET_KEY, PUBLIC_BASE_URL,
                          # CORS_ORIGINS, OWS_TENANT_<SLUG>_API_KEY
npm install
npm run dev               # http://localhost:6002

# once per tenant (idempotent):
npm run register-webhook -- acme
```

## Endpoints
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/healthz` | liveness |
| GET/POST/PUT | `/ows/:tenant/*` | proxy to OWS verification endpoints (injects ApiKey) |
| POST | `/webhook` | OWS webhook receiver (HMAC-verified) |
| GET | `/webhook/sse/:exchangeId` | SSE stream for a presentationExchangeId |
| DELETE | `/webhook/:exchangeId` | consume-and-delete |

Allow-listed OWS paths (proxy): `…/verification/send`, `…/verification/history` (v3 + v2).
Registered topics: `openid.presentation.presentation_acked.v3`, `digitalwallet.presentation.verified`.

See the parent `SKILL.md` and `igrantio-ows-overview` for the full contract.
