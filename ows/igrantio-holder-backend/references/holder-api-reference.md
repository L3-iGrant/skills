# OWS holder API reference - receive, hold, present

Authoritative endpoint/payload/response reference for the OWS **holder**
(wallet-side) API, as exercised by the iGrant.io dashboard wallet-unit pages.
Paths are relative to the OWS base URL (see the overview skill for
environments). The tenant backend authenticates with
`Authorization: ApiKey <key>`; the iGrant.io dashboard calls the same
endpoints with a user `Bearer` token. The browser calls the backend proxy
path with no key.

Legend: `{base}` = OWS base URL. Frontend base = `{backend}/ows/{tenant}`
(see `igrantio-backend-proxy`). Error responses carry `errorDescription`
(sometimes `detail`) - surface that string.

---

## 1. Receive a credential (OpenID4VCI, wallet side)

### 1.1 Receive a credential offer
```
POST {base}/v2/config/digital-wallet/openid/sdjwt/credential/receive
```
```jsonc
{
  "credentialOffer": "openid-credential-offer://…",  // the scanned/pasted offer URI (or offer JSON)
  "autoPresent": true,
  "kid": "<key id, may be \"\">",                     // cleared when trustAnchor is "x509"
  "trustAnchor": "did:key"                            // "did:key" | "x509"
}
```

**Response**: `credential` - a single object **or an array** (multi-credential
offers); normalise to an array. Fields that drive the next step:

| Field | Use |
| --- | --- |
| `id` | credential record id - the `{id}` of every follow-up call. |
| `credentialStatus` | `credential_pending` until received; `credential_acked` when ready to review. |
| `userPinRequired`, `userPin`, `txCode` | transaction-code (pre-authorised code) flow - see §1.2. `txCode.length` = digits, `txCode.input_mode` = `numeric` \| `text`. |
| `oAuthFlow`, `authorizationRequest`, `acceptanceToken` | front-channel authorization-code flow - see §1.3. |
| `version` | offer draft version (e.g. `draft_11` - free-text PIN instead of OTP boxes). |

**Which flow am I in?** (same decision table as the notifications skill)

| Signal on the record | Flow | Next call |
| --- | --- | --- |
| `userPinRequired && !userPin && credentialStatus == "credential_pending"` | pre-authorised code + transaction code | §1.2 |
| `oAuthFlow == "frontchannel" && credentialStatus == "credential_pending" && acceptanceToken absent && authorizationRequest` | authorization code (front-channel) | open `authorizationRequest`, then §1.3 |
| `acceptanceToken present && credentialStatus == "credential_pending"` | deferred issuance | §1.4 |
| `credentialStatus == "credential_acked"` | credential arrived | review, then §1.5 accept or §1.8 reject |

(`acceptanceToken` is `""` in this response but `null` in notifications -
treat empty and null alike.)

### 1.2 Submit the transaction code (user PIN)
```
PUT {base}/v2/config/digital-wallet/openid/sdjwt/credential/{id}/user-pin
```
```jsonc
{ "userPin": "1234" }
```
On a wrong code OWS answers 400 "Invalid one-time code, check and try again".

### 1.3 Exchange the front-channel authorization code
Open `authorizationRequest` in the browser; the issuer redirects back with
`?code=…&state=…`. Then:
```
POST {base}/v2/config/digital-wallet/openid/sdjwt/credential/exchange-code
```
```jsonc
{ "code": "<from ?code>", "state": "<from ?state, may be null>" }
```
Success means the wallet can pull the credential; refetch the credential list
/ notifications rather than parsing this response.

### 1.4 Retrieve a deferred credential
```
PUT {base}/v2/config/digital-wallet/openid/sdjwt/credential/{id}/receive-deferred
```
Empty body. **Response**: `credential.credentialStatus` -
`credential_acked` means the credential is now in the wallet; anything else
means the issuer is not ready yet - retry later.

### 1.5 Accept a received credential
```
PUT {base}/v2/config/digital-wallet/openid/sdjwt/credential/{id}/accept
```
Empty body. Accepts a `credential_acked` credential into the wallet. To
reject instead, `DELETE` the credential (§1.8).

