"use client";

import { RotateCcw, Trash } from "lucide-react";
import type { ReactNode } from "react";
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
import { useCurriculumStore } from "@/stores/curriculum";
import type { Area } from "@/types/curriculum";
import { getLuminance, parseHexColor } from "@/utils/colors";

type DashboardSidebarProps = {
  areas: Area[];
  stats: {
    progress: number;
    approvedCourses: number;
    totalCourses: number;
    approvedCredits: number;
  };
  onReset: () => void;
};

export default function DashboardSidebar({
  areas,
  stats,
  onReset,
}: DashboardSidebarProps) {
  const { removeActiveCurriculum } = useCurriculumStore();
  const { progress, approvedCourses, totalCourses, approvedCredits } = stats;
  const subareaIds = areas.flatMap((area) => area.subareaIds);
  const mainAreas = areas
    .filter((area) => !subareaIds.includes(area.id))
    .sort(
      (a, b) =>
        getLuminance(parseHexColor(a.color)) -
        getLuminance(parseHexColor(b.color)),
    );

  return (
    <Sidebar collapsible="icon">
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
        {mainAreas.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Áreas de Formación</SidebarGroupLabel>
            <SidebarGroupContent>
              <ul>
                {mainAreas.map((area) => (
                  <li
                    key={area.id}
                    className="flex w-full flex-row items-center space-x-2"
                  >
                    <div
                      className="size-4 shrink-0 rounded-xs shadow-inner"
                      style={{ backgroundColor: area.color }}
                    />
                    <span className="line-clamp-1">{area.name}</span>
                  </li>
                ))}
              </ul>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 text-sm">
        <ConfirmDialog
          trigger={
            <>
              <RotateCcw />
              Reiniciar malla
            </>
          }
          title="¿Deseas reiniciar esta malla curricular?"
          description="Volverá a la malla oficial y perderás tu progreso y cambios."
          onConfirm={onReset}
        />
        <ConfirmDialog
          trigger={
            <>
              <Trash />
              Eliminar malla
            </>
          }
          title="¿Deseas eliminar esta malla curricular?"
          description="Esta acción es irreversible, todos los datos se perderán."
          onConfirm={removeActiveCurriculum}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

function ConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="destructive" className="w-full" />}
      >
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="ghost" />}>
            Cancelar
          </DialogClose>
          <DialogClose
            render={<Button variant="destructive" onClick={onConfirm} />}
          >
            Aceptar
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
