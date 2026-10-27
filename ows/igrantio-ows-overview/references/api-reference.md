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

### 1.1 Issue a credential
```
POST {base}/v2/config/digital-wallet/openid/sdjwt/credential/issue
Authorization: ApiKey <issuer-key>
Content-Type: application/json
```

Request body:

```jsonc
{
  "issuanceMode": "InTime",              // required: "InTime" | "Deferred"
  "credentialDefinitionId": "<uuid>",    // required - stored issuer config
  // the claims (format depends on the credential definition), one of:
  "credential": {
    "claims": { /* SD-JWT VC / mdoc claims, or namespaced e.g. "org.iso.18013.5.1": {…} */ }
    // W3C form instead: "credentialSubject": { … }
  },
  // for a definition with more than one credential configuration:
  "credentials": [ { "id": "<credential configuration id>", "claims": { … } } ],  // id required
  // optional fields:
  "userPin": "1234",                      // transaction code, 4-12 characters; selects the pre-authorised code flow
  "isPreAuthorised": true,                // pre-authorised code flow without a transaction code
  "presentationDefinitionId": "<id>",     // "dynamic" issuance: collect a presentation first (not with userPin)
  "transactionData": { … },               // only with presentationDefinitionId; variants in §2.1
  "urlScheme": "openid-credential-offer://",  // default; the scheme of credentialOffer
  "individualId": "<id>"                  // push the offer to this individual (or "mapperId", not both)
}
```

Without `userPin` and `isPreAuthorised` the offer uses the authorization code
flow.

`issuanceMode`:
- **`InTime`** - claims are known now; provide `credential.claims`. Wallet gets the finished credential.
- **`Deferred`** - issue the *offer* now, provide the claims later via §1.2. Use when
  claims are collected after the offer, or gated behind a presentation
  (`presentationDefinitionId` → "dynamic credential request").

**Response** `200`: `{ "credentialHistory": CredentialHistoryItem }`, or an
array of items when the definition has more than one credential configuration
(one record per configuration). Process these fields:

| Field | Use |
| --- | --- |
| `credentialHistory.CredentialExchangeId` | **SSE correlation key** - open SSE on this. |
| `credentialHistory.credentialOffer` | `openid-credential-offer://…` URI → **render as QR / same-device deep link**. |
| `credentialHistory.credentialStatus` | `"pending"` \| `"ready"`. |
| `credentialHistory.status` | `offer_sent` → `offer_received` → `token_issued` → `credential_acked` (the wallet has the credential) → `credential_accepted` (the wallet confirmed it). Deferred: `credential_issued` after §1.2. Failure: `issuance_denied` (reason in `issuanceDeniedReason`). The holder can later send `credential_deleted`. |
| `credentialHistory.credential.id` | the credential configuration id; send it back in §1.2. |
| `credentialHistory.presentationExchangeId` | present for dynamic (presentation-gated) issuance. |

### 1.2 Deferred issue - supply claims after the offer
```
PUT {base}/v2/config/digital-wallet/openid/sdjwt/credential/history/{CredentialExchangeId}
```
Body:
```jsonc
{ "credential": { "claims": { … }, "id": "<credentialHistory.credential.id from the offer>" } }
// W3C form: { "credential": { "credentialSubject": { … }, "id": "<…>" } }
```
Call this when the SSE / webhook reports that the wallet has the offer
(`offer_received` or `token_issued`) for a `Deferred` issuance. The record
must still be `credentialStatus: "pending"`. **`credential.id` is required**:
echo back `credentialHistory.credential.id` from the §1.1 response, or OWS
returns `400 "Id field is missing in credential"` and the claims are never
delivered. For dynamic issuance the presentation must be verified first.
**Response** `200`: `{ "credentialHistory": CredentialHistoryItem }` with
`status: "credential_issued"`.

### 1.3 Read credential history
```
GET {base}/v2/config/digital-wallet/openid/sdjwt/credential/history/{CredentialExchangeId}
```
**Response**: `{ "credentialHistory": CredentialHistoryItem }`. Key fields on the item:
`status`, `credentialStatus`, `credential.credentialSubject`/`claims`, `holder.name`,
`credentialFormat` (`jwt_vc_json` | `dc+sd-jwt` | `mso_mdoc`), `revocationStatus`
(`Operational` | `Revoked` | `Suspended`), `issuanceDeniedReason`, `disclosureMapping`,
`createdAt`, `updatedAt` (Unix seconds).

### 1.4 Delete credential history
```
DELETE {base}/v2/config/digital-wallet/openid/sdjwt/credential/history/{CredentialExchangeId}
```
**Response** `200` with an empty body.

---

## 2. Verification (OpenID4VP + DCQL)

### 2.1 Send a verification request
```
POST {base}/v3/config/digital-wallet/openid/sdjwt/verification/send
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
   `POST {base}/v2/config/digital-wallet/openid/verifier/file/upload` and use
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

### 2.2 Read verification history
```
GET {base}/v3/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}
```
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
POST {base}/v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}/receive
```
Body: `{ "response": "<wallet data>" }` (OpenID4VP: the data as the wallet
returned it; `org-iso-mdoc`: the base64url EncryptedResponse), or
`{ "vp_token": { … } }` for an unencrypted OpenID4VP answer. OWS verifies the
presentation and sends the usual webhook.

