// Business rules for brand profiles. Pure functions, unit tested in tests/.

/** Enough for a hero plus a small gallery without slowing the story page down. */
export const MAX_BRAND_PHOTOS = 8;

/** The story page embeds video from these hosts only (no video hosting of our own). */
const VIDEO_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "vimeo.com", "player.vimeo.com"]);

export function isSupportedVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && VIDEO_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function canAddPhoto(currentCount: number): boolean {
  return currentCount < MAX_BRAND_PHOTOS;
}

/** New people go to the end of the "Meet the maker" list. */
export function nextPersonPosition(existingPositions: number[]): number {
  return existingPositions.length === 0 ? 0 : Math.max(...existingPositions) + 1;
}

/**
 * Removes one photo path from the list. Returns null when the path is not in
 * the list, so a forged request cannot delete another brand's file.
 */
export function withoutPhoto(photoPaths: string[], path: string): string[] | null {
  return photoPaths.includes(path) ? photoPaths.filter((existing) => existing !== path) : null;
}
