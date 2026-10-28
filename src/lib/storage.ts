// File storage (Supabase Storage). Three buckets:
//  - "brand-media" (public): logos, photos, portraits and product photos shown
//    on story pages. publicMediaUrl() turns a stored path into a URL.
//  - "certificates" (private): certificate files. They are only reachable
//    through short-lived signed links (signedCertificateUrl).
// The database stores paths, never full URLs.
import "server-only";
import { AppError } from "./errors";
import { checkCertificateFile, checkImageFile, storagePathFor, type MediaKind } from "./storage-rules";
import { supabaseAdmin } from "./supabase";

export const BRAND_MEDIA_BUCKET = "brand-media";
export const CERTIFICATES_BUCKET = "certificates";
export const SHOPPER_PHOTOS_BUCKET = "shopper-photos";

export function publicMediaUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${BRAND_MEDIA_BUCKET}/${path}`;
}

async function upload(bucket: string, path: string, file: Blob, cacheControl: string): Promise<string> {
  const { error } = await supabaseAdmin()
    .storage.from(bucket)
    .upload(path, file, { contentType: file.type, cacheControl, upsert: false });
  if (error) throw new AppError("UPLOAD_FAILED", undefined, { cause: error });
  return path;
}

/** Validates and uploads a public image; returns its storage path. */
export async function uploadBrandImage(brandId: string, kind: Exclude<MediaKind, "certificate">, file: File): Promise<string> {
  const problem = checkImageFile(file);
  if (problem) throw new AppError("UPLOAD_INVALID", problem);
  return upload(BRAND_MEDIA_BUCKET, storagePathFor(brandId, kind, file.type), file, "31536000");
}

/** Validates and uploads a certificate file to the private bucket; returns its path. */
export async function uploadCertificateFile(brandId: string, file: File): Promise<string> {
  const problem = checkCertificateFile(file);
  if (problem) throw new AppError("UPLOAD_INVALID", problem);
  return upload(CERTIFICATES_BUCKET, storagePathFor(brandId, "certificate", file.type), file, "3600");
}

/** A link to a private certificate file that stops working after `seconds`. */
export async function signedCertificateUrl(path: string, seconds = 300): Promise<string> {
  const { data, error } = await supabaseAdmin().storage.from(CERTIFICATES_BUCKET).createSignedUrl(path, seconds);
  if (error || !data) throw new AppError("CERT_NOT_FOUND", undefined, { cause: error });
  return data.signedUrl;
}

/** Stores a shopper's photo (metadata already removed) in the private bucket; returns its path. */
export async function uploadShopperPhoto(brandId: string, photo: Blob): Promise<string> {
  const problem = checkImageFile(photo);
  if (problem) throw new AppError("UPLOAD_INVALID", problem);
  return upload(SHOPPER_PHOTOS_BUCKET, storagePathFor(brandId, "shopper", photo.type), photo, "3600");
}

/** A short-lived link so the producer can look at a photo waiting for approval. */
export async function signedShopperPhotoUrl(path: string, seconds = 600): Promise<string> {
  const { data, error } = await supabaseAdmin().storage.from(SHOPPER_PHOTOS_BUCKET).createSignedUrl(path, seconds);
  if (error || !data) throw new AppError("SHOPPER_PHOTO_NOT_FOUND", undefined, { cause: error });
  return data.signedUrl;
}

/** Approving: copies the photo to the public bucket under the same path; returns that path. */
export async function publishShopperPhoto(path: string): Promise<string> {
  const { error } = await supabaseAdmin()
    .storage.from(SHOPPER_PHOTOS_BUCKET)
    .copy(path, path, { destinationBucket: BRAND_MEDIA_BUCKET });
  if (error) throw new AppError("UPLOAD_FAILED", "The photo could not be published. Please try again.", { cause: error });
  return path;
}

export async function removeShopperPhotos(paths: string[]): Promise<void> {
  await removeFrom(SHOPPER_PHOTOS_BUCKET, paths);
}

/** Deletes files no longer referenced. Callers log failures; they are not fatal. */
export async function removeBrandMedia(paths: string[]): Promise<void> {
  await removeFrom(BRAND_MEDIA_BUCKET, paths);
}

export async function removeCertificateFiles(paths: string[]): Promise<void> {
  await removeFrom(CERTIFICATES_BUCKET, paths);
}

/**
 * Every file a brand has uploaded, in all three buckets (paths are "{brandId}/{kind}/{file}").
 * Used when an account is deleted. Supabase lists one folder level at a time, 1000 files per call.
 */
export async function removeAllBrandFiles(brandId: string): Promise<number> {
  let removed = 0;
  for (const bucket of [BRAND_MEDIA_BUCKET, CERTIFICATES_BUCKET, SHOPPER_PHOTOS_BUCKET]) {
    const storage = supabaseAdmin().storage.from(bucket);
    const { data: folders, error } = await storage.list(brandId, { limit: 100 });
    if (error) throw error;
    for (const folder of folders ?? []) {
      for (;;) {
        const { data: files, error: listError } = await storage.list(`${brandId}/${folder.name}`, { limit: 1000 });
        if (listError) throw listError;
        const paths = (files ?? []).filter((file) => file.id).map((file) => `${brandId}/${folder.name}/${file.name}`);
        if (paths.length === 0) break;
        await removeFrom(bucket, paths);
        removed += paths.length;
      }
    }
  }
  return removed;
}

async function removeFrom(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabaseAdmin().storage.from(bucket).remove(paths);
  if (error) throw error;
}
