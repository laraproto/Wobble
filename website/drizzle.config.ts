import { defineConfig } from "drizzle-kit";
export default defineConfig({
  out: "./src/modules/db/migrations",
  schema: "./src/modules/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
