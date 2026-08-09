# Holder portal UX reference

The behavioural specification of the iGrant.io reference wallet's holder
pages, distilled so a customer portal can reproduce (or deliberately diverge
from) each rule. The API contract lives in
`igrantio-holder-backend/references/holder-api-reference.md`; this file is
about what the UI does with it. The reference implementation in
`features/holder/` encodes every rule below.

## 1. Portal structure

Three views (plus a base-configuration page in the reference wallet):

| View | Data | Notes |
| --- | --- | --- |
| Received credentials | `GET …/sdjwt/credentials` with `credentialStatus=credential_accepted` | Two tables from the SAME endpoint: Active (`expired=false`) and Archived (`expired=true`). There is no separate expired route. |
| Shared credentials | `GET …/sdjwt/verifications` | Stats double as status filters. |
| Notifications | list + SSE stream | The holder's action centre; a badge with the count sits on the wallet menu/tab. |

Default sort: received by `createdAt` desc, shared by `updatedAt` desc - the
API only honours `sortOrder` on those fields. Search is a single box per
table ("Search by Credential Type, Issuer"), debounced ~100ms.

## 2. Gating

- **Deployment gate**: wallet actions need a deployed wallet; configuration
  buttons stay disabled until deployed and a secure vault exists.
- **Wallet-unit gate**: the "+ Receive" action is enabled only when
  `wallet-unit/status` is `operational` or `valid`. The status ladder
  (`not_installed → installed → operational → valid`) renders as a 4-dot
  stepper; only the current dot is coloured (red / `#FFF36D` / orange /
  `#2f9e44`), the rest grey `#D3D3D3`. Below `operational`, show a
  "wallet unit not provisioned" warning.

## 3. Received credentials

**Columns**: Credential Type | Issuer (+ trust badge) | Credential Format |
Auto Present (Active) or Status (Archived: "Revoked" red / "Expired" grey) |
Date Received (sortable) | actions.

**Stats row**: Total (black), Active (green `#34C759`), Archived (orange
`#FF9500`) - big number + uppercase 11px label.

**Display-name chain (list)**: `credentialConfigurations.credential_definition.type[]`
join → `credentialConfigurations.vct` → `credential.issuerAuth.docType` →
`credential.vc.type[0]` → "Unknown". The detail view uses a DIFFERENT chain:
`display[0].name` → `credential_metadata.display[0].name` → `vc.type` join.
When a title is an http(s) URL, fetch it and use `data.name ?? data.display.name`.

**Format labels**: `mso_mdoc` → "ISO 18013-5 mdoc/mDL"; `dc+sd-jwt` /
`vp+sd-jwt` / `vc+sd-jwt` / `sdjwt` → "IETF SD-JWT VC"; `jwt_vc` /
`jwt_vc_json` → "W3C VC (JWT)". Structural fallbacks: `nameSpaces` → mdoc,
`vc.credentialSubject` → W3C, `vct`/`dataAgreement` → SD-JWT.

**Row actions**:
- Auto-present toggle → `PUT …/credential/{credentialId}/configure`
  `{autoPresent}`; disabled while `credential_pending`.
- Refresh (Active only) → fire revocation-status check AND reissuance request
  together, swallow "does not support revocation/reissuance" errors, then
  refetch. Disabled when `revocationStatus === "Revoked"` or still pending.
- View is enabled when `credentialStatus` is `credential_acked` or
  `credential_accepted`.
- Delete asks for typed confirmation ("DELETE") in the reference wallet.

**Date column**: shows the ISSUANCE date, not createdAt - mdoc
`issuerAuth.validityInfo.validFrom` (a "YYYY-MM-DD HH:mm:ss UTC" string) →
`vc.issuanceDate` → unix `credential.iat`. Format "MMM D, YYYY, HH:mm".

## 4. Credential detail view

Banner (`display.background_image.uri` → `issuer.cover` → default, treating
the literal value "not discoverable" as absent) + circular issuer logo (same
chain with `issuer.logo`). Title + format chip + eye toggle + copy.