### 1.6 Read one credential
```
GET {base}/v2/config/digital-wallet/openid/sdjwt/credential/{id}
```
**Response**: `{ "credential": CredentialRecord }`. Key fields:
`credentialFormat` (`dc+sd-jwt` \| `vc+sd-jwt` \| `vp+sd-jwt` \| `sdjwt` \|
`jwt_vc` \| `jwt_vc_json` \| `mso_mdoc`), the claims
(`credential.vc.credentialSubject` + `credential.vc.type` for W3C,
`credential.vct` for SD-JWT VC, `credential.nameSpaces` for mdoc),
`issuer.name` / `issuer.logo` / `issuer.cover`,
`credentialConfigurations.display[0]` (or
`credentialConfigurations.credential_metadata.display[0]`) with `.name`,
`.logo.uri`, `.background_image.uri`, `dataAgreement.policy`,
`isVerifiedWithTrustList`, `trustServiceProvider`, `autoPresent`,
`revocationStatus`, `createdAt`.

### 1.7 List credentials held in the wallet
```
GET {base}/v2/config/digital-wallet/openid/sdjwt/credentials?limit=&offset=[&expired=true|false][&vct=][&credentialStatus=credential_accepted][&search=][&sortOrder=asc|desc]
```
Omit `expired` for both; `sortOrder` sorts on `createdAt`.

**Response**:
```jsonc
{
  "credential": [ /* CredentialRecord[] */ ],
  "pagination": { "totalItems": 12, "hasNext": true, "hasPrevious": false }
}
```

### 1.8 Delete (or reject) a credential
```
DELETE {base}/v2/config/digital-wallet/openid/sdjwt/credential/{id}
```

### 1.9 Configure a held credential
```
PUT {base}/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/configure
```
```jsonc
{ "autoPresent": true }   // present this credential without a manual consent step
```

---

## 2. Present credentials (OpenID4VP + DCQL, wallet side)

### 2.1 Receive a presentation request
```
POST {base}/v3/config/digital-wallet/openid/sdjwt/verification/receive
```
```jsonc
{
  "vpTokenQrCode": "openid4vp://…",   // the scanned/pasted request - URI or https request URL, verbatim
  "autoPresent": true,
  "kid": "<key id>",
  "trustAnchor": "did:key"
}
```

**Response**: `{ "presentation": PresentationRecord }`. Fields to process:

| Field | Use |
| --- | --- |
| `presentation.presentationId` | the `{id}` for §2.2 filter and §2.3 send. |
| `presentation.status` | `presentation_pending` → continue; `presentation_acked` → already answered. |
| `presentation.dcqlQuery` | the verifier's DCQL query: `credentials[]` (each `id`, `multiple`, `claims[].id`, `claim_sets`, `meta.vct_values`) and `credential_sets` (alternative groups). |
| `presentation.transactionDataDecoded[]` | wallet-displayed transaction data (SCA/QES): entries may carry `data_agreement_record`, `data_disclosure_agreement_record`, or `qes_data.external_link` - show before consent. |
| `presentation.clientMetadata` | verifier display: `clientName`, `logoUri`, `coverUri`, `location`. |
| `presentation.isVerifiedWithTrustList`, `trustServiceProvider` | verifier trust signals. |
| `presentation.dataAgreement.policy` | data agreement to show. |
| `presentation.presentationDefinition` | legacy Presentation Exchange (string or object) when there is no `dcqlQuery`. |

### 2.2 Match held credentials against the request
```
POST {base}/v2/config/digital-wallet/openid/sdjwt/verification/{presentationId}/filter
```
Empty body. **Response**: read `inputDescriptors` (fallbacks:
`inputDescriptor`, `credentials`) - one entry per requested credential:
```jsonc
[ { "id": "<dcql credential id>", "name": "…", "purpose": "…",
    "matchedCredentials": [ { "credentialId": "…", "vct": "…", "doctype": "…" } ] } ]
```
An empty `matchedCredentials` on a mandatory descriptor means the holder
cannot satisfy the request.

