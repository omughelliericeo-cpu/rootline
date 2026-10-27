// Browser-only: makes a phone photo small enough to upload quickly (and
// under the 4 MB limit) by redrawing it at most `maxSide` pixels wide and
// saving it as JPEG. Redrawing also drops the photo's hidden metadata. If
// anything goes wrong, the original file is returned and the server still
// checks and cleans it.

export async function shrinkImage(file: File, maxSide = 2000, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.fillStyle = "#FFFDF8"; // transparent parts of a PNG become card colour, not black
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || (scale === 1 && blob.size >= file.size)) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** For useFormAction's `prepare`: shrinks the image in the named file field. */
export function shrinkImageField(name: string) {
  return async (data: FormData): Promise<FormData> => {
    const file = data.get(name);
    if (file instanceof File && file.size > 0) data.set(name, await shrinkImage(file));
    return data;
  };
}
