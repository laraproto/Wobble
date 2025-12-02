import { drizzle } from "drizzle-orm/bun-sql";
import { drizzle as drizzlePgLite } from "drizzle-orm/pglite";
import { migrate } from "./migrator";
import { SQL } from "bun";
import { PGlite } from "@electric-sql/pglite";
import { installerConfig } from "#modules/installer";
import * as schema from "./schema";
import { pgliteDir } from "../config";
import { createPGlite } from "#/pglite-wrapper";

export let db:
  | ReturnType<typeof drizzle<typeof schema>>
  | ReturnType<typeof drizzlePgLite<typeof schema>>;

let client: SQL | PGlite | undefined = undefined;

const buildDatabaseClient = async () => {
  if (!installerConfig?.database_type) {
    console.log("Database Type is not defined in installer configuration");
    return;
  }
  switch (installerConfig.database_type) {
    case "pglite":
      console.log("About to create PGLite instance");
      return await createPGlite(pgliteDir);
    case "postgres":
      if (!installerConfig?.database_url) {
        console.log("Database URL is not defined in installer configuration");
        return;
      }
      return new SQL(installerConfig.database_url);
    default:
      throw new Error(
        `Unsupported database type: ${installerConfig.database_type}`,
      );
  }
};

(() => {
  buildDatabaseClient().then((createdClient) => {
    client = createdClient;

    if (!installerConfig || !client) {
      console.log("Installer configuration unavailable");
      return;
    }

    switch (installerConfig.database_type) {
      case "pglite":
        const pglite = drizzlePgLite({
          client: client as PGlite,
          schema,
          logger: true,
        });
        migrate(pglite);
        db = pglite;
        break;
      case "postgres":
        const postgres = drizzle({
          client: client as SQL,
          schema,
          logger: true,
        });
        migrate(postgres);
        db = postgres;
        break;
      default:
        throw new Error(
          `Unsupported database type: ${installerConfig.database_type}`,
        );
    }
  });
})();

export const reconnectDatabase = async () => {
  try {
    client = await buildDatabaseClient();

    if (client === undefined) {
      console.log("sql client not created");
      return;
    }

    switch (installerConfig!.database_type) {
      case "pglite":
        db = drizzlePgLite({ client: client as PGlite, schema, logger: true });
        return;
      case "postgres":
        db = drizzle({ client: client as SQL, schema, logger: true });
        return;
      default:
        throw new Error(
          `Unsupported database type: ${installerConfig!.database_type}`,
        );
    }
  } catch (err) {
    console.log(
      "Connection attempted but failed due to missing or incorrect first run config",
      err,
    );
  }
};

export * as schema from "./schema";
