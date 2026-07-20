---
name: igrantio-usecase-ui
description: 'Default iGrant.io look and feel for EUDI Wallet (EUDIW) and European Business Wallet (EUBW) use-case frontends: a theme (design tokens plus Plus Jakarta Sans, monochrome palette, sharp-corner black uppercase buttons, two-column stepper-plus-panel layout, QR box, status stages), a page shell (Header + Footer ported 1:1 from the iGrant.io landing page), a few primitives (Stepper/Step, Panel, Field, Button, QrBox, StatusStage), and strings-driven i18n. Used by default when the user has not specified their own UI or layout. No component-library sprawl; no runtime deps beyond React (peer) plus qrcode.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, UI theme, design tokens, React, i18n
  version: 2026.07.01
  design-source: iGrant.io landing page (Navbar.astro, Footer.astro, _variables.scss)
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

## What it provides (`references/`)
- **`assets/`** - vendored brand assets: `iGrant_210_55_BW.svg` (the white
  iGrant.io logo) and `whatsapp.png`.
- **`ui/theme.css`** - design tokens plus Plus Jakarta Sans; monochrome palette
  (`#000`, `#fff`, muted `#e5e5e5`, divider `#464646`, canvas `#f4f4f5`),
  success `#15803d` / `#dcfce7`, alert red; sharp-corner black uppercase buttons
  (`.btn`, `.btn.ghost`); form fields; the two-column stepper-plus-panel layout
  (`.igr-layout`); `.step` with a light-green tick when done; QR box; and status
  stages (content left-aligned, action buttons right-aligned). Also holds the
  navbar/footer chrome classes at their exact ported values.
- **`ui/Header.tsx`** and **`ui/Footer.tsx`** - a 1:1 port of the landing-page
  `Navbar.astro` and `Footer.astro` (navbar 5.4375rem = 87px, logo 3.4375rem =
  55px, black `#000` bar, nav links 16px with 0.125rem letter-spacing and
  carets, bordered language `<select>`, rounded 1.25rem Demo CTA; footer with
  copyright, ISO/IEC 27001 badge, social icons with `#464646` divider borders,
  legal links, and the mobile WhatsApp float). Values reused from the source,
  not invented.
- **`ui/AppShell.tsx`** - the default page frame: `<Header/> {children}
  <Footer/>` plus the theme. Consumers wrap a flow in this.
- **`ui/primitives.tsx`** - small styled building blocks only: `Stepper` /
  `Step`, `Panel`, `Field`, `Button`, `QrBox`, `StatusStage`. Nothing beyond
  these.
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
import { AppShell, Stepper, Step, Panel, Field, Button, QrBox, StatusStage } from "./ui";

<AppShell>
  <div className="igr-layout">
    <Stepper>
      <Step title="Request" done />
      <Step title="Scan QR" active />
      <Step title="Issued" />
    </Stepper>
    <Panel>
      <QrBox><img src={qrDataUri} alt="Scan to continue" /></QrBox>
      <StatusStage tone="success" actions={<Button>Done</Button>}>
        Credential accepted.
      </StatusStage>
    </Panel>
  </div>
</AppShell>
```

Localize by passing your own strings:
```tsx
import { AppShell, en } from "./ui";

const sv = { ...en, langLabel: "Valj sprak", demo: { label: "Demo", href: "/demo" } };
<AppShell strings={sv} header={{ languages: [{ code: "en", label: "English" }, { code: "sv", label: "Svenska" }] }} />
```

## Composition
- Pairs with `igrantio-frontend-client`: render its `QrCode` inside `QrBox`, and
  drive `Step`/`StatusStage` from the SSE status of `useIssuance` /
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
