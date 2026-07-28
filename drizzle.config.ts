import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const migrationUrl = process.env.DATABASE_MIGRATION_URL;

if (!migrationUrl) {
  throw new Error("DATABASE_MIGRATION_URL is required for database tooling.");
}

export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dbCredentials: { url: migrationUrl },
  strict: true,
  verbose: true,
});
