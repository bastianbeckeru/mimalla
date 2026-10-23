import { cn } from "cn";
import { ArrowDown, ArrowRight, Check, Lock } from "lucide-react";
import Image from "next/image";
import { LandingButton } from "@/components/landing-button";
import { ProgramPicker } from "@/components/program-picker";
import { getCatalog } from "@/server/db/curriculums";

function FloatingCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border bg-card shadow-black/10 shadow-lg dark:shadow-black/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CheckBox({ checked }: { checked?: boolean }) {
  if (checked) {
    return (
      <span className="inline-flex size-4.5 flex-none items-center justify-center rounded-md bg-blue-600 text-white">
        <Check className="size-3" strokeWidth={3.5} />
      </span>
    );
  }

  return (
    <span className="size-4.5 flex-none rounded-md border-[1.5px] border-neutral-400 dark:border-neutral-600" />
  );
}

function ProgressRing({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const circumference = 2 * Math.PI * 34;

  return (
    <svg
      viewBox="0 0 84 84"
      role="img"
      aria-label={`${percent} por ciento de avance`}
      className={cn("size-21 flex-none", className)}
    >
      <circle
        cx="42"
        cy="42"
        r="34"
        fill="none"
        strokeWidth="10"
        className="stroke-muted"
      />
      <circle
        cx="42"
        cy="42"
        r="34"
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${(circumference * percent) / 100} ${circumference}`}
        transform="rotate(-90 42 42)"
        className="stroke-blue-600"
      />
      <text
        x="42"
        y="48"
        textAnchor="middle"
        className="fill-foreground font-bold text-lg"
      >
        {percent}%
      </text>
    </svg>
  );
}

function StickyNote({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xs bg-blue-100 px-5 py-5.5 shadow-black/25 shadow-lg dark:bg-blue-950",
        className,
      )}
    >
      <span className="size-3 self-center rounded-full bg-blue-600" />
      <p className="font-medium italic leading-snug">
        Ojo: para tomar Cálculo II necesitas Cálculo I aprobado.
      </p>
    </div>
  );
}

function SemesterCard({ className }: { className?: string }) {
  return (
    <FloatingCard className={cn("flex flex-col gap-3 p-4.5", className)}>
      <span className="font-semibold text-[15px]">Este semestre</span>
      <ul className="flex flex-col gap-2 text-sm">
        {[
          { name: "Álgebra Lineal", checked: true },
          { name: "Mecánica" },
          { name: "Programación Avanzada" },
        ].map((course) => (
          <li
            key={course.name}
            className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
          >
            <CheckBox checked={course.checked} />
            {course.name}
          </li>
        ))}
      </ul>
    </FloatingCard>
  );
}

const features = [
  {
    title: "Prerrequisitos a la vista",
    description: "Toca un curso y ve qué necesita y qué desbloquea.",
    preview: (
      <div className="flex items-center gap-2.5">
        <FloatingCard className="rounded-xl px-3.5 py-2.5 font-semibold text-[13px]">
          Mecánica
        </FloatingCard>
        <ArrowRight className="size-5 text-neutral-400 dark:text-neutral-600" />
        <FloatingCard className="rounded-xl border-dashed px-3.5 py-2.5 font-semibold text-[13px] text-muted-foreground">
          Termodinámica
        </FloatingCard>
      </div>
    ),
  },
  {
    title: "A tu propio ritmo",
    description:
      "Arrastra cursos entre semestres y arma el plan que te acomode.",
    preview: (
      <div className="flex gap-3">
        <div className="flex w-24 flex-col gap-1.5">
          <span className="font-semibold text-[11px] text-muted-foreground">
            SEM 3
          </span>
          <FloatingCard className="h-7.5 rounded-lg" />
          <div className="h-7.5 rounded-lg border-[1.5px] border-blue-500 border-dashed" />
        </div>
        <div className="flex w-24 flex-col gap-1.5">
          <span className="font-semibold text-[11px] text-muted-foreground">
            SEM 4
          </span>
          <FloatingCard className="h-7.5 rounded-lg" />
          <FloatingCard className="flex h-7.5 -translate-x-2 -translate-y-1 -rotate-5 items-center rounded-lg border-blue-500 px-2 font-semibold text-[11px]">
            Mecánica
          </FloatingCard>
        </div>
      </div>
    ),
  },
  {
    title: "Tu avance real",
    description: "Marca lo aprobado y mira cuánto llevas, sin calcular a mano.",
    preview: (
      <FloatingCard className="flex w-full max-w-60 flex-col gap-2.5 p-4">
        <div className="flex justify-between text-[13px]">
          <span className="font-semibold">Avance total</span>
          <span className="font-bold text-blue-700 dark:text-blue-300">
            38%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[38%] rounded-full bg-blue-600" />
        </div>
        <span className="text-muted-foreground text-xs">
          30 cursos por delante
        </span>
      </FloatingCard>
    ),
  },
];

function Doodle({ name, className }: { name: string; className?: string }) {
  return (
    <Image
      src={`/doodles/${name}.svg`}
      alt=""
      width={1024}
      height={768}
      className={cn("h-auto", className)}
    />
  );
}

function MissingProgramNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-[15px] text-muted-foreground", className)}>
      ¿No está la tuya?{" "}
      <a
        href="https://github.com/bastianbeckeru/mimalla/blob/main/CONTRIBUTING.md"
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-blue-700 hover:text-foreground dark:text-blue-300"
      >
        Ayúdanos a sumarla
      </a>
    </p>
  );
}

export default function IndexPage() {
  return (
    <main>
      <section className="px-2.5 sm:px-3">
        <div className="mx-auto flex max-w-314 flex-wrap items-center justify-center gap-9 rounded-3xl border bg-grid bg-neutral-50 px-4.5 pt-10 pb-8 sm:gap-8 sm:rounded-[28px] sm:px-[clamp(1rem,3vw,2.5rem)] sm:py-[clamp(1.75rem,5vw,4rem)] dark:bg-neutral-900/40">
          <div className="order-1 flex min-w-0 flex-[1_1_30rem] flex-col items-center gap-4.5 text-center sm:gap-5.5 sm:py-6">
            <Doodle
              name="meditating"
              className="-mb-2 w-45 sm:-mb-2.5 sm:w-57.5"
            />
            <h1 className="font-semibold text-[clamp(2.75rem,5.6vw,4.25rem)] leading-[1.04] tracking-[-0.035em]">
              Planifica, avanza
              <br />y respira
            </h1>
            <p className="max-w-75 text-base text-muted-foreground leading-relaxed sm:max-w-110 sm:text-[17px]">
              Ve qué cursos llevas, cuáles te bloquean y cuánto te falta.
            </p>
            <LandingButton
              label="Elegir mi carrera"
              source="hero_cta"
              className="w-full justify-center sm:w-auto"
            />
          </div>

          <div
            aria-hidden="true"
            className="order-2 flex w-full flex-col gap-4.5 px-1 sm:hidden"
          >
            <div className="grid grid-cols-2 items-start gap-3.5">
              <FloatingCard className="flex -rotate-3 flex-col gap-2.5 rounded-2xl p-3.5">
                <span className="font-semibold text-[13px]">Tu avance</span>
                <div className="flex items-center gap-2.5">
                  <ProgressRing percent={38} className="size-14" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[17px] tracking-tight">
                      18/48
                    </span>
                    <span className="text-muted-foreground text-xs">
                      aprobados
                    </span>
                  </div>
                </div>
              </FloatingCard>
              <StickyNote className="translate-y-2.5 rotate-3 gap-2 p-3.5 pb-4 text-[13px]" />
            </div>
            <SemesterCard className="rotate-1 rounded-2xl p-4" />
          </div>

          <div
            aria-hidden="true"
            className="order-0 hidden min-w-0 flex-[0_1_16.25rem] flex-col gap-7 sm:flex"
          >
            <StickyNote className="-rotate-4" />
            <SemesterCard className="rotate-2" />
          </div>

          <div
            aria-hidden="true"
            className="order-2 hidden min-w-0 flex-[0_1_16.25rem] flex-col gap-7 sm:flex"
          >
            <FloatingCard className="flex rotate-3 flex-col gap-3.5 p-5">
              <span className="font-semibold text-[15px]">Tu avance</span>
              <div className="flex items-center gap-4">
                <ProgressRing percent={38} />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-[22px] tracking-tight">
                    18 de 48
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    cursos aprobados
                  </span>
                </div>
              </div>
            </FloatingCard>
            <FloatingCard className="flex -rotate-2 flex-col gap-3 p-4.5">
              <span className="font-semibold text-[15px]">Prerrequisitos</span>
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center justify-between rounded-[10px] bg-blue-600 px-3 py-2.25 font-semibold text-white">
                  Cálculo I
                  <Check className="size-3.5" strokeWidth={3.5} />
                </div>
                <ArrowDown className="size-3.5 self-center text-neutral-400 dark:text-neutral-600" />
                <div className="rounded-[10px] border border-blue-600 px-3 py-2.25">
                  Cálculo II · disponible
                </div>
                <ArrowDown className="size-3.5 self-center text-neutral-400 dark:text-neutral-600" />
                <div className="flex items-center justify-between rounded-[10px] border border-neutral-400 border-dashed px-3 py-2.25 text-muted-foreground dark:border-neutral-600">
                  Cálculo III
                  <Lock className="size-3.5" />
                </div>
              </div>
            </FloatingCard>
          </div>
        </div>
      </section>

      <section
        id="funciones"
        className="mx-auto flex max-w-300 flex-col gap-8 px-4 pt-18 pb-16 sm:gap-12 sm:px-6 sm:pt-26 sm:pb-24"
      >
        <div className="flex flex-col items-center gap-2.5 text-center sm:gap-3">
          <span className="font-semibold text-blue-700 text-sm dark:text-blue-300">
            Funciones
          </span>
          <h2 className="font-semibold text-[clamp(1.875rem,4vw,2.875rem)] leading-[1.1] tracking-[-0.03em]">
            Todo lo que necesitas.
            <br />
            <span className="text-neutral-400 dark:text-neutral-500">
              Nada que te distraiga.
            </span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-5">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="flex min-w-0 flex-[1_1_18.75rem] flex-col overflow-hidden rounded-[22px] border sm:rounded-3xl"
            >
              <div
                aria-hidden="true"
                className="flex h-35 items-center justify-center bg-grid bg-neutral-50 p-4 sm:h-45 sm:p-5 dark:bg-neutral-900/40"
              >
                {feature.preview}
              </div>
              <div className="flex flex-col gap-1.5 p-5 sm:gap-2 sm:p-6">
                <h3 className="font-semibold text-lg sm:text-xl">
                  {feature.title}
                </h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="carreras"
        className="mx-auto flex max-w-300 scroll-mt-6 flex-wrap gap-5 px-4 pb-16 sm:gap-10 sm:px-6 sm:pb-24"
      >
        <div className="flex min-w-0 flex-[1_1_18.75rem] flex-col gap-2.5 sm:gap-3.5">
          <h2 className="font-semibold text-[clamp(1.75rem,3.6vw,2.5rem)] leading-[1.1] tracking-[-0.03em]">
            Parte desde tu malla oficial.
          </h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed sm:text-base">
            Por ahora, carreras de la Universidad Diego Portales. Vamos sumando
            más.
          </p>
          <MissingProgramNote className="mt-1.5 hidden sm:block" />
          <Doodle
            name="reading"
            className="mt-3 hidden w-70 max-w-full sm:block"
          />
        </div>
        <ProgramPicker catalog={getCatalog()} />
        <MissingProgramNote className="w-full text-center sm:hidden" />
        <Doodle name="reading" className="mx-auto w-57.5 sm:hidden" />
      </section>

      <section className="mx-auto max-w-300 px-2.5 pb-14 sm:px-6 sm:pb-24">
        <div className="flex flex-col items-center gap-4.5 rounded-3xl border bg-grid bg-neutral-50 px-4.5 py-12 text-center sm:gap-6 sm:rounded-[28px] sm:px-[clamp(1.25rem,4vw,3.5rem)] sm:py-[clamp(3rem,7vw,6rem)] dark:bg-neutral-900/40">
          <Doodle name="chilling" className="-mb-1.5 w-47.5 sm:-mb-2 sm:w-60" />
          <h2 className="font-semibold text-[clamp(2.125rem,4.6vw,3.375rem)] leading-[1.06] tracking-[-0.035em]">
            Sin cuenta. <br className="sm:hidden" />
            Sin correos.
          </h2>
          <p className="max-w-75 text-base text-muted-foreground leading-relaxed sm:max-w-115 sm:text-[17px]">
            Todo se guarda en tu navegador. Abres la página y empiezas, así de
            simple.
          </p>
          <div className="flex flex-col gap-2.5 self-stretch pt-1.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3 sm:self-auto sm:pt-0">
            <LandingButton
              label="Empezar ahora"
              source="bottom_cta"
              className="justify-center"
            />
            <a
              href="https://github.com/bastianbeckeru/mimalla"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border bg-card px-6 font-semibold transition-colors hover:bg-muted"
            >
              Ver el código
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
