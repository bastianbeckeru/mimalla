---
status: accepted
---

# The curriculum file gives every course a stable id

**Amends ADR 0003. Not implemented yet.**

Version 2 of the curriculum file gives every course, area and track an id generated with nanoid when it is created, kept through every edit and every export. Version 1 renumbers ids from 1 on export, so two revisions of a curriculum cannot tell whether a course is the same one, and a trajectory, whose enrollments point to a course id, can end up pointing to another course after a fix. Stable ids are what diffs, merges and moving a trajectory to a newer revision rely on. We chose a generated id over the course code because a curriculum can be published without codes and have them added later, and over matching courses by name and slot because both change in the edits we most need to follow.

Version 2 also adds the trimester term system: three regular terms per program year, with term 4 still the summer term. A cuatrimestre, as in Argentina, is two terms per year like a semester, so it is a different label for the semester system rather than a new one.

## Consequences

- A version 1 file still loads: its courses, areas and tracks get new ids on import. Two imports of the same version 1 file produce different ids, so a curriculum enters the catalog once and is changed from its revisions afterwards.
- Export stays deterministic for a given curriculum: courses are still sorted by their first slot, but ids are no longer renumbered.
- Courses without a code are accepted in the catalog, reversing the rule in ADR 0004, because trajectories reference courses by id instead of by code.
