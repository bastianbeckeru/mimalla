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

export default function Sidebar() {
  const totalCourses =
    useCurriculumStore().curriculum?.periods.reduce(
      (total, period) => total + period.enrollments.length,
      0,
    ) ?? 0;
  const { areas, reset, progress } = useCurriculumStore();
  const { setEditMode } = useSettingsStore();

  return (
    <>
      {/* SIDEBAR CONTENT */}
      <div className="flex-1">
        <div className="grid items-start gap-2 p-2 text-sm font-medium lg:px-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="edit-mode">Modo edición</Label>
            <Switch
              id="edit-mode"
              onCheckedChange={(checked: boolean) => setEditMode(checked)}
            />
          </div>
          {/* PROGRESS */}
          <div>
            <p>
              Progreso:{" "}
              {((progress.approvedCourses.length / totalCourses) * 100).toFixed(
                2,
              )}
              %
            </p>
            <p>Créditos: {progress.earnedCredits}</p>
          </div>
          {areas.length > 0 && (
            <div className="flex flex-col space-y-2 py-2">
              <h2 className="font-semibold">Áreas de Formación</h2>
              <ul className="space-y-1">
                {areas.map((area, aIndex) => {
                  return (
                    <li
                      key={aIndex}
                      className="flex h-8 w-full flex-row items-center justify-between space-x-2 rounded-lg border border-input px-2 font-normal"
                    >
                      <p className="line-clamp-1">{area.name}</p>
                      <div
                        className="size-4 shrink-0 rounded-sm border border-black/10"
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
      <div className="mt-auto p-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructiveOutline" className="w-full gap-2">
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
                }}
              >
                Aceptar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {/* SIDEBAR CONTENT ENDS */}
    </>
  );
}
