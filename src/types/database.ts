import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/server/db/schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
