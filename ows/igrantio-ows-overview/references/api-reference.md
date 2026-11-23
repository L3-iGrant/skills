# OWS API reference - issuance, verification, config, webhooks

Endpoint, payload and response reference for the OWS OpenID4VC API, as the
building-block skills use it. Paths are relative to the API host of your
environment (see the overview skill). All calls authenticate with
`Authorization: ApiKey <key>` **from the tenant backend only**; the browser
calls the backend proxy path with no key. The `igrantio-api-*` skills give the
full API of each group.

Request bodies are strict: OWS answers `400 "<field>: unknown field"` for a
member that the operation does not know, and `400` for a value of the wrong
JSON type. Send only the fields below.

Legend: `{base}` = the API host. `{tenant}` = your tenant slug on the backend proxy.
Frontend base = `{backend}/ows/{tenant}` (see `igrantio-backend-proxy`).

---

## 1. Issuance (OpenID4VCI)

All issuer paths start with `/v4/config/ows/issuer`. The times are RFC 3339 in
UTC, and the enum values are snake_case. One issue call makes **one credential
offer** for all the credential configurations of the definition, and **one
issuance history** for each configuration. The id of an issuance history is
its **credential exchange id** (`credentialExchangeId`).

### 1.1 Issue a credential
```
POST {base}/v4/config/ows/issuer/issuance-history
Authorization: ApiKey <issuer-key>
Content-Type: application/json
```

Request body:

```jsonc
{
  "mode": "in_time",                       // required: "in_time" | "deferred"
  "credentialDefinitionId": "<uuid>",      // required (except with dataAgreementId)
  "credentials": [                          // the claims of each configuration, at most 20 entries
    {
      "credentialConfigurationId": "<id>", // required when the definition has more than one configuration
      // the claims, in the form of the format of the configuration:
      //   dc+sd-jwt: the claims as they are; mso_mdoc: { "<namespace>": { ... } };
      //   jwt_vc_json: { "credentialSubject": { ... } }
      "claims": { "given_name": "Erika", "family_name": "Mustermann" }
    }
  ],
  // optional fields:
  "preAuthorised": true,                    // pre-authorised code flow (default false: authorisation code flow)
  "transactionCode": { "length": 6, "inputMode": "numeric" },  // only with preAuthorised; add "value" to give the code, else the issuer makes one
  "presentationDefinitionId": "<id>",       // dynamic credential request: collect a presentation first (not with transactionCode)
  "transactionData": { ... },               // only with presentationDefinitionId
  "urlScheme": "openid-credential-offer://",  // default; the scheme of offer.uri ("haip://" is the other value)
  "individualId": "<id>"                    // push the offer to this individual (or "mapperId", not both)
}
```

There is no top-level `claims` member: it gets `400 "claims: unknown field"`.

`mode`:
- **`in_time`** - the claims are known now: send one `credentials` entry for
  each configuration. The wallet gets the finished credentials.
