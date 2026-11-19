# igrantio-verifier-backend (reference)

Runnable OWS **verifier** tenant backend: API-key-hiding proxy + webhook receiver + SSE.

```sh
cp .env.example .env      # set OWS_ENV (demo|staging|production), WEBHOOK_SECRET_KEY, PUBLIC_BASE_URL,
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
| GET/POST/PUT/PATCH/DELETE | `/ows/:tenant/*` | proxy to OWS verification endpoints (injects ApiKey) |
| POST | `/webhook` | OWS webhook receiver (HMAC-verified) |
| GET | `/webhook/sse/:resourceIds` | SSE stream for a presentationExchangeId |
| DELETE | `/webhook/:resourceId?sequence=<n>` | consume-and-delete the handled event |

Allow-listed paths (proxy): `v4/config/ows/verifier/verifications` and
`v4/config/ows/verifier/verifications/{verificationId}[/response]` (the
response is the Digital Credentials API answer).
Registered event types: `ows.verifier.verification.{request_retrieved,presentation_received,declined}`.

See the parent `SKILL.md` and `igrantio-ows-overview` for the full contract.
