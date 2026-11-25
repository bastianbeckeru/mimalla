---
status: accepted
---

# The curriculum file is the only curriculum format

A curriculum travels in one format, the `.malla` curriculum file: the builder downloads and loads it, and the catalog imports it, replacing the catalog's own JSON format. Catalog data that describes the program rather than one curriculum (department, acronyms, SIES and DEMRE codes, schedule) stays in the database: a program is registered once, and each curriculum file is imported into it. We chose one format over keeping a richer catalog format beside the builder's because the catalog will grow to hundreds of curriculums extracted from PDFs, and one guide, one validator and one visual tool to review them is worth more than two schemas drifting apart.

## Considered Options

- **Two formats: the builder's for personal curriculums, a richer one for the catalog.** Rejected: both describe the same thing, and every rule would be written twice.
- **Catalog data inside the curriculum file.** Rejected: it repeats in every curriculum of a program, and a curriculum made in the builder has none of it.

## Consequences

- Until ADR 0005 is implemented there is no database: the catalog reads the curriculum files at build time and keeps program data in `src/server/db/programs.ts`.
- What the catalog format carried and the curriculum file lacks is dropped on purpose: program statistics (costly to keep current and rarely used), course descriptions (PDFs do not carry them), the courses that can fill an elective (they change every term), subareas, and nested tracks.
- The curriculum file allows courses without a code. This ADR made the catalog reject them, because trajectories would reference courses by code; ADR 0007 reverses that, since trajectories reference courses by a stable id.
