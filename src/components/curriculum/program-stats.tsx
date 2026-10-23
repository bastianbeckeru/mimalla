"use client";

import { BookOpen, Briefcase, Coins, GraduationCap } from "lucide-react";
import { useState } from "react";
import InfoItem from "@/components/curriculum/info-item";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CurriculumData } from "@/types/curriculum";
import { formatCurrency, formatPercentage } from "@/utils/numbers";

export type Program = CurriculumData["program"] & {
  stats: CurriculumData["stats"];
};

export function ProgramStats({ program }: { program: Program }) {
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);
  const stats = program.stats ?? [];
  const currentStats = stats[selectedYearIndex];

  if (currentStats === undefined) return null;

  return (
    <div className="space-y-4">
      {stats.length > 1 && (
        <div className="flex gap-2 border-b pb-2">
          {stats.map((stat, index) => (
            <button
              type="button"
              key={stat.year}
              onClick={() => setSelectedYearIndex(index)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                index === selectedYearIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
              aria-pressed={index === selectedYearIndex}
            >
              {stat.year}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 [>div]:col-span-1">
          <h3 className="col-span-2 inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wide [&_svg]:size-4 [&_svg]:shrink-0">
            <GraduationCap />
            Admisión
          </h3>
          <div className="col-span-2 flex w-full flex-wrap gap-2 py-1">
            <Badge variant="secondary">
              NEM {currentStats.admissions.paesRequirements.nem}%
            </Badge>
            <Badge variant="secondary">
              Ranking {currentStats.admissions.paesRequirements.ranking}%
            </Badge>
            <Badge variant="secondary">
              Lenguaje {currentStats.admissions.paesRequirements.language}%
            </Badge>
            <Badge variant="secondary">
              Matemática I {currentStats.admissions.paesRequirements.math1}%
            </Badge>
            <Badge variant="secondary">
              Matemática II {currentStats.admissions.paesRequirements.math2}%
            </Badge>
            <Badge variant="secondary">
              Ciencia {currentStats.admissions.paesRequirements.science}%
            </Badge>
            <Badge variant="secondary">
              Historia {currentStats.admissions.paesRequirements.history}%
            </Badge>
          </div>

          <InfoItem
            label="Puntaje (prom.)"
            value={currentStats.admissions.averageScore}
          />
          <InfoItem
            label="Vacantes"
            value={currentStats.admissions.vacancies}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3 [>div]:col-span-1">
          <h3 className="col-span-2 inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wide [&_svg]:size-4 [&_svg]:shrink-0">
            <BookOpen />
            Académico
          </h3>
          <InfoItem
            label="Tasa de Deserción 1° año"
            value={formatPercentage(
              1 - currentStats.academics.firstYearRetentionRate,
            )}
          />
          <InfoItem
            label="Duración real (prom.)"
            value={`${currentStats.academics.avgRealDuration} semestres`}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3 [>div]:col-span-1">
          <h3 className="col-span-2 inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wide [&_svg]:size-4 [&_svg]:shrink-0">
            <Briefcase />
            Laboral
          </h3>
          <InfoItem
            label="Empleabilidad 1° año"
            value={formatPercentage(
              currentStats.employment.employmentRate1stYear,
            )}
          />
          <InfoItem
            label="Ingresos 4° año"
            value={`${formatCurrency(
              currentStats.employment.avgIncome4thYear.min,
              "compact",
            )} a ${formatCurrency(
              currentStats.employment.avgIncome4thYear.max,
              "compact",
            )}`}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3 [>div]:col-span-1">
          <h3 className="col-span-2 inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wide [&_svg]:size-4 [&_svg]:shrink-0">
            <Coins />
            Costos
          </h3>
          <InfoItem
            label="Matricula anual"
            value={formatCurrency(currentStats.costs.annualEnrollment)}
          />
          <InfoItem
            label="Arancel anual"
            value={formatCurrency(currentStats.costs.annualTuition)}
          />
        </div>
      </div>

      <p className="pt-4 text-left text-muted-foreground text-xs italic">
        Datos oficiales Servicio de Información de Educación Superior (SIES){" "}
        {currentStats.year}.
      </p>
    </div>
  );
}
