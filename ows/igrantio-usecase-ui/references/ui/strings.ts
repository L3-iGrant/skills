/**
 * Strings-driven i18n for the iGrant.io use-case UI chrome.
 *
 * Everything the default Header/Footer render is here as one typed object. To
 * localize, pass your own `UiStrings` (spread `en` and override the parts you
 * need). Defaults mirror the live iGrant.io site.
 */

export interface NavLink {
  label: string;
  href: string;
  /** Open in a new tab. */
  external?: boolean;
}

export type SocialPlatform = "x" | "youtube" | "facebook" | "linkedin";

export interface SocialLink {
  platform: SocialPlatform;
  href: string;
  /** Accessible label, e.g. "iGrant.io LinkedIn". */
  label: string;
}

export interface FooterStrings {
  /** Copyright line. The literal "{year}" is replaced at render time. */
  copyright: string;
  iso27001Label: string;
  iso27001Href: string;
  legal: NavLink[];
  social: SocialLink[];
  whatsappHref: string;
  whatsappLabel: string;
}

export interface UiStrings {
  /** Accessible label for the language selector. */
  langLabel: string;
  /** Top-level navigation links (each rendered with a caret). */
  nav: NavLink[];
  /** Rounded pill call-to-action on the right of the navbar. */
  demo: NavLink;
  footer: FooterStrings;
}

/** Default English strings, sourced from the live iGrant.io site. */
export const en: UiStrings = {
  langLabel: "Select language",
  nav: [
    { label: "Products", href: "#" },
    { label: "Developers", href: "#" },
    { label: "Company", href: "#" },
  ],
  demo: { label: "Demo", href: "/demo" },
  footer: {
    copyright: "© 2017-{year} LCubed AB, Sweden",
    iso27001Label: "ISO/IEC 27001",
    iso27001Href:
      "https://www.iafcertsearch.org/certification/km2vH6e1i3j2Ai0WISr9krvR",
    legal: [
      { label: "Cookie policy", href: "/privacy.html#cookies" },
      { label: "Terms of service", href: "/terms.html" },
      { label: "Privacy policy", href: "/privacy.html#privacy" },
    ],
    social: [
      { platform: "x", href: "https://twitter.com/igrantio", label: "iGrant.io X" },
      { platform: "youtube", href: "https://www.youtube.com/igrantio", label: "iGrant.io YouTube" },
      { platform: "facebook", href: "https://www.facebook.com/igrantio/", label: "iGrant.io Facebook" },
      { platform: "linkedin", href: "https://www.linkedin.com/company/igrantio/", label: "iGrant.io LinkedIn" },
    ],
    whatsappHref: "https://wa.me/message/3YFVQOBN5ZYFE1",
    whatsappLabel: "Contact us on WhatsApp",
  },
};

/** Replace "{year}" in the copyright string with the given year. */
export function formatCopyright(copyright: string, year: number): string {
  return copyright.replace("{year}", String(year));
}
