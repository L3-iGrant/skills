import type { ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react"; // peer dependency: `npm i qrcode.react`

/**
 * The wallet QR panel every iGrant.io demonstrator shows, and the OWS
 * passwordless-login page: the wallet URI (credentialOffer / vpTokenQrCode)
 * as a 240 px code at error-correction level H, in a bordered, rounded 12 px
 * frame, with the logo on a white disc in the centre (26% of the code); then
 * the optional transaction code, the small refresh pill, the bordered white
 * "Open in EUDI Wallet" button at QR width, and the 12 px wallet hint.
 *
 * Styles live in `walletQr.css` (the class names of the demonstrators).
 * Import that file once in your app, or paste its rules into your global
 * stylesheet.
 *
 * Refresh: `onRefresh` must mint a NEW exchange (re-call issue / send via
 * your backend proxy), close the old SSE session, and open one on the new
 * exchange id. Never re-render an expired URI.
 *
 * Scanned: once the wallet has answered (`isScanned`), the frame gives way to
 * a spinner and one line, as the demonstrators do. There is no tick overlay.
 */
export interface WalletQrPanelProps {
  /** The wallet URI to encode (credentialOffer or vpTokenQrCode). */
  uri?: string;
  /** The logo on the white disc in the centre. Your brand mark, or the iGrant.io logo. */
  logoSrc: string;
  /** True while the first exchange is being created (no URI yet). */
  isLoading?: boolean;
  /** True while a refresh mints a new exchange (the old code dims). */
  isRefreshing?: boolean;
  /** True once the wallet has responded. */
  isScanned?: boolean;
  /** Failure text; replaces the panel with the message and a retry button. */
  errorMessage?: string;
  /** Pre-authorised transaction code the user types into the wallet. */
  txCode?: string;
  /** Mint a new exchange and QR. Renders the refresh pill when set. */
  onRefresh?: () => void;
  /** Same-device deep link. Defaults to a plain link to `uri`. */
  onOpenInWallet?: () => void;
  /** Replaces the standard hint under the button. */
  hint?: ReactNode;
  /** Where the hint's download link points. */
  walletDownloadUrl?: string;
  labels?: Partial<WalletQrLabels>;
  className?: string;
}

export interface WalletQrLabels {
  refresh: string;
  openInWallet: string;
  txCode: string;
  initialising: string;
  scanned: string;
  retry: string;
  hintRequires: string;
  hintLink: string;
  hintAfterLink: string;
  qrAlt: string;
}

export const walletQrLabelsEn: WalletQrLabels = {
  refresh: "Refresh",
  openInWallet: "Open in EUDI Wallet",
  txCode: "Enter this code in your wallet",
  initialising: "Initialising…",
  scanned: "Please accept the credential in your wallet. Keep this window open.",
  retry: "Retry",
  hintRequires: "Requires an EUDI Wallet. You can download one ",
  hintLink: "here",
  hintAfterLink: ". The button works on the phone that holds the wallet.",
  qrAlt: "QR code - scan with your wallet",
};

const QR_SIZE = 240;
const WALLET_DOWNLOAD_URL = "https://igrant.io/datawallet-for-eudi-wallet.html";

export function WalletQrPanel({
  uri,
  logoSrc,
  isLoading = false,
  isRefreshing = false,
  isScanned = false,
  errorMessage = "",
  txCode,
  onRefresh,
  onOpenInWallet,
  hint,
  walletDownloadUrl = WALLET_DOWNLOAD_URL,
  labels,
  className,
}: WalletQrPanelProps) {
  const t: WalletQrLabels = { ...walletQrLabelsEn, ...labels };
  const wrapClass = ["qr-wrap", isRefreshing ? "swapping" : "", className ?? ""].filter(Boolean).join(" ");

  if (errorMessage) {
    return (
      <div className={wrapClass}>
        <div className="qr-error" role="alert">
          <p>{errorMessage}</p>
          {onRefresh && (
            <button type="button" className="wallet-link" onClick={onRefresh}>
              {t.retry}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isScanned) {
    return (
      <div className={wrapClass}>
        <div className="qr-scanned" role="status" aria-live="polite">
          <div className="qr-swap-spinner" aria-hidden="true" />
          <p>{t.scanned}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !uri) {
    return (
      <div className={wrapClass}>
        <p className="qr-initialising" role="status" aria-busy="true">
          {t.initialising}
        </p>
      </div>
    );
  }

  return (
    <div className={wrapClass}>
      <div className="qr-frame" role="img" aria-label={t.qrAlt}>
        <div style={{ position: "relative", width: `${QR_SIZE}px`, height: `${QR_SIZE}px` }}>
          {/* Level H leaves room for the logo disc without breaking the scan. */}
          <QRCodeSVG value={uri} size={QR_SIZE} level="H" />
          <div className="qr-logo-disc">
            <img src={logoSrc} alt="" />
          </div>
        </div>
        {isRefreshing && <span className="qr-swap-spinner" aria-hidden="true" />}
      </div>

      {txCode && (
        <div className="pin-box">
          <p className="pin-label">{t.txCode}</p>
          <p className="pin-code">{txCode}</p>
        </div>
      )}

      {onRefresh && (
        <button type="button" className="qr-refresh" onClick={onRefresh} aria-label={t.refresh}>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
          {t.refresh}
        </button>
      )}

      {onOpenInWallet ? (
        <button type="button" className="wallet-link" onClick={onOpenInWallet}>
          {t.openInWallet}
        </button>
      ) : (
        // `key={uri}` remounts the link on refresh so a stale href is never kept.
        <a key={uri} href={uri} className="wallet-link">
          {t.openInWallet}
        </a>
      )}

      <p className="qr-hint">
        {hint ?? (
          <>
            {t.hintRequires}
            <a href={walletDownloadUrl} target="_blank" rel="noreferrer">
              {t.hintLink}
            </a>
            {t.hintAfterLink}
          </>
        )}
      </p>
    </div>
  );
}
