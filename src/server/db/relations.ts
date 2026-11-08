import { defineRelations } from "drizzle-orm";
import * as schema from "@/server/db/schema";

export const relations = defineRelations(schema, (r) => ({
  institution: {
    programs: r.many.program({
      from: r.institution.id,
      to: r.program.institutionId,
    }),
  },
  program: {
    institution: r.one.institution({
      from: r.program.institutionId,
      to: r.institution.id,
      optional: false,
    }),
  },
}));
