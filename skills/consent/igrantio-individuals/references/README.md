# igrantio-individuals (reference)

Onboard users into the iGrant.io Consent BB and map `userId ↔ individualId`.

```sh
cp .env.example .env      # set OWS_ENV, OWS_API_KEY
npm install
npm run dev               # example server on :6003

# demo onboard (userId comes from your session in production):
curl -s -XPOST localhost:6003/individuals/onboard \
  -H 'content-type: application/json' -H 'X-Demo-User-Id: u_123' \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","phone":"+10000000000"}'
# -> { "individualId": "6541...cd" }
```

Core library (use inside your own signup handler — a separate server is optional):
`src/consentClient.ts`, `src/mappingStore.ts`, `src/onboarding.ts` (`ensureIndividual`).

See the parent `SKILL.md`. Pairs with `igrantio-consent-records`.
