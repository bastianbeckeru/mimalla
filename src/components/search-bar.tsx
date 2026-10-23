"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { track } from "@vercel/analytics";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import KbdHotkey from "@/components/kbd-hotkey";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { KbdGroup } from "@/components/ui/kbd";
import type { CatalogInstitution } from "@/types/curriculum";

export function Searchbar({ catalog }: { catalog: CatalogInstitution[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleOpen(source?: string) {
    setOpen((open) => !open);

    if (source) {
      track("searchbar_opened", { source: source });
    }
  }

  useHotkey("Mod+K", () => handleOpen("keyboard_shortcut"));

  return (
    <>
      <Button
        variant="outline"
        aria-label="Buscar carrera"
        className="size-11 items-center justify-center gap-2 rounded-xl bg-muted/50 text-foreground sm:h-10 sm:w-56 sm:bg-transparent sm:px-3 sm:text-muted-foreground"
        onClick={() => handleOpen("button")}
      >
        <p className="ml-0.5 hidden flex-1 text-left text-sm sm:block">
          Buscar carrera...
        </p>

        <div>
          <Search className="sm:mr-0.5 lg:hidden" />
          <KbdGroup className="hidden lg:inline-flex">
            <KbdHotkey hotkey="Mod+K" />
          </KbdGroup>
        </div>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Escribe una carrera..." />
          <CommandList>
            <CommandEmpty>No se encontraron coincidencias.</CommandEmpty>
            {catalog.flatMap((institution) =>
              institution.departments.map((department) => (
                <CommandGroup
                  heading={`${department.name} · ${institution.acronym}`}
                  key={`${institution.acronym}-${department.name}`}
                >
                  {department.programs.map((program) => (
                    <CommandItem
                      key={program.path}
                      onSelect={() => {
                        setOpen(false);
                        router.push(`/${program.path}`);
                      }}
                    >
                      {program.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )),
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
