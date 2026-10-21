import { BookOpen, Target, Users } from "lucide-react";
import { LandingButton } from "@/components/landing-button";

export default async function IndexPage() {
  return (
    <main className="flex flex-col items-center justify-center">
      {/* Grid Background */}
      <div className="absolute inset-0 z-[-10] bg-[linear-gradient(to_right,#8080801e_1px,transparent_1px),linear-gradient(to_bottom,#8080801e_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,#4f4f4f1e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1e_1px,transparent_1px)]" />

      {/* Hero */}
      <section className="my-16 flex max-w-4xl flex-col items-center gap-4 text-center">
        <h1 className="text-balance font-bold text-4xl tracking-tight md:text-7xl xl:text-8xl">
          Toma el{" "}
          <span className="bg-gradient-to-r from-pink-700 to-rose-500 bg-clip-text font-extrabold text-transparent">
            Control
          </span>{" "}
          de tu <span className="italic">Malla</span>
        </h1>
        <p className="max-w-[42rem] text-balance text-muted-foreground leading-normal sm:text-xl sm:leading-8">
          Organiza tus cursos, visualiza tu progreso y proyecta tu camino
          académico.
        </p>

        <div className="flex flex-col items-center justify-center gap-2 p-2 md:flex-row md:space-x-4">
          <LandingButton />
        </div>
      </section>

      {/* Feature highlights */}
      <section className="mx-auto hidden max-w-4xl gap-8 px-6 md:grid-cols-3">
        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-muted p-6 backdrop-blur-xs transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-pink-100">
            <BookOpen className="size-6 text-pink-700" />
          </div>
          <h3 className="font-semibold text-lg">Visualiza Requisitos</h3>
          <p className="text-center text-muted-foreground text-sm">
            Ve claramente los prerequisitos de cada curso en tu malla curricular
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-muted p-6 backdrop-blur-xs transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-pink-100">
            <Target className="size-6 text-pink-700" />
          </div>
          <h3 className="font-semibold text-lg">Personaliza tu Ritmo</h3>
          <p className="text-center text-muted-foreground text-sm">
            Reordena cursos según tu tiempo y necesidades específicas
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-muted p-6 backdrop-blur-xs transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-pink-100">
            <Users className="size-6 text-pink-700" />
          </div>
          <h3 className="font-semibold text-lg">Sigue tu Progreso</h3>
          <p className="text-center text-muted-foreground text-sm">
            Marca cursos como aprobados y visualiza tu avance académico
          </p>
        </div>
      </section>
    </main>
  );
}
