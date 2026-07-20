/**
 * Default iGrant.io navbar. A 1:1 port of the landing-page Navbar.astro chrome
 * (black #000 bar 87px tall, 55px logo, 16px nav links with 0.125rem letter
 * spacing and carets, bordered language select, rounded 1.25rem Demo CTA).
 * Exact values live in theme.css (.igr-navbar); source of truth is
 * landing-page src/components/Navbar.astro + src/styles/_variables.scss.
 */
import logo from "../assets/iGrant_210_55_BW.svg";
import { en, type UiStrings } from "./strings";

export interface Language {
  code: string;
  label: string;
}

export interface HeaderProps {
  strings?: UiStrings;
  /** Locales for the language selector. Defaults to English only. */
  languages?: Language[];
  currentLang?: string;
  onLangChange?: (code: string) => void;
  /** Where the logo links to. */
  homeHref?: string;
}

function Caret() {
  return (
    <svg className="caret" viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M4 6l4 4 4-4z" />
    </svg>
  );
}

const DEFAULT_LANGUAGES: Language[] = [{ code: "en", label: "English" }];

export function Header({
  strings = en,
  languages = DEFAULT_LANGUAGES,
  currentLang,
  onLangChange,
  homeHref = "/",
}: HeaderProps) {
  return (
    <nav className="igr-navbar">
      <div className="nav-container">
        <div className="brand">
          <a href={homeHref} className="brand-link" aria-label="iGrant.io">
            <img src={logo} alt="iGrant.io" className="logo" width={210} height={55} decoding="async" />
          </a>
        </div>

        <ul className="nav-list left">
          {strings.nav.map((item) => (
            <li key={item.label} className="nav-item">
              <a
                className="nav-link"
                href={item.href}
                {...(item.external ? { target: "_blank", rel: "noopener" } : {})}
              >
                <span className="nav-text">{item.label}</span>
                <Caret />
              </a>
            </li>
          ))}
        </ul>

        <ul className="nav-list right">
          {languages.length > 0 ? (
            <li className="nav-item">
              <select
                className="language-menu"
                aria-label={strings.langLabel}
                value={currentLang}
                onChange={(e) => onLangChange?.(e.target.value)}
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </li>
          ) : null}
          <li className="nav-item">
            <a
              className="cta-button"
              href={strings.demo.href}
              {...(strings.demo.external ? { target: "_blank", rel: "noopener" } : {})}
            >
              {strings.demo.label}
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
