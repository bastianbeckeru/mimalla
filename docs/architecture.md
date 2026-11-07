# Architecture

A map of what `ls` does not tell you: where each surface of the app lives and what the surfaces share. Paths are relative to `src/`.

## Surfaces

| Surface | Route | Entry point | State and logic |
| --- | --- | --- | --- |
| Curriculum viewer | `/[institutionAcronym]/[programSlug]`, optionally followed by `/[effectiveYear]` | `components/curriculum/program-page.tsx` | `server/db/curriculums.ts`, `utils/curriculum.ts` |
| Dashboard | `/dashboard` | `components/dashboard/client-side-dashboard.tsx`, which renders `components/trajectory/trajectory-board.tsx` | `stores/trajectory.ts`, `utils/trajectory/`, `utils/grades.ts`, `utils/grading-scheme.ts`, `hooks/use-history.ts` |
| Builder | `/builder` | `components/builder/builder.tsx` | `stores/builder.ts`, `builder/apply.ts`, `builder/draft.ts`, `builder/actions/` |

The dashboard spans two component folders: `components/dashboard/` is the shell (sidebar, settings, new trajectory flow) and `components/trajectory/` is the board (grid, enrollment cards, course panel, dialogs).

`utils/trajectory/` is split by what it answers: `layout.ts` (where each card goes), `edits.ts` (whether a change is allowed) and `progress.ts` (what the student has approved).

In `components/trajectory/`, `trajectory-board.tsx` owns the board's state and edits; `use-board-panel.ts`, `use-board-scroll.ts`, `board-sensors.ts`, `board-options.ts` and `edit-feedback.ts` hold its course panel state, scrolling, drag input, dialog options and error messages. `course-panel.tsx` chooses between the desktop panel and the mobile drawer, and `course-panel-content.tsx` is what both show, built from `grade-summary.tsx`, `grading-scheme-editor.tsx` and `course-details.tsx`. `grading-scheme-editor.tsx` owns the assessment list; `assessment-row.tsx`, `assessment-menu.tsx` and `use-scheme-drag.ts` hold each row, its options and the dragging.

## What the surfaces share

`curriculum/` is what every surface builds on: the curriculum file, the grid and the connections. It depends on no surface, and Biome rejects imports from `builder/`, `components/`, `stores/`, `hooks/`, `server/` and `app/` in it.

| Concern | Files |
| --- | --- |
| Connections between courses | `curriculum/connections.ts` (which ones), `curriculum/routing.ts` (their paths), `stores/connections.ts` (hover and selection), `components/curriculum/connections-overlay.tsx` (drawing) |
| Grid layout | `curriculum/grid.ts` (card sizes and positions), `curriculum/periods.ts` (period order and labels), `curriculum/grid-cells.ts` (cell sizes and lookups) |
| Area colors | `curriculum/colors.ts` |
| Course card | `components/curriculum/course-card.tsx` (the card), wrapped for dragging by `components/builder/course-card.tsx`, which `components/trajectory/enrollment-card.tsx` reuses |
| Dragging | `hooks/use-grid-gesture.ts`, in the builder and the dashboard |

`components/curriculum/` is the viewer's folder, but the card and the connections overlay in it are shared too. `types/curriculum.ts` holds the curriculum and catalog types; `types/builder.ts` holds only the builder's draft and actions.

## Files that share a name

| Name | Files |
| --- | --- |
| `course-card.tsx` | `components/curriculum/` (the card), `components/builder/` (its draggable wrapper) |
| `course-panel.tsx` | `components/builder/` (edits a course of a curriculum), `components/trajectory/` (status and grades of an enrollment) |
| `sidebar.tsx` | `components/dashboard/` (the dashboard's), `components/ui/` (the shadcn primitive) |
| `connections.ts` | `curriculum/` (which connections exist), `stores/` (which course has focus) |
| `colors.ts` | `curriculum/` (area colors), `utils/` (generic color helpers) |

## Data

- **Curriculums:** `.malla` files in `server/db/curriculums/<institution>/<program>_<effectiveYear>.malla`, read at build time by `server/db/curriculums.ts` and served to the browser by the route under `app/api/curriculums/`.
- **Program data:** `server/db/programs.ts` holds what a curriculum file leaves out, such as the department and the SIES and DEMRE codes.
- **File format:** `curriculum/schemas.ts`, `curriculum/import.ts` and `curriculum/export.ts`. `public/builder/pdf-to-malla.md` is the guide for writing a file from a PDF.
- **Student data:** browser local storage only. The keys are `curriculum-storage` (trajectories, despite its name), `builder-storage` and `preferences-storage`. `stores/legacy-curriculums.ts` exists only to migrate old trajectories.

## Other docs

- `DESIGN.md`: the fonts and visual rules.
- `GLOSSARY.md`: the domain vocabulary.
- `docs/adr/`: decisions and why they were made. Check each one's status note: ADRs 0001 and 0002 are not implemented yet.
- `docs/known-problems.md`: known errors in the curriculum files.
- `CONTRIBUTING.md`: commit format, pull request rules and how to add a curriculum.
- `CODING_STANDARDS.md`: rules for writing and reviewing code.
