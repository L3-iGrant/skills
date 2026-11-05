# OWS API reference - issuance, verification, config, webhooks

Endpoint, payload and response reference for the OWS OpenID4VC API. Paths are
relative to the OWS base URL (see the overview skill for environments). All
calls authenticate with `Authorization: ApiKey <key>` **from the tenant backend
only**; the browser calls the backend proxy path with no key.

Request bodies are strict: OWS answers `400 "<field>: unknown field"` for a
member that the operation does not know, and `400` for a value of the wrong
JSON type. Send only the fields below.

Legend: `{base}` = OWS base URL. `{tenant}` = your tenant slug on the backend proxy.
Frontend base = `{backend}/ows/{tenant}` (see `igrantio-backend-proxy`).

---

## 1. Issuance (OpenID4VCI)

All issuer paths start with `/v4/config/ows/issuer`. The times are RFC 3339 in
UTC, and the enum values are snake_case. One issuance has one credential
configuration.

### 1.1 Make an issuance
```
POST {base}/v4/config/ows/issuer/issuances
Authorization: ApiKey <issuer-key>
Content-Type: application/json
```

Request body:

```jsonc
{
  "mode": "in_time",                       // required: "in_time" | "deferred"
  "credentialDefinitionId": "<uuid>",      // required - stored issuer config
  "credentialConfigurationId": "<id>",     // required when the definition has more than one configuration
  // the claims, in the form of the format of the configuration:
  //   dc+sd-jwt: the claims as they are; mso_mdoc: { "<namespace>": { … } };
  //   jwt_vc_json: { "credentialSubject": { … } }
  "claims": { "given_name": "Erika" },     // required for in_time
  // optional fields:
  "preAuthorised": true,                    // pre-authorised code flow (default false: authorisation code flow)
  "transactionCode": { "length": 6, "inputMode": "numeric" },  // only with preAuthorised; the issuer makes the code
  "presentationDefinitionId": "<id>",       // "dynamic" issuance: collect a presentation first (not with transactionCode)
  "transactionData": { … },                 // only with presentationDefinitionId; variants in §2.1
  "urlScheme": "openid-credential-offer://",  // default; the scheme of offer.uri
  "individualId": "<id>"                    // push the offer to this individual (or "mapperId", not both)
}
```

`mode`:
- **`in_time`** - claims are known now; send `claims`. The wallet gets the
  finished credential.
- **`deferred`** - make the *offer* now, give the claims later via §1.2. Use
  when claims are collected after the offer, or gated behind a presentation
  (`presentationDefinitionId` → "dynamic credential request").

**Response** `201`. Process these fields:

| Field | Use |
| --- | --- |
| `id` | The issuance id: **SSE correlation key** (`subject.id` of the issuer events). |
| `offer.uri` | `openid-credential-offer://…` URI → **render as QR / same-device deep link**. |
| `offer.transactionCode` | The transaction code that the issuer made: show it to the holder. Only in this answer; `null` without a code. |
| `offer.preAuthorisedCode` | Only in this answer; `null` without the pre-authorised code flow. |
| `status` | `created`. The next statuses: `offer_retrieved` → `token_issued` → `credential_issued` (the wallet has the credential) → `credential_accepted` (the wallet confirmed it). Deferred: `credential_deferred` (the wallet waits for the claims) and `claims_supplied` after §1.2. Failure: `denied` or `expired`. The holder can later send `credential_deleted`. |

### 1.2 Deferred issue - give the claims after the offer
```
PUT {base}/v4/config/ows/issuer/issuances/{issuanceId}/claims
```
Body:
```jsonc
{ "claims": { … } }   // the form of §1.1
```
Call this when the SSE / webhook reports that the wallet has the offer
(`offer_retrieved`, `token_issued` or `credential_deferred`) for a `deferred`
issuance. Only a `deferred` issuance takes it. For dynamic issuance the
presentation must be verified first. **Response** `200`: the detail of the
issuance (§1.3) with `status: "claims_supplied"`.

