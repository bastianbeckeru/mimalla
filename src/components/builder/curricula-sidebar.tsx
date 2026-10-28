"use client";

import {
  BookOpen,
  Copy,
  Download,
  EllipsisVertical,
  PanelLeft,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { isExportable } from "@/builder/export";
import { downloadDraft } from "@/components/builder/download-button";
import { useFileImport } from "@/components/builder/use-file-import";
import Logo from "@/components/logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { SavedCurriculum } from "@/stores/builder";
import type { Draft } from "@/types/builder";

export const GUIDE_URL = "/builder/pdf-to-json.md";

const MINOR_WORDS = new Set(["de", "del", "la", "las", "los", "el", "y"]);

function getInitials(institution: string) {
  return institution
    .split(/\s+/)
    .filter((word) => word !== "" && !MINOR_WORDS.has(word.toLowerCase()))
    .map((word) => word[0]?.toUpperCase())
    .join("")
    .slice(0, 3);
}

function CurriculumSummary({
  institution,
  programName,
  caption,
}: {
  institution: string;
  programName: string;
  caption: string;
}) {
  const initials = getInitials(institution);

  return (
    <>
      <span className="flex w-full min-w-0 items-center gap-2 pr-6 text-sidebar-muted-foreground text-xs">
        <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-sm bg-sidebar-muted px-0.5 font-semibold text-[0.5rem] tracking-tight">
          {initials || "–"}
        </span>
        <span className="truncate">{institution || "Sin institución"}</span>
      </span>
      <span className="w-full truncate font-medium text-foreground">
        {programName || "Sin título"}
      </span>
      <span className="text-sidebar-muted-foreground text-xs tabular-nums">
        {caption}
      </span>
    </>
  );
}

const itemClassName =
  "h-auto flex-col items-start gap-1 rounded-lg px-2.5 py-2 data-active:bg-sidebar-accent";

export default function CurriculaSidebar({
  curricula,
  activeId,
  isCreating,
  onCreate,
  onSelect,
  onEditDetails,
  onDuplicate,
  onRemove,
  onLoad,
}: {
  curricula: SavedCurriculum[];
  activeId: string | null;
  isCreating: boolean;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEditDetails: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onLoad: (draft: Draft) => void;
}) {
  const { toggleSidebar } = useSidebar();
  const fileImport = useFileImport(onLoad);
  const [pendingRemoval, setPendingRemoval] = useState<SavedCurriculum | null>(
    null,
  );

  return (
    <Sidebar>
      <SidebarHeader className="gap-4 p-0">
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
        <div className="px-4">
          <Button className="w-full" onClick={onCreate}>
            <Plus />
            Nueva malla
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-4 py-3">
          <SidebarMenu className="gap-1">
            {isCreating && (
              <SidebarMenuItem>
                <SidebarMenuButton isActive className={itemClassName}>
                  <CurriculumSummary
                    institution=""
                    programName=""
                    caption="Borrador"
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {curricula.map((saved) => {
              const { curriculum } = saved.draft;
              return (
                <SidebarMenuItem key={saved.id}>
                  <SidebarMenuButton
                    isActive={!isCreating && saved.id === activeId}
                    className={itemClassName}
                    onClick={() => onSelect(saved.id)}
                  >
                    <CurriculumSummary
                      institution={curriculum.institution}
                      programName={curriculum.programName}
                      caption={String(curriculum.effectiveYear ?? "Sin año")}
                    />
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <SidebarMenuAction
                          showOnHover
                          className="top-2 right-1.5 md:peer-data-active/menu-button:opacity-100"
                        />
                      }
                    >
                      <EllipsisVertical />
                      <span className="sr-only">Opciones de la malla</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="right"
                      align="start"
                      className="w-52"
                    >
                      <DropdownMenuItem onClick={() => onEditDetails(saved.id)}>
                        <Pencil />
                        Editar detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(saved.id)}>
                        <Copy />
                        Duplicar
                        {saved.id === activeId && (
                          <DropdownMenuShortcut>⌘ D</DropdownMenuShortcut>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!isExportable(saved.draft)}
                        onClick={() => downloadDraft(saved.draft)}
                      >
                        <Download />
                        Descargar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setPendingRemoval(saved)}
                      >
                        <Trash2 />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-sidebar-muted-foreground"
              onClick={fileImport.open}
            >
              <Upload />
              Importar archivo
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-sidebar-muted-foreground"
              render={<a href={GUIDE_URL} target="_blank" rel="noopener" />}
            >
              <BookOpen />
              Guía del constructor
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {fileImport.input}
      </SidebarFooter>
      <AlertDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta malla?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará «
              {pendingRemoval?.draft.curriculum.programName || "Sin título"}» y
              todos sus cursos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingRemoval) onRemove(pendingRemoval.id);
                setPendingRemoval(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
