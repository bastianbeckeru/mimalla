import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "@/server/db/schema";
import type { Database } from "@/types/database";

const config = { schema, casing: "snake_case" } as const;

let database: Database | undefined;

export function connectNodePostgres(databaseUrl: string) {
  return drizzlePg(databaseUrl, config);
}

function connect(): Database {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  return new URL(databaseUrl).hostname.endsWith(".neon.tech")
    ? drizzleNeon(databaseUrl, config)
    : connectNodePostgres(databaseUrl);
}

export function getDatabase() {
  database ??= connect();
  return database;
}
