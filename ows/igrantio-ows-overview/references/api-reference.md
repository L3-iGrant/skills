# OWS API reference - issuance, verification, config, webhooks

Authoritative endpoint/payload/response reference for the OWS OpenID4VC API, as
used by the iGrant.io landing-page use cases and the `@igrant/usecase-sdk` /
`igrant-api-lib` client. Paths are relative to the OWS base URL (see the overview
skill for environments). All calls authenticate with `Authorization: ApiKey <key>`
**from the tenant backend only**; the browser calls the backend proxy path with no
key.

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

Request body (`IssueCredentialRequest` - one of four shapes by `issuanceMode`):

```jsonc
{
  "issuanceMode": "InTime",              // "InTime" | "Deferred"
  "credentialDefinitionId": "<id>",      // required - stored issuer config
  // one of the credential bodies (format depends on the credential definition):
  "credential": {
    "claims": { /* SD-JWT VC / mdoc claims, or namespaced e.g. "org.iso.18013.5.1": {…} */ }
    // W3C form instead: "credentialSubject": { … }, "type": ["…"]
  },
  // optional, for multi-credential offers:
  "credentials": [ { "id": "<credentialConfigurationId>", "claims": { … } } ],
  // optional fields:
  "userPin": "1234",                      // pre-authorised code PIN
  "presentationDefinitionId": "<id>",     // "dynamic" issuance: collect a presentation first
  "individualId": "<id>",
  "urlScheme": "openid-credential-offer",
  "transactionData": { "payment_data": { "payee": "…", "currency_amount": { "currency": "EUR", "value": "10.00" } } }
}
```

`issuanceMode`:
- **`InTime`** - claims are known now; provide `credential.claims`. Wallet gets the finished credential.
- **`Deferred`** - issue the *offer* now, provide the claims later via §1.2. Use when
  claims are collected after the offer, or gated behind a presentation
  (`presentationDefinitionId` → "dynamic credential request").

**Response** (`IssueCredentialResponse`) - process these fields:

| Field | Use |
| --- | --- |
| `credentialHistory.CredentialExchangeId` | **SSE correlation key** - open SSE on this. |
| `credentialHistory.credentialOffer` | `openid-credential-offer://…` URI → **render as QR / same-device deep link**. |
| `credentialHistory.credentialStatus` | `"pending"` \| `"ready"`. |
| `credentialHistory.status` | `offer_sent` → `offer_received` → `credential_issued` → `credential_acked`/`credential_accepted`, or `issuance_denied`. |
| `credentialHistory.presentationExchangeId` | present for dynamic (presentation-gated) issuance. |
| `c_nonce`, `c_nonce_expires_in`, `credential_id` | protocol fields, usually not needed by the UI. |

### 1.2 Deferred issue - supply claims after the offer
```
PUT {base}/v2/config/digital-wallet/openid/sdjwt/credential/history/{CredentialExchangeId}
```
Body (`UpdateCredentialHistoryPayload`):
```jsonc
{ "credential": { "claims": { … }, "id": "<credentialConfigurationId?>" } }
// W3C form: { "credential": { "credentialSubject": { … } } }
```
Call this when the SSE / webhook reports `offer_received` for a `Deferred` issuance.
**Response**: `{ "success": true, "message"?: "…" }`.

### 1.3 Read credential history
```
GET {base}/v2/config/digital-wallet/openid/sdjwt/credential/history/{CredentialExchangeId}
```
**Response**: `{ "credentialHistory": CredentialHistoryItem }`. Key fields on the item:
`status`, `credentialStatus`, `credential.credentialSubject`/`claims`, `holder.name`,
`credentialFormat` (`jwt_vc_json` | `dc+sd-jwt` | `mso_mdoc`), `revocationStatus`
(`Operational` | `Revoked` | `Suspended`), `disclosureMapping`, `createdAt`, `updatedAt`.

### 1.4 Delete credential history
```
DELETE {base}/v2/config/digital-wallet/openid/sdjwt/credential/history/{CredentialExchangeId}
```

---

## 2. Verification (OpenID4VP + DCQL)

### 2.1 Send a verification request
```
POST {base}/v3/config/digital-wallet/openid/sdjwt/verification/send
Authorization: ApiKey <verifier-key>
Content-Type: application/json
```
> v3 is current; `v2/config/digital-wallet/openid/sdjwt/verification/send` also exists (legacy).

Request body (`SendVerificationRequest`):
```jsonc
{
  "requestByReference": true,                 // request object served by reference (recommended)
  "presentationDefinitionId": "<id>",         // required - stored DCQL query / presentation definition
  // optional:
  "transactionData": { "payment_data": { "payee": "…", "currency_amount": { "currency": "EUR", "value": "10.00" } } },
  "individualId": "<id>",
  "mapperId": "<id>",
  "signatureStamp": true,
  "signatureCoordinate": [x, y]
}
```

**Response** (`VerificationResponse`) - process these fields:

| Field | Use |
| --- | --- |
| `verificationHistory.presentationExchangeId` | **SSE correlation key** - open SSE on this. |
| `verificationHistory.vpTokenQrCode` | `openid4vp://…` URI → **render as QR / same-device DC API request**. |
| `verificationHistory.status` | `request_sent` → `request_received` → `presentation_acked`. |
| `verificationHistory.dcApiRequest` / `dcApiProtocol` | present when same-device **Digital Credentials API** is used (see `igrantio-verifier-frontend`). |

