import { z } from "zod";
import { botConfigSchema } from "#/types/modules";
import { guildProcedure, router } from "#modules/trpc";
import { sendEvent } from "#routes/websocket/index.ts";
import { parseConfig } from "#/configParser";
import { eq } from "drizzle-orm";
import { db, schema } from "#modules/db/index.ts";

const guildRouter = router({
  refreshGuild: guildProcedure.mutation(async ({ input }) => {
    try {
      await sendEvent("guildUpdate", { guildId: input.guildId });
      return {
        success: true,
        message: "Guild refresh request sent",
      };
    } catch (err) {
      console.error("Failed to send guildUpdate event:", err);
      return {
        success: false,
        message: "Something went wrong with sending guild refresh request",
      };
    }
  }),
  testConfig: guildProcedure
    .input(z.looseObject({}))
    .mutation(async ({ input }) => {
      try {
        const parseResult = await botConfigSchema.safeParseAsync(input);

        if (!parseResult.success) {
          console.log(parseResult.error);

          return {
            success: false,
            message: "Config is invalid",
            errors: parseResult.error,
          };
        }

        if (!parseResult.data.plugins) {
          return {
            success: false,
            message: "Plugins required for this",
          };
        }

        for (const plugin of Object.keys(parseResult.data.plugins)) {
          console.log("Parsing plugin:", plugin);
          const pluginData =
            parseResult.data.plugins[
              plugin as keyof typeof parseResult.data.plugins
            ];
          console.log(await parseConfig(pluginData!, 50));
        }

        return {
          success: true,
          message: "Config is valid",
          config: parseResult.data,
        };
      } catch (err) {
        console.error("Failed to test config", err);
        return {
          success: false,
          message: "Something went wrong with testing the config",
        };
      }
    }),
  saveConfig: guildProcedure
    .input(botConfigSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const guildUpdateResult = await db
          .update(schema.guild)
          .set({
            settings: input,
          })
          .where(eq(schema.guild.guildId, ctx.guild.guildId))
          .returning();

        await sendEvent("guildRefetch", { guildId: input.guildId });

        return {
          success: true,
          message: "Config saved successfully",
          guild: guildUpdateResult[0],
        };
      } catch (err) {
        console.error("Failed to save config", err);
        return {
          success: false,
          message: "Something went wrong with saving the config",
        };
      }
    }),
  pullConfig: guildProcedure.query(async ({ ctx }) => {
    return ctx.guild.settings;
  }),
});

export default guildRouter;
