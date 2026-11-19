---
name: igrantio-holder-frontend
description: Build the browser UI for an EUDI Wallet / European Business Wallet HOLDER portal against the iGrant.io Organisation Wallet Suite - the customer-facing wallet frontend. Receive credential offers (OpenID4VCI - transaction code, front-channel authorisation, deferred), show received and archived credentials with claim rendering for each format, personal data blurred by default, and trust badges from the trust checks of the wallet, answer verifier presentation requests through the full DCQL selection wizard (credential set options, claim set disclosure options, several credentials for one query, transaction data before consent), and drive everything from the live notifications inbox. Composes igrantio-frontend-client and igrantio-holder-notifications; talks to igrantio-holder-backend.
license: Apache-2.0
metadata:
  categories: [frontend]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, holder, wallet portal, OpenID4VCI, OpenID4VP, DCQL, claim sets, credential sets, trust check, TrustedListCheck, notifications, Next.js, TypeScript, Better Auth, passwordless
  version: 2026.11.02
  api: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC, W3C-VC-2.0, mso_mdoc
  auth: none in the browser - the holder backend adds the OWS API key
  requires-skills: igrantio-ows-overview, igrantio-frontend-client, igrantio-holder-backend, igrantio-holder-notifications
---

# iGrant.io holder frontend (wallet portal)

## When to use
Build the holder-side portal that the users of a customer see: the wallet
of the organisation, which receives, holds and presents credentials. The
skill ships the complete flow logic and reference views, so that an
integrator gets a working portal first and changes the style after. It
needs `igrantio-frontend-client` (vendored at `src/lib/ows/`) and a running
`igrantio-holder-backend`. The exact contract is in `igrantio-api-holder`
and `igrantio-holder-backend/references/holder-api-reference.md`. The issuer
and verifier user interfaces are separate skills.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **environment** the key belongs to: demo (`https://demo-api.igrant.io`,
  the default), staging (`https://staging-api.igrant.io`) or production
  (`https://api.igrant.io`). A key works only in its own environment.

## Ask the integrator first
Ask one question at a time. Wait for the answer. Give the recommended
default with each question. Look up facts in the project (framework,
environment variables, an existing backend) instead of asking for them.
Record the answers before you write code.

1. **Environment** - demo, staging or production? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - do you have the OWS API key for that environment? If not,
   request it from [support@igrant.io](mailto:support@igrant.io) before you
   continue.
3. **Framework** - React, Next.js, or another? _Look it up in the project
   before you ask._
4. **Scaffold** - the full `HolderPortal` scaffold, or single views?
   _Recommend the scaffold first._
5. **Look** - the default iGrant.io look (`igrantio-usecase-ui`), or the
   design system of the integrator?

The holder role needs no webhook URL: the portal runs on the notification
stream. Do not ask for one.

## What it provides
- **`holderClient.ts`** - a typed client for the holder routes under
  `/v4/config/ows/holder`: receive (an offer, or a wallet-initiated issuance
  with `credentialIssuer` and `credentialConfigurationIds`), transaction
  code, authorisation code exchange, deferred credential, acceptance,
  re-issuance, revocation status, list, read, delete; presentations receive
  (`requestUrl`), read, matching credentials, response, list, delete; the
  holder configuration (read, partial update); the issuer metadata; the
  wallet unit status. It also has the types of the records and of
  `TrustedListCheck`.
- **`shareSelection.ts`** - the pure DCQL selection engine: the pre-flight
  check, the step order (required sets first), the options with "None",
  the claim set options with claim previews (only the options that the
  chosen credential answers), several credentials for a `multiple: true`
  query, the submit gate, and the `credentials` items of the response call
  in the form that the wallet takes (see "Share" below).
- **`credentialDisplay.ts`** - every display fallback chain: titles (list
  and detail), format labels, issuer and verifier identity, the claims of
  each format with the excluded keys, validity dates, the notification
  title, issuer and time, the status chip colours, the wallet unit ladder,
  and `trustCheckView` (the plain-word view of a trust check).
- **`useHolder.ts`** - hooks: `useWalletCredentials`, `useSharedPresentations`,
  `useWalletUnitStatus`, `useHolderConfiguration`, `useReceiveCredential`
  (with `captureAuthorizationCode()` for the front-channel return),
  `useShareFlow`, `useHolderNotifications` (list and live SSE), and
  `errorMessage` (the `errorDescription` of an error answer).
- **`components/`** - working views: `HolderPortal` (the full scaffold:
  status bar, bell, drawer inbox, snackbars, deep-link capture),
  `ReceivedCredentialsView` (stats, active and archived, status, refresh,
  one row for each batch), `SharedCredentialsView` (stats as filter,
  disclosed claims, presentation lifecycle), `BaseConfigurationView` (wallet
  settings, the holder configuration with its trust settings, the wallet
  unit stepper), `ShareWizard`, `ReceivePanel`, `NotificationsInbox` (state
  filter and search), `NotificationSnackbars` (at most 5 toasts, 6 s, no
  repeats), `CredentialDetail` (claims blurred by default, portraits, age
  chips, copy, review mode), `TrustBadge`, `ClaimsTable`, `LifecycleModal`,
  `Drawer`, `NotificationBell` (99+ and nK+ count format).
- **`portal-ux-reference.md`** - the UX rules of the reference wallet
  (condition, then behaviour of the user interface) for custom views.

