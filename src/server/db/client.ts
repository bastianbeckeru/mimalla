import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "@/server/db/schema";
import type { Database } from "@/types/database";

let database: Database | undefined;

function connect(): Database {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const config = { schema, casing: "snake_case" } as const;
  return new URL(databaseUrl).hostname.endsWith(".neon.tech")
    ? drizzleNeon(databaseUrl, config)
    : drizzlePg(databaseUrl, config);
}

export function getDatabase() {
  database ??= connect();
  return database;
}
