// Should we add "isAvailable" field to the program object?
export const institutions = [
  {
    acronym: "UDP",
    name: "Universidad Diego Portales",
    departments: [
      {
        name: "Facultad de Ingeniería y Ciencias",
        programs: [
          {
            name: "Ingeniería Civil Industrial",
            siesCode: "I3S1C10J1V1",
            demreCode: 38174,
          },
          {
            name: "Ingeniería Civil en Informática y Telecomunicaciones",
            siesCode: "I3S1C11J1V1",
            demreCode: 38175,
          },
          {
            name: "Ingeniería Civil en Obras Civiles",
            siesCode: "I3S1C49J1V1",
            demreCode: 38176,
          },
          {
            name: "Ingeniería Civil Plan Común",
            siesCode: "I3S1C300J1V1",
            demreCode: 38080,
          },
        ],
      },
      {
        name: "Facultad de Psicología",
        programs: [
          { name: "Psicología", siesCode: "I3S1C12J1V1", demreCode: 38005 },
        ],
      },
      {
        name: "Facultad de Derecho",
        programs: [
          { name: "Derecho", siesCode: "I3S1C12J122", demreCode: 38004 },
        ],
      },
      {
        name: "Facultad de Salud y Odontología",
        programs: [
          {
            name: "Obstetricia y Neonatología",
            siesCode: "I3S1C310J1V1",
            demreCode: 38323,
          },
        ],
      },
    ],
  },
];

/**
       * name: Opción de articulación con Magíster en Ciencias de la Ingeniería*
       * description: Si optas por el programa de continuidad impartido en la Facultad
          (Magíster en Ciencias de la Ingeniería) podrás convalidar hasta seis
          electivos de la línea Civil Industrial desde el magíster en ciencias
          de la ingeniería mención Industrial hacia la carrera de pregrado. Una
          vez finalizada su tesis de magíster, podrás homologarla por la memoria
          de titulación de ingeniería civil.
       * 
       */
