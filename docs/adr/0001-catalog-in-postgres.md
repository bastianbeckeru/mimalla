---
status: accepted
---

# The catalog lives in Postgres

**Not implemented yet.** Curriculums are still files in the repo, in `src/server/db/curriculums/`. The move to Postgres is in draft pull request #12.

Curriculums live as files in the repo, one per program. They will move to Postgres (Neon, accessed with Drizzle), which will be the source of truth: a curriculum will enter through an import script that validates a file and inserts it, and the file will then be discarded. We chose this over keeping the files as the source and rebuilding the database from them, because the catalog will grow to hundreds of curriculums extracted from PDFs, courses are shared within an institution, curriculums have a draft state, and an optional cloud sync of trajectories will need the database anyway.

## Consequences

- Fixing a curriculum will no longer be a pull request on a file, so the repo will be open in its code but not in its data. The repo will ship a small sample seed so contributors can run the app against a local Postgres.
- Trajectories stay in the browser and will reference a curriculum and course codes, not database ids.
