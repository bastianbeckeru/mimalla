# Convert a curriculum PDF into a Mi Malla file

Read the curriculum ("malla curricular") of one study program from a PDF and write a `.malla` file (JSON content) that loads in the Mi Malla builder (https://mimalla.vercel.app/builder, "Cargar archivo"). The builder rejects the whole file at the first broken rule and repairs nothing, so every rule under [File format](#file-format) is a hard requirement.

## Steps

1. **Read the details.** From the PDF, take the program name, the institution, the effective year (the first entry year the curriculum applies to, often "vigente desde" or "plan 2019") and the version name if one is printed ("v6.0", "Plan 2019-B"). Ask the user for the program name, the institution or the effective year when the PDF lacks them; a guessed value turns into a wrong curriculum that loads without error.
2. **Pick the term system.** `semester` when columns are semesters, `annual` when courses last a whole academic year. For trimesters or any other system, stop and tell the user: the format cannot express them.
3. **List the periods.** One period per column of the PDF, mapped with [Terms](#terms). Include winter and summer columns only where the PDF places courses in them.
4. **List the areas.** One area per entry of the PDF's color legend (or per group heading), with the legend's color as lowercase `#rrggbb`. No legend means `"areas": []`.
5. **List the tracks.** One track per milestone the PDF names, following [Tracks](#tracks). None means `"tracks": []`.
6. **List the courses.** Every course box in the PDF becomes a course with its slot, following [Courses](#courses). Then assign ids and positions as described in [Layout](#layout).
7. **Check.** Walk every rule of [File format](#file-format) and [Layout](#layout) against the file. The step is done when each rule holds, every course box of the PDF is accounted for (either a course or one slot of an elective), and every track has at least one course.
8. **Write and report.** Save the file as the program name in lowercase kebab case without accents, an underscore, the effective year and the `.malla` extension (`derecho_2023.malla`, `ingenieria-civil-industrial_2020.malla`); the builder only offers `.malla` files to load. Then report to the user every judgement call: credits rounded, requirements dropped, electives merged, colors approximated, values you could not read.

## Terms

`term` is a number whose meaning depends on `termSystem`; within a program year terms are ordered by number, and 4 is always summer.

| `termSystem` | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- |
| `semester` | first semester | winter | second semester | summer |
| `annual` | academic year | | | summer |

A PDF that numbers semesters consecutively (I to X) maps semester `n` to `programYear: ceil(n / 2)`, `term: 1` when `n` is odd and `term: 3` when it is even.

## Courses

- **Credits** are whole numbers ≥ 0. When the PDF gives two credit systems, use SCT. Round fractional credits to the nearest integer and report it.
- **Duration** is the number of consecutive columns a course spans (a yearly course in a semester curriculum has duration 2). Columns are counted in the order of `periods`, intensive terms included: a duration-2 course in first semester spans winter when the curriculum has a winter column that year.
- **Prerequisites** are the courses that must be passed first, written as their ids. A requirement of approved credits ("120 SCT aprobados") goes in `prerequisiteCredits`. Requirements that are neither (a degree, a level of English, "todos los cursos hasta el semestre 6") are left out and reported.
- **Electives**: placeholder boxes that repeat with the same name and credits ("Formación General", "Electivo Profesional") become one course with `isElective: true` and one slot per box. Electives with distinct names ("Electivo I", "Electivo II") stay separate courses, each with `isElective: true`.
- **Area**: `areaId` points to the course's legend entry; omit it when the course has none.
- **Tracks**: `trackIds` lists every track the course counts toward; omit it when the course belongs to none.

## Tracks

A track is a set of courses whose completion is a milestone for the student: a common first cycle ("Plan Común", "Bachillerato"), an academic degree ("Licenciatura en..."), a professional or technical title, a certificate or a mention. A track is complete when all its courses are approved, so it must list **every** course it requires.

- **Tracks do not contain other tracks.** When the PDF says the title requires the licenciatura plus the courses of years 5 and 6, the title lists the licenciatura's courses and those of years 5 and 6. A course usually belongs to several tracks.
- **Name** the track as the PDF names the milestone ("Licenciatura en Ciencias de la Ingeniería", "Ingeniero/a Civil Industrial" becomes "Ingeniería Civil Industrial").
- **`credentialType`** is what completing the track grants: `professional` (título profesional), `academic` (grado académico, licenciatura), `technical` (título técnico), `certificate`, or `mention` (mención; a student may earn several). Omit it for a milestone that grants nothing, such as Plan Común.
- **Not tracks**: groups of electives with a credit target ("20 créditos de Formación General") and lists of courses to choose from. The elective slots already stand for them.
- When the PDF does not say which courses a degree requires, ask the user instead of guessing; a track with the wrong courses marks a milestone the student has not reached. Requirements no course expresses (an exam, a level of English, a practicum without a box) are left out and reported.

## Layout

The grid has one column per period and rows of a fixed size. A slot starts at row `position` (1-based) of its period's column.

- **Default credits** are the most common `credits` value among the courses (each course counted once), the lower value on a tie, and 5 when there are no courses.
- **Height** of a course in rows is `max(1, round(credits / defaultCredits))`, with halves rounded up; it is 1 when default credits are 0.
- A slot covers rows `position` to `position + height - 1` in each of the `duration` columns it spans. **No two slots may cover the same cell**, including two slots of one elective.

Place the courses column by column, top to bottom in the PDF's order: each slot goes at the first row where all the cells it covers are free. Gaps are allowed, so a slot may start lower to mirror a gap in the PDF.

Number the courses 1 to n in the order of their first slot (by period, then position), the areas 1 to n in the order their first course appears, and the tracks 1 to n in the order you list them.

## File format

Example (one course per line for reading):

```json
{
  "schemaVersion": 1,
  "program": { "name": "Derecho", "institution": "UDP" },
  "effectiveYear": 2023,
  "versionName": "v6.0",
  "termSystem": "semester",
  "periods": [
    { "programYear": 1, "term": 1 },
    { "programYear": 1, "term": 3 },
    { "programYear": 1, "term": 4 },
    { "programYear": 2, "term": 1 }
  ],
  "areas": [{ "id": 1, "name": "Derecho Privado", "color": "#4f46e5" }],
  "tracks": [{ "id": 1, "name": "Licenciatura en Ciencias Jurídicas", "credentialType": "academic" }],
  "courses": [
    { "id": 1, "name": "Introducción al Derecho", "code": "DER101", "credits": 6, "areaId": 1, "trackIds": [1], "slots": [{ "programYear": 1, "term": 1, "position": 1 }] },
    { "id": 2, "name": "Curso de Formación General", "credits": 5, "trackIds": [1], "isElective": true, "slots": [{ "programYear": 1, "term": 1, "position": 2 }, { "programYear": 2, "term": 1, "position": 1 }] },
    { "id": 3, "name": "Derecho Civil", "credits": 10, "duration": 2, "trackIds": [1], "prerequisiteIds": [1], "prerequisiteCredits": 30, "slots": [{ "programYear": 1, "term": 3, "position": 1 }] }
  ]
}
```

Optional fields are **omitted** when they hold their default; an empty string, `[]`, `0`, `1` or `false` in their place is rejected.

| Field | Type | Rule |
| --- | --- | --- |
| `schemaVersion` | integer | always `1` |
| `program.name` | string | required, not empty |
| `program.institution` | string | required, not empty |
| `effectiveYear` | integer | required, 1900–2100 |
| `versionName` | string | optional, not empty |
| `termSystem` | `"semester"` \| `"annual"` | required |
| `periods[]` | `{ programYear, term }` | integers, at least one, `term` valid for the term system, no repeats, sorted by program year then term |
| `areas[]` | `{ id, name, color }` | required array, may be empty |
| `areas[].id`, `tracks[].id`, `courses[].id` | integer | 1 to n without gaps or repeats, counted separately for areas, tracks and courses |
| `areas[].color` | string | lowercase `#rrggbb` |
| `tracks[]` | `{ id, name, credentialType }` | required array, may be empty; every track needs at least one course |
| `tracks[].name` | string | required, not empty |
| `tracks[].credentialType` | `"professional"` \| `"academic"` \| `"technical"` \| `"certificate"` \| `"mention"` | optional |
| `courses[].name` | string | required, not empty |
| `courses[].code` | string | optional, not empty |
| `courses[].credits` | integer | required, ≥ 0 |
| `courses[].duration` | integer | optional, ≥ 2, must not span past the last period |
| `courses[].areaId` | integer | optional, an existing area id |
| `courses[].trackIds` | integer[] | optional, not empty, existing track ids, no repeats |
| `courses[].prerequisiteIds` | integer[] | optional, not empty, existing course ids, no repeats, never the course itself, no cycles |
| `courses[].prerequisiteCredits` | integer | optional, ≥ 1 |
| `courses[].isElective` | `true` | optional; only electives may have more than one slot |
| `courses[].slots[]` | `{ programYear, term, position }` | at least one, the period must be in `periods`, `position` integer ≥ 1, no overlaps (see [Layout](#layout)) |
