import { useEffect, useState } from "react";
import QRCode from "qrcode"; // peer dependency: `npm i qrcode` (+ `@types/qrcode`)

/**
 * Render a wallet URI (credentialOffer / vpTokenQrCode) as a scannable QR code
 * for cross-device flows. For same-device, use `openInWallet` instead.
 *
 * `qrcode` is a peer dependency so this stays swappable - replace with any QR
 * generator without touching the rest of the client.
 */
export interface QrCodeProps {
  /** The wallet URI to encode. */
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}

export function QrCode({ value, size = 240, className, alt = "Scan with your wallet" }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>();

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl(undefined);
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) return null;
  return <img src={dataUrl} width={size} height={size} className={className} alt={alt} />;
}

/** Same-device deep link: hand the URI to the wallet app on this device. */
export function openInWallet(uri: string): void {
  if (typeof window !== "undefined") window.location.href = uri;
}
