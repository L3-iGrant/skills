---
name: igrantio-usecase-ui
description: 'Default iGrant.io look and feel for EUDI Wallet (EUDIW) and European Business Wallet (EUBW) use-case frontends, ported at exact values from the iGrant.io use-case SDK and landing page: design tokens, Byrd + Plus Jakarta Sans typography, split layout with sticky stepper cards, uppercase buttons, content card, QR box, status stages, page shell, and strings-driven i18n. Used by default when the user has not specified their own UI or layout.'
license: Apache-2.0
metadata:
  provider: iGrant.io
  keywords: EUDIW, EUBW, eIDAS2, EUDI Wallet, European Business Wallet, UI theme, design tokens, React, i18n
  version: 2026.07.04
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

**Before you build**: run the integrator intake in `igrantio-ows-overview` - environment, API key, tenancy, backend host, webhooks, frontend - one question at a time, a recommended default with each.

## What it provides (`references/`)
- **`assets/`** - vendored brand assets: `iGrant_210_55_BW.svg` (the white
  iGrant.io logo) and `whatsapp.png`.
- **`ui/theme.css`** - the single source of truth for every token and
  use-case style, at exact iGrant.io values: typography (Plus Jakarta Sans
  body, **Byrd** headings - copy the woff2 files from an iGrant.io
  deployment's `/assets/fonts/` into `ui/fonts/`, otherwise it falls back to
  Plus Jakarta Sans), palette, buttons, split layout, stepper cards with the
  offset-shadow number box, heading scale, content card, step navigation,
  form fields, QR box, status stages, and the navbar/footer chrome. Read the
  file for the numbers; do not invent new ones.
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
import { AppShell, SplitLayout, Stepper, Step, ContentCard, StepNav, Button, QrBox, StatusStage } from "./ui";

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
      <QrBox><img src={qrDataUri} alt="Scan to continue" /></QrBox>
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
