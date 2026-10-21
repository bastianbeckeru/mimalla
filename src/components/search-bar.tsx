"use client";

import { track } from "@vercel/analytics";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import KbdModifier from "@/components/kbd-modifier";
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
import useShortcuts from "@/hooks/use-shortcut";
import { institutions } from "@/server/db/data";
import { slugify } from "@/utils/strings";

export function Searchbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleOpen(source?: string) {
    setOpen((open) => !open);

    if (source) {
      track("searchbar_opened", { source: source });
    }
  }

  useShortcuts([
    {
      keys: ["Control", "k"],
      callback: () => handleOpen("keyboard_shortcut"),
    },
  ]);

  return (
    <>
      <Button
        variant="outline"
        className="h-8 w-40 items-center justify-center gap-2 p-1.5 text-muted-foreground lg:w-48"
        onClick={() => handleOpen("button")}
      >
        <p className="ml-0.5 flex-1 text-left text-sm">Buscar carrera...</p>

        <div>
          <Search className="mr-0.5 lg:hidden" />
          <KbdGroup className="hidden lg:inline-flex">
            <KbdModifier>+K</KbdModifier>
          </KbdGroup>
        </div>
      </Button>

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