**Claims per format**: mdoc → first namespace of `credential.nameSpaces`
minus `dataAgreement`; W3C JWT → `vc.credentialSubject` (or its nested
`credentialSubject`) minus `dataAgreement`; SD-JWT → `vc.credentialSubject`
minus excluded keys and `id`; legacy SD-JWT → the credential root minus
excluded keys. Excluded keys: `exp iat iss jti nbf sub _sd_alg vct status cnf
dataAgreement transaction_data_types schema_uri#integrity` plus any key
starting `vct`/`transaction_data_types`.

**Rendering rules**: base64 values on portrait-like keys
(`portrait|photo|image|face`) render as a 120px circular avatar; `age_over_18`
becomes an "Above 18"/"Under 18" chip; nested objects render as indented
sections, flattened to dotted keys from depth 3; arrays of objects get
numbered section headers. **Personal data starts blurred** (`blur(4px)`)
every time the view opens; one eye toggle governs the whole view.

**Trust badge** (issuer AND verifier surfaces): `isVerifiedWithTrustList`
true → green (`#2e7d32`) shield, clickable, opens the `trustServiceProvider`
details, long text "Trusted Service Provider", tooltip "This is a verified
organisation". False → red (`#d32f2f`) shield, not clickable, "Untrusted
Service Provider" / "This organisation is not verified".

**Review mode** (credential arrived via a notification with
`credential_acked`): footer becomes Reject (DELETE the credential) / Accept
(`PUT …/accept`); both then delete the notification.

## 5. Sharing - filtered credentials (the selection engine)

Flow: `verification/receive` (v3) → `verification/{id}/filter` (v2) →
pre-flight → selection UI → `verification/{presentationId}/send` (v3).

**Pre-flight** (before any UI): with `credential_sets`, every `required` set
must have at least one option whose descriptors ALL have matches, and not all
descriptors may be empty; without `credential_sets`, EVERY descriptor must
have a match. Failure → snackbar "Requested data is not present in holder".
The asymmetry is deliberate: optional alternatives may legitimately match
nothing. Descriptors with zero matches are silently dropped from the UI,
never shown greyed.

**Wizard**: one step per credential set, sorted required-first (and among
required, single-choice first). Multi-step flows show "Additional data has
been requested. Click next to proceed." and the button label switches
Next → Confirm on the last step with available credentials.

**OR alternatives** (`options.length > 1`): radios labelled "OPTION 01",
"OPTION 02", …; a "None" radio appears only for optional sets with more than
one available option inside a multi-step wizard. Preselection: required →
first option; optional → "None". Changing the radio resets the whole step.
Unselected options render greyed (`#bdbdbd`).