- **`deferred`** - make the *offer* now, give the claims later via §1.2.
  `credentials` is optional. Use it when you collect the claims after the
  offer, or behind a presentation (`presentationDefinitionId`, the "dynamic
  credential request").

**Response** `201`:

```json
{
  "offer": {
    "offerId": "2f6a9c1e-8b3d-4e5f-a1b2-c3d4e5f60718",
    "uri": "openid-credential-offer://?credential_offer_uri=https://oid4vc.igrant.io/organisation/<organisationId>/service/credential-offer/2f6a9c1e-8b3d-4e5f-a1b2-c3d4e5f60718",
    "offerUri": "https://oid4vc.igrant.io/organisation/<organisationId>/service/credential-offer/2f6a9c1e-8b3d-4e5f-a1b2-c3d4e5f60718",
    "preAuthorisedCode": "<pre-authorised code>",
    "transactionCode": "493021"
  },
  "issuanceHistory": [
    {
      "credentialExchangeId": "6b0f3d2a-5c1e-4b7a-9d3f-1e2a3b4c5d6e",
      "credentialConfigurationId": "ExampleMembershipCredentialQ7xK2pLm",
      "status": "offer_sent"
    }
  ],
  "createdAt": "2026-11-05T10:00:00Z"
}
```

Process these fields:

| Field | Use |
| --- | --- |
| `offer.uri` | `openid-credential-offer://...` URI → **render as QR / same-device deep link**. Its host is the wallet service of your environment. |
| `offer.offerId` | The id of the credential offer. Every issuance history of the call has it (`offerId` of the list and of the events). |
| `issuanceHistory[].credentialExchangeId` | One for each credential configuration, in the order of the definition: the **SSE correlation key** (`subject.id` of the issuer events) and the path id of §1.2 to §1.5. |
| `offer.transactionCode` | The transaction code that the issuer made: show it to the holder. Only in this answer; `null` without a code. |
| `offer.preAuthorisedCode` | Only in this answer; `null` without the pre-authorised code flow. |
| `issuanceHistory[].status` | `offer_sent`. The next statuses: `offer_retrieved` → `token_issued` → `credential_issued` (the wallet has the credential) → `credential_accepted` (the wallet confirmed it). Deferred: `credential_deferred` (the wallet waits for the claims) and `claims_supplied` after §1.2. Failure: `denied` or `expired`. The holder can later send `credential_deleted`. A revocation is not a status: it is `revokedAt`. |

### 1.2 Deferred issue - give the claims after the offer
```
PUT {base}/v4/config/ows/issuer/issuance-history/{credentialExchangeId}/claims
```
Body:
```jsonc
{ "claims": { ... } }   // the claims of this configuration, in the form of §1.1
```
Call it for each issuance history of a `deferred` offer, when the SSE /
webhook reports that the wallet has the offer (`offer_retrieved`,
`token_issued` or `credential_deferred`). Only a `deferred` issuance history
that waits for its claims takes it. For a dynamic credential request, the
presentation must be verified first. **Response** `200`: the detail of the
issuance history (§1.3) with `status: "claims_supplied"`.

### 1.3 Read an issuance history
```
GET {base}/v4/config/ows/issuer/issuance-history/{credentialExchangeId}[?include=claims]
```
**Response**: the detail of the issuance history. Key fields:
`credentialExchangeId`, `status`, `mode`, `format` (`jwt_vc_json` |
`dc+sd-jwt` | `mso_mdoc`), `deniedReason`, `offer` (`offerId`, `uri` while a
wallet can still use the offer), `authorisation.clientId` (the wallet),
`revocation` (`enabled`, `method`, `revokedAt`, `reason`), `latestCredential`,
`createdAt`, `updatedAt`, `issuedAt` (RFC 3339). `?include=claims` adds
`claims`. The list (`GET .../issuance-history`) gives cursor pages of summary
items; its filter `offerId` gives the issuance histories of one offer.

### 1.4 Delete an issuance history
```
DELETE {base}/v4/config/ows/issuer/issuance-history/{credentialExchangeId}
```
**Response** `204` with an empty body. The offer of this issuance history
stops. The other issuance histories of the same offer do not change.

### 1.5 Revoke an issuance history
```
POST {base}/v4/config/ows/issuer/issuance-history/{credentialExchangeId}/revocation
```
Body `{}` or `{ "reason": "..." }`. It revokes every issued credential of the
issuance history. A revocation is final. See `igrantio-api-issuer`.

---

## 2. Verification (OpenID4VP + DCQL)

### 2.1 Send a verification request
```
POST {base}/v4/config/ows/verifier/verifications
Authorization: ApiKey <verifier-key>
Content-Type: application/json
```

Request body:
```jsonc
{
  "presentationDefinitionId": "<id>",         // required - stored DCQL query / presentation definition
  "requestByReference": true,                 // default false; true puts a request_uri in requestUrl (a smaller QR code)
  // optional:
  "transactionData": { ... },                 // see below
  "nonce": "...",                             // the server makes a random one without it
  "urlPrefix": "openid4vp://",                // the start of requestUrl before "?" (default openid4vp://)
  "individualId": "<id>",                     // push the request to this individual (or "mapperId", not both)
  "hasSignatureStamp": true,                  // QES signing: visible signature stamp on the PDF
  "signatureCoordinate": [450, 780, 590, 840] // the stamp box on the page, in points: x1, y1, x2, y2
}
```

A signed request always goes by reference, so `requestByReference` changes
only an unsigned `redirect_uri` request. A DC API request does not use it.

**`transactionData`** - the wallet shows it alongside the presentation request
and signs over it (Strong Customer Authentication). The presentation definition
decides: when it sets `transactionDataDefinitionType`, the send must carry
matching transaction data; when it does not, OWS refuses transaction data.
Transaction data binds only to `dc+sd-jwt` credential queries. Exactly one key:

1. **Simple payment** (type `payment_data`):
   ```jsonc
   { "payment_data": { "payee": "Example Ferries AB", "currency_amount": { "currency": "EUR", "value": 10.0 } } }
   ```
   `value` is a number above 0. Optional `recurring_schedule`:
   `{ "start_date": "2026-06-01", "expiry_date": "2027-06-01", "frequency": 30 }`.
2. **EUDI SCA rulebook (TS12) payload** (types `payment`, `emandate`,
   `login_risk_transaction`, `account_access`) - send only the inner payload;
   OWS wraps it into the OpenID4VP `transaction_data` array entry (`type` urn,
   `credential_ids`, `transaction_data_hashes_alg`) for you. The family implies
   the `type` urn. Exact TypeScript models (`ScaPaymentPayload` etc.) are in
   the frontend skills' `lib/ows/types.ts`. `transaction_id` has at most 36
   characters; in a verification request OWS makes one when it is empty.
   Other top-level payload members are refused.

   **Payment** (`urn:eudi:sca:payment:1`) - card or account payment:
   ```jsonc
   {
     "payload": {
       "transaction_id": "txn-84729",                // required
       "date_time": "2026-05-05T15:30:00Z",          // optional, ISO 8601
       "payee": {                                    // required
         "name": "Example Travel AB",                //   required
         "id": "EX-000000-0001",                     //   required (organisation / merchant id)
         "logo": "https://travel.example.com/logo.png", "website": "https://travel.example.com"  //   optional
       },
       "pisp": {                                     // optional - account payment via a PISP
         "legal_name": "Example Payments SA", "brand_name": "Example Payments", "domain_name": "payments.example.com"
       },
       "execution_date": "2026-05-12",               // optional "yyyy-mm-dd"; "" = immediate, future = scheduled
       "currency": "SEK",                            // required, ISO 4217
       "amount": 1250,                               // required, number
       "amount_estimated": false,                    // optional
       "amount_earmarked": false,                    // optional
       "sct_inst": true,                             // optional - SEPA instant
       "recurrence": {                               // optional - ONLY for recurring payments
         "start_date": "2026-06-01",                 //   optional "yyyy-mm-dd"
         "end_date": "2027-06-01",                   //   optional
         "number": 12,                               //   optional occurrence count
         "frequency": "MNTH",                        //   required: INDA, DAIL, WEEK, TOWK, TWMN, MNTH, TOMN, QUTR, FOMN, SEMI, YEAR, TYEA
         "mit_options": {                            //   optional merchant-initiated-transaction limits
           "amount_variable": false, "min_amount": 0, "max_amount": 0,
           "total_amount": 15000, "initial_amount": 0, "initial_amount_number": 0, "apr": 0
         }
       }
     }
   }
   ```
   Omit `recurrence` entirely for one-off payments. Note `mit_options` nests
   **inside** `recurrence`.

   **E-mandate** (`urn:eudi:sca:emandate:1`) - SEPA direct debit / card MIT:
   ```jsonc
   {
     "payload": {
       "transaction_id": "mandate-998811",           // required
       "date_time": "2026-05-05T19:20:00Z",          // optional
       "start_date": "2026-06-01",                   // optional - mandate validity "yyyy-mm-dd"
       "end_date": "2027-06-01",                     // optional
       "reference_number": "MANDATE-EX-000001",      // optional, at most 50 characters
       "creditor_id": "EX00ZZZ000000001",            // optional, at most 50 characters
       "purpose": "Monthly travel subscription authorisation",  // optional, at most 1000 characters
       "payment_payload": { /* a full Payment payload (above) - recurrence populated for recurring mandates */ }
     }
   }
   ```

   **Login / risk transaction** (`urn:eudi:sca:login_risk_transaction:1`):
   ```jsonc
   {
     "payload": {
       "transaction_id": "login-abc123",             // required
       "date_time": "2026-05-05T18:05:00Z",          // optional
       "service": "Example Bank Online Banking",     // optional, at most 100 characters
       "action": "Change daily transaction limit from 1,000 SEK to 10,000 SEK"  // required, at most 140 characters
     }
   }
   ```

   **Account access / AISP** (`urn:eudi:sca:account_access:1`):
   ```jsonc
   {
     "payload": {
       "transaction_id": "aisp-445566",              // required
       "date_time": "2026-05-05T21:00:00Z",          // optional
       "aisp": { "legal_name": "Example Insurance AB", "brand_name": "Example Insurance", "domain_name": "insurance.example.com" },  // optional; all three names when present
       "description": "Read access to account balance and transaction history."  // optional, at most 140 characters
     }
   }
   ```
3. **QES document signing** (type `qes_data`) - the wallet signs the linked
   document. Upload the PDF with
   `POST {base}/v4/config/ows/verifier/files` and use
   its `fileExternalLink`:
   ```jsonc
   { "qes_data": { "type": "pdf", "external_link": "<fileExternalLink>" } }   // optional "hash"
   ```

**Response** `200` (`{ "verificationHistory": VerificationHistoryItem }`) - process these fields:

| Field | Use |
| --- | --- |
| `verificationHistory.presentationExchangeId` | **SSE correlation key** - open SSE on this. `id` holds the same value. |
| `verificationHistory.requestUrl` | `openid4vp://...` Authorization Request URL → **render as QR / same-device deep link**. Empty for a Digital Credentials API request. |
| `verificationHistory.status` | `request_sent` → `request_received` → `presentation_acked`. |
| `verificationHistory.dcApiRequest` / `dcApiProtocol` | Only when the presentation definition uses a `dc_api` or `dc_api.jwt` response mode, or the version `iso18013_7_annex_c` (same-device **Digital Credentials API**, see `igrantio-verifier-frontend`). `dcApiRequest.chrome` (Chromium) or `dcApiRequest.safari` (Safari) is the argument of `navigator.credentials.get()`. `dcApiProtocol`: `openid4vp-v1-signed` \| `openid4vp-v1-unsigned` \| `org-iso-mdoc`. |

### 2.2 Read a verification
```
GET {base}/v4/config/ows/verifier/verifications/{verificationId}
```
`{verificationId}` is the `presentationExchangeId` of §2.1.
**Response**: `{ "verificationHistory": VerificationHistoryItem }`. Key fields to process:

| Field | Meaning |
| --- | --- |
| `isVerified` | **boolean - the accept/reject decision.** `true` when every check passed: the signatures, the holder binding, the validity and revocation of each credential, the match with the DCQL query, the transaction data, and the trust rule of each credential query. |
| `presentation` | `object[]` - the **decoded credentials**, with only the claims that the request asked for (`presentation[0]` = the first credential). `null` until the wallet answers. |
| `vpToken` | `string[]` - the VP Token as the verifier keeps it. `null` until the wallet answers. |
| `presentationValidity` | `[{ "validatedAt": ..., "<credential query id>": { "isVerified", "isExpired", "isRevoked", "noMissingData", "errors", "credentialSignerTrustedListCheck", ... } }]` - the checks of each credential, with the trusted list check of its issuer (`credentialSignerTrustedListCheck.result`: `trusted`, `not_trusted`, `not_found`, `not_applicable` or `error`). |
| `status` | `request_sent` \| `request_received` \| `presentation_acked`. A wallet error response (for example the holder declined) also ends in `presentation_acked`, with `isVerified` `false`. |
| `holder.name` | subject/holder. |

Accept the presentation only when `isVerified === true`. When the request
carried `transactionData`, the check of the transaction data hashes in the Key
Binding JWT is part of `isVerified`. `POST .../verifications/{verificationId}/revalidation`
checks a finished exchange again (for example after a revocation); see
`igrantio-api-verifier`.

### 2.3 Post a Digital Credentials API response
```
POST {base}/v4/config/ows/verifier/verifications/{verificationId}/response
```
Body: `{ "response": "<string>" }` (the JWE of `dc_api.jwt`, the JSON text of
a `dc_api` response, or the base64url encrypted response of `org-iso-mdoc`),
or `{ "vp_token": { ... } }` (the parsed VP Token of a `dc_api` response).
OWS checks the presentation and sends the usual webhook event. The answer is
the stored record in another shape than §2.2: read the verification for the
documented shape. A request takes one response.

### 2.4 Delete a verification
```
DELETE {base}/v4/config/ows/verifier/verifications/{verificationId}
```
**Response** `200` with an empty body.

---

## 3. Config (one-time setup, tenant backend or admin console)

These are typically created once per organisation in the iGrant.io dashboard
or with a setup script; the frontend never calls them.

- **Credential definition** (issuer config) -
  `POST {base}/v4/config/ows/issuer/credential-definitions`. Body: `label`
  (unique in the organisation), `version: "version_01"` and
  `credentialConfigurations[]`; each configuration has its
  `credentialFormat`, its type (`vct`, `doctype` or `type`), its `claims`, and
  its signing key (`cryptographicKeyFormat: "x509"` and
  `cryptographicKeyIdentifier`, a key with a certificate chain). Yields the
  `credentialDefinitionId` and the `credentialConfigurationId` values used in
  §1.1. A second create with the same `label` gets `400`: change the label, or
  reuse the id of the first run. See `igrantio-api-issuer`.
- **Presentation definition** (verifier config / DCQL) -
  `POST {base}/v4/config/ows/verifier/presentation-definitions`,
  list via `GET .../presentation-definitions`, delete via
  `DELETE .../presentation-definitions/{presentationDefinitionId}`.
  Body: `label` (unique in the organisation), `version: "version_01"`,
  `cryptographicKeyIdentifier` (a key with a certificate chain), and a
  `dcqlQuery` (`credentials[]` with `id`, `format`, `meta.vct_values` or
  `meta.doctype_value`, `claims[].path`). Optional:
  `transactionDataDefinitionType` (§2.1), `responseMode` (`dc_api` /
  `dc_api.jwt` for the Digital Credentials API), `credentialQueryOptions` (the
  trust rule of each credential query). Yields the `presentationDefinitionId`
  used in §2.1. See `igrantio-api-verifier`.
- **Webhook** - see §4 and the `igrantio-backend-webhooks` skill.

---

## 4. Webhooks

### 4.1 Register a webhook (idempotent)
```
POST {base}/v4/config/platform/webhook
Authorization: ApiKey <org-key>
Content-Type: application/json
```
```jsonc
{
  "webhook": {
    "payloadUrl": "https://your-backend.example.com/webhook",   // your receiver, http(s)
    "contentType": "application/json",                         // the only content type
    "subscribedEvents": {
      "digitalWalletWebhook": [
        "ows.issuer.issuance_history.offer_retrieved",
        "ows.issuer.issuance_history.token_issued",
        "ows.issuer.issuance_history.credential_deferred",
        "ows.issuer.issuance_history.credential_issued",
        "ows.issuer.issuance_history.credential_accepted",
        "ows.issuer.issuance_history.denied",
        "ows.issuer.issuance_history.expired",
        "ows.verifier.verification.request_retrieved",
        "ows.verifier.verification.presentation_received",
        "ows.verifier.verification.declined"
      ]
    },
    "disabled": false,
    "secretKey": "<shared HMAC secret>",     // MUST match the backend's WEBHOOK_SECRET_KEY
    "skipSslVerification": false
  }
}
```
**Response** `200`: `{ "webhook": { ... } }`, the created webhook with `id`,
`orgId` and `timestamp`. The answer holds `secretKey` in clear text: do not
log it. OWS answers `400` for an unknown event type and for a `payloadUrl`
that another webhook has, `400` (`service_not_installed`) or `403`
(`feature_disabled`) for an event type that the organisation cannot use, and
`409` at the limit of 50 webhooks.
`GET {base}/v4/config/platform/webhooks/event-types` lists the event types
that the organisation can subscribe to (`{"eventTypes": [{"type",
"description", "schemaVersion", "feature"}]}`).

### 4.2 List webhooks (for idempotency - "don't create if exists")
```
GET {base}/v4/config/platform/webhooks?offset=0&limit=100
Authorization: ApiKey <org-key>
```
**Response**: `{ "webhooks": [ ... ], "pagination": { ... } }`. An
organisation has at most 50 webhooks, so one page of 100 holds them all.
Before you register, list and skip if a webhook with the same `payloadUrl`
already exists. See `igrantio-backend-webhooks` for the idempotent register
routine.

### 4.3 Webhook delivery → your receiver
OWS `POST`s to your `payloadUrl`:

Headers:
```
Content-Type: application/json
X-IGrant-Event-Id: <id of the body>
X-IGrant-Event-Type: <type of the body>
X-IGrant-Webhook-Id: <webhook id>
X-IGrant-Delivery-Id: <delivery id>
X-IGrant-Delivery-Attempt: <1 to 7>
X-IGrant-Signature: t=<Unix seconds>,v1=<hex hmac-sha256>
```
Signature: `v1 = HMAC_SHA256(secretKey, "<t>." + <the exact body bytes>)`,
hex-encoded; compare in constant time, over the raw bytes (do not encode the
JSON again). Refuse a `t` more than 5 minutes from your clock.

Body (the event; the same for each attempt):
```jsonc
{
  "id": "<event id>",                            // remove duplicates with it
  "type": "ows.issuer.issuance_history.credential_issued",
  "schemaVersion": 1,
  "occurredAt": "2026-11-05T08:00:00Z",
  "organisationId": "...",
  "sandboxOrganisationId": null,
  "subject": { "type": "issuance_history", "id": "<credential exchange id>", "sequence": 4 },
  "data": {
    "issuanceHistory": { "credentialExchangeId": "...", "offerId": "...", "status": "credential_issued", ... },
    "credential": { ... }
  }
}
```
`data.issuanceHistory` is the summary of the issuance history (the list item:
`credentialExchangeId`, `credentialDefinitionId`, `credentialConfigurationId`,
`offerId`, `status`, ...); `data.verification` is the summary of the
verification (`id` = the presentationExchangeId, `status`, `isVerified`, ...).
The body holds no claims, tokens or presentation content.
Answer 2xx in 10 seconds: another answer makes OWS try again after 1 min,
5 min, 30 min, 2 h, 6 h and 24 h (7 attempts). A refusal (400, 401, 403, 404,
405, 413, 415, 422) and 410 get no retry, and 410 pauses the webhook; a 429 or
503 with `Retry-After` can move the next attempt later. A webhook with many
failed attempts is paused and gets no events until you resume it (see
`igrantio-api-webhooks`). For one webhook and one resource, the events come in
the order of `subject.sequence`; a gap is possible.

### 4.4 Event type → resource id
The **resource id** of each event is `subject.id`; it is the SSE key that you
store the event under:

| Event type (`type`) | `subject.id` | Flow |
| --- | --- | --- |
| `ows.issuer.issuance_history.offer_retrieved` | credential exchange id | issuance: the wallet has the offer (deferred: give the claims now) |
| `ows.issuer.issuance_history.token_issued` | credential exchange id | issuance: access token issued (deferred: give the claims now) |
| `ows.issuer.issuance_history.credential_deferred` | credential exchange id | issuance: the wallet waits for the claims of a deferred issuance history |
| `ows.issuer.issuance_history.credential_issued` | credential exchange id | issuance (complete: the wallet has the credential) |
| `ows.issuer.issuance_history.credential_accepted` | credential exchange id | issuance (complete: the wallet confirmed it) |
| `ows.issuer.issuance_history.denied` / `expired` | credential exchange id | issuance (failed; `data.reason` on `denied`) |
| `ows.verifier.verification.request_retrieved` | presentationExchangeId | verification: the wallet fetched the request |
| `ows.verifier.verification.presentation_received` | presentationExchangeId | verification (complete; `data.verification.isVerified`) |
| `ows.verifier.verification.declined` | presentationExchangeId | verification (the holder declined or the wallet answered with an error; `data.reason`) |

`igrantio-api-webhooks` lists all the event types and the extra `data` of
each.

### 4.5 SSE event shape (what the browser receives)
The backend re-emits each stored event to the browser as one SSE `data:` line
(JSON): the webhook event body plus `receivedAt`:

```jsonc
{
  "id": "<event id>",
  "type": "ows.verifier.verification.presentation_received",
  "subject": { "type": "verification", "id": "<presentationExchangeId>", "sequence": 3 },
  "data": {
    // verification:
    "verification": { "id": "...", "status": "presentation_acked", "isVerified": true, ... }
    // OR issuance history:
    // "issuanceHistory": { "credentialExchangeId": "...", "status": "credential_issued" | "offer_retrieved" | ..., ... }
  },
  "receivedAt": "..."
}
```

Frontend processing:
- **Issuance done** when `data.issuanceHistory.status` is `credential_issued`
  or `credential_accepted` for **every** issuance history of the offer;
  **failed** when one is `denied` or `expired`.
- **Verification done** on `ows.verifier.verification.presentation_received`:
  read the verification (§2.2) for the disclosed claims (`presentation`) and
  the decision (`isVerified`). **Rejected** on
  `ows.verifier.verification.declined`.

---

## 5. Client call summary (frontend, via backend proxy)

Using `createOwsClient({ baseUrl })` from `igrantio-frontend-client`, where
`baseUrl = {backend}/ows/{tenant}` and no API key is set (the proxy injects it):

```ts
client.issuanceHistory.issue(payload)                   // POST   .../issuer/issuance-history
client.issuanceHistory.supplyClaims(id, { claims })     // PUT    .../issuer/issuance-history/{credentialExchangeId}/claims
client.issuanceHistory.read(id)                         // GET    .../issuer/issuance-history/{credentialExchangeId}
client.issuanceHistory.delete(id)                       // DELETE .../issuer/issuance-history/{credentialExchangeId}
client.verification.sendRequest(payload)                // POST   .../verifier/verifications
client.verification.readHistory(exId)                   // GET    .../verifier/verifications/{presentationExchangeId}
client.verification.receiveDcApiResponse(exId, body)    // POST   .../verifier/verifications/{presentationExchangeId}/response
client.verification.deleteHistory(exId)                 // DELETE .../verifier/verifications/{presentationExchangeId}
```
