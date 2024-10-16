import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 *
 * ❗Revisar los enlaces para configurar y optimizar drizzle con neon y este con vercel
 * - https://orm.drizzle.team/learn/tutorials/drizzle-with-neon
 * - https://neon.tech/docs/guides/vercel
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
