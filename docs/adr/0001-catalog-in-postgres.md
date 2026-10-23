# The catalog lives in Postgres

Curriculums used to live as JSON files in the repo, one per program. They now live in Postgres (Neon, accessed with Drizzle), which is the source of truth: a curriculum enters through an import script that validates a file and inserts it, and the file is then discarded. We chose this over keeping the JSON files as the source and rebuilding the database from them, because the catalog will grow to hundreds of curriculums extracted from PDFs, courses are shared within an institution, curriculums have a draft state, and an optional cloud sync of trajectories will need the database anyway.

## Consequences

- Fixing a curriculum is no longer a pull request on a JSON file, so the repo is open in its code but not in its data. The repo ships a small sample seed so contributors can run the app against a local Postgres.
- Trajectories stay in the browser and reference a curriculum and course codes, not database ids.
