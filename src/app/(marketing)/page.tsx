import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default async function IndexPage() {
  return (
    <main className="flex items-center justify-center">
      {/* Grid Background */}
      <div className="absolute inset-0 z-[-10] bg-[linear-gradient(to_right,#8080801e_1px,transparent_1px),linear-gradient(to_bottom,#8080801e_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,#4f4f4f1e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1e_1px,transparent_1px)]" />

      <section className="container flex max-w-[64rem] flex-col items-center space-y-4 py-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-balance md:text-7xl xl:text-8xl">
          Toma el{" "}
          <span className="to-accent bg-gradient-to-r from-pink-700 bg-clip-text font-extrabold text-transparent">
            Control
          </span>{" "}
          de tu <span className="italic">Malla</span>
        </h1>
        <p className="text-muted-foreground max-w-[42rem] leading-normal text-balance sm:text-xl sm:leading-8">
          ¡Personalízala a tu pinta y lleva el registro de tu progreso!
        </p>

        <div className="flex flex-col items-center justify-center gap-2 p-2 md:flex-row md:space-x-4">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "glow hover:bg-primary rounded-md",
            )}
          >
            Comenzar
          </Link>
        </div>
      </section>
    </main>
  );
}
