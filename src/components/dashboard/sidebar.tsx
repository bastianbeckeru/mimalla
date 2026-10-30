"use client";

import { PanelLeft } from "lucide-react";
import SettingsDialog from "@/components/dashboard/settings-dialog";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
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
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTrajectoryStore } from "@/stores/trajectory";
import type { GradingScale } from "@/types/trajectory";
import { formatGrade } from "@/utils/grades";

type DashboardSidebarProps = {
  stats: {
    progress: number;
    approvedCourses: number;
    totalCourses: number;
    approvedCredits: number;
    cumulativeAverage: number | null;
  };
  gradingScale: GradingScale;
  onGradingScaleChange: (scale: GradingScale) => void;
  onReset: () => void;
};

export default function DashboardSidebar({
  stats,
  gradingScale,
  onGradingScaleChange,
  onReset,
}: DashboardSidebarProps) {
  const { toggleSidebar } = useSidebar();
  const removeActiveTrajectory = useTrajectoryStore(
    (state) => state.removeActiveTrajectory,
  );
  const {
    progress,
    approvedCourses,
    totalCourses,
    approvedCredits,
    cumulativeAverage,
  } = stats;

  return (
    <Sidebar>
      <SidebarHeader className="p-0">
        <div className="flex h-14 items-center justify-between border-sidebar-border border-b px-4">
          <Logo alwaysShow className="[&_span]:text-base [&_svg]:size-6" />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Ocultar barra lateral"
            className="text-sidebar-muted-foreground"
            onClick={toggleSidebar}
          >
            <PanelLeft />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-4 py-3">
          <SidebarGroupLabel className="px-0 text-sidebar-muted-foreground">
            Progreso
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2 text-sm">
            <Progress value={progress} />
            <div className="flex justify-between gap-2 text-sidebar-muted-foreground tabular-nums">
              <p>
                {approvedCourses}/{totalCourses} cursos
              </p>
              <p>{approvedCredits} créditos</p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="px-4 py-3">
          <SidebarGroupLabel className="px-0 text-sidebar-muted-foreground">
            Promedio acumulado
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <p className="font-heading font-semibold text-2xl tabular-nums">
              {cumulativeAverage === null
                ? "—"
                : formatGrade(Math.round(cumulativeAverage * 100) / 100)}
            </p>
            <p className="text-sidebar-muted-foreground text-xs">
              Cursos aprobados y reprobados, ponderados por créditos.
            </p>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SettingsDialog
              gradingScale={gradingScale}
              onGradingScaleChange={onGradingScaleChange}
              onReset={onReset}
              onRemove={removeActiveTrajectory}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