### 1.3 Read an issuance
```
GET {base}/v4/config/ows/issuer/issuances/{issuanceId}[?include=claims]
```
**Response**: the detail of the issuance. Key fields: `status`, `mode`,
`format` (`jwt_vc_json` | `dc+sd-jwt` | `mso_mdoc`), `deniedReason`,
`holder.name`, `offer.uri` (while a wallet can still use the offer),
`revocation` (`enabled`, `method`, `revokedAt`, `reason`), `latestCredential`,
`createdAt`, `updatedAt`, `issuedAt` (RFC 3339). `?include=claims` adds
`claims`. The list (`GET …/issuances`) gives cursor pages of summary items.

### 1.4 Delete an issuance
```
DELETE {base}/v4/config/ows/issuer/issuances/{issuanceId}
```
**Response** `204` with an empty body. The offer stops.

### 1.5 Revoke an issuance
```
POST {base}/v4/config/ows/issuer/issuances/{issuanceId}/revocation
```
Body `{}` or `{ "reason": "…" }`. It revokes every issued credential of the
issuance. A revocation is final. See `igrantio-api-issuer`.

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
  "requestByReference": true,                 // request object served by reference (recommended; default false)
  // optional:
  "transactionData": { … },                   // see below
  "nonce": "…",
  "individualId": "<id>",                     // push the request to this individual (or "mapperId", not both)
  "signatureStamp": true,                     // QES signing: visible signature stamp on the PDF
  "signatureCoordinate": [450, 780, 590, 840] // the stamp box on the page: x1, y1, x2, y2
}
```

**`transactionData`** - the wallet shows it alongside the presentation request
and signs over it (Strong Customer Authentication). The presentation definition
decides: when it sets `transactionDataDefinitionType`, the send must carry
matching transaction data; when it does not, OWS refuses transaction data.
Transaction data binds only to `dc+sd-jwt` credential queries. Exactly one key:

1. **Simple payment** (type `payment_data`):
   ```jsonc
   { "payment_data": { "payee": "Fast ferries", "currency_amount": { "currency": "EUR", "value": 10.0 } } }
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
         "name": "Travel Company",                   //   required
         "id": "SE556789-5678",                      //   required (organisation / merchant id)
         "logo": "https://…", "website": "https://…" //   optional
       },
       "pisp": {                                     // optional - account payment via a PISP
         "legal_name": "Worldline SA", "brand_name": "Worldline", "domain_name": "worldline.com"
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
       "reference_number": "MANDATE-FF-555888",      // optional, at most 50 characters
       "creditor_id": "SE903289-1935",               // optional, at most 50 characters
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
       "service": "Piggy Bank Online Banking",       // optional, at most 100 characters
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
       "aisp": { "legal_name": "Insurance Company AB", "brand_name": "Insurance Company", "domain_name": "insurancecompany.se" },  // optional; all three names when present
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
| `verificationHistory.presentationExchangeId` | **SSE correlation key** - open SSE on this. |
| `verificationHistory.vpTokenQrCode` | `openid4vp://…` URI → **render as QR / same-device deep link**. Empty for a Digital Credentials API request. |
| `verificationHistory.status` | `request_sent` → `request_received` → `presentation_acked`. |
| `verificationHistory.dcApiRequest` / `dcApiProtocol` | present when the presentation definition uses a `dc_api` response mode (same-device **Digital Credentials API**, see `igrantio-verifier-frontend`). `dcApiProtocol`: `openid4vp-v1-signed` \| `openid4vp-v1-unsigned` \| `org-iso-mdoc`. |

### 2.2 Read a verification
```
GET {base}/v4/config/ows/verifier/verifications/{verificationId}
```
`{verificationId}` is the `presentationExchangeId` of §2.1.
**Response**: `{ "verificationHistory": VerificationHistoryItem }`. Key fields to process:

| Field | Meaning |
| --- | --- |
| `verified` | **boolean - the accept/reject decision.** |
| `vpTokenResponse` | `string[]` - non-empty once the wallet has responded (`null` before). |
| `presentation` | `object[]` - the **disclosed claims** (`presentation[0]` = first credential's claims). |
| `presentationSubmission` | maps disclosed credentials to the DCQL query. |
| `presentationValidity` | `[{ "validatedAt": …, "<credential query id>": { "isVerified", "keyBinding", "issuerTrustServiceProvider", … } }]` - the checks per credential, with the issuer trust result. |
| `status` | `request_sent` \| `request_received` \| `presentation_acked`. |
| `holder.name` | subject/holder. |

Accept the presentation only when `verified === true` (and, per your trust
rules, `presentationValidity` passes). If the request carried
`transactionData`, the wallet's key-binding JWT (last segment of each
`vpTokenResponse` entry) includes `transaction_data_hashes` +
`transaction_data_hashes_alg`; verify the hash matches the transaction data
you sent.

### 2.3 Post a Digital Credentials API response
```
POST {base}/v4/config/ows/verifier/verifications/{verificationId}/response
```
Body: `{ "response": "<wallet data>" }` (OpenID4VP: the data as the wallet
returned it; `org-iso-mdoc`: the base64url EncryptedResponse), or
`{ "vp_token": { … } }` for an unencrypted OpenID4VP answer. OWS verifies the
presentation and sends the usual webhook event.

### 2.4 Delete a verification
```
DELETE {base}/v4/config/ows/verifier/verifications/{verificationId}
```
**Response** `200` with an empty body.

---

## 3. Config (one-time setup, tenant backend or admin console)

These are typically created once per organisation via the OWS business console or a
setup script; the frontend never calls them.

- **Credential definition** (issuer config) - defines a credential type/format the
  issuer can issue; yields the `credentialDefinitionId` used in §1.1.
- **Presentation definition** (verifier config / DCQL) -
  `POST {base}/v4/config/ows/verifier/presentation-definitions`,
  list via `GET …/presentation-definitions`, delete via
  `DELETE …/presentation-definitions/{presentationDefinitionId}`.
  Body: `label`, `version: "version_01"`, `cryptographicKeyFormat: "x509"`
  (a key with a certificate chain), and a `dcqlQuery` (`credentials[]` with
  `id`, `format`, `meta.vct_values` or `meta.doctype_value`, `claims[].path`).
  Optional: `transactionDataDefinitionType` (§2.1), `responseMode`
  (`dc_api` / `dc_api.jwt` for the Digital Credentials API). Yields the
  `presentationDefinitionId` used in §2.1.
- **Webhook** - see §4 and the `igrantio-backend-webhooks` skill.

---

## 4. Webhooks

### 4.1 Register a webhook (idempotent)
```
POST {base}/v2/config/webhook
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
        "ows.issuer.issuance.offer_retrieved",
        "ows.issuer.issuance.token_issued",
        "ows.issuer.issuance.credential_deferred",
        "ows.issuer.issuance.credential_issued",
        "ows.issuer.issuance.credential_accepted",
        "ows.issuer.issuance.denied",
        "ows.issuer.issuance.expired",
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
**Response** `200`: `{ "webhook": { … } }`, the created webhook with `id`,
`orgId` and `timestamp`. OWS answers `400` for an unknown event type and for a
`payloadUrl` that already has a webhook. `GET {base}/v2/config/webhooks/event-types`
lists every event type with its description.

### 4.2 List webhooks (for idempotency - "don't create if exists")
```
GET {base}/v2/config/webhooks?limit=10&offset=0
Authorization: ApiKey <org-key>
```
**Response**: `{ "webhooks": [ … ], "pagination": { … } }`.
Before registering, list and skip if a webhook with the same `payloadUrl` already
exists. See `igrantio-backend-webhooks` for the idempotent register routine.

### 4.3 Webhook delivery → your receiver
OWS `POST`s to your `payloadUrl`:

Headers:
```
Content-Type: application/json
X-IGrant-Event-Id: <id of the body>
X-IGrant-Event-Type: <type of the body>
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
  "type": "ows.issuer.issuance.credential_issued",
  "schemaVersion": 1,
  "occurredAt": "2026-11-05T08:00:00Z",
  "organisationId": "…",
  "sandboxOrganisationId": null,
  "subject": { "type": "issuance", "id": "<issuance id>", "sequence": 4 },
  "data": { "issuance": { "id": "…", "status": "credential_issued", … }, "credential": { … } }
}
```
`data.issuance` is the summary of the issuance (the issuance list item);
`data.verification` is the summary of the verification (`id`, `status`,
`isVerified`, …). The body holds no claims, tokens or presentation content.
Answer 2xx in 10 seconds: any other answer makes OWS try again after 1 min,
5 min, 30 min, 2 h, 6 h and 24 h. For one resource, the events come in the
order of `subject.sequence`.

### 4.4 Event type → resource id
The **resource id** of each event is `subject.id`; it is the SSE key that you
store the event under:

| Event type (`type`) | `subject.id` | Flow |
| --- | --- | --- |
| `ows.issuer.issuance.offer_retrieved` | issuance id | issuance: the wallet has the offer (deferred: give the claims now) |
| `ows.issuer.issuance.token_issued` | issuance id | issuance: access token issued (deferred: give the claims now) |
| `ows.issuer.issuance.credential_deferred` | issuance id | issuance: the wallet waits for the claims of a deferred issuance |
| `ows.issuer.issuance.credential_issued` | issuance id | issuance (complete: the wallet has the credential) |
| `ows.issuer.issuance.credential_accepted` | issuance id | issuance (complete: the wallet confirmed it) |
| `ows.issuer.issuance.denied` / `expired` | issuance id | issuance (failed; `data.reason` on `denied`) |
| `ows.verifier.verification.presentation_received` | verification id (`presentationExchangeId`) | verification (complete; `data.verification.isVerified`) |
| `ows.verifier.verification.declined` | verification id | verification (the holder declined; `data.reason`) |

### 4.5 SSE event shape (what the browser receives)
The backend re-emits the stored event to the browser as one SSE `data:` line
(JSON): the webhook event body plus `receivedAt`:

```jsonc
{
  "id": "<event id>",
  "type": "ows.verifier.verification.presentation_received",
  "subject": { "type": "verification", "id": "<presentationExchangeId>", "sequence": 3 },
  "data": {
    // verification:
    "verification": { "id": "…", "status": "presentation_acked", "isVerified": true, … }
    // OR issuance:
    // "issuance": { "id": "…", "status": "credential_issued" | "offer_retrieved" | …, … }
  },
  "receivedAt": "…"
}
```

Frontend processing:
- **Issuance done** when `data.issuance.status ∈ { "credential_issued", "credential_accepted" }`;
  **failed** when it is `denied` or `expired`.
- **Verification done** on `ows.verifier.verification.presentation_received`:
  read the verification (§2.2) for the disclosed claims
  (`presentation[0]`) and the decision (`verified`). **Rejected** on
  `ows.verifier.verification.declined`.

---

## 5. Client call summary (frontend, via backend proxy)

Using `createOwsClient({ baseUrl })` from `igrantio-frontend-client`, where
`baseUrl = {backend}/ows/{tenant}` and no API key is set (the proxy injects it):

```ts
client.issuance.create(payload)                         // POST   …/issuer/issuances
client.issuance.supplyClaims(id, { claims })            // PUT    …/issuer/issuances/{id}/claims
client.issuance.read(id)                                // GET    …/issuer/issuances/{id}
client.issuance.delete(id)                              // DELETE …/issuer/issuances/{id}
client.verification.sendRequest(payload)                // POST   …/verifier/verifications
client.verification.readHistory(exId)                   // GET    …/verifier/verifications/{exId}
client.verification.receiveDcApiResponse(exId, body)    // POST   …/verifier/verifications/{exId}/response
client.verification.deleteHistory(exId)                 // DELETE …/verifier/verifications/{exId}
```