**`multiple: true`**: the instance carousel becomes multi-pick ("N instances
found. Swipe to select one or more to share"); required sets preselect the
first instance, optional sets start empty.

**`claim_sets`**: one radio per disclosure profile, each previewing exactly
the claims that set would disclose (claim `path` resolved against the match:
mdoc tries namespace-nested → dotted → flat; JWT drops the leading
`credentialSubject` segment). Default = set 0. Claims are NOT individually
togglable - the radio picks a whole set. An empty claim set previews nothing
rather than falling back to everything. Without claim sets, preview all match
entries minus the excluded keys (after stripping `$.`/`$.vc.credentialSubject.`
prefixes).

**Submit gating**: "None" passes only for optional sets; a chosen option
needs every descriptor satisfied (multiple → ≥1 instance; single → a
credential; claim sets → a chosen set). Required single-group steps are
locked on.

**Payload**: `[{id, credentialId | credentialIds, claimIds?}]` with a
UNIFORM shape across the array - any claim sets anywhere → items carry
`claimIds`; else any `multiple` → all items use `credentialIds` arrays; else
all use `credentialId` strings. Wrap as `{credentials}` when the record has a
`dcqlQuery`, `{inputDescriptors}` for legacy Presentation Exchange.

**Before consent**, show: verifier identity (`clientMetadata.clientName` /
`logoUri` / `location`, fallbacks "Unknown" / "Not Discoverable") + trust
badge; `transactionDataDecoded` entries - `data_agreement_record` /
`data_disclosure_agreement_record` → policy cards,
`qes_data.external_link` → "View Unsigned File" (PDF preview);
`dataAgreement.policy` → policy card. Transaction-data signing happens
through the send call itself - there is no separate sign step.

**After send**: if `presentation.responseRedirectUri` is non-blank, open it
in a new tab (warn if the popup is blocked); refresh the lists.

## 6. Shared credentials

Stats cards ARE the filter: Total / "Presentation Shared" (green,
`presentation_acked`) / "Presentation Pending" (orange,
`presentation_pending`); clicking an active card clears it. Status chips:
Shared `#34C759` on `#F0FFF4`; Pending `#FF9500` on `#FFF8EE`; holder-facing
label for `presentation_acked` is "Presentation Shared".

Type label chain: presented credentials (`presentation[]`: `type[last]` →
`doctype` → `vct`, joined) → else the request's `dcqlQuery.credentials[].meta`
(`doctype_value` / `vct_values` / `type_values`). Pending rows re-enter the
share wizard; acked rows open a detail with one collapsible card per
disclosed credential (collapsed by default only when there is more than one),
each with the blur toggle and the standard claims renderer.

## 7. Notifications

Inbox title "Credential State Notifications"; optional state filter
(All / Acknowledged / Pending / Expired / Revoked, sent as
`notificationType=`). Row: 44px avatar | title (chain: `credential.vct` →
`issuerAuth.docType` → `vc.type[0]` → configurations `vct` →
`credential_definition.type[0]` → `doctype` → display names → "Unknown";
array contents joined, "Unknown" entries dropped) | issuer name | relative
time ("Just now" / "Xm ago" / "Xh ago" / absolute) | type chip | action.

Chip colours: pending + acked orange on `#FFF8EE`; revoked red on `#FFF2F1`;
expired grey.

**Action decision table** (first match wins, on `notificationContent[0]`):

| Action | Condition | Button text | Handler |
| --- | --- | --- | --- |
| informational | type `credential_revoked` / `credential_expired` | "Credential revoked by issuer." / "Credential expired and cannot be used." | none |
| `transaction_code` | pending + `userPinRequired` + no `userPin` | "Click to enter transaction code to continue." | PIN input sized/typed by `txCode` |
| `authorization` | pending + no `acceptanceToken` + `oAuthFlow=="frontchannel"` + `authorizationRequest` | "Authorise credential issuance" | open URL; exchange `?code`/`?state` on return |
| `deferred_credential` | pending + `acceptanceToken` present | "Get the credential issued" | `receive-deferred`; delete the notification ONLY when the response is `credential_acked` |
| `verification` | pending + `presentationId` + no `acceptanceToken` | "Provide additional details to continue" | filter → share wizard |
| `review_credential` | `credential_acked` | "Get the credential issued" | detail view in review mode |

In-flight rows show a spinner + "Processing...". Deleting a notification is
the "handled" signal; "Clear all" deletes the whole inbox (typed confirmation
in the reference wallet). Wrong transaction code → surface "Invalid
transaction code, check and try again".

SSE: new notifications prepend to the list (dedupe by id) and may raise a
snackbar (max ~5 visible, 6s auto-hide). The stream emits only creations -
status changes and deletions produce no frame, and there is no replay on
reconnect, so refetch the list after reconnecting.

## 8. Input UX

No camera scanning exists in the reference wallet - offers and verification
requests are pasted into a required textarea ("Enter Credential Offer URL" /
"Enter Verification Request URL") with a Trust Anchor dropdown (default
`did:key`; choosing `x509` clears the optional Key Identifier). A pasted
verification value starting with `http(s)://` is sent verbatim. Deep links
carrying `request_uri` can auto-open and auto-submit the respond modal.

## 9. Palette

Text `#1d1d1f`, secondary `#86868b`, borders `#d2d2d7`, green `#34C759`,
orange `#FF9500`, red `#FF3B30`, blue `#007aff`. Pair with
`igrantio-usecase-ui` for the full iGrant.io look, or restyle freely - the
reference components take no styling dependency.
