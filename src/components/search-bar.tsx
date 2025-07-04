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
import { useEffect, useState } from "react";
import { usePostHog } from "posthog-js/react";
import useShortcuts from "@/hooks/use-shortcut";
import { Search } from "lucide-react";

export function Searchbar() {
  const posthog = usePostHog();
  const [open, setOpen] = useState(false);

  function handleEditMode(source?: string) {
    setOpen((open) => !open);

    if (source) {
      posthog.capture("searchbar_opened", { source: source });
    }
  }

  useShortcuts([
    {
      keys: ["Control", "k"],
      handler: () => handleEditMode("keyboard_shortcut"),
    },
  ]);

  return (
    <>
      <Button
        variant="outline"
        className="text-muted-foreground h-8 w-40 items-center justify-center gap-2 p-1.5 lg:w-48"
        onClick={() => handleEditMode("button")}
      >
        <p className="ml-0.5 flex-1 text-left text-sm">Buscar malla...</p>

        <div>
          <Search className="mr-0.5 lg:hidden" />
          <kbd className="bg-muted pointer-events-none hidden rounded-sm border px-1.5 text-center text-sm font-medium select-none lg:inline-flex">
            <span className="scale-75">⌘</span>K
          </kbd>
        </div>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Escribe una carrera..." />
        <CommandList>
          <CommandEmpty>No se encontraron coincidencias.</CommandEmpty>
          <CommandGroup heading={"Facultad de Ingeniería y Ciencias"}>
            <CommandItem asChild>
              <Link
                href="/udp/ingenieria-civil-industrial"
                onClick={() => setOpen(false)}
              >
                Ingeniería Civil Industrial
              </Link>
            </CommandItem>
            <CommandItem asChild>
              <Link
                href="/udp/ingenieria-civil-en-informatica-y-telecomunicaciones"
                onClick={() => setOpen(false)}
              >
                Ingeniería Civil en Informática y Telecomunicaciones
              </Link>
            </CommandItem>
            <CommandItem asChild>
              <Link
                href="/udp/ingenieria-civil-en-obras-civiles"
                onClick={() => setOpen(false)}
              >
                Ingeniería Civil en Obras Civiles
              </Link>
            </CommandItem>
            <CommandItem asChild>
              <Link
                href="/udp/ingenieria-civil-plan-comun"
                onClick={() => setOpen(false)}
              >
                Ingeniería Civil Plan Común
              </Link>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading={"Facultad de Psicología"}>
            <CommandItem asChild>
              <Link href="/udp/psicologia" onClick={() => setOpen(false)}>
                Psicología
              </Link>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading={"Facultad de Derecho"}>
            <CommandItem asChild>
              <Link href="/udp/derecho" onClick={() => setOpen(false)}>
                Derecho
              </Link>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
