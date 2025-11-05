"use client";

import { CurriculumData } from "@/types/curriculum";
import { useState } from "react";
import { Separator } from "../ui/separator";
import InfoItem from "./info-item";
import { formatCurrency, formatPercentage } from "@/utils/numbers";
import { Badge } from "../ui/badge";
import { BookOpen, Briefcase, Coins, GraduationCap } from "lucide-react";

export type Program = CurriculumData["program"] & {
  stats: CurriculumData["stats"];
};

export function ProgramStats({ program }: { program: Program }) {
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);

  if (!program.stats?.length) return null;

  const currentStats = program.stats[selectedYearIndex];

  if (currentStats === undefined) return null;

  return (
    <div className="space-y-4">
      {/* Year selector if multiple years */}
      {program.stats.length > 1 && (
        <div className="flex gap-2 border-b pb-2">
          {program.stats.map((stat, index) => (
            <button
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
        <div className="[>div]:col-span-1 grid grid-cols-2 gap-3">
          <h3 className="col-span-2 inline-flex items-center gap-2 font-semibold [&_svg]:size-4">
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

        <div className="[>div]:col-span-1 grid grid-cols-2 gap-3">
          <h3 className="col-span-2 inline-flex items-center gap-2 font-semibold [&_svg]:size-4">
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

        <div className="[>div]:col-span-1 grid grid-cols-2 gap-3">
          <h3 className="col-span-2 inline-flex items-center gap-2 font-semibold [&_svg]:size-4">
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
            value={`${formatCurrency(currentStats.employment.avgIncome4thYear.min, "compact")} a ${formatCurrency(currentStats.employment.avgIncome4thYear.max, "compact")}`}
          />
        </div>

        <Separator />

        <div className="[>div]:col-span-1 grid grid-cols-2 gap-3">
          <h3 className="col-span-2 inline-flex items-center gap-2 font-semibold [&_svg]:size-4">
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

      {/* Footer note */}
      <p className="text-muted-foreground pt-4 text-left text-xs italic">
        Datos oficiales Servicio de Información de Educación Superior (SIES){" "}
        {currentStats.year}.
      </p>
    </div>
  );
}

// Sub-components for better organization and reusability

function StatCard({
  icon,
  title,
  value,
  subtitle,
  valueClassName = "text-2xl font-bold",
  className = "",
}: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={`bg-card rounded-lg border p-3 ${className}`}>
      <h3 className="text-muted-foreground mb-2 text-sm font-semibold">
        {icon} {title}
      </h3>
      <div className={valueClassName}>{value}</div>
      <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
    </div>
  );
}

function AdmissionCard({ stats }: { stats: Program["stats"][number] }) {
  return (
    <div className="bg-card col-span-2 rounded-lg border p-3">
      <h3 className="text-muted-foreground mb-2 text-sm font-semibold">
        📊 Admisión {stats.year}
      </h3>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm">Puntaje promedio</span>
          <span className="text-lg font-semibold">
            {stats.admissions.averageScore.toLocaleString("es-CL")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Vacantes</span>
          <span className="font-medium">
            {stats.admissions.vacancies.toLocaleString("es-CL")}
          </span>
        </div>
        <details className="text-muted-foreground mt-2 text-xs">
          <summary className="hover:text-foreground cursor-pointer">
            Ver ponderaciones PAES
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 pl-2">
            {Object.entries({
              NEM: stats.admissions.paesRequirements.nem,
              Ranking: stats.admissions.paesRequirements.ranking,
              Lenguaje: stats.admissions.paesRequirements.language,
              "Matemática 1": stats.admissions.paesRequirements.math1,
              Historia: stats.admissions.paesRequirements.history,
              "Matemática 2": stats.admissions.paesRequirements.math2,
            }).map(([label, value]) => (
              <div key={label}>
                {label}: {value}%
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

function IncomeCard({
  labor,
}: {
  labor: Program["stats"][number]["employment"];
}) {
  const formatIncome = (amount: number) => `$${(amount / 1000000).toFixed(1)}M`;

  return (
    <div className="bg-card rounded-lg border p-3">
      <h3 className="text-muted-foreground mb-2 text-sm font-semibold">
        💰 Ingreso 4° año
      </h3>
      <div className="text-lg font-bold">
        {formatIncome(labor.avgIncome4thYear.min)}
      </div>
      <p className="text-muted-foreground text-xs">
        - {formatIncome(labor.avgIncome4thYear.max)}
      </p>
    </div>
  );
}

function EnrollmentCard({
  academic,
}: {
  academic: Program["stats"][number]["academics"];
}) {
  return (
    <div className="bg-card col-span-2 rounded-lg border p-3">
      <h3 className="text-muted-foreground mb-2 text-sm font-semibold">
        👥 Matrícula
      </h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-lg font-bold">
            {academic.totalEnrollment.toLocaleString("es-CL")}
          </div>
          <div className="text-muted-foreground text-xs">Total</div>
        </div>
        <div>
          <div className="text-lg font-bold text-blue-600">
            {academic.freshmenEnrollment.toLocaleString("es-CL")}
          </div>
          <div className="text-muted-foreground text-xs">Nuevos</div>
        </div>
        <div>
          <div className="text-lg font-bold text-green-600">
            {academic.graduates.toLocaleString("es-CL")}
          </div>
          <div className="text-muted-foreground text-xs">Titulados</div>
        </div>
      </div>
    </div>
  );
}

function EmploymentCard({
  labor,
}: {
  labor: Program["stats"][number]["employment"];
}) {
  return (
    <div className="bg-card rounded-lg border p-3">
      <h3 className="text-muted-foreground mb-2 text-sm font-semibold">
        💼 Empleabilidad
      </h3>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">1er año</span>
          <span className="font-semibold">
            {(labor.employmentRate1stYear * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">2do año</span>
          <span className="font-semibold text-green-600">
            {(labor.employmentRate2ndYear * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function TuitionCard({ amount }: { amount: number }) {
  return (
    <div>
      <dt className="text-muted-foreground text-sm font-medium">
        💳 Arancel anual
      </dt>
      <dd className="text-foreground text-base font-normal">{amount}</dd>
    </div>
  );
}
