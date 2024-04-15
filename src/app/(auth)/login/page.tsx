import type { Metadata } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

import { ChevronLeftIcon, GraduationCap } from "lucide-react";
import { UserAuthForm } from "@/components/UserAuthForm";

export const metadata: Metadata = {
  title: "Inicio de sesión | Malla",
  description: "Inicia sesión en tu cuenta",
};

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-4 top-4 md:left-8 md:top-8",
        )}
      >
        <>
          <ChevronLeftIcon className="mr-2 size-4" />
          Volver
        </>
      </Link>

      <div className="lg:py-4">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <GraduationCap className="mx-auto size-6" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Bienvenido de nuevo
            </h1>
            <p className="text-sm text-muted-foreground">
              Inicia sesión a continuación para acceder a tu cuenta, utiliza tu
              correo institucional
            </p>
          </div>

          <UserAuthForm />

          <p className="px-8 text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link
              aria-label="Regístrate"
              href="/register"
              className="hover:text-brand underline underline-offset-4"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full flex-row items-center justify-center space-x-2 p-4 text-sm text-muted-foreground sm:w-[350px]">
        <Link href="/terms-of-use">Términos de uso</Link>
        <div className="h-5/6 w-px bg-muted-foreground"></div>
        <Link href="/privacy-policy">Política de privacidad</Link>
      </div>
    </div>
  );
}
