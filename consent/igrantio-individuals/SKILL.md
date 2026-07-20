---
name: igrantio-individuals
description: Onboard application users into the iGrant.io Consent Building Block as "individuals" and keep a mapping between your own userId and the returned individualId. Node/TypeScript backend for the Consent BB admin Individual API (create, read, update, list). Use when an application signs up users and must create a corresponding individual so GDPR consents can later be recorded against a data agreement. Pairs with igrantio-consent-records.
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: consent management, GDPR, data agreement, eIDAS2, EUDIW, user onboarding, personal data
  version: 2026.07.04
  api: https://docs.igrant.io/docs/category/consent-management-admin-api/individual
  auth: Organisation API key (Authorization "ApiKey <key>") - server-side only, never the browser
  requires-skills: igrantio-consent-records
---

# iGrant.io individuals (Consent BB admin Individual API)

## When to use
When your app onboards a user, create a matching **individual** in the iGrant.io
Consent Building Block and store the returned `individualId` against your own
`userId`. That mapping is what later lets `igrantio-consent-records` record and
manage consents for the right person.

## Integrator intake
Ask one question at a time, a recommended default with each; look up facts in
the project, put only decisions to the integrator:
1. **Environment** - demo (`https://demo-api.igrant.io`), staging, or a custom
   Consent BB deployment (ask its base URL)? _Recommend demo to start._
2. **API key** - organisation API key for the Consent Building Block? From
   your iGrant.io organisation account; server-side only, never the browser.
3. **Mapping storage** - where does the `userId` to `individualId` mapping
   live: a column on the existing users table (recommended) or a separate
   store?

## The mapping (the important part)
```
your users table          Consent BB
+----------+-------------+          +---------------------------+
| user_id  | individual  | <──────► | individual { id, ... }    |
|  u_123   |  6541...cd  |          | externalId = "u_123"      |
+----------+-------------+          +---------------------------+
```
Persist `individualId` in YOUR database keyed by your `userId`. The reference uses
`externalId = your userId` so the individual is also recoverable from OWS if the
local mapping is ever lost.

## API (Consent BB admin, base `/v2`, `Authorization: ApiKey <key>`)
| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/v2/config/individual` | Create individual → returns `individual.id` |
| GET | `/v2/config/individual/{id}` | Read individual |
| PUT | `/v2/config/individual/{id}` | Update individual |
| GET | `/v2/config/individuals?limit=&offset=&externalIndividualId=` | List (find by your userId) |

Individual fields: `name`, `email`, `phone` (required), `externalId`,
`externalIdType`, `identityProviderId`, `iamId`, `mapperId`, `deviceType`, …

## Reference
[`./references`](./references):
- `src/consentClient.ts` - dependency-free Consent BB client (`individuals.*` + `consentRecords.*`).
- `src/mappingStore.ts` - `IndividualMappingStore` (userId ↔ individualId); in-memory + DB-swappable.
- `src/onboarding.ts` - **`ensureIndividual(client, store, userId, profile)`**: idempotent (local mapping → lookup by externalId → create).
- `src/server.ts` - example onboarding endpoints (`POST /individuals/onboard`, `GET /individuals/me`).

## Steps
1. `cd references && cp .env.example .env`; set `OWS_ENV` (demo|staging), `OWS_API_KEY`.
2. `npm install`.
3. In your **authenticated** signup handler:
   ```ts
   const client = createConsentClient({ owsBaseUrl: config.owsBaseUrl, apiKey: config.apiKey });
   const individualId = await ensureIndividual(client, store, session.userId, { name, email, phone });
   // store.set already persisted userId -> individualId; save it in your users table too
   ```
   `userId` must come from your session - never from request input.

## Clean-code notes
- The client is the only place Consent BB paths live; onboarding logic is one
  idempotent function; the mapping store is an interface you back with your DB.
- The org API key stays server-side; browsers never call the Consent BB directly.

## Validation / done criteria
- `npm run typecheck` passes.
- Onboarding the same user twice returns the same `individualId` and creates one
  individual (idempotent).
- Your DB holds `userId → individualId` after onboarding.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- Consent management - individual API: https://docs.igrant.io/docs/category/consent-management-individual-api/organisation
- Consent management - admin API: https://docs.igrant.io/docs/category/consent-management-admin-api/data-agreement
