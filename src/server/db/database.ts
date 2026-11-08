import type { PgAsyncDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { relations } from "@/server/db/relations";

/** Any Drizzle database on this schema: Neon in the app, PGlite in tests. */
export type Database = PgAsyncDatabase<PgQueryResultHKT, typeof relations>;
