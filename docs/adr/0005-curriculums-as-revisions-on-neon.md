---
status: accepted
---

# Curriculums are stored as revisions of their curriculum file on Neon

**Supersedes ADR 0001. Not implemented yet.**

Mi Malla becomes a hub where anyone can publish a curriculum and others propose changes to it (ADR 0006). Every version of a curriculum is a revision: an immutable, complete curriculum file stored in Postgres on Neon, accessed with Drizzle. A revision records its parent revision, its author, a message and a hash of its content, and each curriculum points to its current revision. Normalized tables, such as the courses of an institution or a search index, are projections of the current revisions and can be rebuilt from them at any time. We chose complete files over normalized tables as the source of truth because history, diffs, merges and opening a curriculum in the builder all work on whole curriculum files, and rebuilding an old version from normalized rows is costly and easy to get wrong.

## Considered Options

- **Normalized tables as the source of truth, as in ADR 0001 and draft pull request #12.** Rejected: every edit would touch many tables, and history would have to be rebuilt from row changes.
- **Curriculum files in the repo as the source, rebuilt into the database.** Rejected: contributing a curriculum would require a GitHub pull request, which most students will never open.
- **Courses shared between the curriculums of an institution (ADR 0002).** Kept only as a projection: if curriculums shared course rows, a change approved in one curriculum would change others without their review.

## Consequences

- The project runs at no cost: Vercel Hobby, the free plan of Neon and Google sign-in. A paid service needs a new decision. Reads of the catalog are cached so that visits barely reach the database, and only signed-in contributors write.
- Accounts use Better Auth with Google sign-in only, and are needed only to contribute. Viewing the catalog, using the builder and keeping trajectories work without an account, in local storage, as before. There is no email: notices are shown inside the app.
- Each institution has an id, a slug, an acronym, a name and a country; everything else, such as SIES or DEMRE codes, is metadata. Chilean institutions and programs are seeded from the SIES; programs elsewhere are added on request. Only admins edit institutions and programs.
- Trajectories still live in the browser. They reference a curriculum and a revision, and their enrollments reference courses by their stable id (ADR 0007), so a trajectory can move to a newer revision without losing its progress.
- The curriculum files in the repo are imported as the first revisions and then removed, except for a small sample seed for contributors.
- Contributed curriculum data is licensed CC BY-SA 4.0, accepted on a user's first contribution. The code stays MIT.
