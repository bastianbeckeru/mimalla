import type { Institution, ProgramRecord } from "@/types/curriculum";

export const INSTITUTIONS: Record<string, Institution> = {
  uch: { name: "Universidad de Chile", acronym: "UCH" },
  udp: { name: "Universidad Diego Portales", acronym: "UDP" },
};

export const PROGRAMS: Record<string, ProgramRecord> = {
  "uch/quimica-y-farmacia": {
    department: {
      name: "Facultad de Ciencias Químicas y Farmacéuticas",
      acronym: "FCQF",
    },
    siesCode: "I70S1C177J1V2",
    demreCode: 11037,
    schedule: "DAYTIME",
  },
  "udp/derecho": {
    department: { name: "Facultad de Derecho", acronym: "FD" },
    siesCode: "I3S1C1J1V1",
    demreCode: 38004,
    schedule: "DAYTIME",
  },
  "udp/ingenieria-civil-en-informatica-y-telecomunicaciones": {
    department: { name: "Facultad de Ingeniería y Ciencias", acronym: "FIC" },
    siesCode: "I3S1C11J1V1",
    demreCode: 38175,
    schedule: "DAYTIME",
  },
  "udp/ingenieria-civil-en-obras-civiles": {
    department: { name: "Facultad de Ingeniería y Ciencias", acronym: "FIC" },
    siesCode: "I3S1C49J1V1",
    demreCode: 38176,
    schedule: "DAYTIME",
  },
  "udp/ingenieria-civil-industrial": {
    department: { name: "Facultad de Ingeniería y Ciencias", acronym: "FIC" },
    siesCode: "I3S1C10J1V1",
    demreCode: 38174,
    schedule: "DAYTIME",
  },
  "udp/ingenieria-civil-plan-comun": {
    department: { name: "Facultad de Ingeniería y Ciencias", acronym: "FIC" },
    siesCode: "I3S1C300J1V1",
    demreCode: 38080,
    schedule: "DAYTIME",
  },
  "udp/obstetricia-y-neonatologia": {
    department: { name: "Facultad de Salud y Odontología", acronym: "FSO" },
    siesCode: "I3S1C310J1V1",
    demreCode: 38323,
    schedule: "DAYTIME",
  },
  "udp/psicologia": {
    department: { name: "Facultad de Psicología", acronym: "FP" },
    siesCode: "I3S1C12J1V1",
    demreCode: 38005,
    schedule: "DAYTIME",
  },
};
