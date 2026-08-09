---
name: igrantio-holder-frontend
description: Build the browser UI for an EUDI Wallet / European Business Wallet HOLDER portal against the iGrant.io Organisation Wallet Suite - the customer-facing wallet frontend. Receive credential offers (OpenID4VCI - transaction code, front-channel authorization, deferred), show received/archived credentials with per-format claim rendering, blur-by-default personal data, and trust-list badges, answer verifier presentation requests through the full DCQL selection wizard (credential-set OPTION groups, claim-set disclosure profiles, multiple-instance pick, transaction-data consent), and drive everything from the live notifications inbox. Composes igrantio-frontend-client and igrantio-holder-notifications; talks to igrantio-holder-backend.
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, holder, wallet portal, OpenID4VCI, OpenID4VP, DCQL, claim sets, credential sets, trust list, notifications
  version: 2026.08.03
  api: https://docs.igrant.io/docs/developer-apis
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC, W3C-VC-2.0, mso_mdoc
  auth: none in the browser - the holder backend injects the OWS API key
  requires-skills: igrantio-ows-overview, igrantio-frontend-client, igrantio-holder-backend, igrantio-holder-notifications
---

# iGrant.io holder frontend (wallet portal)

## When to use
Build the holder-side portal a customer's users see: the organisation's
wallet that receives, holds, and presents credentials. Ships the complete
flow logic and reference views so an integrator scaffolds a working portal
first and restyles it after. Depends on `igrantio-frontend-client` (vendored
at `src/lib/ows/`) and an `igrantio-holder-backend` deployment; the exact
endpoint contract is in `igrantio-api-holder` and
`igrantio-holder-backend/references/holder-api-reference.md`. Issuer and
verifier UIs are separate skills.

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each. (Webhooks: not needed - the holder runs on the notifications stream. Additionally ask: full `HolderPortal` scaffold or individual views, and default look (`igrantio-usecase-ui`) or the integrator's design system.)

## What it provides
- **`holderClient.ts`** - typed client for every holder endpoint (receive /
  user-pin / exchange-code / receive-deferred / accept / configure /
  reissuance / revocation-status / list / delete; v3 presentation
  receive / read / send / list + v2 filter / delete; wallet-unit status).
- **`shareSelection.ts`** - the pure DCQL selection engine: pre-flight
  validation ("Requested data is not present in holder"), required-first
  step ordering, OPTION groups with "None", claim-set disclosure profiles
  with claim previews, `multiple:true` instance picks, submit gating, and
  the uniform `{id, credentialId|credentialIds, claimIds?}` payload.
- **`credentialDisplay.ts`** - every display fallback chain: titles (list vs
  detail), format labels, issuer/verifier identity, per-format claim
  extraction with the excluded-key set, validity dates, notification
  title/issuer/time, status-chip palette, wallet-unit ladder.
- **`useHolder.ts`** - hooks: `useWalletCredentials`, `useSharedPresentations`,
  `useWalletUnitStatus`, `useReceiveCredential` (with
  `captureAuthorizationCode()` for the front-channel return leg),
  `useShareFlow`, `useHolderNotifications` (list + live SSE).
- **`components/`** - working views: `HolderPortal` (full scaffold: status
  bar + bell + drawer inbox + snackbars + deep-link capture),
  `ReceivedCredentialsView` (stats, active/archived, auto-present, refresh),
  `SharedCredentialsView` (stats-as-filter, disclosed-claims detail,
  presentation lifecycle), `BaseConfigurationView` (wallet solution settings
  + wallet-unit stepper), `ShareWizard`, `ReceivePanel`,
  `NotificationsInbox` (state filter + search), `NotificationSnackbars`
  (max 5 toasts, 6s auto-hide, dedupe), `CredentialDetail` (blur-by-default
  claims, portraits, age chips, copy, review mode), `TrustBadge` (green/red
  trust-list shield with provider details), `ClaimsTable`, `LifecycleModal`
  (+ wallet-unit and presentation stage data), `Drawer`, `NotificationBell`
  (99+/nK+ count formatting).
- **`portal-ux-reference.md`** - the distilled UX rules of the reference
  wallet (conditions → UI behaviour) for building custom views.

## Flow (what happens)
1. **Receive**: paste an `openid-credential-offer://…` URI →
   `POST …/credential/receive` → branch on the record: transaction code
   (`user-pin`), front-channel (open `authorizationRequest`, exchange
   `?code`/`?state`), deferred (retry until `credential_acked`), then
   review → accept or reject.
2. **Share**: paste/deep-link an `openid4vp://…` request →
   `verification/receive` → `{id}/filter` → pre-flight → the selection
   wizard → `{presentationId}/send` → open `responseRedirectUri` when
   returned. Transaction data (SCA / QES / data agreements) is shown before
   consent and signed through the send call itself.
3. **Notifications** drive both flows: the SSE inbox derives each row's next
   action (decision table in `igrantio-holder-notifications`); deleting the
   notification is the "handled" signal.

## Steps
1. Vendor `igrantio-frontend-client/references/lib/ows` into `src/lib/ows/`.
2. Copy [`./references/features/holder`](./references/features/holder) into
   `src/features/holder/` (includes the vendored `notificationsClient.ts`).
3. Wire it up:
   ```tsx
   <HolderPortal proxyBaseUrl="https://host/ows/acme" />
   ```
   or compose the individual views/hooks into your own shell - every view
   needs only `proxyBaseUrl`.

## Clean-code notes
- Flow logic lives in hooks, selection rules in `shareSelection.ts` (pure,
  unit-testable), display chains in `credentialDisplay.ts`; components carry
  no OWS specifics and take no styling dependency - restyle or replace them
  freely (pair with `igrantio-usecase-ui` for the default look).
- Personal data renders blurred until the user toggles the eye - keep that
  default in custom views.
- Show the `TrustBadge` wherever an issuer or verifier name appears.

## Related skills
- `igrantio-api-holder` - the normative endpoint/field/enum dictionary for
  every call this UI makes (paths, SSE frame protocol, sandbox call style).
- `igrantio-holder-backend` - the tenant backend this UI talks to (proxy +
  notifications SSE relay); its `holder-api-reference.md` is the narrative
  contract.
- `igrantio-holder-notifications` - the notification decision table and the
  vendored `notificationsClient.ts`.
- `igrantio-usecase-ui` - the default iGrant.io look (theme, app shell,
  primitives) if the integrator wants it; the components here are unstyled
  on purpose.
- `igrantio-dcql-*` workflow skills (claim sets, credential sets, multiple
  statements, KYC, student pass) - ready-made verifier requests to exercise
  every branch of the share wizard.
- `igrantio-credential-schema-*` - the claim structures of the credentials
  the wallet will hold (PID, mDL, Photo ID, …).

## Validation / done criteria
- `npm run typecheck` passes.
- Receiving a pre-authorised offer with a transaction code lands the
  credential after the code is entered; rejecting deletes it.
- A DCQL request with credential sets renders OPTION groups, a claim-set
  request previews exactly the selected profile's claims, and the send
  payload matches the uniform shape rules.
- A verifier on the trust list shows the green badge with provider details;
  one not on it shows the red badge.
- No OWS API key is present anywhere in the browser bundle.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
