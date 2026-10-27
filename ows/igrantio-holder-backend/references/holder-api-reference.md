# OWS holder API reference - receive, hold, present

Authoritative endpoint/payload/response reference for the OWS **holder**
(wallet-side) API, as exercised by the iGrant.io dashboard wallet-unit pages.
Paths are relative to the OWS base URL (see the overview skill for
environments). The tenant backend authenticates with
`Authorization: ApiKey <key>`. The browser calls the backend proxy path with
no key.

Legend: `{base}` = OWS base URL. Frontend base = `{backend}/ows/{tenant}`
(see `igrantio-backend-proxy`). Error responses carry `errorDescription`
(sometimes `detail`) - surface that string. Request bodies are strict: an
unknown field or a value of the wrong JSON type answers 400.

The v2 holder routes in §1 and §2 (all except §1.11, §2.1, §2.3, §2.4 and
§2.5) answer 400 "Holder functionalities for sandbox organisation is
disabled" for an API key that is bound to a sandbox organisation. Use a key
of the main organisation.

---

## 1. Receive a credential (OpenID4VCI, wallet side)

### 1.1 Receive a credential offer
```
POST {base}/v2/config/digital-wallet/openid/sdjwt/credential/receive
```
```jsonc
{
  "credentialOffer": "openid-credential-offer://…",  // the scanned/pasted offer URI (or offer JSON)
  "autoPresent": true                                 // default false
}
```
The wallet receives with the organisation default key; there is no key
field in the body.

**Response**: `credential` - a single object **or an array** (multi-credential
offers); normalise to an array. Fields that drive the next step:

| Field | Use |
| --- | --- |
| `id` | credential record id - the `{id}` of every follow-up call. |
| `credentialStatus` | `credential_pending` until received; `credential_acked` when ready to review. |
| `userPinRequired`, `userPin`, `txCode` | transaction-code (pre-authorised code) flow - see §1.2. `txCode.length` = digits, `txCode.input_mode` = `numeric` \| `text`. |
| `oAuthFlow`, `authorizationRequest`, `acceptanceToken` | front-channel authorization-code flow - see §1.3. |

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
{ "userPin": "1234" }   // a JSON string, 4 to 12 characters
```
On a wrong code OWS answers 400; show its `errorDescription`. **Response**:
`{ "credential": CredentialRecord }`.

### 1.3 Exchange the front-channel authorization code
Open `authorizationRequest` in the browser; the issuer redirects back with
`?code=…&state=…`. Then:
```
POST {base}/v2/config/digital-wallet/openid/sdjwt/credential/exchange-code
```
```jsonc
{ "code": "<from ?code>", "state": "<from ?state>", "iss": "<from ?iss, when present>" }
```
`state` is required: the wallet finds the credential records by it (or by
an optional `credentialIds` array, which must match the same `state`).
**Response**: `{ "credential": … }` (one record or an array); refetch the
credential list and notifications as well.

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
Empty body. Accepts a `credential_acked` credential into the wallet
(**response** `{ "credential": … }`). To reject instead, `DELETE` the
credential (§1.8).

### 1.6 Read one credential
```
GET {base}/v2/config/digital-wallet/openid/sdjwt/credential/{id}
```
**Response**: `{ "credential": CredentialRecord }`. Key fields:
`credentialFormat` (`dc+sd-jwt` \| `vc+sd-jwt` \| `vp+sd-jwt` \| `jwt_vc` \|
`jwt_vc_json` \| `mso_mdoc`), the claims
(`credential.vc.credentialSubject` + `credential.vc.type` for W3C,
`credential.vct` for SD-JWT VC, `credential.nameSpaces` for mdoc),
`issuer.name` / `issuer.logo` / `issuer.cover`,
`credentialConfigurations.display[0]` (or
`credentialConfigurations.credential_metadata.display[0]`) with `.name`,
`.logo.uri`, `.background_image.uri`, `isVerifiedWithTrustList`,
`trustServiceProvider`, `autoPresent`, `revocationStatus`, `createdAt` and
`updatedAt` (Unix seconds).

### 1.7 List credentials held in the wallet
```
GET {base}/v2/config/digital-wallet/openid/sdjwt/credentials?limit=&offset=[&expired=true|false][&vct=][&doctype=][&credentialStatus=credential_accepted][&search=][&sortBy=createdAt|updatedAt][&sortOrder=asc|desc]
```
Omit `expired` for both (revoked and archived count as expired).
`credentialStatus` takes one value or a comma list. The list sorts on
`updatedAt` unless `sortBy=createdAt`; `sortOrder=asc` sorts ascending,
anything else descending.

**Response**:
```jsonc
{
  "credential": [ /* CredentialRecord[] */ ],
  "pagination": { "currentPage": 1, "totalItems": 12, "totalPages": 2, "limit": 10, "hasNext": true, "hasPrevious": false }
}
```

### 1.8 Delete (or reject) a credential
```
DELETE {base}/v2/config/digital-wallet/openid/sdjwt/credential/{id}
```
**Response**: 204, no body.

### 1.9 Configure a held credential
```
PUT {base}/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/configure
```
```jsonc
{ "autoPresent": true }   // required JSON boolean: present this credential without a manual consent step
```

### 1.10 Request reissuance
```
PUT {base}/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/request
```
Empty body. Requests reissuance of an expired or near-expiry credential via
OID4VCI. **Response**: `{ "credential": … }`.

### 1.11 Check revocation status
```
GET {base}/v2/config/digital-wallet/openid/sdjwt/credential/{credentialId}/revocation-status
```
Queries the IETF Token Status List for the credential's current revocation
status. **Response**: `{ "credential": … }` with `revocationStatus` updated.
A credential without a status answers 400 ("does not support revocation"); an
issuer status list that cannot be read answers 502.

---

## 2. Present credentials (OpenID4VP + DCQL, wallet side)

### 2.1 Receive a presentation request
```
POST {base}/v3/config/digital-wallet/openid/sdjwt/verification/receive
```
```jsonc
{
  "vpTokenQrCode": "openid4vp://…",   // the scanned/pasted request - URI or https request URL, verbatim
  "autoPresent": true                  // the wallet answers at once when it can select the credentials
}
```

**Response**: `{ "presentation": PresentationRecord }`. Fields to process:

| Field | Use |
| --- | --- |
| `presentation.presentationId` | the `{id}` for §2.2 filter and §2.3 send. |
| `presentation.status` | `presentation_pending` → continue; `presentation_acked` → already answered (also when `autoPresent` answered in this call). |
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
Empty body. **Response**: `credentials` for a DCQL request,
`inputDescriptors` for a Presentation Exchange request - one entry per
requested credential:
```jsonc
{ "credentials": [ { "id": "<dcql credential id>", "multiple": false, "claimSets": [["a", "b"]],
    "matchedCredentials": [ { "credentialId": "…", "vct": "…", "doctype": "…", "type": ["…"] } ] } ] }
