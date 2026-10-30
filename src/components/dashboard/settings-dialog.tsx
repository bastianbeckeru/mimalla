"use client";

import { ArrowLeft, RotateCcw, Settings, Trash } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import CommitInput from "@/components/trajectory/commit-input";
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
import { toast } from "@/components/ui/toast";
import type { GradingScale } from "@/types/trajectory";
import { formatGrade, parseGrade } from "@/utils/grades";

const SCALE_FIELDS: { key: keyof GradingScale; label: string }[] = [
  { key: "min", label: "Mínima" },
  { key: "passing", label: "Aprobación" },
  { key: "max", label: "Máxima" },
];

type Action = {
  icon: ReactNode;
  label: string;
  description: string;
  confirmTitle: string;
  confirmDescription: string;
  onConfirm: () => void;
};

type SettingsDialogProps = {
  gradingScale: GradingScale;
  onGradingScaleChange: (scale: GradingScale) => void;
  onReset: () => void;
  onRemove: () => void;
};

export default function SettingsDialog({
  gradingScale,
  onGradingScaleChange,
  onReset,
  onRemove,
}: SettingsDialogProps) {
  const [pending, setPending] = useState<Action | null>(null);
  const scaleId = useId();

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
        render={<SidebarMenuButton className="text-sidebar-muted-foreground" />}
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
            <AdaptiveDialogBody className="space-y-4">
              <section className="space-y-2 rounded-lg border p-3">
                <div className="space-y-0.5">
                  <h3 className="font-medium">Escala de notas</h3>
                  <p className="text-muted-foreground">
                    Las notas fuera de la escala no cuentan en los promedios.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SCALE_FIELDS.map(({ key, label }) => (
                    <div key={key} className="space-y-1 text-sm">
                      <label
                        htmlFor={`${scaleId}-${key}`}
                        className="text-muted-foreground"
                      >
                        {label}
                      </label>
                      <CommitInput
                        id={`${scaleId}-${key}`}
                        inputMode="decimal"
                        value={formatGrade(gradingScale[key])}
                        onCommit={(text) => {
                          const grade = parseGrade(text);
                          const next = { ...gradingScale, [key]: grade };
                          if (
                            grade === null ||
                            Number.isNaN(grade) ||
                            next.min >= next.max ||
                            next.passing < next.min ||
                            next.passing > next.max
                          ) {
                            toast.add({
                              type: "error",
                              title: "Escala no válida",
                              description:
                                "La mínima debe ser menor que la máxima y la aprobación debe quedar entre ambas.",
                            });
                            return;
                          }
                          onGradingScaleChange(next);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
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
