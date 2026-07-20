---
name: igrantio-qr-code
description: 'Wallet QR code panel for EUDI Wallet (EUDIW) and European Business Wallet (EUBW) flows on the iGrant.io Organisation Wallet Suite: credential-offer / presentation-request QR with optional centre logo, optional green tick on scan, refresh that mints a new exchange, open-in-wallet deep link, transaction-code block, and pending/scanned/error states. Use whenever an issuer or verifier frontend renders a wallet QR.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, QR code, credential offer, OpenID4VCI, OpenID4VP, deep link, open in wallet, centre logo, EUDI Wallet
  version: 2026.07.04
  auth: none
  requires-skills: igrantio-frontend-client
---

# iGrant.io wallet QR panel

## When to use
Any time a frontend renders a wallet QR: the issuance `credentialOffer` or the
verification `vpTokenQrCode` URI. This skill is the single QR pattern for the
`igrantio-issuer-frontend` and `igrantio-verifier-frontend` skills; use it
instead of hand-rolling a QR component. For the bare URI-to-image helper only,
`igrantio-frontend-client` ships a minimal `QrCode`; this skill is the full
panel (logo, refresh, wallet button, tx code, states).

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each.

## Ask the integrator first
Two visual options are deliberate brand choices. If the user has not already
specified them, ask before building:

1. **Centre logo in the QR?** If yes, which asset (e.g. their brand mark or
   the iGrant.io logo). Enabling a logo switches the QR to error-correction
   level H automatically.
2. **Green tick overlay when scanned?** A centred green tick over the QR once
   the wallet responds (`scannedOverlay`, default on; colour via `tickColor`).

Defaults when the user has no preference: no logo, tick overlay on.

## What it provides
- **`WalletQrPanel`** - one component covering the whole QR lifecycle:
  - QR canvas from the wallet URI (`qrcode` peer dep, swappable).
  - **Centre logo** (`logoSrc`, `logoRatio` default 0.28, max 0.3,
    `logoBackground` white backing) - rendered at EC level **H** so the
    overlay does not break scanning; without a logo it uses level M.
  - **Scanned state** - centred green tick overlay (`scannedOverlay`,
    `tickColor`) plus a success status line.
  - **Refresh chip** (bottom-right, `onRefresh`) - mint a NEW exchange:
    re-call issue/send through the backend proxy, close the old SSE session,
    open SSE on the new exchange id. Never re-render an expired URI.
  - **Open in wallet** button (`onOpenInWallet`, defaults to navigating to
    the URI) - same-device deep link; on desktop the QR is the primary path.
  - **Transaction code** block (`txCode`) - for pre-authorised issuance with
    a user PIN ("Enter this code in your wallet").
  - **Status line** - `errorMessage` (assertive, red) > scanned > pending;
    loading placeholder while the exchange is being created.

## Steps
1. Copy [`./references/ui`](./references/ui) into your app (e.g.
   `src/components/walletQr/`).
2. `npm i qrcode @types/qrcode` (peer dependency).
3. Wire it to the flow state from `igrantio-frontend-client` /
   `igrantio-issuer-frontend` / `igrantio-verifier-frontend`:
   ```tsx
   <WalletQrPanel
     uri={verificationHistory?.vpTokenQrCode}
     isLoading={isCreating}
     isScanned={status === "verified"}
     errorMessage={verificationError ?? ""}
     onRefresh={recreateExchange}
     logoSrc={brandChoice.logo ? "/logo.png" : undefined}
     scannedOverlay={brandChoice.greenTick}
   />
   ```
4. For issuance, pass `credentialHistory.credentialOffer` as `uri` and the
   `userPin` as `txCode` when using pre-authorised codes.

## Behaviour rules (from the working iGrant.io demos)
- Logo at ~28-32% of QR width with EC level H scans reliably; beyond 30% is
  rejected by the component. A white backing square further protects scans.
- The refresh chip and wallet button disable while loading and once scanned.
- The error state recolours the QR modules red and announces the message
  assertively; pending/scanned updates announce politely.

## Validation / done criteria
- `cd references && npm install && npm run typecheck` passes.
- With a logo enabled, a phone camera still scans the QR from screen.
- Refresh produces a new exchange id (old SSE closed, new one open).
- The wallet button opens the wallet on a phone; QR shown on desktop.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
