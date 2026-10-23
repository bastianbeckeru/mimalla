import { cacheLife, cacheTag } from "next/cache";
import {
  getCatalog,
  getCurrentCurriculum,
  getCurriculumParams,
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
