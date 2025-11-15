import { drizzle } from "drizzle-orm/bun-sql";
import { drizzle as drizzlePgLite } from "drizzle-orm/pglite";
import { SQL } from "bun";
import { PGlite } from "@electric-sql/pglite";
import { installerConfig } from "@modules/installer";
import * as schema from "./schema";
import { pgliteDir } from "../config";

export let db:
  | ReturnType<typeof drizzle<typeof schema>>
  | ReturnType<typeof drizzlePgLite<typeof schema>>;

let client: SQL | PGlite | undefined = undefined;

const buildDatabaseClient = () => {
  if (!installerConfig?.database_url)
    throw new Error("Database URL is not defined in installer configuration");
  switch (installerConfig.database_type) {
    case "pglite":
      return new PGlite(pgliteDir);
    case "postgres":
      return new SQL(installerConfig.database_url);
    default:
      throw new Error(
        `Unsupported database type: ${installerConfig.database_type}`,
      );
  }
};

// @ts-expect-error This is stupid but rather than use ! or ? everywhere we'll just assume db exists, since after first run it should
db = (() => {
  client = buildDatabaseClient();

  if (!installerConfig || !client) {
    console.log("Installer configuration unavailable");
    return;
  }

  switch (installerConfig.database_type) {
    case "pglite":
      return drizzlePgLite({ client: client as PGlite, schema, logger: true });
    case "postgres":
      return drizzle({ client: client as SQL, schema, logger: true });
    default:
      throw new Error(
        `Unsupported database type: ${installerConfig.database_type}`,
      );
  }
})();

export const reconnectDatabase = () => {
  try {
    client = buildDatabaseClient();

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
