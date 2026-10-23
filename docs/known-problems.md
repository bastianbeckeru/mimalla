# Known problems

Data problems found in the curriculum JSON files (`src/server/db/curriculums/`) that are not fixed yet, because fixing them needs the official source of each curriculum. None of them breaks the app, but they show wrong or missing information.

## Química y Farmacia (UCH) uses the areas of Derecho

`uch/quimica-y-farmacia.json` was created from the Derecho template, and its `areas` were never replaced. Of its 14 areas, 10 are law areas ("Derecho Privado", "Derecho Penal", "Clínicas Jurídicas", ...) and 1 is "Formación General Deportiva", and none of these 11 match any of its courses. At most 12 of its 67 courses belong to an area, so most cards use the default color, and the dashboard sidebar lists law areas.

**Fix:** replace `areas` with the formation areas of the official Química y Farmacia curriculum.

## Diseño (UDP) belongs to the wrong department

`udp/diseno.json` sets `department` to "Facultad de Psicología" (`FP`). It is likely a leftover of the Psicología template. The department groups programs in the search bar and in the dashboard form, so Diseño appears under Psicología.

**Fix:** set the department that the program actually belongs to.

## "Inglés III" requires a course that does not exist

In `udp/ingenieria-civil-en-informatica-y-telecomunicaciones.json` and `udp/ingenieria-civil-en-obras-civiles.json`, course `26` (CIG1014 Inglés III) lists `21` in `prerequisiteIds`, but neither file has a course with id `21`. The app skips the missing prerequisite, so Inglés III shows fewer prerequisites than it should.

**Fix:** add course `21` (probably Inglés II) to `courses`, or point the prerequisite to the right id.

## Areas reference courses that do not exist

Many areas list ids in `courseIds` that are not in the file's `courses`, mostly in "Formación General e Inglés", "Formación General Deportiva" and the engineering areas. These are leftovers of the shared templates. They are harmless today, because lookups only start from existing courses, but they make the files harder to review and can hide real mistakes like the one above.

| File | Areas affected | Missing ids |
| --- | --- | --- |
| `uch/quimica-y-farmacia.json` | 12 | 67 |
| `udp/derecho.json` | 3 | 38 |
| `udp/diseno.json` | 1 | 8 |
| `udp/ingenieria-civil-en-informatica-y-telecomunicaciones.json` | 4 | 79 |
| `udp/ingenieria-civil-en-obras-civiles.json` | 4 | 54 |
| `udp/ingenieria-civil-industrial.json` | 3 | 31 |
| `udp/ingenieria-civil-plan-comun.json` | 5 | 60 |
| `udp/obstetricia-y-neonatologia.json` | 1 | 9 |
| `udp/psicologia.json` | 1 | 8 |

**Fix:** remove from each area the ids that are not courses of that curriculum.

## `isElective` is missing in some files

`isElective` is missing in every course of `uch/quimica-y-farmacia.json` and `udp/ingenieria-civil-plan-comun.json`, and in 35 of the 36 courses of `udp/obstetricia-y-neonatologia.json`. The app treats a missing value as "not elective", so if any of these courses is an elective, it cannot be added more than once to a period and its area falls back to the non-elective rule.

**Fix:** set `isElective` explicitly on every course.

## Programs without statistics

`udp/diseno.json`, `udp/ingenieria-civil-plan-comun.json` and `udp/obstetricia-y-neonatologia.json` have no `stats`, so their pages hide the "Ver estadísticas" button. `udp/ingenieria-civil-plan-comun.json` also has no `plans`, so its page lists no degree or title.

**Fix:** add the SIES statistics and the plans from the official sources.
