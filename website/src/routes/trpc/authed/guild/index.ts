import { guildProcedure, router } from "#modules/trpc";
import z from "zod";
import { guildInsertSchema } from "#modules/db/schema.ts";
import { db, schema } from "#modules/db/index.ts";
import { zodSnowflake } from "#/types/discord";
import { eq } from "drizzle-orm";
import { sendEvent } from "#routes/websocket/index.ts";

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
});

export default guildRouter;
