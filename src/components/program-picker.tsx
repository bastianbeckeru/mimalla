"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { CatalogInstitution } from "@/types/curriculum";
import { slugify } from "@/utils/strings";

const PREVIEW_COUNT = 4;

export function ProgramPicker({ catalog }: { catalog: CatalogInstitution[] }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const programs = catalog.flatMap((institution) =>
    institution.departments.flatMap((department) =>
      department.programs.map((program) => ({
        ...program,
        institutionAcronym: institution.acronym,
      })),
    ),
  );

  const matches = programs.filter((program) =>
    slugify(program.name).includes(slugify(query)),
  );
  const visible = showAll || query ? matches : matches.slice(0, PREVIEW_COUNT);

  return (
    <div className="min-w-0 flex-[1.6_1_26rem] rounded-[20px] border p-1.5 sm:rounded-3xl sm:p-2">
      <div className="p-1.5 sm:p-2">
        <label htmlFor="buscar-carrera" className="sr-only">
          Busca tu carrera
        </label>
        <input
          id="buscar-carrera"
          type="search"
          placeholder="Busca tu carrera…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-12 w-full rounded-2xl border bg-muted/50 px-4 text-base outline-none placeholder:text-muted-foreground focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/30 sm:text-[15px]"
        />
      </div>

      <ul>
        {visible.map((program) => (
          <li key={program.path}>
            <Link
              href={`/${program.path}`}
              className="flex min-h-13 items-center justify-between gap-3 rounded-xl px-3.5 py-3 font-medium text-[15px] transition-colors hover:bg-muted/60 sm:px-4"
            >
              {program.name}
              <span className="flex-none font-semibold text-muted-foreground text-xs">
                {program.institutionAcronym}
              </span>
            </Link>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="px-4 py-3 text-muted-foreground text-sm">
            No se encontraron coincidencias.
          </li>
        )}
      </ul>

      {!showAll && !query && matches.length > PREVIEW_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mx-1.5 mt-1 mb-1.5 flex min-h-12 w-[calc(100%-0.75rem)] cursor-pointer items-center justify-center gap-2 border-t font-semibold text-blue-700 text-sm transition-colors hover:text-foreground sm:mx-2 sm:mb-2 sm:w-[calc(100%-1rem)] dark:text-blue-300"
        >
          Ver todas las carreras
          <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  );
}
