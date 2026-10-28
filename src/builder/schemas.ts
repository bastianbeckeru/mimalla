import { z } from "zod";

const MIN_EFFECTIVE_YEAR = 1900;
const MAX_EFFECTIVE_YEAR = 2100;
const EFFECTIVE_YEAR_RANGE = `Ingresa un año entre ${MIN_EFFECTIVE_YEAR} y ${MAX_EFFECTIVE_YEAR}`;

export const courseNameSchema = z
  .string()
  .trim()
  .min(1, "Ingresa el nombre del curso");

const effectiveYearSchema = z
  .number({ error: "Ingresa el año de vigencia" })
  .int(EFFECTIVE_YEAR_RANGE)
  .min(MIN_EFFECTIVE_YEAR, EFFECTIVE_YEAR_RANGE)
  .max(MAX_EFFECTIVE_YEAR, EFFECTIVE_YEAR_RANGE);

export const detailsSchema = z.object({
  programName: z.string().trim().min(1, "Ingresa el nombre del programa"),
  institution: z.string().trim().min(1, "Ingresa la institución"),
  effectiveYear: effectiveYearSchema,
  versionName: z.string().trim(),
});

export const exportableCurriculumSchema = detailsSchema.extend({
  courses: z.array(z.object({ name: courseNameSchema })),
});

export function isValidEffectiveYear(year: unknown): year is number {
  return effectiveYearSchema.safeParse(year).success;
}
