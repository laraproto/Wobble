import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import type { PgliteDatabase } from "drizzle-orm/pglite";

import { DATA_DIR } from "@modules/config";
import { installerConfig } from "@modules/installer";
import * as path from "node:path";

import { migrate as migrateBun } from "drizzle-orm/bun-sql/migrator";
import { migrate as migratePgLite } from "drizzle-orm/pglite/migrator";

declare const EXECUTABLE: boolean;

export async function migrate<TSchema extends Record<string, unknown>>(
  db: BunSQLDatabase<TSchema> | PgliteDatabase<TSchema>,
) {
  let migrationsFolder: string;
  if (EXECUTABLE) {
    console.log("Network download migration functionality not made yet");
    migrationsFolder = path.join(DATA_DIR, "migrations");
  } else {
    migrationsFolder = path.join(import.meta.dir, "migrations");
  }

  switch (installerConfig?.database_type) {
    case "pglite":
      await migratePgLite(db as PgliteDatabase<TSchema>, {
        migrationsFolder,
      });
      break;
    case "postgres":
      await migrateBun(db as BunSQLDatabase<TSchema>, {
        migrationsFolder,
      });
      break;
    default:
      throw new Error(
        `Unsupported database type: ${installerConfig?.database_type}`,
      );
  }
}
