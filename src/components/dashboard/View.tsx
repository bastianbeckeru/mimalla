"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import { useCurriculumStore } from "@/stores/curriculum";
import Curriculum from "./Curriculum";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";

import { Button, buttonVariants } from "../ui/button";
import { ChevronLeftIcon, Kanban, Loader2, Menu } from "lucide-react";
import { toast } from "../ui/use-toast";
import Sidebar from "./Sidebar";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

const formSchema = z.object({
  siesCode: z.string({
    required_error: "Por favor selecciona una carrera.",
  }),
});

export default function View() {
  const { curriculum, setData } = useCurriculumStore();
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { data: careers, isLoading } = api.university.getCareers.useQuery(
    undefined,
    {
      enabled: !curriculum,
      refetchInterval: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );
  const getCareerCurriculum = api.career.getCurriculum.useQuery(
    { siesCode: form.watch("siesCode") },
    {
      enabled: false,
      refetchInterval: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (
      !curriculum &&
      getCareerCurriculum.isSuccess &&
      getCareerCurriculum.data
    ) {
      setData(getCareerCurriculum.data);
      setIsCreating(false);

      toast({
        description: (
          <p>
            ✅ Se ha importado la malla de{" "}
            <span className="italic">
              {getCareerCurriculum.data.curriculum.career?.name}
            </span>{" "}
            exitosamente.
          </p>
        ),
      });
    }
  }, [getCareerCurriculum, curriculum, setData]);

  /* Loader or Skeleton */
  if (getCareerCurriculum.isLoading || isLoading) {
    return (
      <div className="size-screen flex justify-center overflow-hidden">
        <Loader2 className="mt-64 size-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {!curriculum ? (
        <div className="container flex h-screen w-screen flex-col justify-center">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "absolute left-4 top-4 md:left-8 md:top-8",
            )}
          >
            <ChevronLeftIcon className="mr-2 size-4" />
            Volver
          </Link>

          <div className="mx-auto mb-24 flex w-full flex-col justify-center space-y-4 px-2 sm:w-[350px]">
            <div className="mb-2 flex flex-col space-y-2 text-center">
              <h1 className="flex items-center gap-2">
                <span className="text-2xl font-semibold tracking-tight">
                  Crea tu malla de estudios
                </span>
              </h1>
              <p className="text-left text-sm text-muted-foreground">
                Comienza seleccionando la malla curricular de tu carrera
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-1"
              >
                <Select disabled>
                  <SelectTrigger
                    aria-label="seleccionar universidad"
                    className="w-full"
                  >
                    <SelectValue placeholder="Universidad Diego Portales" />
                  </SelectTrigger>
                </Select>

                <FormField
                  control={form.control}
                  name="siesCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una carrera" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Carreras</SelectLabel>
                              {careers?.map((career) => (
                                <SelectItem
                                  key={career.siesCode}
                                  value={career.siesCode}
                                >
                                  {career.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  aria-label="crear malla predefinida"
                  variant="outline"
                  disabled={isCreating}
                  className={cn("mt-1 h-11 w-full")}
                  type="submit"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creando malla...
                    </>
                  ) : (
                    "Crear malla ✨"
                  )}
                </Button>
              </form>
            </Form>

            <p className="px-8 text-center text-sm text-muted-foreground">
              ¿No encuentras tu carrera?{" "}
              <a
                aria-label="No encontraste tu carrera? Rellena este formulario para solicitarla!"
                target="_blank"
                rel="noreferrer"
                href="google-form-link-here"
                className="hover:text-brand underline underline-offset-4"
              >
                Haz clic aquí
              </a>
            </p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <Sidebar />

          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/20 px-4 lg:h-16 lg:justify-center lg:px-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                  >
                    <Menu className="size-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-72 flex-col">
                  <div className="grid gap-2 text-lg font-medium">
                    <Link
                      href="/"
                      className="flex items-center gap-2 text-lg font-semibold"
                    >
                      <Kanban className="size-6" />
                      <span className="sr-only">Mi Malla</span>
                    </Link>
                    {/* CONTENT */}
                  </div>
                  {/* DELETE CURRICULUM */}
                </SheetContent>
              </Sheet>

              <div className="flex flex-col items-center justify-center space-y-px px-2">
                <h1 className="font-semibold">{curriculum.career?.name}</h1>
                <p className="text-xs/3 text-muted-foreground">
                  {curriculum.career?.faculty.university.name}
                </p>
              </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 bg-[#FF69B4]/20 p-4 dark:bg-[#FF69B4]/10">
              <Curriculum curriculum={curriculum} />
            </main>
          </div>
        </div>
      )}
    </>
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsCreating(true);
    void getCareerCurriculum.refetch();
  }
}
