"use client";

import SettingsDialog from "@/components/dashboard/settings-dialog";
import Logo from "@/components/logo";
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
import { useTrajectoryStore } from "@/stores/trajectory";
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
  const removeActiveTrajectory = useTrajectoryStore(
    (state) => state.removeActiveTrajectory,
  );
  const { progress, approvedCourses, totalCourses, approvedCredits } = stats;
  const subareaIds = new Set(areas.flatMap((area) => area.subareaIds));
  const mainAreas = areas
    .filter((area) => !subareaIds.has(area.id))
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

      <SidebarFooter>
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
