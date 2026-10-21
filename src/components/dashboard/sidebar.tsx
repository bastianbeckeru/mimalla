"use client";

import { RotateCcw, Trash } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/sidebar";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import type {
  CurriculumData,
  History,
  PeriodWithEnrollments,
} from "@/types/curriculum";
import { getLuminance, parseHexColor } from "@/utils/colors";

type DashboardSidebar = {
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
  areas: CurriculumData["areas"];
  stats: {
    progress: number;
    approvedCourses: number;
    totalCourses: number;
    approvedCredits: number;
  };
  setHistory: (history: History<PeriodWithEnrollments[]>) => void;
};

export default function DashboardSidebar({
  editMode,
  setEditMode,
  areas,
  stats,
  setHistory,
  ...props
}: DashboardSidebar) {
  const { resetStore } = useNewCurriculumStore();
  const { progress, approvedCourses, totalCourses, approvedCredits } = stats;
  const subareaIds = areas.flatMap((area) => area.subareaIds);
  const fixedAreas = areas
    .filter((area) => area.color !== null && !subareaIds.includes(area.id))
    .sort((a, b) => {
      const lumA = getLuminance(parseHexColor(a.color));
      const lumB = getLuminance(parseHexColor(b.color));
      return lumA - lumB;
    });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex h-14 justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Logo alwaysShow />}
              className="group-data-[collapsible=icon]:!p-1 [&>svg]:size-6"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="p-2 text-sm">
        {/* PROGRESS */}
        <SidebarGroup>
          <SidebarGroupLabel>Progreso</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2">
            <Progress value={progress} />
            <div className="flex flex-row justify-between space-x-2">
              <p>
                {approvedCourses}/{totalCourses}
              </p>
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
              {fixedAreas.map((area) => (
                <li
                  key={area.id}
                  className="flex w-full flex-row items-center space-x-2"
                >
                  <div
                    className="size-4 shrink-0 rounded-xs shadow-inner"
                    style={{
                      backgroundColor: area.color,
                    }}
                  ></div>
                  <span className="line-clamp-1">{area.name}</span>
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
          className="my-4 hidden w-full text-center text-muted-foreground text-sm underline transition-colors duration-200 hover:text-foreground"
          rel="noopener"
        >
          ¡Ayudanos a mejorar!
        </a>

        <Button variant="destructive" className="w-full">
          <RotateCcw />
          Reiniciar malla
        </Button>

        <Dialog>
          <DialogTrigger
            render={<Button variant="destructive" className="w-full" />}
          >
            <Trash />
            Eliminar malla
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>¿Deseas eliminar esta malla curricular?</DialogTitle>
              <DialogDescription>
                Esta acción es irreversible, todos los datos se perderán.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="ghost" />}>
                Cancelar
              </DialogClose>
              <DialogClose
                render={
                  <Button
                    variant="destructive"
                    type="submit"
                    onClick={() => {
                      resetStore();
                      setHistory({ past: [], present: [], future: [] });
                      setEditMode(false);
                    }}
                  />
                }
              >
                Aceptar
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarFooter>
    </Sidebar>
  );
}
