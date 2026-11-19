# Holder portal UX reference

The behaviour rules of the holder pages of the iGrant.io reference wallet, so
that a customer portal can do the same (or change a rule on purpose). The API
contract is in `igrantio-holder-backend/references/holder-api-reference.md`
and `igrantio-api-holder`; this file is about what the user interface does
with it. The reference code in `features/holder/` follows every rule below.

## 1. Portal structure

Three views (and a base configuration page):

| View | Data | Notes |
| --- | --- | --- |
| Received credentials | `GET .../holder/credentials` with `credentialStatus=credential_accepted` and `groupBatches=true` | Two tables from the SAME operation: Active (`expired=false`) and Archived (`expired=true`: revoked, archived, or past its expiry). There is no separate route for expired credentials. |
| Shared credentials | `GET .../holder/presentations` | The stats are also the status filters. |
| Notifications | the list and the SSE stream | The action centre of the holder; a badge with the count is on the wallet menu or tab. |

Default sort: received by `createdAt`, newest first (send `sortBy=createdAt`;
else the list sorts on `updatedAt`); shared by `updatedAt`, newest first.
One search box for each table ("Search by Credential Type, Issuer"), with a
debounce of about 100 ms.

## 2. Gating

- **Deployment gate**: the wallet actions need a deployed wallet.
- **Wallet unit gate**: "+ Receive" is on only when `wallet-unit/status` is
  `operational` or `valid`. The ladder (`not_installed`, `installed`,
  `operational`, `valid`) shows as a stepper with 4 dots; only the current
  dot has its colour (red, `#FFF36D`, orange, `#2f9e44`), the others are
  grey `#D3D3D3`. Below `operational`, show the warning "Wallet unit not
  provisioned".
- **Sandbox**: the held credential operations answer 400 for a key of a
  sandbox organisation. Use a key of the main organisation.

## 3. Received credentials

**Columns**: Credential Type (with "N of M single-use copies left" for a
batch) | Issuer (with the trust badge) | Credential Format | Status
("Active" green, "Suspended" orange, "Revoked" red, "Expired" grey) | Date
Received (sortable) | actions.

**Stats row**: Total (black), Active (green `#34C759`), Archived (orange
`#FF9500`): a big number and an uppercase 11 px label.

**Title chain (list)**: `credentialConfigurations.credential_definition.type[]`
joined, then `credentialConfigurations.vct`, then
`credential.issuerAuth.docType`, then `credential.vc.type[0]`, then
"Unknown". The detail view uses a DIFFERENT chain: `display[0].name`, then
`credential_metadata.display[0].name`, then `vc.type` joined. When a title is
an http(s) URL, fetch it and use `data.name ?? data.display.name`.

**Format labels**: `mso_mdoc` is "ISO 18013-5 mdoc/mDL"; `dc+sd-jwt`,
`vp+sd-jwt` and `vc+sd-jwt` are "IETF SD-JWT VC"; `jwt_vc` and
`jwt_vc_json` are "W3C VC (JWT)". Fallbacks on the structure: `nameSpaces`
is mdoc, `vc.credentialSubject` is W3C, `vct` is SD-JWT.

**Row actions**:
- Refresh (Active only): send the revocation status check AND the
  re-issuance request together, ignore their errors (the issuer can support
  neither), then read the list again. Off when `revocationStatus` is
  `Revoked` or the record is pending.
- View: the detail view.
- Delete asks for a typed confirmation ("DELETE") in the reference wallet.
  It is off for a Wallet Unit Attestation and a credential with
  `isSystemManaged` `true` (the wallet refuses to delete them). A delete
  removes every copy of the batch.

**Date column**: the ISSUE date, not `createdAt`: mdoc
`issuerAuth.validityInfo.validFrom` (a "YYYY-MM-DD HH:mm:ss UTC" text), then
`vc.issuanceDate`, then the Unix `credential.iat`. Format "MMM D, YYYY,
HH:mm".

## 4. Credential detail view

Banner (`display.background_image.uri`, then `issuer.cover`, then a
default; the literal value "not discoverable" counts as absent) and a round
issuer logo (the same chain with `issuer.logo`). Title, format chip, eye
toggle, copy.

**Claims for each format**: mdoc: the first namespace of
`credential.nameSpaces` without `dataAgreement`; W3C VC (JWT):
`vc.credentialSubject` (or its nested `credentialSubject`) without
`dataAgreement`; SD-JWT VC: the claims at the root without the excluded keys.
Excluded keys: `exp iat iss jti nbf sub _sd_alg vct status cnf kb
dataAgreement transaction_data_types schema_uri#integrity`, and every key that
starts with `vct` or `transaction_data_types`.

