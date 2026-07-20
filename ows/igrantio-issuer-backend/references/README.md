# igrantio-issuer-backend (reference)

Runnable OWS **issuer** tenant backend: API-key-hiding proxy + webhook receiver + SSE.

```sh
cp .env.example .env      # set OWS_BASE_URL, WEBHOOK_SECRET_KEY, PUBLIC_BASE_URL,
                          # CORS_ORIGINS, OWS_TENANT_<SLUG>_API_KEY
npm install
npm run dev               # http://localhost:6001

# once per tenant (idempotent):
npm run register-webhook -- acme
```

## Endpoints
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/healthz` | liveness |
| GET/POST/PUT | `/ows/:tenant/*` | proxy to OWS credential endpoints (injects ApiKey) |
| POST | `/webhook` | OWS webhook receiver (HMAC-verified) |
| GET | `/webhook/sse/:exchangeId` | SSE stream for a CredentialExchangeId |
| DELETE | `/webhook/:exchangeId` | consume-and-delete |

Allow-listed OWS paths (proxy): `…/credential/issue`, `…/credential/history`.
Registered topics: `openid.credential.{offer_received,token_issued,credential_acked,credential_accepted}`.

See the parent `SKILL.md` and `igrantio-ows-overview` for the full contract.
