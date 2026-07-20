import { useEffect, useRef, type CSSProperties } from "react";
import QRCode from "qrcode"; // peer dependency: `npm i qrcode` (+ `@types/qrcode`)

/**
 * Wallet QR panel: the full QR user experience for OWS issuance and
 * verification flows. Renders the wallet URI (credentialOffer /
 * vpTokenQrCode) as a QR code with an optional centre logo, a refresh
 * chip, an "open in wallet" same-device button, a transaction-code block,
 * and pending / scanned / error status - mirroring the behaviour of the
 * iGrant.io demo apps.
 *
 * Centre logo: when `logoSrc` is set the QR is rendered at error-correction
 * level H (30% recovery) so the overlaid logo does not break scanning. Keep
 * the logo at or below ~30% of the QR width (default ratio 0.28, as in the
 * working demos: 80px on a 250px QR).
 *
 * Refresh: `onRefresh` must mint a NEW exchange (re-call issue / send via
 * your backend proxy), close the old SSE session, and open one on the new
 * exchange id. Never re-render an expired URI.
 */
export interface WalletQrPanelProps {
  /** The wallet URI to encode (credentialOffer or vpTokenQrCode). */
  uri?: string;
  /** Centre logo image (e.g. your brand mark). Enables EC level H. */
  logoSrc?: string;
  /** Logo width as a fraction of the QR width. Clamped to 0.3. */
  logoRatio?: number;
  /** Paint a white backing square behind the logo (safer scans). */
  logoBackground?: boolean;
  size?: number;
  /** True while the exchange is being (re)created. */
  isLoading?: boolean;
  /** True once the wallet has responded. */
  isScanned?: boolean;
  /** Show the centred green tick overlay when scanned. */
  scannedOverlay?: boolean;
  /** Tick / success colour. */
  tickColor?: string;
  /** Failure text; replaces the status line, styled as an error. */
  errorMessage?: string;
  pendingMessage?: string;
  scannedMessage?: string;
  loadingLabel?: string;
  /** Mint a new exchange and QR. Renders a refresh chip when set. */
  onRefresh?: () => void;
  refreshLabel?: string;
  /** Same-device deep link. Defaults to opening `uri` directly. */
  onOpenInWallet?: () => void;
  openInWalletLabel?: string;
  /** Pre-authorised transaction code the user types into the wallet. */
  txCode?: string;
  txCodeLabel?: string;
  className?: string;
}

const box: CSSProperties = {
  position: "relative",
  display: "inline-block",
  background: "#ffffff",
  padding: 12,
  border: "1px solid #e0e0e0",
};

export function WalletQrPanel({
  uri,
  logoSrc,
  logoRatio = 0.28,
  logoBackground = true,
  size = 250,
  isLoading = false,
  isScanned = false,
  scannedOverlay = true,
  tickColor = "#1a7f37",
  errorMessage = "",
  pendingMessage = "Waiting for confirmation in your wallet.",
  scannedMessage = "",
  loadingLabel = "Loading QR code...",
  onRefresh,
  refreshLabel = "Refresh",
  onOpenInWallet,
  openInWalletLabel = "OPEN IN EUDI WALLET",
  txCode,
  txCodeLabel = "Enter this code in your wallet",
  className,
}: WalletQrPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const showLoading = isLoading || !uri;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !uri || showLoading) return;
    let active = true;
    QRCode.toCanvas(canvas, uri, {
      width: size,
      margin: 1,
      // Level H tolerates ~30% module loss - required under a centre logo.
      errorCorrectionLevel: logoSrc ? "H" : "M",
      color: { dark: errorMessage ? "#dc3545" : "#000000", light: "#ffffff" },
    })
      .then(() => {
        if (!active || !logoSrc) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
          if (!active) return;
          const w = canvas.width * Math.min(logoRatio, 0.3);
          const h = (img.height / img.width) * w;
          const x = (canvas.width - w) / 2;
          const y = (canvas.height - h) / 2;
          if (logoBackground) {
            const pad = 6;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
          }
          ctx.drawImage(img, x, y, w, h);
        };
        img.src = logoSrc;
      })
      .catch(() => {
        /* leave the canvas blank; the status line still shows */
      });
    return () => {
      active = false;
    };
  }, [uri, size, logoSrc, logoRatio, logoBackground, errorMessage, showLoading]);

  const openInWallet = () => {
    if (onOpenInWallet) onOpenInWallet();
    else if (uri && typeof window !== "undefined") window.location.href = uri;
  };

  return (
    <div className={className} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {showLoading ? (
        <div role="status" aria-busy="true" aria-label={loadingLabel} style={{ ...box, width: size + 24, height: size + 24 }}>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#767676", fontSize: 14 }}>
            {loadingLabel}
          </span>
        </div>
      ) : (
        <div role="img" aria-label="QR code - scan with your wallet" style={box}>
          <canvas ref={canvasRef} width={size} height={size} style={{ display: "block" }} />
          {isScanned && scannedOverlay && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.88)" }}>
              <span aria-label="Scanned" style={{ fontSize: 64, lineHeight: 1, color: tickColor, fontWeight: 700 }}>✓</span>
            </div>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isScanned}
              title={refreshLabel}
              aria-label={refreshLabel}
              style={{ position: "absolute", right: 6, bottom: 6, display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid #e0e0e0", background: "#ffffff", padding: "2px 8px", fontSize: 12, cursor: "pointer" }}
            >
              <span aria-hidden="true">↻</span> {refreshLabel}
            </button>
          )}
        </div>
      )}

      {txCode && !isScanned && (
        <div style={{ textAlign: "center", border: "1px solid #e0e0e0", padding: "8px 16px" }}>
          <div style={{ fontSize: 12, color: "#767676" }}>{txCodeLabel}</div>
          <div style={{ fontSize: 22, letterSpacing: 4, fontWeight: 700 }}>{txCode}</div>
        </div>
      )}

      <button
        type="button"
        onClick={openInWallet}
        disabled={showLoading || isScanned}
        title={openInWalletLabel}
        style={{ width: size + 24, padding: "10px 0", background: "#000000", color: "#ffffff", border: "none", textTransform: "uppercase", letterSpacing: 1, cursor: showLoading || isScanned ? "default" : "pointer", opacity: showLoading || isScanned ? 0.5 : 1 }}
      >
        {openInWalletLabel}
      </button>

      {(errorMessage || pendingMessage || scannedMessage) && (
        <p
          aria-live={errorMessage ? "assertive" : "polite"}
          style={{ margin: 0, fontSize: 14, maxWidth: size + 24, textAlign: "center", color: errorMessage ? "#dc3545" : isScanned ? tickColor : "#444444" }}
        >
          {errorMessage ? errorMessage : isScanned ? scannedMessage : showLoading ? "" : pendingMessage}
        </p>
      )}
    </div>
  );
}