**Rendering rules**: a base64 value on a portrait-like key
(`portrait|photo|image|face`) shows as a round 120 px avatar; `age_over_18`
becomes an "Above 18" or "Under 18" chip; nested objects show as indented
sections, with dotted keys from depth 3; a list of objects gets numbered
section headers. **Personal data starts blurred** (`blur(4px)`) each time the
view opens; one eye toggle controls the whole view.

**Trust badges** (issuer AND verifier surfaces) read a `TrustedListCheck`:

| Record | Check next to the name | Also in the detail view |
| --- | --- | --- |
| held credential | `credentialSignerTrustedListCheck` | `issuerTrustedListCheck` (signer of the signed issuer metadata), `statusIssuerTrustedListCheck` (signer of the status list), when set |
| presentation request | `relyingPartyTrustedListCheck` | |

| `result` | Badge |
| --- | --- |
| `trusted` | green shield `#2e7d32`, "Trusted" |
| `not_trusted` | red shield `#d32f2f`, "Not trusted" |
| `not_found` | red shield, "Not in the trusted lists" |
| `not_applicable` (`reason.code` `not_required`: the trust setting is off) | grey shield, "Not checked" |
| `error` | orange shield, "Check failed" |
| no check (`null`, for example a pending credential) | grey shield, "Not checked" |

A click opens the details: the listed name (`entry.provider.tSPName`, else
`entry.service.serviceName`, else `decision.entity`), the trust source
(`entry.source.name`), the role, the reason or warning (their `message`), and
the signer certificate (`presentedCertificates[0]`: subject, issuer, valid
until). Use plain words; do not show algorithm names.

**Review mode** (a `credential_acked` credential from a notification or a
receive): the footer becomes Refuse (DELETE the credential) and Accept
(`PUT .../acceptance`); both then delete the notification.

## 5. Sharing: the selection engine

Flow: `POST .../holder/presentations` with `{requestUrl}`, then
`.../presentations/{presentationId}/matching-credentials`, the pre-flight
check, the selection user interface, and
`.../presentations/{presentationId}/response`.

**Record status**: `presentation_acked` shows "This request was answered on
<date>"; `request_refused` shows `refusalReason`.

**Pre-flight** (before any user interface): with `credential_sets`, every
required set (`required` left out is `true`) must have one option whose
queries ALL have matches, and not all queries can be empty; without
`credential_sets`, EVERY query must have a match. A failure shows "The wallet
does not hold the requested data". The difference is on purpose: an optional
alternative can match nothing. A query with no match does not show.

**Wizard**: one step for each credential set, required sets first (and among
them, the single-choice sets first). A wizard with several steps shows "The
verifier asks for more data. Click Next to continue." and the button changes
from Next to Confirm on the last step.

**Alternatives** (`options.length > 1`): radios "OPTION 01", "OPTION 02",
and so on; a "None" radio shows only for an optional set with more than one
available option in a wizard with several steps. Preselection: required,
the first option; optional, "None". A radio change resets the whole step.
The options that are not chosen show grey (`#bdbdbd`).

