import { cacheLife, cacheTag } from "next/cache";
import {
  getCatalog,
  getCurrentCurriculum,
  getCurriculumParams,
  getProgramCurriculums,
  getPublishedCurriculum,
} from "@/server/catalog/read-catalog";
import { getDatabase } from "@/server/db/client";

export const CATALOG_TAG = "catalog";

function cacheCatalogRead() {
  cacheLife("max");
  cacheTag(CATALOG_TAG);
}

export async function getCachedCatalog() {
  "use cache";
  cacheCatalogRead();
  return getCatalog(getDatabase());
}

export async function getCachedCurriculumParams() {
  "use cache";
  cacheCatalogRead();
  return getCurriculumParams(getDatabase());
}

export async function getCachedCurrentCurriculum(
  institutionAcronym: string,
  programSlug: string,
) {
  "use cache";
  cacheCatalogRead();
  return getCurrentCurriculum(getDatabase(), {
    institutionAcronym,
    programSlug,
  });
}

export async function getCachedProgramCurriculums(
  institutionAcronym: string,
  programSlug: string,
) {
  "use cache";
  cacheCatalogRead();
  return getProgramCurriculums(getDatabase(), {
    institutionAcronym,
    programSlug,
  });
}

export async function getCachedPublishedCurriculum(curriculumId: number) {
  "use cache";
  cacheCatalogRead();
  return getPublishedCurriculum(getDatabase(), curriculumId);
}
