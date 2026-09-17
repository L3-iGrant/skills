---
name: igrantio-usecase-ui
description: 'Default iGrant.io look and feel for EUDI Wallet (EUDIW) and European Business Wallet (EUBW) use-case frontends, ported at exact values from the iGrant.io use-case SDK and landing page: design tokens, Byrd + Plus Jakarta Sans typography, split layout with sticky stepper cards, uppercase buttons, content card, QR box, status stages, page shell, and strings-driven i18n. Used by default when the user has not specified their own UI or layout.'
license: Apache-2.0
metadata:
  categories: [frontend, education]
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, UI theme, design tokens, React, i18n
  version: 2026.09.01
  design-source: iGrant.io landing page (Navbar.astro, Footer.astro, _variables.scss) + use-case SDK (@igrant/usecase-sdk styles and components)
  font: Plus Jakarta Sans
  auth: none
  requires-skills: igrantio-frontend-client
---

# iGrant.io use-case UI (default look and feel)

## When to use
The default chrome for any iGrant.io frontend (`igrantio-issuer-frontend`,
`igrantio-verifier-frontend`, or a bespoke use-case UI). Reach for it whenever
the user has not specified their own UI or layout. It gives you the iGrant.io
navbar, footer, theme, and a small set of primitives so a flow looks on-brand
with zero design work. If the user brings their own design system, skip this.

Intentionally minimal: a theme, a shell, a few primitives, strings-driven i18n.
No component-library sprawl, and no runtime deps beyond what
`igrantio-frontend-client` already uses (React peer plus `qrcode`).

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
3. **Look** - the default iGrant.io look, or your own design system? _Skip
   this skill for your own._
4. **Languages** - which UI languages? _Strings live in `strings.ts`._
5. **Fonts** - do you have the Byrd woff2 files? _Otherwise Plus Jakarta Sans
   is used._
6. **QR** - the wallet QR is rendered by `igrantio-qr-code` at the
   demonstrator look; confirm the logo for its centre disc.

## What it provides (`references/`)
- **`assets/`** - vendored brand assets: `iGrant_210_55_BW.svg` (the white
  iGrant.io logo) and `whatsapp.png`.
- **`ui/theme.css`** - the single source of truth for every token and
  use-case style, at exact iGrant.io values: typography (Plus Jakarta Sans
  body, **Byrd** headings - copy the woff2 files from an iGrant.io
  deployment's `/assets/fonts/` into `ui/fonts/`, otherwise it falls back to
  Plus Jakarta Sans), palette, buttons, split layout, stepper cards with the
  offset-shadow number box, heading scale, content card, step navigation,
  form fields, status stages, and the navbar/footer chrome. Read the file
  for the numbers; do not invent new ones. The QR box carries the frame
  values of the demonstrator wallet QR panel (`igrantio-qr-code`); render
  `WalletQrPanel` from that skill for the full panel.
- **`ui/Header.tsx`** and **`ui/Footer.tsx`** - a 1:1 port of the landing-page
  `Navbar.astro` and `Footer.astro` (navbar 5.4375rem = 87px, logo 3.4375rem =
  55px, black `#000` bar, nav links 16px with 0.125rem letter-spacing and
  carets, bordered language `<select>`, rounded 1.25rem Demo CTA; footer with
  copyright, ISO/IEC 27001 badge, social icons with `#464646` divider borders,
  legal links, and the mobile WhatsApp float). Values reused from the source,
  not invented.
- **`ui/AppShell.tsx`** - the default page frame: `<Header/> {children}
  <Footer/>` plus the theme. Consumers wrap a flow in this.
- **`ui/primitives.tsx`** - small styled building blocks only: `SplitLayout`,
  `Stepper` / `Step` (number box, tick, active card), `ContentCard`,
  `StepNav`, `Panel`, `Field`, `Button` (`primary` / `secondary` / `ghost`),
  `QrBox`, `StatusStage`. Nothing beyond these.
- **`ui/strings.ts`** - a typed `UiStrings` object plus the default English
  `en`. All visible chrome text (and the nav/social/legal links) lives here; to
  localize, spread `en` and override.

## Reference layout (vendor into your app)
Copy [`./references/ui`](./references/ui) into your app at `src/ui/` and
[`./references/assets`](./references/assets) into `src/assets/` (Header/Footer
import the logo and WhatsApp icon from `../assets`).
```
ui/
  theme.css   AppShell.tsx   Header.tsx   Footer.tsx
  primitives.tsx   strings.ts   index.ts   assets.d.ts
assets/
  iGrant_210_55_BW.svg   whatsapp.png
```

## Usage
```tsx
import { AppShell, SplitLayout, Stepper, Step, ContentCard, StepNav, Button, StatusStage } from "./ui";
import { WalletQrPanel } from "./components/walletQr"; // igrantio-qr-code

<AppShell>
  <SplitLayout
    sidebar={
      <Stepper>
        <Step number={1} title="Request" done />
        <Step number={2} title="Scan QR" detail="Use your EUDI Wallet" active />
        <Step number={3} title="Issued" />
      </Stepper>
    }
  >
    <ContentCard>
      <h2>Scan the QR code</h2>
      <WalletQrPanel uri={qrUri} logoSrc="/your-logo.png" onRefresh={recreate} />
      <StatusStage tone="success" actions={<Button variant="primary">Done</Button>}>
        Credential accepted.
      </StatusStage>
      <StepNav back={<Button>Back</Button>} next={<Button variant="primary">Next</Button>} />
    </ContentCard>
  </SplitLayout>
</AppShell>
```

Localize by passing your own strings:
```tsx
import { AppShell, en } from "./ui";

const sv = { ...en, langLabel: "Valj sprak", demo: { label: "Demo", href: "/demo" } };
<AppShell strings={sv} header={{ languages: [{ code: "en", label: "English" }, { code: "sv", label: "Svenska" }] }} />
```

## Composition
- Pairs with `igrantio-frontend-client` and `igrantio-qr-code`: render
  `WalletQrPanel` in the content card (its frame equals `QrBox`), and drive
  `Step`/`StatusStage` from the SSE status of `useIssuance` /
  `useVerification`.
- `igrantio-issuer-frontend` and `igrantio-verifier-frontend` use this shell by
  default for their demo components.

## Clean-code notes
- One concern per file: tokens/layout in `theme.css`, chrome in Header/Footer,
  reusable bits in `primitives.tsx`, all text in `strings.ts`.
- No component library, no CSS framework, no new npm runtime deps.
- Exact navbar/footer values come from the landing page; do not invent new ones.

## Validation / done criteria
- `cd references && npm install && npm run typecheck` passes.
- The logo is the real white `iGrant_210_55_BW.svg`; palette and dimensions
  match the landing page.
