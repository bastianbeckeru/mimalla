# The builder file stores only what cannot be derived

A curriculum made in the builder is downloaded as a minified JSON file that can be loaded back to keep editing. Its format departs on purpose from the curriculum files of the catalog: it stores only data that cannot be derived from other data, and every reference points from the referencing item to the referenced one, so no reference can be left dangling. We chose this because files will be kept and shared outside Mi Malla, so a format change is costly, and the catalog files show what redundant, inward references lead to (see `docs/known-problems.md`).

## Considered Options

- **Slots in their own array, as in the catalog.** Rejected: slots could point to courses that do not exist. Slots live inside their course instead, and an elective that repeats has several slots.
- **Areas listing their courses, as in the catalog.** Rejected for the same reason. Each course names its area with `areaId`.
- **Terms as names (`"first"`, `"winter"`...).** Rejected: the file is not meant to be read by people, and numbers match the code. `term` is a number whose meaning depends on `termSystem`, and 4 is always summer.
- **Storing the default credits, heights or colors per course.** Rejected: default credits are the most common credits of the courses, heights follow from them, and course colors follow from areas.

## Consequences

- `position` counts rows, not credits, and the height of each course is recomputed on load. Since the default credits come from the same courses, a file always loads with the layout it was saved with.
- Export is deterministic (courses sorted by their first slot, ids renumbered from 1, fixed key order), so the same curriculum always produces the same file.
- `schemaVersion` starts at 1. A file with a higher version is rejected; a format change must raise it and keep reading older files.
