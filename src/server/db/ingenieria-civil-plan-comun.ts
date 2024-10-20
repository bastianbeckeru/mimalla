/*
 * slots -> Es el conjunto de las relaciones de curriculum con cursos
 *         más las relaciones de curriculum con electives.
 *
 * courses -> Todos los cursos relacionados de alguna manera
 *           con curriculum. (Slots+Electives)
 * areas -> Todas las areas relacionadas de alguna manera con los cursos
 *          del curriculum. (Slots+)
 */

export const data = {
  program: {
    name: "Ingeniería Civil Plan Común",
    siesCode: "I3S1C300J1V1",
    demreCode: 38080,
    institution: {
      name: "Universidad Diego Portales",
      acronym: "UDP",
    },
    department: {
      name: "Facultad de Ingeniería y Ciencias",
      acronym: "FIC",
    },
  },
  curriculum: {
    slots: [
      {
        id: 1,
        year: 2020,
        term: 1,
        position: 1,
        type: "MANDATORY",
        courseId: 1,
      },
      {
        id: 2,
        year: 2020,
        term: 1,
        position: 2,
        type: "MANDATORY",
        courseId: 2,
      },
      {
        id: 3,
        year: 2020,
        term: 1,
        position: 3,
        type: "MANDATORY",
        courseId: 3,
      },
      {
        id: 4,
        year: 2020,
        term: 1,
        position: 4,
        type: "MANDATORY",
        courseId: 4,
      },
      {
        id: 5,
        year: 2020,
        term: 1,
        position: 5,
        type: "MANDATORY",
        courseId: 5,
      },
      {
        id: 6,
        year: 2020,
        term: 2,
        position: 1,
        type: "MANDATORY",
        courseId: 6,
      },
      {
        id: 7,
        year: 2020,
        term: 2,
        position: 2,
        type: "MANDATORY",
        courseId: 7,
      },
      {
        id: 8,
        year: 2020,
        term: 2,
        position: 3,
        type: "MANDATORY",
        courseId: 8,
      },
      {
        id: 9,
        year: 2020,
        term: 2,
        position: 4,
        type: "ELECTIVE",
        courseId: 20,
      },
      {
        id: 10,
        year: 2020,
        term: 2,
        position: 5,
        type: "ELECTIVE",
        courseId: 21,
      },
    ],
  },
  instructors: [
    {
      id: 1,
      name: "Dr. Jane Smith",
      email: "jsmith@university.edu",
      department: "Mathematics",
    },
    {
      id: 2,
      name: "Prof. John Doe",
      email: "jdoe@university.edu",
      department: "Mathematics",
    },
    {
      id: 3,
      name: "Dr. Alice Johnson",
      email: "ajohnson@university.edu",
      department: "Physics",
    },
  ],
  areas: [
    {
      id: 1,
      name: "Formación General e Inglés",
      color: "#FFFFFF",
      subareaIds: [9, 10],
      courseIds: [5],
      electiveIds: [],
    },
    {
      id: 2,
      name: "Formación en Ciencias Básicas",
      color: "#34C1CD",
      subareaIds: [],
      courseIds: [1, 2, 3, 6, 7, 8],
      electiveIds: [],
    },
    {
      id: 3,
      name: "Formación en Ciencias de la Ingeniería",
      color: "#BBE5EB",
      subareaIds: [4],
      courseIds: [4, 9, 309],
      electiveIds: [],
    },
    {
      id: 4,
      name: "Programación Avanzada o Ingeniería de los Materiales",
      color: null,
      subareaIds: [],
      courseIds: [9, 309, 20],
      electiveIds: [1],
    },
    {
      id: 9,
      name: "Formación General",
      color: null,
      subareaIds: [],
      courseIds: [21],
      electiveIds: [2],
    },
    {
      id: 10,
      name: "Formación General Deportiva",
      color: null,
      subareaIds: [],
      courseIds: [],
      electiveIds: [2],
    },
  ],
  courses: [
    {
      id: 1,
      isElective: false,
      name: "Álgebra y Geometría",
      code: "CBM1000",
      credits: 7,
      description: "",
      prerequisiteIds: [],
      instructors: [1, 2],
    },
    {
      id: 2,
      isElective: false,
      name: "Cálculo I",
      code: "CBM1001",
      credits: 7,
      description: "",
      prerequisiteIds: [],
      instructors: [3],
    },
    {
      id: 3,
      isElective: false,
      name: "Química",
      code: "CBQ1000",
      credits: 6,
      description: "",
      prerequisiteIds: [],
      instructors: [],
    },
    {
      id: 4,
      isElective: false,
      name: "Programación",
      code: "CIT1000",
      credits: 6,
      description: "",
      prerequisiteIds: [],
      instructors: [],
    },
    {
      id: 5,
      isElective: false,
      name: "Comunicación para la Ingeniería",
      code: "FIC1000",
      credits: 5,
      description: "",
      prerequisiteIds: [],
      instructors: [],
    },
    {
      id: 6,
      isElective: false,
      name: "Álgebra Lineal",
      code: "CBM1002",
      credits: 6,
      description: "",
      prerequisiteIds: [1],
      instructors: [],
    },
    {
      id: 7,
      isElective: false,
      name: "Cálculo II",
      code: "CBM1003",
      credits: 6,
      description: "",
      prerequisiteIds: [2],
      instructors: [],
    },
    {
      id: 8,
      isElective: false,
      name: "Mecánica",
      code: "CBF1000",
      credits: 7,
      description: "",
      prerequisiteIds: [2],
      instructors: [],
    },
    {
      id: 9,
      isElective: false,
      name: "Programación Avanzada",
      code: "CIT1010",
      credits: 6,
      description: "",
      prerequisiteIds: [4],
      instructors: [],
    },
    {
      id: 309,
      isElective: false,
      name: "Ingeniería de los Materiales",
      code: "COC2001",
      credits: 6,
      description: null,
      prerequisiteIds: [3],
      instructors: [],
    },
    {
      id: 20,
      isElective: true,
      name: "Programación Avanzada o Ingeniería de los Materiales",
      code: null,
      credits: 6,
      description: null,
      prerequisiteIds: [],
    },
    {
      id: 21,
      isElective: true,
      name: "Curso de Formación General",
      code: null,
      credits: 5,
      description: null,
      prerequisiteIds: [],
    },
  ],
  electives: [
    {
      id: 20,
      name: "Programación Avanzada o Ingeniería de los Materiales",
      credits: 6,
      description: null,
    },
    {
      id: 21,
      name: "Curso de Formación General",
      credits: 5,
      description: "",
      areas: [1],
    },
  ],
  degrees: [],
};

