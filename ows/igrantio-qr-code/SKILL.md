---
name: igrantio-qr-code
description: 'Wallet QR code panel for EUDI Wallet (EUDIW) and European Business Wallet (EUBW) flows on the iGrant.io Organisation Wallet Suite, at the exact look of the iGrant.io demonstrators and the OWS passwordless-login page: a 240 px credential-offer or presentation-request QR at error-correction level H in a bordered, rounded 12 px frame, the logo on a white disc in the centre, the small refresh pill that mints a new exchange, the bordered white "Open in EUDI Wallet" button at QR width, a transaction-code box, the wallet hint, and the initialising / refreshing / scanned / error states. Use whenever an issuer or verifier frontend renders a wallet QR.'
license: Apache-2.0
metadata:
  categories: [frontend, education]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, QR code, credential offer, OpenID4VCI, OpenID4VP, deep link, open in wallet, logo disc, refresh, transaction code, EUDI Wallet
  version: 2026.09.01
  design-source: iGrant.io demonstrators (sme-business-wallet WalletInvite, piggy-bank-demo and infogreffe-ebwoid-issuer WalletQr, webuild-shop-demo CheckoutFlow) and the OWS passwordless-login QR panel
  auth: none
  requires-skills: igrantio-ows-overview
---

# iGrant.io wallet QR panel

## When to use
Any time a frontend renders a wallet QR: the issuance `credentialOffer` or
the verification `vpTokenQrCode` URI. This skill is the single QR pattern
for `igrantio-issuer-frontend` and `igrantio-verifier-frontend`; both vendor
it. Use it instead of a hand-rolled QR component, so every QR code a user
meets looks the same as in the iGrant.io demonstrators and the OWS
passwordless-login page. For the bare URI-to-image helper only,
`igrantio-frontend-client` ships a minimal `QrCode`.

## Prerequisites
- An **iGrant.io Organisation Wallet Suite (OWS) API key**. Get it from
  [support@igrant.io](mailto:support@igrant.io). Keep it on the server, in
  an environment variable or a secret manager. The browser never sees it.
- The **OWS environment** the key belongs to. The default is **demo**
  (`https://demo-api.igrant.io`). Use **staging**
  (`https://staging-api.igrant.io`) only when the integrator asks for it.
  A key works only in its own environment.
- A tenant backend that mints the exchange (`igrantio-issuer-backend` or
  `igrantio-verifier-backend`). The panel never calls OWS itself.
- A logo image for the disc in the centre of the code (PNG or SVG, square).

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
3. **Logo** - which image goes on the white disc in the centre of the code?
   _Recommend the integrator's brand mark, as each demonstrator does; the
   iGrant.io logo is the fallback (`/igrant-logo.png`)._
4. **Language** - which language for the button, the hint and the code
   label? _Default English strings are in `walletQrLabelsEn`; pass `labels`
   to translate._
