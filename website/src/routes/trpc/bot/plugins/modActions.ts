import { router, botProcedure } from "#modules/trpc";
import { zodSnowflake } from "#/types/discord";
import z from "zod";
import { db, schema } from "#modules/db/index.ts";

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
});

export default modActionsRouter;
