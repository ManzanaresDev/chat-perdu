"use client";

import { QRCodeSVG } from "qrcode.react";

export default function QrCode({ value, size = 128 }: { value: string; size?: number }) {
  return <QRCodeSVG value={value} size={size} marginSize={2} title="QR code vers l'annonce en ligne" />;
}
    