```
`name`, `purpose`, `claimSets` and `multiple` are present only when set.
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
descriptors from the selected credential-set option group. Sending both
`credentials` and `inputDescriptors`, or neither, answers 400.

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
  "pagination": { "currentPage": 1, "totalItems": 4, "totalPages": 1, "limit": 10, "hasNext": false, "hasPrevious": false },
  "presentationStats": { "total": 4, "presentationShared": 3, "presentationPending": 1 }
}
```
The list sorts on `updatedAt` (`sortOrder=asc` ascending, else descending).

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
(v2 path - the delete endpoint has no v3 variant.) **Response**: 204, no
body.

---

## 3. Notifications

The holder's event channel (no webhooks on the holder side). Full contract,
SSE stream, and the notification→action decision table:
`igrantio-holder-notifications`. Summary:

| Method | Path |
| --- | --- |
| GET | `{base}/v2/config/digital-wallet/openid/notifications?limit=&offset=&search=&notificationType=&status=&sortOrder=` |
| GET / PUT / DELETE | `{base}/v2/config/digital-wallet/openid/notification/{id}` |
| DELETE | `{base}/v2/config/digital-wallet/openid/notifications` (delete all, 204) |
| GET (SSE) | `{base}/v2/config/digital-wallet/openid/notifications/sse[?lastEventId=]` (the backend relay sends the `Authorization` header) |

The PUT body is `{ "status": "<string>" }`; the response wraps the record as
`{ "notification": … }`.

---

## 4. Holder global configuration

```
GET    {base}/v2/config/digital-wallet/openid/holder/global-configuration
PUT    {base}/v2/config/digital-wallet/openid/holder/global-configuration
```
An organisation has one holder global configuration. The wallet makes it with
the default values when it deploys the organisation wallet: there is no create,
list or delete, and no id in the path. The update is partial (a field that you
leave out keeps its stored value).

Update body:
```jsonc
{
  "supportCredentialEncryption": false,
  "refreshCredentialStatusInterval": 86400,     // seconds (86400 = daily revocation-status refresh)
  "redirectUrl": "https://…",                   // absolute return URL after front-channel authorization; "" = the wallet default
  "requirePushedAuthorizationRequests": false   // true = use a Pushed Authorization Request in the authorization code flow
}
```
Read and update response: the record is under **`globalConfiguration`**
(`{ "globalConfiguration": { … } }`); it carries `holderGlobalConfigurationId`
plus the fields above.

---

## 5. Wallet unit

```
GET {base}/v2/config/digital-wallet/openid/wallet-unit/status
```
**Response**: `{ "status": "not_installed" | "installed" | "operational" | "valid" }`
(no wallet → wallet deployed without a valid Wallet Unit Attestation → valid
Wallet Unit Attestation → valid Wallet Unit Attestation and an LPID
credential).

---

## 6. Vocabularies

- **`credentialStatus`** (holder records): `credential_pending`,
  `credential_acked`, `credential_accepted`, `credential_archived` (a
  superseded Wallet Unit Attestation). Revocation is in `revocationStatus`.
- **Presentation `status`**: `presentation_pending`, `presentation_acked`.
- **`notificationType`**: `credential_pending`, `credential_acked`,
  `credential_revoked`, `credential_expired`.
- **`credentialFormat`**: `dc+sd-jwt`, `vc+sd-jwt`, `vp+sd-jwt`, `jwt_vc`,
  `jwt_vc_json`, `mso_mdoc`.
- **Errors**: read `errorDescription` (fallback `detail`).
