/**
 * Default iGrant.io footer. A 1:1 port of the landing-page Footer.astro chrome
 * (black #000 bar, muted #e5e5e5 text, copyright, ISO/IEC 27001 badge, social
 * icons separated by #464646 divider borders, legal links, and the mobile
 * WhatsApp float). Exact values live in theme.css (.igr-footer); source of
 * truth is landing-page src/components/Footer.astro.
 */
import whatsapp from "../assets/whatsapp.png";
import { en, formatCopyright, type SocialPlatform, type UiStrings } from "./strings";

const YEAR = new Date().getFullYear();

function ShieldCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

const SOCIAL_PATHS: Record<SocialPlatform, string> = {
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z",
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d={SOCIAL_PATHS[platform]} />
    </svg>
  );
}

export interface FooterProps {
  strings?: UiStrings;
}

export function Footer({ strings = en }: FooterProps) {
  const f = strings.footer;
  return (
    <>
      <footer className="igr-footer">
        <div className="footer-container">
          <div className="footer-row">
            <div className="footer-copyright">
              <p className="copyright-text">{formatCopyright(f.copyright, YEAR)}</p>
              <a className="iso-badge" href={f.iso27001Href} target="_blank" rel="noopener noreferrer">
                <ShieldCheck />
                <span>{f.iso27001Label}</span>
              </a>
            </div>

            <div className="footer-social">
              <ul className="social-list">
                {f.social.map((s) => (
                  <li key={s.platform} className="social-item">
                    <a
                      className="social-link"
                      href={s.href}
                      aria-label={s.label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <SocialIcon platform={s.platform} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-links">
              {f.legal.map((link, i) => (
                <span key={link.label}>
                  <a
                    className="footer-link"
                    href={link.href}
                    {...(link.external ? { target: "_blank", rel: "noopener" } : {})}
                  >
                    {link.label}
                  </a>
                  {i < f.legal.length - 1 ? <span className="footer-sep">|</span> : null}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <a
        className="igr-whatsapp-float"
        href={f.whatsappHref}
        aria-label={f.whatsappLabel}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={whatsapp} alt="" width={50} height={50} decoding="async" loading="lazy" />
      </a>
    </>
  );
}
