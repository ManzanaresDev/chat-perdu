// lib/image.ts
export async function resizeImage(file: File, maxSize = 1600, quality = 0.85): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de traiter cette image");

  ctx.fillStyle = "#fff"; // fond blanc pour les PNG transparents
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Impossible de traiter cette image");

  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}
