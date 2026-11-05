# Architecture

A map of what `ls` does not tell you: where each surface of the app lives and what the surfaces share. Paths are relative to `src/`.

## Surfaces

| Surface | Route | Entry point | State and logic |
| --- | --- | --- | --- |
| Curriculum viewer | `/[institutionAcronym]/[programSlug]`, optionally followed by `/[effectiveYear]` | `components/curriculum/program-page.tsx` | `server/db/curriculums.ts`, `utils/curriculum.ts` |
| Dashboard | `/dashboard` | `components/dashboard/client-side-dashboard.tsx`, which renders `components/trajectory/trajectory-board.tsx` | `stores/trajectory.ts`, `utils/trajectory.ts`, `utils/grades.ts`, `utils/grading-scheme.ts`, `hooks/use-history.ts` |
| Builder | `/builder` | `components/builder/builder.tsx` | `stores/builder.ts`, `builder/` and its `actions/` |

The dashboard spans two component folders: `components/dashboard/` is the shell (sidebar, settings, new trajectory flow) and `components/trajectory/` is the board (grid, enrollment cards, course panel, dialogs).

## What the surfaces share

`builder/` also serves the viewer and the dashboard, despite its name. Changes to these modules reach all three surfaces:

| Concern | Files |
| --- | --- |
| Connections between courses | `builder/connections.ts` (which ones), `builder/routing.ts` (their paths), `stores/connections.ts` (hover and selection), `components/curriculum/connections-overlay.tsx` (drawing) |
| Grid layout | `builder/grid.ts` (card sizes and positions), `builder/periods.ts` (period order and labels), `utils/curriculum-grid.ts` (cell sizes and lookups) |
| Area colors | `builder/colors.ts` |
| Course card | `components/curriculum/course-card.tsx` (the card), wrapped for dragging by `components/builder/course-card.tsx`, which `components/trajectory/enrollment-card.tsx` reuses |
| Dragging | `hooks/use-grid-gesture.ts`, in the builder and the dashboard |

The `Curriculum` type lives in `types/builder.ts`. `types/curriculum.ts` holds the catalog types: institutions, programs and period keys.

## Files that share a name

| Name | Files |
| --- | --- |
| `course-card.tsx` | `components/curriculum/` (the card), `components/builder/` (its draggable wrapper) |
| `course-panel.tsx` | `components/builder/` (edits a course of a curriculum), `components/trajectory/` (status and grades of an enrollment) |
| `sidebar.tsx` | `components/dashboard/` (the dashboard's), `components/ui/` (the shadcn primitive) |
| `connections.ts` | `builder/` (which connections exist), `stores/` (which course has focus) |
| `colors.ts` | `builder/` (area colors), `utils/` (generic color helpers) |

## Data

- **Curriculums:** `.malla` files in `server/db/curriculums/<institution>/<program>_<effectiveYear>.malla`, read at build time by `server/db/curriculums.ts` and served to the browser by the route under `app/api/curriculums/`.
- **Program data:** `server/db/programs.ts` holds what a curriculum file leaves out, such as the department and the SIES and DEMRE codes.
- **File format:** `builder/schemas.ts`, `builder/import.ts` and `builder/export.ts`. `public/builder/pdf-to-malla.md` is the guide for writing a file from a PDF.
- **Student data:** browser local storage only. The keys are `curriculum-storage` (trajectories, despite its name), `builder-storage` and `preferences-storage`. `stores/legacy-curriculums.ts` exists only to migrate old trajectories.

## Other docs

- `GLOSSARY.md`: the domain vocabulary.
- `docs/adr/`: decisions and why they were made. Check each one's status note: ADRs 0001 and 0002 are not implemented yet.
- `docs/known-problems.md`: known errors in the curriculum files.
- `CONTRIBUTING.md`: commit format, pull request rules and how to add a curriculum.
- `CODING_STANDARDS.md`: rules for writing and reviewing code.
