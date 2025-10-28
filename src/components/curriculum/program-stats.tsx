"use client";

import { CurriculumData } from "@/types/curriculum";
import { useState } from "react";

export type Program = CurriculumData["program"] & {
  stats: CurriculumData["stats"];
};

export function ProgramStats({ program }: { program: Program }) {
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);

  if (!program.stats?.length) return null;

  const currentStats = program.stats[selectedYearIndex];

  if (currentStats === undefined) return null;

  return (
    <div className="max-h-10/12 overflow-y-auto">
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

        <div className="grid grid-cols-1 gap-3">
          {/* Admisión */}
          <AdmissionCard stats={currentStats} />

          {/* Retención */}
          <StatCard
            icon="📚"
            title="Retención"
            value={`${(currentStats.academics.firstYearRetentionRate * 100).toFixed(1)}%`}
            subtitle="Primer año"
            valueClassName="text-green-600"
          />

          {/* Duración Real */}
          <StatCard
            icon="⏱️"
            title="Duración real"
            value={currentStats.academics.avgRealDuration.toString()}
            subtitle="semestres (promedio)"
          />

          {/* Empleabilidad */}
          <EmploymentCard labor={currentStats.employment} />

          {/* Ingresos */}
          <IncomeCard labor={currentStats.employment} />

          {/* Arancel */}
          <TuitionCard
            amount={currentStats.costs.annualTuition}
            year={currentStats.year}
          />

          {/* Matrícula */}
          <EnrollmentCard academic={currentStats.academics} />
        </div>

        {/* Footer note */}
        <p className="text-muted-foreground border-t pt-2 text-center text-xs italic">
          Datos oficiales año {currentStats.year} SIES.
        </p>
      </div>
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

function TuitionCard({ amount, year }: { amount: number; year: number }) {
  return (
    <div className="bg-card rounded-lg border p-3">
      <h3 className="text-muted-foreground mb-2 text-sm font-semibold">
        💳 Arancel anual
      </h3>
      <div className="text-xl font-bold text-amber-700">
        ${(amount / 1000000).toFixed(2)}M
      </div>
      <p className="text-muted-foreground mt-1 text-xs">CLP {year}</p>
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
