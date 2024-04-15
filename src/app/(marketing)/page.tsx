import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function IndexPage() {
  /*   const hello = await api.post.hello({ text: "from tRPC" });
  const session = await getServerAuthSession(); */

  return (
    <>
      {/* Grid Background */}
      <div
        className="absolute inset-0 z-[-10] 
        bg-[linear-gradient(to_right,#8080801e_1px,transparent_1px),linear-gradient(to_bottom,#8080801e_1px,transparent_1px)] 
        bg-[size:32px_32px] 
        [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]
        dark:bg-[linear-gradient(to_right,#4f4f4f1e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1e_1px,transparent_1px)]"
      />

      <section className="space-y-6 pb-40 pt-36 xl:pt-24">
        <div className="container flex max-w-[64rem] flex-col items-center space-y-4 text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl 2xl:text-[6.5rem]">
            Toma el{" "}
            <span className="bg-gradient-to-r from-[#FF69B4] to-[#FF947B] bg-clip-text font-extrabold text-transparent">
              Control
            </span>{" "}
            de tu Malla.
          </h1>
          <p className="max-w-[42rem] text-pretty leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Personalízala a tu pinta y lleva el registro de tu progreso.
            Simplifica tu vida universitaria.
          </p>
          <div className="mt-2 flex flex-col items-center justify-center space-y-2 md:mt-0 md:flex-row md:space-x-4">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "w-full md:w-fit",
              )}
            >
              Comenzar
            </Link>
            <Link
              href="#features"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              ¿Cómo funciona?
            </Link>
          </div>
        </div>
      </section>
      <section
        id="features"
        className="container space-y-16 py-8 md:py-12 lg:py-24"
      >
        <div className="mx-auto flex flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl font-semibold leading-[1.1] sm:text-3xl md:text-6xl">
            Funcionalidades
          </h2>
        </div>

        <div className="mx-auto flex w-full max-w-[58rem] flex-col-reverse justify-between gap-4 md:flex-row md:items-start md:space-x-2">
          <div className="rounded-md border-4 border-foreground/10 bg-black/90 px-4 py-2 shadow-inner">
            <Image
              src="/drag-and-drop.png"
              width={500}
              height={500}
              alt="Drag and Drop"
            />
          </div>

          <div className="flex flex-col justify-start space-y-2 md:h-64">
            <h3 className="font-semibold sm:text-lg sm:leading-7">
              Modifica tu malla a gusto
            </h3>
            <p className="text-pretty leading-normal text-muted-foreground sm:text-lg sm:leading-6">
              Agrega semestres y reorganiza cursos según tus necesidades.
            </p>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[58rem] flex-col justify-between gap-4 md:flex-row md:items-start md:space-x-2">
          <div className="flex flex-col justify-start space-y-2 md:h-64">
            <h3 className="font-semibold sm:text-lg sm:leading-7">
              Lleva registro de tu progreso
            </h3>
            <p className="leading-normal text-muted-foreground sm:text-lg sm:leading-6">
              Marca como completados los cursos que quieras.
            </p>
          </div>
          <div className="rounded-md border-4 border-foreground/10 bg-black/90 px-4 py-2 shadow-inner">
            <Image
              src="/complete.png"
              width={500}
              height={500}
              alt="Complete Courses"
            />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[58rem] flex-col-reverse justify-between gap-4 md:flex-row md:items-start md:space-x-2">
          <div className="rounded-md border-4 border-foreground/10 bg-black/90 px-4 py-2 shadow-inner">
            <Image
              src="/grades.png"
              width={500}
              height={500}
              alt="Add Grades"
            />
          </div>

          <div className="flex flex-col justify-start space-y-2 md:h-64">
            <h3 className="font-semibold sm:text-lg sm:leading-7">
              Guarda tus notas
            </h3>
            <p className="leading-normal text-muted-foreground sm:text-lg sm:leading-6">
              Agrega tus notas, y obten promedios automáticamente.
            </p>
          </div>
        </div>
      </section>
      <section
        id="try-it"
        className="container space-y-6 py-8 md:pb-12 lg:pb-24"
      >
        <div className="mx-auto space-y-8 text-center md:max-w-[58rem]">
          <h2 className="font-semibold leading-[1.1] sm:text-4xl">
            La flexibilidad está en tus manos.
          </h2>
          <Link
            href="/dashboard"
            className={cn("card", buttonVariants({ size: "lg" }))}
          >
            Probar Gratis
          </Link>
        </div>
      </section>
    </>
  );
}

/* async function CrudShowcase() {
  const session = await getServerAuthSession();
  if (!session?.user) return null;

  const latestPost = await api.post.getLatest();

  return (
    <div className="w-full max-w-xs">
      {latestPost ? (
        <p className="truncate">Your most recent post: {latestPost.name}</p>
      ) : (
        <p>You have no posts yet.</p>
      )}

      <CreatePost />
    </div>
  );
}
 */