### 2.3 Send the presentation (consent)
```
POST {base}/v3/config/digital-wallet/openid/sdjwt/verification/{presentationId}/send
```
Top-level key by query type: `credentials` when the record has a `dcqlQuery`,
`inputDescriptors` for legacy Presentation Exchange. One uniform item shape
across the array:
```jsonc
// with claim-set selection (per item):
{ "credentials": [ { "id": "<dcql id>", "credentialId": "<held id>", "claimIds": ["a", "b"] } ] }
// any descriptor has multiple:true → array form everywhere:
{ "credentials": [ { "id": "<dcql id>", "credentialIds": ["<id1>", "<id2>"] } ] }
// all single, no claim sets → string form everywhere:
{ "credentials": [ { "id": "<dcql id>", "credentialId": "<held id>" } ] }
```
`claimIds` are the claim ids of the chosen `claim_sets` entry. Include only
descriptors from the selected credential-set option group.

**Response**: `presentation.responseRedirectUri` - when non-empty, open it
(the verifier's post-presentation redirect). The signing/approval of
transaction data happens through this call - there is no separate holder
"sign" endpoint.

### 2.4 List presentations
```
GET {base}/v3/config/digital-wallet/openid/sdjwt/verifications?limit=&offset=[&search=][&sortOrder=][&status=presentation_acked|presentation_pending]
```
**Response**:
```jsonc
{
  "presentation": [ /* PresentationRecord[] */ ],
  "pagination": { "totalItems": 4, "hasNext": false, "hasPrevious": false },
  "presentationStats": { "total": 4, "presentationShared": 3, "presentationPending": 1 }
}
```

### 2.5 Read one presentation
```
GET {base}/v3/config/digital-wallet/openid/sdjwt/verification/{presentationId}
```
**Response**: `{ "presentation": PresentationRecord }`; after sharing,
`presentation.presentation[]` holds the disclosed credentials and
`updatedAt` the share time.

### 2.6 Delete a presentation record
```
DELETE {base}/v2/config/digital-wallet/openid/sdjwt/verification/{presentationId}
```
(v2 path - the delete endpoint has no v3 variant.)

---

## 3. Notifications

The holder's event channel (no webhooks on the holder side). Full contract,
SSE stream, and the notification→action decision table:
`igrantio-holder-notifications`. Summary:

| Method | Path |
| --- | --- |
| GET | `{base}/v2/config/digital-wallet/openid/notifications?limit=&offset=&search=&notificationType=` |
| PUT / DELETE | `{base}/v2/config/digital-wallet/openid/notification/{id}` |
| DELETE | `{base}/v2/config/digital-wallet/openid/notifications` |
| GET (SSE) | `{base}/v2/config/digital-wallet/openid/notifications/sse?status=unread&limit=10&offset=0&authorization=…` |

---

## 4. Holder global configuration

```
GET  {base}/v2/config/digital-wallet/openid/holder/global-configurations
POST {base}/v2/config/digital-wallet/openid/holder/global-configuration
PUT  {base}/v2/config/digital-wallet/openid/holder/global-configuration/{holderGlobalConfigurationId}
```
Create/update body:
```jsonc
{
  "supportCredentialEncryption": false,
  "refreshCredentialStatusInterval": 86400,   // seconds (86400 = daily revocation-status refresh)
  "redirectUrl": "https://…"                  // return URL after front-channel authorization
}
```
List response: the array is under **`holderGlobalConfiguration`**; each item
carries `holderGlobalConfigurationId` plus the three fields above.

---

## 5. Wallet unit

```
GET {base}/v2/config/digital-wallet/openid/wallet-unit/status
```
**Response**: `{ "status": "NOT_INSTALLED" | "INSTALLED" | "OPERATIONAL" | "VALID" }`
(WUA lifecycle: no wallet unit → instance installed → Wallet Unit Attestation
issued → operational + legal PID issued).

---

## 6. Vocabularies

- **`credentialStatus`** (holder records): `credential_pending`,
  `credential_acked`, `credential_accepted`, `credential_expired`,
  `credential_revoked`.
- **Presentation `status`**: `presentation_pending`, `presentation_acked`.
- **`notificationType`**: `credential_pending`, `credential_acked`,
  `credential_revoked`, `credential_expired`; SSE also emits
  `credential_received`.
- **`credentialFormat`**: `dc+sd-jwt`, `vc+sd-jwt`, `vp+sd-jwt`, `sdjwt`,
  `jwt_vc`, `jwt_vc_json`, `mso_mdoc`.
- **Errors**: read `errorDescription` (fallback `detail`).
