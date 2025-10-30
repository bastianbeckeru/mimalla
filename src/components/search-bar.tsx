"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "./ui/button";
import Link from "next/link";
import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import useShortcuts from "@/hooks/use-shortcut";
import { Search } from "lucide-react";
import { institutions } from "@/server/db/data";
import { slugify } from "@/utils/strings";
import { KbdGroup } from "./ui/kbd";
import KbdModifier from "./kbd-action";

export function Searchbar() {
  const posthog = usePostHog();
  const [open, setOpen] = useState(false);

  function handleOpen(source?: string) {
    setOpen((open) => !open);

    if (source) {
      posthog.capture("searchbar_opened", { source: source });
    }
  }

  useShortcuts([
    {
      keys: ["Control", "k"],
      handler: () => handleOpen("keyboard_shortcut"),
    },
  ]);

  return (
    <>
      <Button
        variant="outline"
        className="text-muted-foreground h-8 w-40 items-center justify-center gap-2 p-1.5 lg:w-48"
        onClick={() => handleOpen("button")}
      >
        <p className="ml-0.5 flex-1 text-left text-sm">Buscar carrera...</p>

        <div>
          <Search className="mr-0.5 lg:hidden" />
          <KbdGroup className="hidden lg:inline-flex">
            <KbdModifier>+ K</KbdModifier>
          </KbdGroup>
        </div>
      </Button>

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
