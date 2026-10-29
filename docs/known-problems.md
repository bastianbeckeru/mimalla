# Known problems

Data problems found in the curriculum files (`src/server/db/curriculums/`) that are not fixed yet, because fixing them needs the official source of each curriculum (#5). None of them breaks the app, but they show wrong or missing information.

## Química y Farmacia (UCH) has almost no areas

`uch/quimica-y-farmacia_2022.malla` was converted from a catalog file built on the Derecho template, whose law areas matched none of its courses. Only its three general education areas survived the conversion, so 57 of its 67 courses have no area and use the default color.

**Fix:** add the formation areas of the official Química y Farmacia curriculum.

## Courses without a code

Trajectories will reference courses by code, so the catalog will reject courses without one (ADR 0004).

| File | Courses without a code |
| --- | --- |
| `uch/quimica-y-farmacia_2022.malla` | 67 of 67 |
| `udp/ingenieria-civil-industrial_2026.malla` | 46 of 46 |
| `udp/ingenieria-civil-en-informatica-y-telecomunicaciones_2020.malla` | 26 of 49 |
| `udp/psicologia_2020.malla` | 3 of 48 |
| `udp/ingenieria-civil-en-obras-civiles_2020.malla` | 2 of 48 |

**Fix:** add the official code of every course.

## Missing or incomplete tracks

`udp/derecho_2023.malla`, `udp/ingenieria-civil-en-informatica-y-telecomunicaciones_2020.malla`, `udp/ingenieria-civil-en-obras-civiles_2020.malla` and `udp/ingenieria-civil-plan-comun_2020.malla` have no tracks, so their pages list no degree or title. The conversion of Obstetricia y Neonatología and Psicología kept only the professional title, with every course, because their licenciaturas listed no courses.

**Fix:** rebuild the tracks from the official PDFs.

## "Inglés III" lost a prerequisite

In the Informática y Telecomunicaciones and Obras Civiles curriculums, Inglés III (CIG1014) required a course that did not exist in the old catalog files, so it was dropped and Inglés III has no prerequisites.

**Fix:** add Inglés II as its prerequisite if the official curriculum requires it.
