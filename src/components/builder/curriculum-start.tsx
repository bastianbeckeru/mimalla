"use client";

import { ArrowRight, Check, Copy, Upload } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { GUIDE_URL } from "@/components/builder/curricula-sidebar";
import CurriculumSetupForm from "@/components/builder/curriculum-setup-form";
import { useFileImport } from "@/components/builder/use-file-import";
import { Button } from "@/components/ui/button";
import { FieldSeparator } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import type { CurriculumDetails, Draft, TermSystem } from "@/types/builder";

const AGENT_PROMPT = `Help me build my curriculum so I can use it in Mi Malla. Fetch https://mimalla.vercel.app${GUIDE_URL} and follow the guide to build the curriculum.`;
const COPIED_DURATION = 2000;

const optionClassName =
  "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function StartOption({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-sm">{title}</span>
        <span className="truncate text-muted-foreground text-xs">
          {description}
        </span>
      </span>
    </>
  );
}

export default function CurriculumStart({
  onCreate,
  onLoad,
}: {
  onCreate: (termSystem: TermSystem, details: CurriculumDetails) => void;
  onLoad: (draft: Draft) => void;
}) {
  const fileImport = useFileImport(onLoad);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;
    const timeout = setTimeout(() => setIsCopied(false), COPIED_DURATION);
    return () => clearTimeout(timeout);
  }, [isCopied]);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT);
      setIsCopied(true);
    } catch {
      toast.add({
        type: "error",
        title: "No se pudo copiar el prompt",
        description: AGENT_PROMPT,
      });
    }
  }

  return (
    <div className="m-auto flex w-full max-w-110 flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading font-semibold text-2xl">
          ¿Qué programa vas a armar?
        </h2>
        <p className="text-muted-foreground">
          Puedes modificar estos datos en cualquier momento.
        </p>
      </div>
      <CurriculumSetupForm onSubmit={onCreate}>
        <Button type="submit" size="lg" className="h-10">
          Crear malla
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CurriculumSetupForm>
      <FieldSeparator className="-my-2">o</FieldSeparator>
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          className={optionClassName}
          onClick={fileImport.open}
        >
          <StartOption
            icon={<Upload />}
            title="Cargar archivo"
            description="Un archivo .malla"
          />
        </button>
        <button
          type="button"
          className={optionClassName}
          onClick={() => void copyPrompt()}
        >
          <StartOption
            icon={
              <span className="grid *:col-start-1 *:row-start-1 *:transition-[opacity,scale,filter] *:duration-150 *:ease-out">
                <Copy
                  className={
                    isCopied ? "scale-75 opacity-0 blur-[2px]" : undefined
                  }
                />
                <Check
                  className={
                    isCopied ? undefined : "scale-75 opacity-0 blur-[2px]"
                  }
                />
              </span>
            }
            title="Deja que tu agente la arme"
            description={
              isCopied ? "Prompt copiado" : "Copia el prompt para tu IA"
            }
          />
          <span className="sr-only" aria-live="polite">
            {isCopied ? "Prompt copiado" : ""}
          </span>
        </button>
      </div>
      {fileImport.input}
    </div>
  );
}