5. **Hint** - keep the standard hint ("Requires an EUDI Wallet. You can
   download one here. The button works on the phone that holds the
   wallet.") or replace it? _Recommend the standard hint; change only the
   download link if you ship your own wallet._
6. **Transaction code** - does the issuance use a pre-authorised code the
   user types into the wallet? _Only for issuance with a user PIN; pass it
   as `txCode`._
7. **Same-device** - does the page also run on the phone that holds the
   wallet? _The "Open in EUDI Wallet" button handles it; no separate
   same-device view is needed._

The look itself is not a choice. Every value below comes from the
demonstrators; do not change a number.

## The look (exact values)

| Part | Value |
| --- | --- |
| Code | `qrcode.react` `QRCodeSVG`, `size={240}`, `level="H"` |
| Frame `.qr-frame` | white, `padding: 12px`, `border: 1px solid #dfdfdf`, `border-radius: 12px`, `line-height: 0` |
| Logo disc `.qr-logo-disc` | centred, `63px` white disc (26% of the code), `border-radius: 50%`, logo `48px` with `object-fit: cover` |
| Column `.qr-wrap` | flex column, centred, `gap: 0.75rem`; order: frame, code box, refresh pill, wallet button, hint |
| Refresh pill `.qr-refresh` | `border: 1px solid #e5e7eb`, `border-radius: 999px`, `padding: 3px 9px`, `10px` `600` uppercase, `letter-spacing: 0.05em`, colour `#6b7280`, `10px` refresh icon, hover `#f9fafb` |
| Wallet button `.wallet-link` | `266px` x `40px`, white, `border: 1px solid #dfdfdf`, `border-radius: 8px`, `14px` `400`, black text, hover `#f7f7f7`; text "Open in EUDI Wallet" |
| Hint `.qr-hint` | `12px`, `line-height: 1.5`, colour `#666`, `max-width: 266px`, centred, links black and underlined |
| Code box `.pin-box` | `max-width: 266px`, white, `border: 1px solid #dfdfdf`, `border-radius: 8px`; label `0.7rem` `#666`; code `1.45rem` `800` `letter-spacing: 0.4rem` |
| Initialising | one muted line, "Initialising..." |
| Refreshing | the old code at `opacity: 0.4` with a `34px` spinner on it |
| Scanned | the frame gives way to a `48px` spinner and one line; no tick overlay |
| Error | the message in red, then a "Retry" button in the wallet-button style |

The only brand slot is `--qr-accent` (spinner and transaction-code colour,
default black). Everything else is fixed.

## What it provides
- **`WalletQrPanel`** ([`references/ui/WalletQrPanel.tsx`](./references/ui/WalletQrPanel.tsx)) -
  one component for the whole QR lifecycle. Props: `uri`, `logoSrc`,
  `isLoading`, `isRefreshing`, `isScanned`, `errorMessage`, `txCode`,
  `onRefresh`, `onOpenInWallet`, `hint`, `walletDownloadUrl`, `labels`.
- **`walletQr.css`** ([`references/ui/walletQr.css`](./references/ui/walletQr.css)) -
  the class rules, ported at exact values from the demonstrators. Import it
  once, or paste it into your global stylesheet.
- **`walletQrLabelsEn`** - the default English strings, the base for
  translations.

## Steps
1. Copy [`./references/ui`](./references/ui) into your app (for example
   `src/components/walletQr/`). Import `walletQr.css` once.
2. `npm i qrcode.react` (peer dependency, the library the demonstrators use).
3. Put the logo in `public/` and pass its path as `logoSrc`.
4. Wire the panel to the flow state from `igrantio-issuer-frontend` or
   `igrantio-verifier-frontend`:
   ```tsx
   <WalletQrPanel
     uri={verificationHistory?.vpTokenQrCode}
     logoSrc="/your-logo.png"
     isLoading={isCreating}
     isRefreshing={isRecreating}
     isScanned={status === "scanned"}
     errorMessage={verificationError ?? ""}
     onRefresh={recreateExchange}
   />
   ```
5. For issuance, pass `credentialHistory.credentialOffer` as `uri` and the
   user PIN as `txCode` when the definition uses a pre-authorised code.

## Behaviour rules (from the demonstrators)
- `onRefresh` mints a **new** exchange: re-call issue or send through the
  backend proxy, close the old SSE session, open SSE on the new exchange id.
  Never re-render an expired URI. The wallet link carries `key={uri}` so a
  stale `href` is never kept.
- The "Open in EUDI Wallet" button is a plain link to the URI. It works on
  the phone that holds the wallet; on a desktop the QR is the path.
- Level H error correction leaves room for the logo disc. Keep the disc at
  the given size; a larger logo breaks the scan.
- Once the wallet has answered, show the scanned state and keep the window
  open until the final webhook arrives over SSE.

## Validation / done criteria
- `cd references && npm install && npm run typecheck` passes.
- A phone camera scans the code from the screen with the logo disc in place.
- Refresh produces a new exchange id (old SSE closed, new one open).
- The panel matches the demonstrator side by side: frame, disc, pill,
  button, hint.

## Documentation & workflows

When anything is unclear, consult the iGrant.io documentation before guessing:

- iGrant.io developer APIs (index): https://docs.igrant.io/docs/developer-apis
- Workflow: issue a credential (OID4VCI): https://docs.igrant.io/docs/openID4vci-issue-credential-intime/
- Workflow: send and verify credentials (OID4VP): https://docs.igrant.io/docs/openID4vc-send-verify-credentials/
- Trust-list registration (verified badge in the wallet): https://docs.igrant.io/docs/trust-relying-party-registration/
