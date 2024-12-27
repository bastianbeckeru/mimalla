"use client";

import type { CurriculumData } from "@/types/curriculum";
import { useEffect } from "react";

import { useSettingsStore } from "@/stores/settings";
import { useNewCurriculumStore } from "@/stores/newCurriculum";

import { getLuminance, parseHexColor } from "@/utils/colors";
import Logo from "../Logo";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "../ui/sidebar";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Progress } from "../ui/progress";
import { Lock, LockOpen, Trash2 } from "lucide-react";

type DashboardSidebar = {
  areas: CurriculumData["areas"];
  progress: number;
  approvedCredits: number;
};

export default function DashboardSidebar({
  areas,
  progress,
  approvedCredits,
  ...props
}: DashboardSidebar) {
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
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="group-data-[collapsible=icon]:!p-1 [&>svg]:size-6"
            >
              <Logo alwaysShow />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="p-2 text-sm">
        <SidebarGroup>
          <SidebarMenu className="flex cursor-pointer items-center justify-between space-x-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Modo edición"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? (
                  <LockOpen className="size-4" />
                ) : (
                  <Lock className="size-4" />
                )}
                <span className="font-semibold">Modo edición</span>
                <span className="hidden text-xs text-muted-foreground md:inline-block">
                  ⌘+E
                </span>
                <Switch
                  id="edit-mode"
                  checked={editMode}
                  onCheckedChange={(checked: boolean) => setEditMode(checked)}
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />
        {/* PROGRESS */}
        <SidebarGroup>
          <SidebarGroupLabel>Progreso</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            <Progress value={progress} />
            <div className="flex flex-row justify-between space-x-2">
              <p>{progress.toFixed(2)}%</p>
              <p>
                {approvedCredits}
                {" créditos"}
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />
        {/* AREAS */}
        {fixedAreas.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Áreas de Formación</SidebarGroupLabel>
            <SidebarGroupContent>
              {fixedAreas.map((area, aIndex) => (
                <li
                  key={aIndex}
                  className="flex w-full flex-row items-center justify-between space-x-2"
                >
                  <span className="line-clamp-1">{area.name}</span>
                  <div
                    className="size-4 shrink-0 rounded-sm shadow-inner"
                    style={{
                      backgroundColor: area.color,
                    }}
                  ></div>
                </li>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 text-sm">
        <a
          href="https://forms.gle/Qm43RjotQ38VGhTq7"
          target="_blank"
          className="my-4 block w-full text-center text-sm text-muted-foreground underline transition-colors duration-200 hover:text-foreground"
        >
          ¡Ayudanos a mejorar!
        </a>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outlineDestructive" className="w-full gap-2">
              <Trash2 className="size-4" />
              Eliminar Malla
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>¿Deseas eliminar esta malla curricular?</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Esta acción es irreversible, todos los datos se perderán.
            </DialogDescription>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                type="submit"
                onClick={() => {
                  resetStore();
                  setEditMode(false);
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
