// Removing files that are no longer used. A failed delete only leaves an
// unused file in storage, so it is logged as a warning instead of failing
// the user's action.
import "server-only";
import type { ActionContext } from "./action";
import { logger } from "./logger";
import { removeBrandMedia } from "./storage";

/** Removes public images (brand-media bucket) that nothing refers to any more. */
export async function cleanUpMedia(paths: Array<string | null | undefined>, ctx: ActionContext, action: string) {
  const toRemove = paths.filter((path): path is string => Boolean(path));
  try {
    await removeBrandMedia(toRemove);
  } catch (error) {
    logger.warn("unused media not removed", {
      feature: "storage",
      action,
      requestId: ctx.requestId,
      brandId: ctx.brandId,
      paths: toRemove,
      error,
    });
  }
}

/**
 * Runs a database write that refers to a newly uploaded file. If the write
 * fails, the new file is removed again so storage does not fill with orphans.
 */
export async function saveWithUpload<T>(
  newPath: string | undefined,
  ctx: ActionContext,
  action: string,
  write: () => Promise<T>,
): Promise<T> {
  try {
    return await write();
  } catch (error) {
    await cleanUpMedia([newPath], ctx, action);
    throw error;
  }
}