## Flow (what happens)
1. **Receive**: paste an `openid-credential-offer://` link, then
   `POST .../holder/credentials` with `{credentialOffer}`, then follow the
   record (the first match wins): deferred (`acceptanceToken` set,
   `.../deferred-credential`, again after `deferredIntervalSeconds` until
   `credential_acked`), transaction code (`requiresTransactionCode`,
   `.../transaction-code`), front channel (`oauthFlow` `frontchannel`: open
   `authorisationRequest`; when the portal is the `redirectUrl`, exchange
   `?code`, `?state` and `?iss` with `.../authorisation-code-exchanges`),
   then review: accept (`.../acceptance`) or refuse (`DELETE`).
2. **Share**: paste or deep-link an `openid4vp://` request, then
   `POST .../holder/presentations` with `{requestUrl}`, then
   `.../matching-credentials`, the pre-flight check, the selection wizard,
   and `.../response` with `{credentials: [...]}`. The first item decides the
   form of all items: when a chosen query has `multiple: true`, every item
   has `credentialIds`; else every item has `credentialId`. `claimIds` is
   only on the items of a query with `claim_sets`. Open
   `responseRedirectUri` when it is not empty. Show the transaction data
   before consent; the response call signs it. A request with `status`
   `request_refused` shows `refusalReason`.
3. **Notifications** drive both flows: the inbox takes the next action of
   each row from its content (table in `igrantio-holder-notifications`).
   Delete a notification only as that table says: a delete of a
   `credential_acked` notification of a credential that is not accepted
   refuses the offer and deletes the credential.
4. **Trust badges**: a held credential shows
   `credentialSignerTrustedListCheck` next to the issuer name (the detail
   view also shows `issuerTrustedListCheck` and
   `statusIssuerTrustedListCheck` when they are set); a presentation shows
   `relyingPartyTrustedListCheck` next to the verifier name. `trusted` is
   green, `not_trusted` and `not_found` are red, `not_applicable` (the trust
   setting is off) and a missing check are a neutral grey "Not checked",
   `error` is orange. The detail panel shows the listed name
   (`entry.provider.tSPName`), the trust source (`entry.source.name`), the
   reason or warning (`message`), and the signer certificate.

## Steps
1. Host app: recommend **Next.js (App Router) + TypeScript**
   (`npx create-next-app@latest --typescript`) when the integrator has no
   stack yet. The holder views run in client components (`"use client"`):
   they use `EventSource`, the clipboard and `window`. For the portal
   sign-in, recommend **Better Auth** passwordless (magic link or email
   one-time code); see `igrantio-business-wallet-portal`. The portal login is
   separate from the wallet: the OWS key never reaches the browser.
2. Vendor `igrantio-frontend-client/references/lib/ows` into `src/lib/ows/`.
3. Copy [`./references/features/holder`](./references/features/holder) into
   `src/features/holder/` (it has the vendored `notificationsClient.ts`).
4. Wire it up:
   ```tsx
   <HolderPortal proxyBaseUrl="https://wallet-portal.example.com/ows/acme" />
   ```
   or put the single views and hooks in your own shell: every view needs
   only `proxyBaseUrl`.
5. For a front-channel issuance that returns to the portal, set
   `redirectUrl` of the holder configuration to the portal page that mounts
   `ReceivePanel`. With an empty `redirectUrl`, the wallet exchanges the
   code on its own callback URL, and the inbox row changes to
   `credential_acked` on its own.

## Clean-code notes
- The flow logic is in hooks, the selection rules in `shareSelection.ts`
  (pure, easy to unit test), the display chains in `credentialDisplay.ts`.
  The components have no OWS specifics and no style dependency: change or
  replace them (use `igrantio-usecase-ui` for the default look).
- Personal data shows blurred until the user toggles the eye. Keep that
  default in custom views.
- Show the `TrustBadge` wherever an issuer or verifier name appears. Use
  plain words, not algorithm names.

## Related skills
- `igrantio-api-holder` - the field and enum dictionary of every call of
  this user interface (paths, SSE frames, sandbox call style).
- `igrantio-holder-backend` - the tenant backend of this user interface
  (proxy and notification stream relay); its `holder-api-reference.md` is
  the contract in flow order.
- `igrantio-holder-notifications` - the notification decision table and the
  vendored `notificationsClient.ts`.
- `igrantio-api-trust-anchor` - the trust sources and the `TrustedListCheck`
  shape behind the trust badges.
- `igrantio-usecase-ui` - the default iGrant.io look (theme, app shell,
  primitives); the components here have no style on purpose.
- `igrantio-dcql-*` workflow skills (claim sets, credential sets, multiple
  statements, student pass, trusted authority) - ready verifier requests
  that test every branch of the share wizard.
- `igrantio-credential-schema-*` - the claim structures of the credentials
  that the wallet holds (PID, mDL, LPID, and more).

## Validation / done criteria
- `npm run typecheck` passes.
- A pre-authorised offer with a transaction code lands the credential after
  the code; a deferred offer shows the deferred step and keeps the inbox row
  (it changes to `credential_acked`); refuse deletes the credential.
- A DCQL request with credential sets shows the options; a claim set
  request previews exactly the claims of the chosen option; a request with
  a `multiple: true` query sends `credentialIds` in every item.
- A verifier whose signer a trust source holds shows a green badge with the
  listed name; with the trust setting off, the badge is grey "Not checked".
- No OWS API key is anywhere in the browser bundle.

## Documentation
When anything is unclear, consult the iGrant.io documentation before you
guess. If this skill and the documentation disagree, the documentation wins.

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis/
- Holder API group: https://docs.igrant.io/docs/category/openid4vc-api/holder/
- Getting started: https://docs.igrant.io/docs/get-started/
- Workflow: issue a credential (OpenID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Workflow: send and verify credentials (OpenID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