### 2.4 Delete verification history
```
DELETE {base}/v2/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}
```
**Response** `200` with an empty body. There is no v3 delete.

---

## 3. Config (one-time setup, tenant backend or admin console)

These are typically created once per organisation via the OWS business console or a
setup script; the frontend never calls them.

- **Credential definition** (issuer config) - defines a credential type/format the
  issuer can issue; yields the `credentialDefinitionId` used in §1.1.
- **Presentation definition** (verifier config / DCQL) -
  `POST {base}/v2/config/digital-wallet/openid/sdjwt/presentation-definition`,
  list via `…/presentation-definitions`, delete via `…/presentation-definition/{id}`.
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
    "contentType": "application/json",
    "subscribedEvents": {
      "digitalWalletWebhook": [
        "openid.credential.offer_received",
        "openid.credential.token_issued",
        "openid.credential.credential_acked",
        "openid.credential.credential_accepted",
        "openid.credential.issuance_denied",
        "openid.presentation.presentation_acked.v3"
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
lists every event type.

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
X-iGrant-Signature: t=<time>,sig=<hex hmac-sha256>
Content-Type: application/json
```
`t` is the UTC delivery time in ISO 8601 (for example `2026-10-27T10:15:00Z`).
Signature: `sig = HMAC_SHA256(secretKey, "<t>.<raw-body>")`, hex-encoded; compare in
constant time. (`t` comes from the header, not the body.)

Body:
```jsonc
{
  "deliveryID": "…",
  "webhookID": "…",
  "timestamp": "…",
  "type": "openid.presentation.presentation_acked.v3",   // the topic
  "data": { "organisationId": "…", /* "credential": {…}  OR  "presentation": {…} */ }
}
```
`data.credential` is the issuance record (§1.3 fields); `data.presentation` is
the verification record (§2.2 fields).

### 4.4 Topic → exchange-id correlation
Extract the **exchange id** from each topic's payload; it is the SSE key that
you store the event under:

| Topic (`type`) | Path into `data` | Flow |
| --- | --- | --- |
| `openid.credential.offer_received` | `credential.CredentialExchangeId` | issuance: the wallet has the offer (deferred: supply claims now) |
| `openid.credential.token_issued` | `credential.CredentialExchangeId` | issuance: access token issued (deferred: supply claims now) |
| `openid.credential.credential_acked` | `credential.CredentialExchangeId` | issuance (complete: the wallet has the credential) |
| `openid.credential.credential_accepted` | `credential.CredentialExchangeId` | issuance (complete: the wallet confirmed it) |
| `openid.credential.issuance_denied` | `credential.CredentialExchangeId` | issuance (failed) |
| `openid.presentation.presentation_acked.v3` | `presentation.presentationExchangeId` | verification (complete) |

### 4.5 SSE event shape (what the browser receives)
The backend re-emits the stored event to the browser as one SSE `data:` line
(JSON). The frontend parses it as:

```jsonc
{
  "id": 123, "delivery_id": "…", "webhook_id": "<exchange-id>",
  "timestamp": "…", "created_at": "…",
  "type": "openid.presentation.presentation_acked.v3",
  "data": {
    // verification:
    "presentation": {
      "verified": true,
      "vpTokenResponse": ["…"],          // non-empty = wallet responded
      "presentation": [ { /* disclosed claims */ } ],
      "presentationExchangeId": "…",
      "status": "presentation_acked",
      "holder": { "name": "…" }
    }
    // OR issuance:
    // "credential": { "status": "credential_acked" | "offer_received" | …, "CredentialExchangeId": "…", "credentialOffer": "…" }
  }
}
```

Frontend processing:
- **Issuance done** when `data.credential.status ∈ { "credential_acked", "credential_accepted" }`;
  **failed** when it is `issuance_denied`.
- **Verification done** when `data.presentation.vpTokenResponse` is non-empty; read
  disclosed claims from `data.presentation.presentation[0]` and the decision from
  `data.presentation.verified`.

---

## 5. Client call summary (frontend, via backend proxy)

Using `createOwsClient({ baseUrl })` from `igrantio-frontend-client`, where
`baseUrl = {backend}/ows/{tenant}` and no API key is set (the proxy injects it):

```ts
client.issuance.issueInTime(payload)                    // POST …/credential/issue
client.issuance.startDeferred(payload)                  // POST …/credential/issue
client.issuance.completeDeferred(exId, body)            // PUT  …/credential/history/{exId}
client.issuance.readHistory(exId)                       // GET  …/credential/history/{exId}
client.verification.sendRequest(payload)                // POST v3 …/verification/send
client.verification.readHistory(exId)                   // GET  v3 …/verification/history/{exId}
client.verification.receiveDcApiResponse(exId, body)    // POST v2 …/verification/history/{exId}/receive
client.verification.deleteHistory(exId)                 // DELETE v2 …/verification/history/{exId}
```
