"use client";

import { useSettingsStore } from "@/stores/settings";
import { Lock, Trash2 } from "lucide-react";
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
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
} from "../ui/sidebar";
import type { CurriculumData } from "@/types/curriculum";
import { getLuminance, parseHexColor } from "@/utils/colors";
import { useEffect } from "react";

type DashboardSidebar = {
  areas: CurriculumData["areas"];
};

export default function DashboardSidebar({
  areas,
  ...props
}: DashboardSidebar) {
  const router = useRouter();
  const { resetStore } = useNewCurriculumStore();
  const { editMode, setEditMode } = useSettingsStore();

  const fixedAreas = areas
    .filter((area) => area.color !== null)
    .sort((a, b) => {
      const lumA = getLuminance(parseHexColor(a.color));
      const lumB = getLuminance(parseHexColor(b.color));
      return lumA - lumB;
    });

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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex h-14 justify-center border-b">
        <SidebarMenu>
          <Logo />
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="p-2 text-sm">
        <div className="flex items-center justify-between space-x-2 p-2">
          <div className="flex flex-row items-end justify-end space-x-1">
            <Lock className="size-3" />
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
        {/*           <div>
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
          </div> */}

        {/* AREAS */}
        {fixedAreas.length > 0 && (
          <div className="flex flex-col p-2">
            <h2 className="font-semibold">Áreas de Formación</h2>
            <ul className="space-y-1 py-2">
              {fixedAreas.map((area, aIndex) => (
                <li
                  key={aIndex}
                  className="flex w-full flex-row items-center justify-between space-x-2 pl-2 font-normal"
                >
                  <p className="line-clamp-1">{area.name}</p>
                  <span
                    className="size-4 shrink-0 rounded-sm shadow-inner"
                    style={{
                      backgroundColor: area.color,
                    }}
                  ></span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter>
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
                  resetStore();
                  setEditMode(false);
                  router.push("/create");
                }}
              >
                Aceptar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarFooter>
    </Sidebar>
  );
}