**`multiple: true`**: the user can pick one or more credentials ("N
credentials found. Select one or more to share"); a required set preselects
the first credential, an optional set starts empty.

**`claim_sets`**: one radio for each option of the `claimSets` of the
matching answer (the options that a match answers, in the order of
preference of the verifier). Each radio previews exactly the claims that the
option discloses (the claim `path` against the match: mdoc tries
namespace, then dotted, then flat; W3C drops the leading
`credentialSubject` segment). An option that the chosen credential does not
answer (its `claimSets`) is off. Default: the first option that the chosen
credential answers. The user cannot toggle single claims: the radio picks a
whole option. An empty option previews nothing. Without claim sets, preview
every match entry except the excluded keys (after the `$.` and
`$.vc.credentialSubject.` prefixes are removed).

**Submit gate**: "None" passes only for an optional set; a chosen option
needs every query answered (`multiple`: at least one credential; single: a
credential; claim sets: an option that the credential answers). A required
step without radios is locked on.

**Items of the response call**: `[{id, credentialId | credentialIds,
claimIds?}]`. The wallet takes the form of the first item for every item:
when a chosen query has `multiple: true`, every item uses a `credentialIds`
list (a single choice is a list with one id); else every item uses a
`credentialId` text. `claimIds` is only on the items of a query with
`claim_sets`. The body is `{"credentials": [...]}`.

**Before consent**, show: the verifier identity (`clientMetadata.clientName`,
`logoUri`, `location`, with the fallbacks "Unknown" and "Not Discoverable")
and its trust badge; the transaction data (`transactionDataDecoded`; a
`qes_data.external_link` entry gives "View the unsigned document"). The
response call signs the transaction data: there is no separate sign step.

**After the send**: when `presentation.responseRedirectUri` is not blank,
open it in a new tab (warn when the browser blocks the popup); read the
lists again.

## 6. Shared credentials

The stats cards ARE the filter: Total, "Presentation Shared" (green,
`presentation_acked`), "Presentation Pending" (orange,
`presentation_pending`); a click on an active card clears it. Status chips:
Shared `#34C759` on `#F0FFF4`; Pending `#FF9500` on `#FFF8EE`; Refused red on
`#FFF2F1`.

Type label chain: the shared credentials (`presentation[]`: `type[last]`,
then `doctype`, then `vct`, joined), else the request
(`dcqlQuery.credentials[].meta`: `doctype_value`, `vct_values`,
`type_values`). A pending row opens the share wizard again; a shared row
opens a detail with one card for each shared credential: its `claims`
(SD-JWT VC, mdoc) or `credentialSubject` (W3C VC), with the blur toggle and
the standard claims renderer.

## 7. Notifications

Inbox title "Credential State Notifications"; an optional state filter (All,
Acknowledged, Pending, Expired, Revoked, sent as `notificationType=`). Row:
44 px avatar | title (chain: `credential.vct`, `issuerAuth.docType`,
`vc.type[0]`, configuration `vct`, `credential_definition.type[0]`,
`doctype`, display names, "Unknown"; the items of the content joined,
"Unknown" items dropped) | issuer name | relative time ("Just now", "Xm ago",
"Xh ago", then the date) | type chip | action. An unread row has a bold
title.

Chip colours: pending and acknowledged orange on `#FFF8EE`; revoked red on
`#FFF2F1`; expired grey.

**Action table** (the first match wins, on `notificationContent[0]`):

| Action | Condition | Button text | Handler | When it is done |
| --- | --- | --- | --- | --- |
| informational | type `credential_revoked` or `credential_expired` | "The issuer revoked the credential." or "The credential expired and cannot be used." | a click marks it as read | |
| `deferred_credential` | pending and `acceptanceToken` set | "Get the credential" | `deferred-credential`; when the issuer is not ready, show the wait (`deferredIntervalSeconds`) | the row changes in place to `credential_acked`: keep it |
| `transaction_code` | pending and `requiresTransactionCode` | "Enter the transaction code to continue" | a code input sized and typed by `txCode` (`length` 0: 4 to 12 characters) | delete the row (the wallet makes a new one) |
| `authorization` | pending, `oauthFlow` `frontchannel`, `authorisationRequest` set | "Authorise the credential issuance" | open the URL; exchange `?code`, `?state` and `?iss` on the return when the portal is the `redirectUrl` | the row changes in place: keep it |
| `verification` | pending and `presentationId` set | "Provide additional details to continue" | the share wizard on that presentation | delete the row after the share (the wallet makes a new one) |
| `review_credential` | `credential_acked` | "Review the credential" | the detail view in review mode | accept or refuse, then delete the row |

A row in progress shows "Processing...". "Clear all" deletes the whole inbox
(typed confirmation in the reference wallet). A wrong transaction code shows
the `errorDescription` of the 400 answer.

Caution: a delete of a `credential_acked` notification whose credential is
still `credential_acked` also deletes the credential (the offer is refused).
The delete icon of such a row says "Refuse and delete".

SSE: a new notification goes to the top of the list and can show a snackbar
(at most about 5 at a time, 6 s). A pending notification that changes in
place comes again with the same id: replace the row. A status change and a
delete send no frame. A reconnect resumes from the last frame id (replay);
also read the list again after each connect.

## 8. Input UX

The reference wallet has no camera scan: offers and verification requests go
into a required textarea ("Enter Credential Offer URL", "Enter Verification
Request URL"). The wallet always uses its own holder key, so there is no key
choice. A pasted verification request goes to the wallet as it is, in
`requestUrl`. A deep link with `request_uri` can open and send the respond
step at once.

## 9. Palette

Text `#1d1d1f`, secondary `#86868b`, borders `#d2d2d7`, green `#34C759`,
orange `#FF9500`, red `#FF3B30`, blue `#007aff`. Use `igrantio-usecase-ui`
for the full iGrant.io look, or change the style as you like: the reference
components have no style dependency.
