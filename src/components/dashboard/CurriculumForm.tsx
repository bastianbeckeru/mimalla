"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/trpc/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useCurriculumStore } from "@/stores/curriculum";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeftIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  siesCode: z.string({
    required_error: "Por favor selecciona una carrera.",
  }),
});

export default function CurriculumForm() {
  const { curriculum, setData } = useCurriculumStore();
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const getCareers = api.university.getCareers.useQuery(undefined, {
    enabled: !curriculum,
    refetchInterval: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
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
      isCreating &&
      getCareerCurriculum.isSuccess &&
      getCareerCurriculum.data
    ) {
      router.push("/dashboard");
      setData(getCareerCurriculum.data);
      setIsCreating(false);
      form.reset();

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
  }, [getCareerCurriculum, curriculum, setData, form, router, isCreating]);

  /* Loader or Skeleton */
  if (getCareerCurriculum.isLoading || getCareers.isLoading) {
    return (
      <div className="size-screen flex justify-center overflow-hidden">
        <Loader2 className="mt-64 size-8 animate-spin" />
      </div>
    );
  }

  if (curriculum) {
    router.push("/dashboard");
  }

  return (
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-1">
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
                          {getCareers.data?.map((career) => (
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
                  <FormMessage />
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

        <p className="px-4 text-center text-sm text-muted-foreground">
          ¿No encuentras tu carrera?{" "}
          <a
            aria-label="No encontraste tu carrera? Rellena este formulario para solicitarla!"
            target="_blank"
            rel="noreferrer"
            href="https://forms.gle/P6JjrCPn1y4fZyUNA"
            className="hover:text-brand underline underline-offset-4"
          >
            Haz clic aquí
          </a>
        </p>
      </div>
    </div>
  );

  function onSubmit() {
    setIsCreating(true);
    void getCareerCurriculum.refetch();
  }
}
