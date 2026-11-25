import { jsonb, snakeCase, text, unique } from "drizzle-orm/pg-core";
import { pk } from "@/server/db/columns";
import type { Schedule } from "@/types/curriculum";

export type InstitutionMetadata = Record<string, never>;

export type ProgramMetadata = {
  department?: { name: string; acronym: string };
  siesCode?: string;
  demreCode?: number;
  schedule?: Schedule;
};

export const institution = snakeCase.table("institution", {
  id: pk("institution"),
  slug: text().notNull().unique("institution_slug_key"),
  acronym: text().notNull(),
  name: text().notNull(),
  // ISO 3166-1 alpha-2, such as "CL".
  country: text().notNull(),
  metadata: jsonb().$type<InstitutionMetadata>().notNull().default({}),
});

export const program = snakeCase.table(
  "program",
  {
    id: pk("program"),
    institutionId: text()
      .notNull()
      .references(() => institution.id),
    slug: text().notNull(),
    name: text().notNull(),
    metadata: jsonb().$type<ProgramMetadata>().notNull().default({}),
  },
  (t) => [
    unique("program_institution_id_slug_key").on(t.institutionId, t.slug),
  ],
);
