import { installerProcedure, router } from "#modules/trpc";
import { z } from "zod";
import { zodSnowflake } from "#/types/discord";
import { db, reconnectDatabase } from "#modules/db";
import {
  configDB,
  InstallerConfiguration,
  setInstallerConfig,
} from "#modules/installer";
import { migrate } from "#modules/db/migrator";
import { startBotChildProcess } from "#/modules/bot";
import { serverUrl } from "#/index";
import { setupOAuthModules } from "#/modules/oauth";

const installerRouter = router({
  set: installerProcedure
    .input(
      z.object({
        databaseType: z.string().min(1, "Database type is required"),
        databaseUrl: z.string(),
        websiteUrl: z.url().min(1, "URL is required"),
        botToken: z.string().min(1, "Bot token is required"),
        clientId: zodSnowflake.min(1, "Client ID is required"),
        clientSecret: z.string().min(1, "Client Secret is required"),
        registrationEnabled: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.databaseType === "postgres" && input.databaseUrl === "") {
        return {
          success: false,
          message: "Database URL is required for PostgreSQL",
        };
      }

      const installerGenerated = new InstallerConfiguration(
        input.databaseType,
        input.databaseUrl,
        input.websiteUrl,
        input.registrationEnabled ? 1 : 0,
        input.botToken,
        input.clientId,
        input.clientSecret,
      );

      const updateQuery = configDB.query(
        "INSERT INTO data(database_type,database_url,url,registration_enabled,bot_token,client_id,client_secret) VALUES ($database_type,$database_url,$url,$registration_enabled,$bot_token,$client_id,$client_secret);",
      );

      setInstallerConfig(installerGenerated);

      try {
        await reconnectDatabase();
      } catch (err) {
        console.error(err);
        return {
          success: false,
          message: `Failed to connect to the database: ${(err as Error).message}`,
        };
      }

      try {
        if (!db) {
          return {
            success: false,
            message: "Database connection is not available.",
          };
        }
        await migrate(db);
      } catch (err) {
        console.error(err);
        return {
          success: false,
          message: `Failed to migrate the database: ${(err as Error).message}`,
        };
      }

      try {
        console.log("Setting up OAuth modules");

        setupOAuthModules();
      } catch (err) {
        console.error(err);
        return {
          success: false,
          message: `Failed to setup OAuth modules: ${(err as Error).message}`,
        };
      }

      try {
        console.log("Attempting to initialise discord bot");

        if (!serverUrl) {
          throw new Error(
            "Server somehow doesn't know it's URL, this shouldn't happen!",
          );
        }

        const botStarted = await startBotChildProcess(serverUrl, Bun.main);

        if (!botStarted) {
          throw new Error("Failed to start bot process");
        }
      } catch (err) {
        console.error(err);
        return {
          success: false,
          message: `Failed to setup OAuth modules: ${(err as Error).message}`,
        };
      }

      try {
        console.log("Storing installer config");
        updateQuery.get({
          database_type: installerGenerated.database_type,
          database_url: installerGenerated.database_url,
          url: installerGenerated.url,
          registration_enabled: installerGenerated.canRegister ? 1 : 0,
          bot_token: installerGenerated.bot_token,
          client_id: installerGenerated.client_id,
          client_secret: installerGenerated.client_secret,
        });
        return {
          success: true,
          message: "Panel configured",
          redirect: "/",
        };
      } catch (err) {
        console.error(err);
        setInstallerConfig(null);
        configDB.run("DELETE FROM data;");

        return {
          success: false,
          message: `Failed to save installer configuration: ${(err as Error).message}`,
        };
      }
    }),
});

export default installerRouter;
