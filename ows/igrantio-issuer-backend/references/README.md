# igrantio-issuer-backend (reference)

Runnable OWS **issuer** tenant backend: API-key-hiding proxy + webhook receiver + SSE.

```sh
cp .env.example .env      # set OWS_ENV (demo|staging|production), WEBHOOK_SECRET_KEY, PUBLIC_BASE_URL,
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
| GET/POST/PUT/PATCH/DELETE | `/ows/:tenant/*` | proxy to the issuance history routes (injects ApiKey) |
| POST | `/webhook` | OWS webhook receiver (HMAC-verified) |
| GET | `/webhook/sse/:resourceIds` | SSE stream for the credential exchange ids of one offer (comma-separated) |
| DELETE | `/webhook/:resourceId?sequence=<n>` | consume-and-delete the handled event |

Allow-listed paths (proxy): `v4/config/ows/issuer/issuance-history` and
`v4/config/ows/issuer/issuance-history/{credentialExchangeId}[/claims]`.
Registered event types: `ows.issuer.issuance_history.{offer_retrieved,token_issued,credential_deferred,credential_issued,credential_accepted,denied,expired}`.

See the parent `SKILL.md` and `igrantio-ows-overview` for the full contract.
