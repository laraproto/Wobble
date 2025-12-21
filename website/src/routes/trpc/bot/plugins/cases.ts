import z from "zod";
import { router, botProcedure } from "#modules/trpc";
import { zodSnowflake } from "#/types/discord";
import { db, schema } from "#modules/db/index.ts";
import { eq, and, count, desc } from "drizzle-orm";

const casesRouter = router({
  getCase: botProcedure
    .input(
      z.object({
        guildId: zodSnowflake,
        caseId: z.uuid(),
      }),
    )
    .query(async ({ input }) => {
      const guildCase = await db.query.guildCases.findFirst({
        where: and(
          eq(schema.guildCases.guildId, input.guildId),
          eq(schema.guildCases.uuid, input.caseId),
        ),
      });

      if (!guildCase) {
        return {
          success: false,
          message: "Case not found.",
        };
      }

      return {
        success: true,
        message: "Case retrieved successfully.",
        data: guildCase,
      };
    }),
  getCasesByUser: botProcedure
    .input(
      z.object({
        guildId: zodSnowflake,
        userId: zodSnowflake,
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ input }) => {
      const totalCases = await db
        .select({ count: count() })
        .from(schema.guildCases)
        .where(
          and(
            eq(schema.guildCases.guildId, input.guildId),
            eq(schema.guildCases.targetId, input.userId),
          ),
        );

      if (!totalCases[0]) {
        return {
          success: false,
          message: "No cases found for this user.",
        };
      }

      const cases = await db.query.guildCases.findMany({
        where: and(
          eq(schema.guildCases.guildId, input.guildId),
          eq(schema.guildCases.targetId, input.userId),
        ),
        orderBy: [desc(schema.guildCases.createdAt)],
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
      });

      return {
        message: "Following cases retrieved",
        data: cases,
        total: Number(totalCases[0].count),
        pageTotal: Math.ceil(Number(totalCases[0].count) / input.pageSize),
      };
    }),
  getCases: botProcedure
    .input(
      z.object({
        guildId: zodSnowflake,
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ input }) => {
      const totalCases = await db
        .select({ count: count() })
        .from(schema.guildCases)
        .where(eq(schema.guildCases.guildId, input.guildId));

      if (!totalCases[0]) {
        return {
          success: false,
          message: "No cases found for this guild.",
        };
      }

      const cases = await db.query.guildCases.findMany({
        where: eq(schema.guildCases.guildId, input.guildId),
        orderBy: [desc(schema.guildCases.createdAt)],
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
      });

      return {
        message: "Following cases retrieved",
        data: cases,
        total: Number(totalCases[0].count),
        pageTotal: Math.ceil(Number(totalCases[0].count) / input.pageSize),
      };
    }),
  createCase: botProcedure
    .input(schema.guildCasesInsertSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await db
          .insert(schema.guildCases)
          .values(input)
          .returning();

        if (!result[0]) {
          return {
            success: false,
            message: "Failed to create case.",
          };
        }

        return {
          success: true,
          message: "Case created successfully.",
          data: result[0],
        };
      } catch (err) {
        return {
          success: false,
          message: `Error creating case: ${err}`,
        };
      }
    }),
  editCase: botProcedure
    .input(
      z.object({
        caseId: z.uuid(),
        guildId: zodSnowflake,
        reason: z.string().optional(),
        moderatorId: zodSnowflake.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const result = await db
          .update(schema.guildCases)
          .set({
            reason: input.reason,
            creatorId: input.moderatorId,
          })
          .where(
            and(
              eq(schema.guildCases.guildId, input.guildId),
              eq(schema.guildCases.uuid, input.caseId),
            ),
          )
          .returning();

        if (!result) {
          return {
            success: false,
            message: "Failed to edit case.",
          };
        }

        return {
          success: true,
          message: "Case edited successfully.",
          data: result,
        };
      } catch (err) {
        return {
          success: false,
          message: `Error editing case: ${err}`,
        };
      }
    }),
  deleteCase: botProcedure
    .input(
      z.object({
        caseId: z.uuid(),
        guildId: zodSnowflake,
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const deletedCase = await db
          .delete(schema.guildCases)
          .where(
            and(
              eq(schema.guildCases.guildId, input.guildId),
              eq(schema.guildCases.uuid, input.caseId),
            ),
          )
          .returning();

        if (!deletedCase) {
          return {
            success: false,
            message: "Failed to delete case.",
          };
        }

        return {
          success: true,
          message: "Case deleted successfully.",
          data: deletedCase,
        };
      } catch (err) {
        return {
          success: false,
          message: `Error deleting case: ${err}`,
        };
      }
    }),
});

export default casesRouter;
