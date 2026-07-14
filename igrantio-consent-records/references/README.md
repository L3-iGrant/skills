# igrantio-consent-records (reference)

Record and manage consents in the iGrant.io Consent BB, given a `dataAgreementId`
and an `individualId`.

```sh
cp .env.example .env      # set OWS_ENV, OWS_API_KEY
npm install
npm run dev               # example server on :6004

# give consent (individualId comes from your session->mapping in production):
curl -s -XPUT localhost:6004/consents/<dataAgreementId> \
  -H 'content-type: application/json' -H 'X-Demo-Individual-Id: <individualId>' \
  -d '{"optIn":true}'

# read it back:
curl -s localhost:6004/consents/<dataAgreementId> -H 'X-Demo-Individual-Id: <individualId>'
```

Endpoints (from `consentRouter`): `GET/DELETE /consents`, `GET/PUT
/consents/:dataAgreementId`, `GET /history`. Library helpers:
`src/consent.ts` (`giveConsent`, `withdrawConsent`, `setConsent`, `readConsent`).

See the parent `SKILL.md`. Get `individualId` from `igrantio-individuals`.
