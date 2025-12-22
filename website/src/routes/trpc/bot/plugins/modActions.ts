import { router, botProcedure } from "#modules/trpc";
import { zodSnowflake } from "#/types/discord";
import z from "zod";
import { db, schema } from "#modules/db/index.ts";
import { eq, and } from "drizzle-orm";

const modActionsRouter = router({
  createBan: botProcedure
    .input(
      z.object({
        guildId: z.uuid(),
        targetId: zodSnowflake,
        caseId: z.uuid(),
        creatorId: zodSnowflake.optional(),
        reason: z.string(),
        duration: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const banCreate = await db
          .insert(schema.guildBan)
          .values({
            guildId: input.guildId,
            caseId: input.caseId,
            targetId: input.targetId,
            authorId: input.creatorId || null,
            reason: input.reason,
            expiresAt: input.duration
              ? new Date(Date.now() + input.duration)
              : null,
          })
          .returning();

        if (!banCreate[0]) {
          return { success: false, message: "Failed to create ban." };
        }

        return { success: true, ban: banCreate[0] };
      } catch (err) {
        console.error("Error creating ban:", err);
        return { success: false, message: `Failed to create ban: ${err}` };
      }
    }),
  checkBan: botProcedure
    .input(
      z.object({
        guildId: z.uuid(),
        targetId: zodSnowflake,
      }),
    )
    .query(async ({ input }) => {
      const ban = await db.query.guildBan.findFirst({
        where: and(
          eq(schema.guildBan.targetId, input.targetId),
          eq(schema.guildBan.guildId, input.guildId),
        ),
      });

      if (!ban) {
        return { success: false, message: "Ban not found" };
      }

      return { success: true, message: "Ban found", ban };
    }),
  deleteBan: botProcedure
    .input(
      z.object({
        guildId: z.uuid(),
        targetId: zodSnowflake,
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const banDelete = await db
          .delete(schema.guildBan)
          .where(
            and(
              eq(schema.guildBan.targetId, input.targetId),
              eq(schema.guildBan.guildId, input.guildId),
            ),
          )
          .returning();

        if (!banDelete[0]) {
          return { success: false, message: "Failed to delete ban." };
        }

        return { success: true, message: "Ban deleted", ban: banDelete[0] };
      } catch (err) {
        console.error("Error deleting ban:", err);
        return { success: false, message: `Failed to delete ban: ${err}` };
      }
    }),
});

export default modActionsRouter;
