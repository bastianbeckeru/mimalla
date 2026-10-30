# Mi Malla

Mi Malla lets a university student start from the official curriculum of their program and plan, term by term, when they take each course and which ones they have passed.

## Catalog

**Institution**:
A university that offers programs.
_Avoid_: University, school

**Department**:
The faculty or school of an institution that a program belongs to.
_Avoid_: Faculty

**Program**:
A degree course of study that an institution offers for admission, such as Derecho at UDP. A program has one or more curriculums over time. A common first cycle, such as Ingeniería Civil Plan Común, is a program when students are admitted to it directly.
_Avoid_: Career, carrera, degree

**Catalog**:
Every program available in Mi Malla, grouped by institution and department.

## Curriculums

**Curriculum**:
A course layout of a program, with its slots, areas, courses and tracks. Shown in the UI as "malla curricular".
_Avoid_: Malla (alone), structure, program data

**Official curriculum**:
A curriculum the institution publishes and Mi Malla lists in its catalog. It applies to the students who enter the program from its year on, until a newer one replaces it; students do not move from one curriculum to another. Shown in the UI as "malla oficial".

**Effective year**:
The first year of entry a curriculum applies to. Students who enter the program that year or later follow it, until a curriculum with a later effective year replaces it.
_Avoid_: Year (alone), start year

**Builder**:
Where anyone lays out a curriculum from scratch and downloads it as a curriculum file. A curriculum made in the builder is not official until it enters the catalog. Shown in the UI as "constructor de mallas".
_Avoid_: Editor, creator

**Curriculum file**:
A curriculum saved as a `.malla` file. It is the only way a curriculum travels: the builder downloads and loads it, and the catalog imports it. It holds the curriculum alone, not catalog data such as the department or the program codes.
_Avoid_: JSON, builder file, malla file

**Course**:
A subject an institution teaches, with its own code and credits. The code identifies the course within its institution, and the same course can belong to the curriculums of several programs. Its prerequisites depend on each curriculum. Shown in the UI as "curso".
_Avoid_: Ramo, subject, asignatura

**Curriculum course**:
A course as it appears in one curriculum, with the rules that curriculum sets for it: its prerequisites, the minimum approved credits it requires, its duration and whether it is an elective.

**Default credits**:
The most common credits among the courses of a curriculum, such as 5 or 3 depending on the institution. The height of a course is shown relative to them.

**Duration**:
The number of consecutive terms a course spans in a curriculum, counting winter and summer terms.

**Slot**:
The place of a course in a curriculum: the program year, the term and the position within that term.
_Avoid_: Structure, cell

**Program year**:
A year counted from the start of the program (1, 2, 3...), used by slots.
_Avoid_: Year (alone), level

**Prerequisite**:
A course that must be approved before taking another one. A course can also require a minimum number of approved credits.
_Avoid_: Requirement

**Successor**:
A course that has a given course as a prerequisite.
_Avoid_: Subsequent, dependent

**Misplaced prerequisite**:
A prerequisite none of whose slots ends before the first term of the course that requires it, so the curriculum cannot be followed as laid out. Seen from the prerequisite, the course that requires it is a misplaced successor.
_Avoid_: Invalid prerequisite, conflicting prerequisite

**Elective**:
A course that stands for a choice among several options, such as "Curso de Formación General", so it can appear more than once in a period. The student can write down which course they actually chose for each of its enrollments.
_Avoid_: Optional, OFG

**Area**:
A group of related courses in a curriculum, shown with one color. Each course belongs to at most one area, and areas do not contain other areas.
_Avoid_: Category, line, subarea

**Track**:
A set of courses of a curriculum whose completion is a milestone for the student, such as Plan Común, a licenciatura, a professional title or a mention. It may grant a credential. A track is complete when all its courses are approved. Tracks do not contain other tracks, and a course can belong to several tracks. Shown in the UI as "plan".
_Avoid_: Plan (in code: it clashes with "plan de estudios" and with planning a trajectory), degree path

**Credential**:
What completing a track grants, if anything: a professional title, an academic degree, a technical title, a certificate or a mention. A student can earn several mentions.
_Avoid_: Diploma

## Trajectories

**Trajectory**:
A student's own path through a curriculum: it starts as a copy of a base curriculum, and the student rearranges its enrollments and tracks their status. Shown in the UI as "mi malla".
_Avoid_: Student curriculum, study plan, roadmap, malla

**Base curriculum**:
The curriculum a trajectory was created from, and the one it returns to when reset.

**Entry**:
The period in which the student started the program; it anchors the trajectory to calendar years.
_Avoid_: Start, ingreso date

**Period**:
A year and a term. In a trajectory the year is a calendar year, such as the first semester of 2026; in a curriculum it is a program year, such as the first semester of year 1.
_Avoid_: Column, semester (when it may be a summer or winter term)

**Term**:
The part of a year a period or slot covers: a regular term of the term system, or an intensive winter or summer term.
_Avoid_: Season

**Term system**:
How a curriculum splits each program year into regular terms: two semesters, or one annual term.
_Avoid_: Régimen, calendar

**Semester**:
A first or second semester term. Winter and summer terms are not semesters and do not count toward the semester number.

**Enrollment**:
A course placed in a period of a trajectory, with its status and its grading scheme. The same elective can have several enrollments, and a failed course retaken later gets a new enrollment.
_Avoid_: Enrolled course, inscripción

**Status**:
Where an enrollment stands: pending, approved or failed. The student sets it; a course grade only suggests it.

**Available**:
Said of a course whose prerequisites are all approved and whose required credits are reached.
_Avoid_: Unlocked, enabled

## Grades

**Grade**:
A mark the student obtained in an assessment, on the trajectory's grading scale. Shown in the UI as "nota".
_Avoid_: Score, mark, calificación (in code)

**Grading scale**:
The lowest and highest grades of a trajectory and the passing grade, 1.0 to 7.0 passing at 4.0 by default.
_Avoid_: Grade range

**Assessment**:
Something that counts toward an enrollment's course grade, with a weight within its parent. It is either a single test that takes a grade, such as an exam, or a group of assessments whose grade is the weighted average of their grades, possibly dropping the lowest ones, such as all the controles. Shown in the UI as "evaluación".
_Avoid_: Evaluation, test, item

**Weight**:
The share of its parent's grade an assessment counts for, as a percentage. When a group sets no weights, its assessments count equally.
_Avoid_: Ponderación (in code), percentage

**Grading scheme**:
The tree of assessments of one enrollment, at most three levels deep.
_Avoid_: Syllabus, rubric, evaluation plan

**Course grade**:
The grade of an enrollment, rounded to one decimal. The student can enter it directly, such as for a course whose assessments they no longer remember, and then it prevails; otherwise it is computed from the grading scheme once every assessment has a grade.
_Avoid_: Final grade, nota final (in code)

**Partial average**:
The weighted average of the assessments of an enrollment that already have a grade, while others are still missing.
_Avoid_: Current grade, running average

**Required grade**:
The grade the student needs in every assessment still missing to reach the passing grade.
_Avoid_: Target grade, needed grade

**Cumulative average**:
The average of the course grades of every approved and failed enrollment of a trajectory, weighted by credits. Each attempt at a course counts.
_Avoid_: GPA, PPA, global average

