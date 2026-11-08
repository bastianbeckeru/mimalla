import { db } from "@/server/db/client";
import { getProgram, getProgramParams } from "@/server/db/curriculums";
import { INSTITUTIONS } from "@/server/db/programs";
import { type SeedInstitution, seedCatalog } from "@/server/db/seed";

// Loads the institutions and programs of the curriculum files in the repo.
const institutions = Object.entries(INSTITUTIONS).map(
  ([slug, { acronym, name }]): SeedInstitution => ({
    slug,
    acronym,
    name,
    country: "CL",
    programs: getProgramParams()
      .filter((params) => params.institutionAcronym === slug)
      .map((params) => {
        const { name, department, siesCode, demreCode, schedule } =
          getProgram(params);
        return {
          slug: params.programSlug,
          name,
          metadata: { department, siesCode, demreCode, schedule },
        };
      }),
  }),
);

await seedCatalog(db, institutions);
console.log(
  `Seeded ${institutions.length} institutions and ${institutions.flatMap((i) => i.programs).length} programs.`,
);
process.exit(0);
