---
name: igrantio-business-wallet-portal
description: Umbrella recipe for building a CUSTOM European Business Wallet (EBW) portal on the iGrant.io Organisation Wallet Suite - the path most customers take. Orchestrates the holder skills end to end - deploy the tenant backend (igrantio-holder-backend), scaffold or hand-build the portal UI (igrantio-holder-frontend), run everything on the live notifications inbox (igrantio-holder-notifications), and look up exact endpoints in igrantio-api-holder - with the page-by-page build order (base configuration, received credentials, shared credentials, share wizard, notifications), EBW onboarding to a valid wallet unit, and DCQL test requests. Use when an organisation wants its own business wallet portal with only holder functions.
license: Apache-2.0
metadata:
  categories: [recipe]
  provider: iGrant.io
  keywords: EUBW, EBW, European Business Wallet, EUDIW, eIDAS2, holder, wallet portal, custom portal, OpenID4VCI, OpenID4VP, DCQL, notifications, Next.js, TypeScript, Better Auth, passwordless
  version: 2026.11.02
  api: https://docs.igrant.io/docs/developer-apis/
  protocols: OpenID4VCI-1.0, OpenID4VP-1.0, DCQL, SD-JWT-VC, W3C-VC-2.0, mso_mdoc
  auth: OWS API key held only by the holder backend; the portal browser sends no key
  requires-skills: igrantio-ows-overview, igrantio-holder-backend, igrantio-holder-frontend, igrantio-holder-notifications
---

# iGrant.io business wallet portal (umbrella)

## When to use
A customer organisation wants its **own** business wallet portal - their
branding, their pages, only holder functions (receive, hold, present,
notifications) - on the iGrant.io OWS APIs. This skill is the route map: it
does not duplicate any contract; it tells you which skill to open for each
part and in which order. For a single missing fact (a path, an enum, a
payload), go straight to `igrantio-api-holder`.

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

The holder role needs no webhook URL: the portal runs on the notification
stream. Do not ask for one. Then ask the portal questions below.

