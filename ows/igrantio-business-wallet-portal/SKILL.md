---
name: igrantio-business-wallet-portal
description: Umbrella recipe for building a CUSTOM European Business Wallet (EBW) portal on the iGrant.io Organisation Wallet Suite - the path most customers take. Orchestrates the holder skills end to end - deploy the tenant backend (igrantio-holder-backend), scaffold or hand-build the portal UI (igrantio-holder-frontend), run everything on the live notifications inbox (igrantio-holder-notifications), and look up exact endpoints in igrantio-api-holder - with the page-by-page build order (base configuration, received credentials, shared credentials, share wizard, notifications), EBW onboarding to a valid wallet unit, and DCQL test requests. Use when an organisation wants its own business wallet portal with only holder functions.
license: Apache-2.0
metadata:
  categories: [recipe]
  provider: iGrant.io
  keywords: EUBW, EBW, European Business Wallet, EUDIW, eIDAS2, holder, wallet portal, custom portal, OpenID4VCI, OpenID4VP, DCQL, notifications, Next.js, TypeScript, Better Auth, passwordless
  version: 2026.09.01
  api: https://docs.igrant.io/docs/developer-apis
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
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
  A key works only in its own environment.

## Ask the integrator first
Ask one question at a time. Wait for the answer. Give the recommended
default with each question. Look up facts in the project (framework,
environment variables, an existing backend) instead of asking for them.
Record the answers before you write code.

1. **Environment** - demo or staging? _Default demo
   (`https://demo-api.igrant.io`); a switch later is a configuration
   change._
2. **API key** - do you have the OWS API key for that environment? If not,
   request it from [support@igrant.io](mailto:support@igrant.io) before you
   continue.
3. **Webhooks** - none for the holder role; the portal runs on the
   notifications stream.

Then ask the portal questions below.

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
5. **EBW onboarding state** - is the organisation's wallet unit already
   `valid` (WUA + Owner ID/LPID issued)? If not, plan step 7.

## Recommended stack
Unless the customer has a standing choice, recommend and scaffold:
- **Next.js (App Router) + TypeScript** for the portal
  (`npx create-next-app@latest --typescript`). All reference code is strict
  TypeScript; mount the holder views in client components (`"use client"`) -
  they use `EventSource`, the clipboard, and `window`.
- **Better Auth (<https://www.better-auth.com>) for passwordless portal
  login** - magic link or email OTP (add passkeys where wanted) so portal
  users sign in without passwords. Protect the portal routes with the Better
  Auth session (middleware). Portal login is **orthogonal to wallet auth**:
  the OWS API key lives only in the holder backend, whoever is signed in.
- Run the holder backend (the Express reference) as its own service beside
  the Next.js app. Set its `CORS_ORIGINS` to the portal origin; for
  multi-user portals, verify the Better Auth session in a proxy middleware
  before forwarding to OWS.

## Build order

| # | Step | Skill to open |
| --- | --- | --- |
| 1 | Architecture, glossary, intake | `igrantio-ows-overview` |
| 2 | Deploy the tenant backend: API-key-hiding proxy scoped to holder endpoints + notifications SSE relay (port 6003; **no webhooks** - the holder runs on notifications) | `igrantio-holder-backend` |
| 3 | Scaffold the portal in the Next.js + TypeScript app: vendor `lib/ows`, copy `features/holder`, mount `<HolderPortal proxyBaseUrl="…/ows/<tenant>"/>` in a client component | `igrantio-holder-frontend` |
| 4 | Portal login: passwordless sign-in (magic link / email OTP) guarding the portal routes | Better Auth (see Recommended stack) |
| 5 | Wire the live inbox: SSE stream, decision table (transaction code / authorize / deferred / respond / review), delete-as-handled | `igrantio-holder-notifications` (already vendored by step 3) |
| 6 | Restyle: swap the unstyled components into the customer's design system, or apply the default chrome | customer design system, or `igrantio-usecase-ui` |
| 7 | EBW onboarding: bring the wallet unit to `valid` - WUA, then the Owner ID (LPID) | `igrantio-ebw-owner-id` |
| 8 | Test every flow end to end | DCQL workflow skills (below) |

## Page map (portal page → where its rules and code live)

All UI rules: `igrantio-holder-frontend/references/portal-ux-reference.md`.
All endpoint contracts: `igrantio-api-holder` +
`igrantio-holder-backend/references/holder-api-reference.md`.

| Portal page | Reference implementation |
| --- | --- |
| Base configuration (wallet settings + wallet-unit stepper) | `components/BaseConfigurationView.tsx`, `components/lifecycle.tsx` |
| Received credentials (stats, active/archived, auto-present, refresh) | `components/ReceivedCredentialsView.tsx` |
| Credential detail (per-format claims, blur, portraits, trust badge, accept/reject) | `components/CredentialDetail.tsx`, `ClaimsTable.tsx`, `TrustBadge.tsx` |
| Receive flow (offer paste, transaction code, front-channel, deferred) | `components/ReceivePanel.tsx`, `useHolder.ts` |
| Share wizard (filtered credentials, OPTION groups, claim sets, multiple) | `components/ShareWizard.tsx`, `shareSelection.ts` (pure engine) |
| Shared credentials (stats-as-filter, disclosed claims, lifecycle) | `components/SharedCredentialsView.tsx` |
| Notifications (bell, drawer inbox, state filter, snackbars) | `components/NotificationsInbox.tsx`, `NotificationSnackbars.tsx`, `ui.tsx` |

## EBW specifics
- The wallet-unit ladder gates receiving: `not_installed → installed →
  operational → valid`; the "+ Receive" action needs `operational` or
  `valid`. `valid` means WUA + Owner ID (LPID) held - issue it with
  `igrantio-ebw-owner-id`.
- The credentials an EBW typically holds have schema skills
  (`igrantio-credential-schema-lpid`,
  `igrantio-credential-schema-certificate-of-registration`, …); start from
  `igrantio-schema-discovery` when unsure.

## Testing the portal
Exercise every wizard branch with the ready-made verifier requests:
`igrantio-dcql-credential-sets` (OPTION groups),
`igrantio-dcql-claim-sets` (disclosure profiles),
`igrantio-dcql-multiple-statements` (`multiple:true`),
`igrantio-dcql-student-pass` (mandatory + optional),
`igrantio-dcql-trusted-authority` (trust-list badge). Issue test
credentials with `igrantio-issuer-backend`/`igrantio-issuer-frontend` or
the iGrant.io console.

## Validation / done criteria
- The four pages work against a deployed holder backend; the browser bundle
  holds no OWS API key.
- An end-to-end pass succeeds: receive an offer (with a transaction code) →
  accept → a verifier's DCQL request → the wizard shares the selected
  claims → the shared list shows "Presentation Shared" - with the
  notifications inbox driving each step.
- Wallet-unit gating and trust-list badges behave per
  `portal-ux-reference.md`.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Getting started: https://docs.igrant.io/docs/get-started/
- OpenID4VC API (issuer / verifier / webhook): https://docs.igrant.io/docs/category/openid4vc-api/issuer
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
