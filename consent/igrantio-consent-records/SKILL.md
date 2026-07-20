---
name: igrantio-consent-records
description: 'Record and manage individual consents against a data agreement using the iGrant.io Consent Building Block, given a dataAgreementId and an individualId. Node/TypeScript backend for the individual Consent-Record API: create, read, list, update (allow/withdraw), history, and delete-all (right to be forgotten). Use when an application must capture and manage a user''s consent decisions. Get individualId from igrantio-individuals.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  version: 1.0.0
  api: https://docs.igrant.io/docs/category/consent-management-individual-api/consent-record
  auth: Organisation API key (Authorization "ApiKey <key>") + X-ConsentBB-IndividualId — server-side only
  requires-skills: igrantio-individuals
---

# iGrant.io consent records (Consent BB individual API)

## When to use
When your app must **record and manage a user's consent** for a data agreement —
allow, read current state, withdraw, show history, or erase (right to be
forgotten). Assumes you already have the `individualId` (from
`igrantio-individuals`) and the `dataAgreementId` you are collecting consent for.

## Prerequisites
- `individualId` — the Consent BB individual for the user (see `igrantio-individuals`;
  resolve it **server-side** from your session/userId mapping).
- `dataAgreementId` — the data agreement to record consent against.
- Organisation API key — server-side only.

## API (Consent BB individual, base `/v2`)
Auth on every call: `Authorization: ApiKey <key>` **and**
`X-ConsentBB-IndividualId: <individualId>`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/v2/service/individual/record/data-agreement/{dataAgreementId}?revisionId=` | Record consent (first time) |
| GET | `/v2/service/individual/record/data-agreement/{dataAgreementId}` | Read consent for a data agreement |
| GET | `/v2/service/individual/record/consent-record?limit=&offset=` | List all the individual's records |
| PUT | `/v2/service/individual/record/consent-record/{consentRecordId}?individualId=&dataAgreementId=&revisionId=` | Update (allow/withdraw) |
| GET | `/v2/service/individual/record/consent-record/history?limit=&offset=` | Consent change history |
| DELETE | `/v2/service/individual/record` | Delete all records (right to be forgotten) |

Consent record fields: `id`, `dataAgreementId`, `individualId`, **`optIn`** (true=allow,
false=withdraw), `state` (`unsigned`|`signed`), `sectorPreferences[]`. Updating a
signed record invalidates its signature. (Signature/draft endpoints exist for PKI
flows; the reference covers the core opt-in lifecycle.)

## Reference
[`./references`](./references):
- `src/consentClient.ts` — dependency-free Consent BB client (`consentRecords.*`).
- `src/consent.ts` — `readConsent`, `setConsent`, `giveConsent`, `withdrawConsent`
  (create-or-update, so callers don't juggle first-time vs update).
- `src/consentRouter.ts` — Express router exposing clean endpoints; resolves
  `individualId` **server-side** via an `IndividualIdResolver` (never trusts the browser).
- `src/server.ts` — example wiring.

## Steps
1. `cd references && cp .env.example .env`; set `OWS_ENV`, `OWS_API_KEY`.
2. `npm install`.
3. Mount the router with your own resolver (session → userId → individualId):
   ```ts
   const client = createConsentClient({ owsBaseUrl: config.owsBaseUrl, apiKey: config.apiKey });
   app.use("/", consentRouter(client, (req) => mappingStore.getIndividualId(req.session.userId)));
   ```
4. Frontend calls `PUT /consents/:dataAgreementId { optIn }` to allow/withdraw,
   `GET /consents/:dataAgreementId` to read — no key or individualId in the browser.

## Clean-code notes
- `individualId` and the API key are injected server-side; the browser only sends
  the dataAgreementId and the opt-in choice.
- `setConsent` hides the create-vs-update branch; the client is the only place
  Consent BB paths live.

## Validation / done criteria
- `npm run typecheck` passes.
- `giveConsent` then `readConsent` returns `optIn: true`; `withdrawConsent` flips it
  to `false`; `history` shows the change.
- No API key or raw individualId is present in the browser.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- Consent management - individual API: https://docs.igrant.io/docs/category/consent-management-individual-api/organisation
- Consent management - admin API: https://docs.igrant.io/docs/category/consent-management-admin-api/data-agreement
