"use client";

import { Settings } from "lucide-react";
import { useState } from "react";
import {
  type CurriculumSettings,
  SETTINGS_SECTIONS,
  SettingsSection,
  type SettingsSectionId,
} from "@/components/dashboard/settings-sections";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export default function SettingsDialog({
  settings,
}: {
  settings: CurriculumSettings;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("curriculum");

  const activeLabel = SETTINGS_SECTIONS.find(
    ({ id }) => id === activeSection,
  )?.label;

  return (
    <>
      <SidebarMenuButton
        className="text-sidebar-muted-foreground"
        onClick={() => {
          setActiveSection("curriculum");
          setIsOpen(true);
        }}
      >
        <Settings />
        <span>Configuraciones</span>
      </SidebarMenuButton>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[800px]">
          <div className="flex h-[580px] max-h-[calc(100dvh-2rem)] min-w-0">
            <nav
              aria-label="Secciones de configuraciones"
              className="flex w-51 shrink-0 flex-col gap-1 border-r p-2"
            >
              {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant="ghost"
                  aria-current={id === activeSection ? "page" : undefined}
                  className="h-9 justify-start text-muted-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
                  onClick={() => setActiveSection(id)}
                >
                  <Icon />
                  {label}
                </Button>
              ))}
            </nav>
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="flex h-13 shrink-0 items-center border-b px-6">
                <DialogTitle className="flex items-center gap-1.5 font-medium font-sans text-sm">
                  <span className="font-normal text-muted-foreground">
                    Configuraciones
                  </span>
                  <span aria-hidden className="text-muted-foreground">
                    /
                  </span>
                  {activeLabel}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Ajusta esta malla y la apariencia, o busca ayuda.
                </DialogDescription>
              </header>
              <div
                key={activeSection}
                className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6"
              >
                <SettingsSection
                  section={activeSection}
                  settings={{
                    ...settings,
                    onReset: () => {
                      setIsOpen(false);
                      settings.onReset();
                    },
                    onRemove: () => {
                      setIsOpen(false);
                      settings.onRemove();
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
