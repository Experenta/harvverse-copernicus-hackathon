import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import {
  attachments,
  attachmentOwnerTypeEnum,
  farms,
  insertAttachmentSchema,
  lots,
  users,
} from "@harvverse-copernicus-hackathon/db/schema";
import type { Context } from "../context";
import { protectedProcedure, router } from "../index";

const ownerTypeSchema = z.enum(attachmentOwnerTypeEnum.enumValues);
type AttachmentOwnerType = typeof attachmentOwnerTypeEnum.enumValues[number];

async function getRequestingUser(ctx: Context) {
  if (!ctx.clerkId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
  }
  const requestingUser = await ctx.db.query.users.findFirst({
    where: eq(users.clerkId, ctx.clerkId),
  });
  if (!requestingUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
  }
  return requestingUser;
}

async function assertCanAccessOwner(
  ctx: Context,
  ownerType: AttachmentOwnerType,
  ownerId: number,
) {
  const requestingUser = await getRequestingUser(ctx);

  if (ownerType === "user") {
    if (ownerId !== requestingUser.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access this user attachment" });
    }
    return;
  }

  if (ownerType === "farm") {
    const farm = await ctx.db.query.farms.findFirst({
      where: eq(farms.id, ownerId),
    });
    if (!farm) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Farm not found" });
    }
    if (farm.farmerId !== requestingUser.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access this farm attachment" });
    }
    return;
  }

  const lot = await ctx.db.query.lots.findFirst({
    where: eq(lots.id, ownerId),
    with: { farm: true },
  });
  if (!lot) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Lot not found" });
  }
  if (lot.farm.farmerId !== requestingUser.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You cannot access this lot attachment" });
  }
}

export const attachmentsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        ownerType: ownerTypeSchema,
        ownerId: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertCanAccessOwner(ctx, input.ownerType, input.ownerId);
      return ctx.db.query.attachments.findMany({
        where: and(
          eq(attachments.ownerType, input.ownerType),
          eq(attachments.ownerId, input.ownerId),
        ),
        orderBy: (attachments, { desc }) => [desc(attachments.createdAt)],
      });
    }),

  create: protectedProcedure
    .input(insertAttachmentSchema)
    .mutation(async ({ ctx, input }) => {
      await assertCanAccessOwner(ctx, input.ownerType, input.ownerId);
      const [attachment] = await ctx.db
        .insert(attachments)
        .values(input)
        .returning();

      if (!attachment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create attachment",
        });
      }

      return attachment;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.attachments.findFirst({
        where: eq(attachments.id, input.id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attachment not found",
        });
      }
      await assertCanAccessOwner(ctx, existing.ownerType, existing.ownerId);

      const [attachment] = await ctx.db
        .delete(attachments)
        .where(eq(attachments.id, input.id))
        .returning();

      if (!attachment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attachment not found",
        });
      }

      return attachment;
    }),
});
