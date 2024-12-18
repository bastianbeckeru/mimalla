"use client";

import { useCurriculumStore, useSettingsStore } from "@/stores/curriculum";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useRouter } from "next/navigation";
import Logo from "../Logo";
import { useEffect } from "react";

export default function Sidebar() {
  const router = useRouter();
  const { reset, areas, progress } = useCurriculumStore();
  const { editMode, setEditMode } = useSettingsStore();

  const totalCourses =
    useCurriculumStore().curriculum?.periods.reduce(
      (total, period) => total + period.enrollments.length,
      0,
    ) ?? 0;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "e" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setEditMode(!editMode);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [editMode, setEditMode]);

  return (
    <>
      {/* SM */}
      <div className="flex h-14 items-center justify-start border-b px-4 lg:h-16">
        <Logo alwaysShow />
      </div>

      {/* SIDEBAR CONTENT */}
      <div className="flex-1">
        <div className="grid items-start gap-2 px-4 py-2 text-sm font-medium">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-row space-x-1">
              <Label htmlFor="edit-mode">Modo edición</Label>
              <span className="hidden text-xs text-muted-foreground md:inline-block">
                ⌘+E
              </span>
            </div>
            <Switch
              id="edit-mode"
              checked={editMode}
              onCheckedChange={(checked: boolean) => setEditMode(checked)}
            />
          </div>

          {/* PROGRESS */}
          <div>
            <div className="flex space-x-2">
              <h2 className="font-semibold">Progreso:</h2>
              <p className="font-normal">
                {(
                  (progress.approvedCourses.length / totalCourses) *
                  100
                ).toFixed(2)}
                %
              </p>
            </div>
            <div className="flex space-x-2">
              <h2 className="font-semibold">Créditos:</h2>
              <p className="font-normal">{progress.earnedCredits}</p>
            </div>
          </div>

          {/* AREAS */}
          {areas.length > 0 && (
            <div className="flex flex-col">
              <h2 className="font-semibold">Áreas de Formación</h2>
              <ul className="space-y-1 py-2">
                {areas.map((area, aIndex) => {
                  if (area.name == "none") return null;
                  return (
                    <li
                      key={aIndex}
                      className="flex w-full flex-row items-center justify-between space-x-2 pl-2 font-normal"
                    >
                      <p className="line-clamp-1">{area.name}</p>
                      <div
                        className="size-4 shrink-0 rounded-sm shadow-inner"
                        style={{
                          backgroundColor: area.color ?? undefined,
                        }}
                      ></div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR FOOTER */}
      <div className="mt-auto p-4">
        <a
          href="https://forms.gle/Qm43RjotQ38VGhTq7"
          target="_blank"
          className="my-4 block w-full text-center text-sm text-muted-foreground underline transition-colors duration-200 hover:text-foreground"
        >
          ¡Ayudanos a mejorar!
        </a>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full gap-2">
              <Trash2 className="size-4" />
              Eliminar Malla
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              ¿Seguro que deseas eliminar tu malla curricular? Esta acción es
              irreversible y todos los datos se borrarán.
            </DialogDescription>
            <DialogFooter>
              <Button
                variant="destructive"
                type="submit"
                onClick={() => {
                  reset();
                  setEditMode(false);
                  router.push("/create");
                }}
              >
                Aceptar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
