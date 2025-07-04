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
        className="text-muted-foreground h-8 w-48 cursor-pointer p-1.5 pl-3"
        onClick={() => handleEditMode("button")}
      >
        <p className="flex flex-grow text-sm">Buscar malla...</p>
        <p className="">
          <kbd className="bg-muted pointer-events-none inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 font-mono text-sm font-medium select-none">
            <span className="text-xs">⌘</span>K
          </kbd>
        </p>
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
