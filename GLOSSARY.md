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
A degree course of study offered by an institution, such as Derecho at UDP. A program has one or more curriculums over time.
_Avoid_: Career, carrera, degree

**Catalog**:
Every program available in Mi Malla, grouped by institution and department.

## Official curriculum

**Curriculum**:
One official version of the course layout of a program, with its slots, areas, courses and tracks. Shown in the UI as "malla oficial".
_Avoid_: Malla, structure, program data

**Course**:
A subject with its own code, credits and prerequisites. Shown in the UI as "curso".
_Avoid_: Ramo, subject, asignatura

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

**Elective**:
A course that stands for a choice among several options, so it can appear more than once in a period.
_Avoid_: Optional, OFG

**Area**:
A group of related courses in a curriculum, shown with one color. An area can contain subareas.
_Avoid_: Category, line

**Track**:
A path to a degree or title within a curriculum: the courses and credits it requires and the credential it grants.
_Avoid_: Plan, mención, degree path

**Credential**:
The degree, title or certificate a track grants.
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
A calendar year and term in a trajectory, such as the first semester of 2026.
_Avoid_: Column, semester (when it may be a summer or winter term)

**Term**:
The part of the year a period covers: first semester, winter, second semester or summer.
_Avoid_: Season

**Semester**:
A first or second semester term. Winter and summer terms are not semesters and do not count toward the semester number.

**Enrollment**:
A course placed in a period of a trajectory, with its status. The same elective can have several enrollments.
_Avoid_: Enrolled course, inscripción

**Status**:
Where an enrollment stands: pending, approved or failed.

**Available**:
Said of a course whose prerequisites are all approved and whose required credits are reached.
_Avoid_: Unlocked, enabled
