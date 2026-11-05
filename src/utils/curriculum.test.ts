import { describe, expect, test } from "bun:test";
import type { CatalogInstitution } from "@/types/curriculum";
import { findCatalogProgram } from "@/utils/curriculum";

const derecho = {
  name: "Derecho",
  path: "udp/derecho",
  effectiveYears: [2023],
};
const quimica = {
  name: "Química y Farmacia",
  path: "uch/quimica-y-farmacia",
  effectiveYears: [2022],
};

const udp = {
  name: "Universidad Diego Portales",
  acronym: "UDP",
  departments: [{ name: "Derecho", programs: [derecho] }],
} as CatalogInstitution;
const uch = {
  name: "Universidad de Chile",
  acronym: "UCH",
  departments: [{ name: "Química", programs: [quimica] }],
} as CatalogInstitution;

describe("findCatalogProgram", () => {
  test("finds a program with its institution", () => {
    expect(findCatalogProgram([udp, uch], quimica.path)).toEqual({
      institution: uch,
      program: quimica,
    });
  });

  test("finds nothing for an unknown path", () => {
    expect(findCatalogProgram([udp, uch], "udp/medicina")).toBeNull();
  });

  test("finds nothing when no program is requested", () => {
    expect(findCatalogProgram([udp, uch], null)).toBeNull();
  });
});
