"use client";

import { ArrowLeft, RotateCcw, Settings, Trash } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  AdaptiveDialog,
  AdaptiveDialogBody,
  AdaptiveDialogClose,
  AdaptiveDialogContent,
  AdaptiveDialogDescription,
  AdaptiveDialogFooter,
  AdaptiveDialogHeader,
  AdaptiveDialogTitle,
  AdaptiveDialogTrigger,
} from "@/components/ui/adaptive-dialog";
import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";

type Action = {
  icon: ReactNode;
  label: string;
  description: string;
  confirmTitle: string;
  confirmDescription: string;
  onConfirm: () => void;
};

type SettingsDialogProps = {
  onReset: () => void;
  onRemove: () => void;
};

export default function SettingsDialog({
  onReset,
  onRemove,
}: SettingsDialogProps) {
  const [pending, setPending] = useState<Action | null>(null);

  const actions: Action[] = [
    {
      icon: <RotateCcw />,
      label: "Reiniciar malla",
      description: "Vuelve a la malla oficial y descarta tu progreso.",
      confirmTitle: "¿Deseas reiniciar esta malla curricular?",
      confirmDescription:
        "Volverá a la malla oficial y perderás tu progreso y cambios.",
      onConfirm: onReset,
    },
    {
      icon: <Trash />,
      label: "Eliminar malla",
      description: "Borra esta malla y todos sus datos.",
      confirmTitle: "¿Deseas eliminar esta malla curricular?",
      confirmDescription:
        "Esta acción es irreversible, todos los datos se perderán.",
      onConfirm: onRemove,
    },
  ];

  return (
    <AdaptiveDialog
      onOpenChange={(open) => {
        if (open) setPending(null);
      }}
    >
      <AdaptiveDialogTrigger
        render={<SidebarMenuButton tooltip="Configuraciones" />}
      >
        <Settings />
        <span>Configuraciones</span>
      </AdaptiveDialogTrigger>
      <AdaptiveDialogContent className="sm:max-w-[425px]">
        {pending ? (
          <>
            <AdaptiveDialogHeader>
              <AdaptiveDialogTitle>{pending.confirmTitle}</AdaptiveDialogTitle>
              <AdaptiveDialogDescription>
                {pending.confirmDescription}
              </AdaptiveDialogDescription>
            </AdaptiveDialogHeader>
            <AdaptiveDialogFooter>
              <Button variant="ghost" onClick={() => setPending(null)}>
                <ArrowLeft />
                Volver
              </Button>
              <AdaptiveDialogClose
                render={
                  <Button variant="destructive" onClick={pending.onConfirm} />
                }
              >
                {pending.icon}
                {pending.label}
              </AdaptiveDialogClose>
            </AdaptiveDialogFooter>
          </>
        ) : (
          <>
            <AdaptiveDialogHeader>
              <AdaptiveDialogTitle>Configuraciones</AdaptiveDialogTitle>
              <AdaptiveDialogDescription>
                Administra la malla curricular activa.
              </AdaptiveDialogDescription>
            </AdaptiveDialogHeader>
            <AdaptiveDialogBody>
              <ul className="divide-y rounded-lg border">
                {actions.map((action) => (
                  <li
                    key={action.label}
                    className="flex items-center justify-between gap-4 p-3"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium">{action.label}</p>
                      <p className="text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label={action.label}
                      onClick={() => setPending(action)}
                    >
                      {action.icon}
                    </Button>
                  </li>
                ))}
              </ul>
            </AdaptiveDialogBody>
          </>
        )}
      </AdaptiveDialogContent>
    </AdaptiveDialog>
  );
}