## Portal intake (ask after the questions above)
1. **Stack** - which web stack? _Recommend **Next.js (App Router) +
   TypeScript** with **Better Auth** passwordless login (see "Recommended
   stack" below); accept the customer's standing stack if they have one._
2. **Scope** - which pages? _Recommend all four: base configuration,
   received credentials, shared credentials, notifications._
3. **Scaffold or custom** - start from the ready `HolderPortal` scaffold and
   restyle, or build custom views on the hooks + engines?
   _Recommend the scaffold first; every view works standalone._
4. **Look** - the customer's design system, or the default iGrant.io look
   (`igrantio-usecase-ui`)? _The reference components are unstyled on purpose._
5. **EBW onboarding state** - is the wallet unit of the organisation already
   `valid` (a Wallet Unit Attestation and an Owner ID (LPID) held)? If not,
   plan step 7.
6. **Front-channel return** - must the issuer redirect back to the portal
   after an authorisation? _Default no: the wallet exchanges the code on its
   own callback URL. Yes: set `redirectUrl` of the holder configuration to
   the portal page._

## Recommended stack
Unless the customer has a standing choice, recommend and scaffold:
- **Next.js (App Router) + TypeScript** for the portal
  (`npx create-next-app@latest --typescript`). All reference code is strict
  TypeScript; mount the holder views in client components (`"use client"`) -
  they use `EventSource`, the clipboard, and `window`.
- **Better Auth (<https://www.better-auth.com>) for passwordless portal
  login** - magic link or email one-time code (add passkeys where wanted),
  so that portal users sign in without passwords. Protect the portal routes
  with the Better Auth session (middleware). The portal login is
  **separate from the wallet**: the OWS API key stays only in the holder
  backend, whoever signs in.
- Run the holder backend (the Express reference) as its own service beside
  the Next.js app. Set its `CORS_ORIGINS` to the portal origin; for
  multi-user portals, verify the Better Auth session in a proxy middleware
  before forwarding to OWS.

## Build order

| # | Step | Skill to open |
| --- | --- | --- |
| 1 | Architecture, glossary, intake | `igrantio-ows-overview` |
| 2 | Deploy the tenant backend: a proxy that hides the API key and forwards only the holder routes, and the relay of the notification stream (port 6003; no webhook URL) | `igrantio-holder-backend` |
| 3 | Scaffold the portal in the Next.js + TypeScript app: vendor `lib/ows`, copy `features/holder`, mount `<HolderPortal proxyBaseUrl="https://wallet-portal.example.com/ows/<tenant>"/>` in a client component | `igrantio-holder-frontend` |
| 4 | Portal login: passwordless sign-in (magic link or email one-time code) in front of the portal routes | Better Auth (see Recommended stack) |
| 5 | Wire the live inbox: the SSE stream and the decision table (deferred, transaction code, authorisation, presentation during issuance, review). Delete a notification only as the table says: a delete of a `credential_acked` notification refuses the offer | `igrantio-holder-notifications` (already vendored by step 3) |
| 6 | Restyle: put the components without style into the design system of the customer, or use the default look | customer design system, or `igrantio-usecase-ui` |
| 7 | EBW onboarding: bring the wallet unit to `valid`: the Wallet Unit Attestation, then the Owner ID (LPID) | `igrantio-ebw-owner-id` |
| 8 | Test every flow end to end | DCQL workflow skills (below) |

## Page map (portal page and where its rules and code are)

All UI rules: `igrantio-holder-frontend/references/portal-ux-reference.md`.
All endpoint contracts: `igrantio-api-holder` +
`igrantio-holder-backend/references/holder-api-reference.md`.

| Portal page | Reference implementation |
| --- | --- |
| Base configuration (wallet settings, holder configuration with the trust settings, wallet unit stepper) | `components/BaseConfigurationView.tsx`, `components/lifecycle.tsx` |
| Received credentials (stats, active and archived, status, refresh, batches) | `components/ReceivedCredentialsView.tsx` |
| Credential detail (claims of each format, blur, portraits, trust badges, accept or refuse) | `components/CredentialDetail.tsx`, `ClaimsTable.tsx`, `TrustBadge.tsx` |
| Receive flow (offer paste, deferred, transaction code, front channel) | `components/ReceivePanel.tsx`, `useHolder.ts` |
| Share wizard (matching credentials, options, claim sets, `multiple`) | `components/ShareWizard.tsx`, `shareSelection.ts` (pure engine) |
| Shared credentials (stats-as-filter, disclosed claims, lifecycle) | `components/SharedCredentialsView.tsx` |
| Notifications (bell, drawer inbox, state filter, snackbars) | `components/NotificationsInbox.tsx`, `NotificationSnackbars.tsx`, `ui.tsx` |

## EBW specifics
- Use an API key of the main organisation. The held credential routes
  (receive, the credential list and actions, the matching credentials)
  answer 400 for a key of a sandbox organisation.
- The wallet unit ladder controls the receive: `not_installed`,
  `installed`, `operational`, `valid`. "+ Receive" and the presentations
  need `operational` or `valid`. `valid` means that the wallet holds a
  Wallet Unit Attestation and an Owner ID (LPID); get it with
  `igrantio-ebw-owner-id`.
- Trust: the holder configuration says which issuers and verifiers the
  wallet trusts (`requiresTrustedCredentialSigner`,
  `requiresTrustedIssuer`, `requiresTrustedStatusIssuer`,
  `requiresTrustedRelyingParty`, each with an accepted list of trust
  sources; see `igrantio-api-holder` and `igrantio-api-trust-anchor`). The
  trust badges of the portal show the result of each check; with a switch
  off, they show "Not checked".
- The credentials that a business wallet often holds have schema skills
  (`igrantio-credential-schema-lpid`,
  `igrantio-credential-schema-certificate-of-registration`, and more); start
  from `igrantio-schema-discovery` when you are not sure.

## Testing the portal
Exercise every wizard branch with the ready-made verifier requests:
`igrantio-dcql-credential-sets` (OPTION groups),
`igrantio-dcql-claim-sets` (disclosure profiles),
`igrantio-dcql-multiple-statements` (`multiple:true`),
`igrantio-dcql-student-pass` (mandatory + optional),
`igrantio-dcql-trusted-authority` (trusted authorities). Issue test
credentials with `igrantio-issuer-backend` and `igrantio-issuer-frontend`,
or in the iGrant.io dashboard.

## Validation / done criteria
- The four pages work against a deployed holder backend; the browser bundle
  holds no OWS API key.
- An end-to-end pass succeeds: receive an offer (with a transaction code),
  accept it, answer the DCQL request of a verifier, share the selected
  claims, and see "Presentation Shared" in the shared list, with the
  notifications inbox driving each step.
- The wallet unit gate and the trust badges behave as
  `portal-ux-reference.md` says.

## Documentation
When anything is unclear, consult the iGrant.io documentation before you
guess. If this skill and the documentation disagree, the documentation wins.

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis/
- Holder API group: https://docs.igrant.io/docs/category/openid4vc-api/holder/
- Getting started: https://docs.igrant.io/docs/get-started/
- Workflow: issue a credential (OpenID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Workflow: send and verify credentials (OpenID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
