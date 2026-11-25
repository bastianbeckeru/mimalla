---
status: accepted
---

# One curriculum per program and effective year, changed through proposals

**Not implemented yet.**

A program has at most one curriculum per effective year in the catalog. Anyone signed in can publish a curriculum for a program and year that has none, and becomes its maintainer; for one that exists, every change is a proposal made in the builder, which a maintainer approves or closes, as with a pull request. We chose a single curriculum over competing public forks because forks split students of the same program across curriculums that drift apart, and a fix made in one never reaches the others. A personal copy is still the builder and its curriculum file.

The risk of a single curriculum is a maintainer who stops answering, so no curriculum depends on one person:

- A proposal unanswered for 14 days is approved if two other users approve it and nobody objects. The rule is checked when the proposal is opened or listed, not on a schedule.
- A maintainer inactive for 60 days with proposals waiting can be replaced by an admin, at the request of a user with approved proposals in that curriculum.
- A maintainer can add other maintainers, and a user with three approved proposals in a curriculum can be invited to maintain it.

## Considered Options

- **Competing public forks for the same program and year.** Rejected for the reasons above.
- **Quick edits from the curriculum viewer, such as adding a course code on its card.** Rejected: every change goes through a proposal from the builder, so review and history live in one place.
- **No curriculum public until an admin reviews it.** Rejected: admins would limit how fast the catalog grows. A curriculum is public as a community curriculum when published, and an admin marks a revision as verified after checking it against the official curriculum.

## Consequences

- Nobody approves their own proposal, except a maintainer in the curriculums they maintain. Admins can approve in any curriculum and reassign maintainers.
- A proposal merges on its own when it starts from the current revision. Otherwise its changes are merged course by course and field by field, and it has a conflict only where both sides changed the same field of the same course.
- A proposal cannot change the program or effective year of a curriculum; an admin corrects them.
- A curriculum for a program not yet in the catalog stays a draft, visible only to its author, until an admin approves the program.
- Curriculums are never deleted. An admin can archive one, and trajectories that use it keep working.
- To limit spam, a user can publish at most 3 curriculums and open at most 20 proposals per day, and only users with an approved proposal or an account at least 7 days old count toward approving the proposals of others.
- Admins are named only by a script run against the production database.
