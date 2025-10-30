"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button, buttonVariants } from "./ui/button";
import Link from "next/link";
import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import { ArrowRight } from "lucide-react";
import { institutions } from "@/server/db/data";
import { slugify } from "@/utils/strings";
import { cn } from "@/lib/utils";
import { useNewCurriculumStore } from "@/stores/newCurriculum";

export function LandingButton() {
  const posthog = usePostHog();
  const { curriculums } = useNewCurriculumStore();
  const [open, setOpen] = useState(false);

  if (curriculums.length > 0) {
    return (
      <Link
        href="/dashboard"
        className="glow glow-active bg-foreground text-background inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md p-2 px-4 py-2 text-sm font-medium whitespace-nowrap has-[>svg]:px-3 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
        onClick={() => {
          posthog.capture("redirect_dashboard", { source: "cta_button" });
        }}
      >
        Ir a mi malla
        <ArrowRight />
      </Link>
    );
  }

  return (
    <>
      <button
        className="glow glow-active bg-foreground text-background inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md p-2 px-4 py-2 text-sm font-medium whitespace-nowrap has-[>svg]:px-3 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
        onClick={() => {
          setOpen((open) => !open);

          posthog.capture("searchbar_opened", { source: "cta_button" });
        }}
      >
        Explorar carreras
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Escribe una carrera..." />
        <CommandList>
          <CommandEmpty>No se encontraron coincidencias.</CommandEmpty>
          {institutions[0]?.departments.map((department) => (
            <CommandGroup heading={department.name} key={department.name}>
              {department.programs.map((program) => (
                <CommandItem asChild key={program.siesCode}>
                  <Link
                    href={`/udp/${slugify(program.name)}`}
                    onClick={() => setOpen(false)}
                  >
                    {program.name}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
