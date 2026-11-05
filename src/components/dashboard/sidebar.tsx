"use client";

import { ChevronLeft, ChevronRight, Settings, X } from "lucide-react";
import { useEffect, useRef } from "react";
import SettingsDialog from "@/components/dashboard/settings-dialog";
import {
  SETTINGS_SECTIONS,
  SettingsSection,
} from "@/components/dashboard/settings-sections";
import SidebarResizeHandle from "@/components/dashboard/sidebar-resize-handle";
import { useSidebarScreen } from "@/components/dashboard/use-sidebar-screen";
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
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTrajectoryStore } from "@/stores/trajectory";
import type { SettingsSectionId, TrajectorySettings } from "@/types/settings";
import type { GradingScale } from "@/types/trajectory";
import { formatGrade } from "@/utils/grades";

type DashboardSidebarProps = {
  programName: string;
  stats: {
    progress: number;
    approvedCourses: number;
    totalCourses: number;
    approvedCredits: number;
    cumulativeAverage: number | null;
  };
  width: number;
  onWidthChange: (width: number) => void;
  gradingScale: GradingScale;
  onGradingScaleChange: (scale: GradingScale) => void;
  onReset: () => void;
};

const HEADER_CLASS =
  "flex h-14 items-center gap-2 border-sidebar-border border-b px-4";

function ScreenHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <SidebarHeader className="p-0">
      <div className={HEADER_CLASS}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Volver"
          className="-ml-1.5 text-sidebar-muted-foreground"
          onClick={onBack}
        >
          <ChevronLeft />
        </Button>
        <h2
          ref={titleRef}
          tabIndex={-1}
          className="font-heading font-semibold text-base outline-none"
        >
          {title}
        </h2>
      </div>
    </SidebarHeader>
  );
}

function MobileSettingsList({
  onOpenSection,
}: {
  onOpenSection: (section: SettingsSectionId) => void;
}) {
  return (
    <SidebarContent className="p-4">
      <ul className="divide-y overflow-hidden rounded-lg border">
        {SETTINGS_SECTIONS.map(({ id, label, summary, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
              onClick={() => onOpenSection(id)}
            >
              <Icon className="size-4 shrink-0 text-sidebar-muted-foreground" />
              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="block font-medium text-sm">{label}</span>
                <span className="block text-sidebar-muted-foreground text-xs">
                  {summary}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-sidebar-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </SidebarContent>
  );
}

export default function DashboardSidebar({
  programName,
  stats,
  width,
  onWidthChange,
  gradingScale,
  onGradingScaleChange,
  onReset,
}: DashboardSidebarProps) {
  const { isMobile, open, setOpenMobile } = useSidebar();
  const { screen, openScreen, goBack } = useSidebarScreen();
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

  const settings: TrajectorySettings = {
    programName,
    gradingScale,
    onGradingScaleChange,
    onReset,
    onRemove: removeActiveTrajectory,
  };

  const activeSection = SETTINGS_SECTIONS.find(({ id }) => id === screen);

  return (
    <Sidebar mobileClassName="w-full! max-w-none! border-0!">
      {isMobile && screen === "settings" && (
        <div key={screen} className="flex min-h-0 flex-1 flex-col">
          <ScreenHeader title="Configuraciones" onBack={goBack} />
          <MobileSettingsList onOpenSection={openScreen} />
        </div>
      )}

      {isMobile && activeSection && (
        <div key={screen} className="flex min-h-0 flex-1 flex-col">
          <ScreenHeader title={activeSection.label} onBack={goBack} />
          <SidebarContent className="gap-6 p-4">
            <SettingsSection
              section={activeSection.id}
              settings={{
                ...settings,
                onReset: () => {
                  setOpenMobile(false);
                  onReset();
                },
                onRemove: () => {
                  setOpenMobile(false);
                  removeActiveTrajectory();
                },
              }}
            />
          </SidebarContent>
        </div>
      )}

      {(!isMobile || screen === "main") && (
        <>
          <SidebarHeader className="p-0">
            <div className={`${HEADER_CLASS} justify-between`}>
              <Logo alwaysShow className="[&_span]:text-base [&_svg]:size-6" />
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Cerrar barra lateral"
                  className="text-sidebar-muted-foreground"
                  onClick={() => setOpenMobile(false)}
                >
                  <X />
                </Button>
              )}
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
            {cumulativeAverage !== null && (
              <SidebarGroup className="px-4 py-3">
                <SidebarGroupLabel className="px-0 text-sidebar-muted-foreground">
                  Promedio acumulado
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <p className="font-heading font-semibold text-2xl tabular-nums">
                    {formatGrade(Math.round(cumulativeAverage * 100) / 100)}
                  </p>
                  <p className="text-sidebar-muted-foreground text-xs">
                    Cursos aprobados y reprobados, ponderados por créditos.
                  </p>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                {isMobile ? (
                  <SidebarMenuButton
                    className="text-sidebar-muted-foreground"
                    onClick={() => openScreen("settings")}
                  >
                    <Settings />
                    <span>Configuraciones</span>
                    <ChevronRight className="ml-auto" />
                  </SidebarMenuButton>
                ) : (
                  <SettingsDialog settings={settings} />
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </>
      )}

      {!isMobile && open && (
        <SidebarResizeHandle width={width} onWidthChange={onWidthChange} />
      )}
    </Sidebar>
  );
}
