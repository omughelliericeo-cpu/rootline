"use server";
// Server actions for "Meet the maker": add, edit and remove people.
import { revalidatePath } from "next/cache";
import { defineOwnerAction } from "@/lib/action";
import { tenantOf } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { uploadBrandImage } from "@/lib/storage";
import { addPersonSchema, personIdSchema, updatePersonSchema } from "../schema";
import { nextPersonPosition } from "../service";
import { cleanUpMedia, saveWithUpload } from "@/lib/media-cleanup";

export const addPerson = defineOwnerAction({
  feature: "brand",
  action: "addPerson",
  input: addPersonSchema,
  handler: async ({ name, role, photo }, ctx) => {
    const { owner } = ctx;
    const photoPath = photo ? await uploadBrandImage(owner.brandId, "person", photo) : undefined;
    await saveWithUpload(photoPath, ctx, "addPerson", () =>
      withTenant(tenantOf(owner), async (tx) => {
        const existing = await tx.brandPerson.findMany({ where: { brandId: owner.brandId }, select: { position: true } });
        await tx.brandPerson.create({
          data: {
            brandId: owner.brandId,
            name,
            role,
            photoPath: photoPath ?? null,
            position: nextPersonPosition(existing.map((person) => person.position)),
          },
        });
      }),
    );
    revalidatePath("/brand");
    return { message: `${name} added.` };
  },
});

export const updatePerson = defineOwnerAction({
  feature: "brand",
  action: "updatePerson",
  input: updatePersonSchema,
  handler: async ({ personId, name, role, photo }, ctx) => {
    const { owner } = ctx;
    const newPhotoPath = photo ? await uploadBrandImage(owner.brandId, "person", photo) : undefined;
    const previousPhoto = await saveWithUpload(newPhotoPath, ctx, "updatePerson", () =>
      withTenant(tenantOf(owner), async (tx) => {
        const person = await tx.brandPerson.findFirst({ where: { id: personId, brandId: owner.brandId } });
        if (!person) throw new AppError("PERSON_NOT_FOUND");
        await tx.brandPerson.update({
          where: { id: personId },
          data: { name, role, ...(newPhotoPath ? { photoPath: newPhotoPath } : {}) },
        });
        return newPhotoPath ? person.photoPath : null;
      }),
    );
    await cleanUpMedia([previousPhoto], ctx, "updatePerson");
    revalidatePath("/brand");
    return { message: `${name} updated.` };
  },
});

export const removePerson = defineOwnerAction({
  feature: "brand",
  action: "removePerson",
  input: personIdSchema,
  handler: async ({ personId }, ctx) => {
    const { owner } = ctx;
    const removed = await withTenant(tenantOf(owner), async (tx) => {
      const person = await tx.brandPerson.findFirst({ where: { id: personId, brandId: owner.brandId } });
      if (!person) throw new AppError("PERSON_NOT_FOUND");
      await tx.brandPerson.delete({ where: { id: personId } });
      return person;
    });
    await cleanUpMedia([removed.photoPath], ctx, "removePerson");
    revalidatePath("/brand");
    return { message: `${removed.name} removed.` };
  },
});
