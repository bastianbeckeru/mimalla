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

type DashboardSidebarProps = {
  stats: {
    progress: number;
    approvedCourses: number;
    totalCourses: number;
    approvedCredits: number;
  };
  onReset: () => void;
};

export default function DashboardSidebar({
  stats,
  onReset,
}: DashboardSidebarProps) {
  const { toggleSidebar } = useSidebar();
  const removeActiveTrajectory = useTrajectoryStore(
    (state) => state.removeActiveTrajectory,
  );
  const { progress, approvedCourses, totalCourses, approvedCredits } = stats;

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
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SettingsDialog
              onReset={onReset}
              onRemove={removeActiveTrajectory}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