/*
 * Con el fin de facilitar la búsqueda de datos, se pueden crear mapas de los objetos de la siguiente manera:
 *
 * const areasMap = new Map(data.areas.map(area => [area.id, area]));
 * const coursesMap = new Map(data.courses.map(course => [course.id, course]));
 * const electivesMap = new Map(data.electives.map(elective => [elective.id, elective]));
 *
 * De esta manera, se puede acceder a los datos de la siguiente manera:
 *
 * const course = coursesMap.get(id);
 */

/* PROBLEMAS */
/*

Sería mejor combinar los slot de curriculum_course con curriculum_elective?
Opción 1: Combinarlos
Opción 2: Dejarlos separados como "slot_course" y "slot_elective"

Las areas llamadas en los electivos:
Opción 1: Combinarlas con el array areas. (Fácil)
Opción 2: Los dejamos dentro de elective
Opción 3: Los dejamos separados en otro array

Los cursos de electivos, específicamente de areas, cómo serán llamados y guardados?
Opción 1: Combinarlos con el array courses. (Fácil)
Opción 2: Los dejamos dentro de cada área
Opción 3: Los dejamos separados en otro array

Lo más consistence, sería "combinar", basicamente dejar todos los cursos en courses sin importar la cantidad de estos (No deberían haber más de 500 cursos) y dejar todas las areas dentro de areas, sin importar la cantidad de estas (No debería haber más de 20 áreas)

Los prerequisitos de los cursos, deberían venir todos o solamente los relacionados con el curriculum?
Opción 1: Todos los prerequisitos (If in courses && approvedCourses)
Opción 2: Solo los relacionados con el curriculum (If in approvedCourses)

*/

// Deberían los courses referenciados de cierta manera en un course.isElective (true) tener su isElective en true o false?
