"use client";

import { track } from "@vercel/analytics";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { institutions } from "@/server/db/data";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import { slugify } from "@/utils/strings";

export function LandingButton() {
  const { curriculums } = useNewCurriculumStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (curriculums.length > 0) {
    return (
      <Link
        href="/dashboard"
        className="glow glow-active inline-flex h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-foreground p-2 px-4 py-2 font-medium text-background text-sm has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none"
        onClick={() => {
          track("redirect_dashboard", { source: "cta_button" });
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
        type="button"
        className="glow glow-active inline-flex h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-foreground p-2 px-4 py-2 font-medium text-background text-sm has-[>svg]:px-3 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none"
        onClick={() => {
          setOpen((open) => !open);

          track("searchbar_opened", { source: "cta_button" });
        }}
      >
        Explorar carreras
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Escribe una carrera..." />
          <CommandList>
            <CommandEmpty>No se encontraron coincidencias.</CommandEmpty>
            {institutions[0]?.departments.map((department) => (
              <CommandGroup heading={department.name} key={department.name}>
                {department.programs.map((program) => (
                  <CommandItem
                    key={program.siesCode}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/udp/${slugify(program.name)}`);
                    }}
                  >
                    {program.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
