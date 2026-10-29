"use client";

import { ChevronsUpDown, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getCurrentYear,
  getCurriculumPath,
  getVersionLabel,
} from "@/utils/curriculum";

export default function VersionSelect({
  programPath,
  effectiveYears,
  effectiveYear,
}: {
  programPath: string;
  effectiveYears: number[];
  effectiveYear: number;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" disabled={effectiveYears.length < 2} />
        }
      >
        <History data-icon="inline-start" />
        <span className="text-muted-foreground">Versión</span>
        {effectiveYear}
        {effectiveYears.length > 1 && <ChevronsUpDown data-icon="inline-end" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Versiones de la malla</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={effectiveYear}
            onValueChange={(year: number) =>
              router.push(
                year === getCurrentYear(effectiveYears)
                  ? `/${programPath}`
                  : `/${getCurriculumPath(programPath, year)}`,
              )
            }
          >
            {effectiveYears.map((year) => {
              const yearLabel = getVersionLabel(year, effectiveYears);
              return (
                <DropdownMenuRadioItem key={year} value={year}>
                  Malla {year}
                  {yearLabel && <Badge variant="secondary">{yearLabel}</Badge>}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
