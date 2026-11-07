# Known problems

Data problems found in the curriculum files (`src/server/db/curriculums/`) that are not fixed yet, because fixing them needs the official source of each curriculum (#5). None of them breaks the app, but they show wrong or missing information.

## Química y Farmacia (UCH) simplifies its ámbitos and electives

In the official curriculums of `uch/quimica-y-farmacia_2022.malla` and `uch/quimica-y-farmacia_2025.malla`, many courses belong to two or three ámbitos (clínico, industria, regulatorio, investigación), but a course has at most one area, so each keeps only the first ámbito the official curriculum lists. Their "Electivos Especializados" require at least 15 credits from courses of any credits, but they are laid out as two electives of 7 and 8 credits.

**Fix:** give these courses all their areas and the electives a credit requirement once curriculums support them (#44 and #45).

## Courses without a code

Trajectories will reference courses by code, so the catalog will reject courses without one (ADR 0004).

| File | Courses without a code |
| --- | --- |
| `uch/quimica-y-farmacia_2022.malla` | 5 of 67 |
| `uch/quimica-y-farmacia_2025.malla` | 66 of 66 |
| `udp/ingenieria-civil-industrial_2026.malla` | 46 of 46 |
| `udp/ingenieria-civil-en-informatica-y-telecomunicaciones_2020.malla` | 26 of 49 |
| `udp/psicologia_2020.malla` | 3 of 48 |
| `udp/ingenieria-civil-en-obras-civiles_2020.malla` | 2 of 48 |

**Fix:** add the official code of every course.

## Missing or incomplete tracks

`udp/derecho_2023.malla`, `udp/ingenieria-civil-en-informatica-y-telecomunicaciones_2020.malla`, `udp/ingenieria-civil-en-obras-civiles_2020.malla` and `udp/ingenieria-civil-plan-comun_2020.malla` have no tracks, so their pages list no degree or title. The conversion of Obstetricia y Neonatología and Psicología kept only the professional title, with every course, because their licenciaturas listed no courses.

**Fix:** rebuild the tracks from the official PDFs.