### 2.2 Read verification history
```
GET {base}/v3/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}
```
**Response**: `{ "verificationHistory": VerificationHistoryItem }`. Key fields to process:

| Field | Meaning |
| --- | --- |
| `verified` | **boolean - the accept/reject decision.** |
| `vpTokenResponse` | `string[]` - non-empty once the wallet has responded. |
| `presentation` | `object[]` - the **disclosed claims** (`presentation[0]` = first credential's claims). |
| `presentationSubmission` | maps disclosed credentials to the DCQL query. |
| `status` | `request_sent` \| `request_received` \| `presentation_acked`. |
| `holder.name` | subject/holder. |
| `walletUnitAttestationVerified`, `presentationValidity`, `walletUnitValidity` | trust/assurance signals. |

Accept the presentation only when `verified === true` (and, per your trust rules,
attestation/validity signals pass).

### 2.3 Delete verification history
```
DELETE {base}/v3/config/digital-wallet/openid/sdjwt/verification/history/{presentationExchangeId}
```

---

## 3. Config (one-time setup, tenant backend or admin console)

These are typically created once per organisation via the OWS business console or a
setup script; the frontend never calls them.

- **Credential definition** (issuer config) - defines a credential type/format the
  issuer can issue; yields the `credentialDefinitionId` used in §1.1.
- **Presentation definition** (verifier config / DCQL) -
  `POST {base}/v2/config/digital-wallet/openid/sdjwt/presentation-definition`,
  list via `…/presentation-definitions`, delete via `…/presentation-definition/{id}`.
  Body carries a `dcqlQuery` (`credentials[]` with `format`, `meta.doctype_value`,
  `claims[].path`); yields the `presentationDefinitionId` used in §2.1.
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
    "payloadUrl": "https://your-backend.example.com/webhook",   // your receiver
    "contentType": "application/json",
    "subscribedEvents": {
      "digitalWalletWebhook": [
        "openid.credential.offer_received",
        "openid.credential.token_issued",
        "openid.credential.credential_acked",
        "openid.credential.credential_accepted",
        "openid.presentation.presentation_acked.v3",
        "digitalwallet.presentation.verified"
      ]
    },
    "disabled": false,
    "secretKey": "<shared HMAC secret>",     // MUST match the backend's WEBHOOK_SECRET_KEY
    "skipSslVerification": false
  }
}
```
**Response** `201`: the created webhook plus `id`, `orgId`, `timestamp`.

### 4.2 List webhooks (for idempotency - "don't create if exists")
```
GET {base}/v2/config/webhooks?limit=10&offset=0
Authorization: ApiKey <org-key>   (Bearer <dashboard-JWT> also works from the console)
```
Before registering, list and skip if a webhook with the same `payloadUrl` already
exists. See `igrantio-backend-webhooks` for the idempotent register routine.

### 4.3 Webhook delivery → your receiver
OWS `POST`s to your `payloadUrl`:

Headers:
```
X-iGrant-Signature: t=<unix-ts>,sig=<hex hmac-sha256>
Content-Type: application/json
```
Signature: `sig = HMAC_SHA256(secretKey, "<t>.<raw-body>")`, hex-encoded; compare in
constant time. (`t` comes from the header, not the body.)

Body (`webhookPayload`):
```jsonc
{
  "deliveryID": "…",
  "webhookID": "…",
  "timestamp": "…",
  "type": "openid.presentation.presentation_acked.v3",   // the topic
  "data": { /* "credential": {…}  OR  "presentation": {…} */ }
}
```

### 4.4 Topic → exchange-id correlation
Extract the **exchange id** from each topic's payload; it is the SSE key and the
`external_id` you store the event under:

| Topic (`type`) | Path into `data` | Flow |
| --- | --- | --- |
| `openid.credential.offer_received` | `credential.CredentialExchangeId` | issuance (deferred: supply claims now) |
| `openid.credential.token_issued` | `credential.CredentialExchangeId` | issuance |
| `openid.credential.credential_acked` | `credential.CredentialExchangeId` | issuance |
| `openid.credential.credential_accepted` | `credential.CredentialExchangeId` | issuance (complete) |
| `openid.presentation.presentation_acked.v3` | `presentation.presentationExchangeId` | verification (complete) |
| `digitalwallet.presentation.verified` | `presentation.presentationExchangeId` | verification |

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
    // "credential": { "status": "credential_accepted" | "token_issued" | …, "CredentialExchangeId": "…", "credentialOffer": "…" }
  }
}
```

Frontend processing:
- **Issuance done** when `data.credential.status ∈ { "credential_accepted", "token_issued" }`.
- **Verification done** when `data.presentation.vpTokenResponse.length > 0`; read
  disclosed claims from `data.presentation.presentation[0]` and the decision from
  `data.presentation.verified`.

---

## 5. Client call summary (frontend, via backend proxy)

Using `@igrant/usecase-sdk` `apiService` (or the equivalent in
`igrantio-frontend-client`), where `baseUrl = {backend}/ows/{tenant}` and the API
key is **empty** (the proxy injects it):

```ts
apiService.issuance.issueInTime(baseUrl, "", payload)      // POST …/credential/issue
apiService.issuance.issueDeferred(baseUrl, "", exId, body) // PUT  …/credential/history/{exId}
apiService.issuance.readHistory(baseUrl, "", exId)         // GET  …/credential/history/{exId}
apiService.verification.sendRequest(baseUrl, "", payload)  // POST …/verification/send
apiService.verification.readHistory(baseUrl, "", exId)     // GET  …/verification/history/{exId}
```
