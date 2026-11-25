import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { relations } from "@/server/db/relations";

const globalForDb = globalThis as unknown as { pool: Pool | undefined };

// Development reuses one pool across hot reloads.
const pool =
  globalForDb.pool ??
  new Pool({ connectionString: process.env.DATABASE_URL as string });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle({ client: pool, relations });
