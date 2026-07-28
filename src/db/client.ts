import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnvironment } from "@/lib/env";

import * as schema from "./schema";

let database: ReturnType<typeof createDatabase> | undefined;

function createDatabase() {
  const connectionUrl = getServerEnvironment().DATABASE_URL;

  if (!connectionUrl) {
    throw new Error("DATABASE_URL is required for database access.");
  }

  const queryClient = postgres(connectionUrl, {
    max: 1,
    prepare: false,
  });

  return drizzle(queryClient, { schema });
}

export function getDatabase() {
  database ??= createDatabase();
  return database;
}
