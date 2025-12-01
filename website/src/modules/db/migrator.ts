import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import type { PgliteDatabase } from "drizzle-orm/pglite";

import { DATA_DIR } from "@modules/config";
import { installerConfig } from "@modules/installer";
import * as path from "node:path";
import * as fs from "node:fs";
import unzipper from "unzipper";

import { migrate as migrateBun } from "drizzle-orm/bun-sql/migrator";
import { migrate as migratePgLite } from "drizzle-orm/pglite/migrator";

declare const EXECUTABLE: boolean;

export async function migrate<TSchema extends Record<string, unknown>>(
  db: BunSQLDatabase<TSchema> | PgliteDatabase<TSchema>,
) {
  let migrationsFolder: string;
  if (EXECUTABLE) {
    let zipBlob: Blob | null = null;
    for (const file of Bun.embeddedFiles) {
      if ((file as File).name === "migrations.zip") {
        zipBlob = file as Blob;
        break;
      }
    }

    if (!zipBlob) {
      throw new Error("Migrations zip file not found in embedded files");
    }

    const zip = await unzipper.Open.buffer(
      Buffer.from(await zipBlob.arrayBuffer()),
    );

    migrationsFolder = path.join(DATA_DIR, "migrations");

    fs.mkdirSync(migrationsFolder, { recursive: true });

    await zip.extract({ path: DATA_DIR });
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
