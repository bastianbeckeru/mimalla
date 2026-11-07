"use client";

import {
  ArrowUpRight,
  ChevronDown,
  CircleHelp,
  GraduationCap,
  type LucideIcon,
  Monitor,
  Moon,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { type ReactNode, useId, useState } from "react";
import KbdHotkey from "@/components/kbd-hotkey";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePreferencesStore } from "@/stores/preferences";
import type { SettingsSectionId, TrajectorySettings } from "@/types/settings";
import type { GradingScale } from "@/types/trajectory";
import { formatGrade, isValidGradingScale, parseGrade } from "@/utils/grades";
import { version } from "../../../package.json";

export const SETTINGS_SECTIONS: {
  id: SettingsSectionId;
  label: string;
  summary: string;
  icon: LucideIcon;
}[] = [
  {
    id: "trajectory",
    label: "Esta malla",
    summary: "Escala de notas, reiniciar y eliminar",
    icon: GraduationCap,
  },
  {
    id: "preferences",
    label: "Preferencias",
    summary: "Tema y barra de áreas",
    icon: SlidersHorizontal,
  },
  {
    id: "help",
    label: "Ayuda",
    summary: "Preguntas, reportar un problema y novedades",
    icon: CircleHelp,
  },
];

const SCALE_FIELDS: {
  key: keyof GradingScale;
  label: string;
  description: string;
}[] = [
  { key: "min", label: "Mínima", description: "La nota más baja posible." },
  {
    key: "passing",
    label: "Aprobación",
    description: "Desde esta nota, un curso se considera aprobado.",
  },
  { key: "max", label: "Máxima", description: "La nota más alta posible." },
];

const THEMES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
];

const QUESTIONS = [
  {
    question: "¿Dónde se guarda mi progreso?",
    answer:
      "Solo en este navegador. Si borras los datos del sitio o cambias de dispositivo, no lo verás ahí.",
  },
  {
    question: "Marcar cursos y poner notas",
    answer:
      "Selecciona un curso en el tablero para abrir su panel. Ahí puedes cambiar su estado y registrar sus notas.",
  },
  {
    question: "Cerrar un periodo",
    answer:
      "Abre el menú del encabezado de un periodo ya iniciado y elige «Cerrar periodo» para definir de una vez el estado de sus cursos pendientes.",
  },
  {
    question: "¿Por qué hay cursos atenuados?",
    answer:
      "Están bloqueados: todavía te faltan requisitos o créditos para tomarlos.",
  },
];

const HOTKEYS = [
  { label: "Deshacer", hotkey: "Mod+Z" },
  { label: "Rehacer", hotkey: "Mod+Shift+Z" },
  { label: "Mostrar u ocultar la barra", hotkey: "Mod+B" },
] as const;

const REPORT_URL = `mailto:bastian.becker.u@gmail.com?subject=${encodeURIComponent(
  `Problema en Mi Malla (v${version})`,
)}`;
const RELEASES_URL = "https://github.com/bastianbeckeru/mimalla/releases";

const ROW_CLASS = "flex items-center justify-between gap-4 px-3 py-2.5";
const LINK_ROW_CLASS = `${ROW_CLASS} outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50`;

function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div>
        <h3 className="font-heading font-semibold text-sm">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      <div className="divide-y overflow-hidden rounded-lg border">
        {children}
      </div>
    </section>
  );
}

function RowText({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="font-medium text-sm">{label}</p>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
    </div>
  );
}

function GradingScaleGroup({
  gradingScale,
  onGradingScaleChange,
}: Pick<TrajectorySettings, "gradingScale" | "onGradingScaleChange">) {
  const [drafts, setDrafts] = useState<
    Partial<Record<keyof GradingScale, string>>
  >({});
  const [hasError, setHasError] = useState(false);
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  function commitDrafts() {
    const next = { ...gradingScale };
    for (const { key } of SCALE_FIELDS) {
      const draft = drafts[key];
      if (draft !== undefined) next[key] = parseGrade(draft) ?? Number.NaN;
    }
    if (!isValidGradingScale(next)) {
      setHasError(true);
      return;
    }
    setHasError(false);
    setDrafts({});
    if (SCALE_FIELDS.some(({ key }) => next[key] !== gradingScale[key])) {
      onGradingScaleChange(next);
    }
  }

  return (
    <SettingsGroup
      title="Escala de notas"
      description="Las notas fuera de la escala no cuentan en los promedios."
    >
      {SCALE_FIELDS.map(({ key, label, description }) => (
        <div key={key} className={ROW_CLASS}>
          <label htmlFor={`${fieldId}-${key}`} className="min-w-0">
            <RowText label={label} description={description} />
          </label>
          <Input
            id={`${fieldId}-${key}`}
            inputMode="decimal"
            className="w-18 shrink-0"
            value={drafts[key] ?? formatGrade(gradingScale[key])}
            aria-invalid={hasError && drafts[key] !== undefined}
            aria-describedby={hasError ? errorId : undefined}
            onChange={(event) =>
              setDrafts({ ...drafts, [key]: event.target.value })
            }
            onBlur={commitDrafts}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
        </div>
      ))}
      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="px-3 py-2.5 text-destructive text-xs"
        >
          La mínima debe ser menor que la máxima y la aprobación debe quedar
          entre ambas.
        </p>
      )}
    </SettingsGroup>
  );
}

function DangerRow({
  label,
  description,
  action,
  isDestructive,
  confirmTitle,
  confirmDescription,
  onConfirm,
}: {
  label: string;
  description: string;
  action: string;
  isDestructive?: boolean;
  confirmTitle: string;
  confirmDescription: string;
  onConfirm: () => void;
}) {
  return (
    <div className={ROW_CLASS}>
      <RowText label={label} description={description} />
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant={isDestructive ? "destructive" : "outline"}
              className="shrink-0"
            />
          }
        >
          {action}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end *:flex-1 sm:*:flex-none">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onConfirm}>
              {label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TrajectorySection({
  programName,
  gradingScale,
  onGradingScaleChange,
  onReset,
  onRemove,
}: TrajectorySettings) {
  return (
    <>
      <GradingScaleGroup
        gradingScale={gradingScale}
        onGradingScaleChange={onGradingScaleChange}
      />
      <SettingsGroup title="Zona de peligro">
        <DangerRow
          label="Reiniciar malla"
          description="Vuelve a la malla oficial."
          action="Reiniciar"
          confirmTitle="¿Reiniciar esta malla?"
          confirmDescription="Volverá a la malla oficial y perderás tu progreso, tus notas y tus cambios."
          onConfirm={onReset}
        />
        <DangerRow
          label="Eliminar malla"
          description="Borra la malla y sus datos."
          action="Eliminar"
          isDestructive
          confirmTitle="¿Eliminar esta malla?"
          confirmDescription={`Se borrarán ${programName}, tu progreso y tus notas. No se puede deshacer.`}
          onConfirm={onRemove}
        />
      </SettingsGroup>
    </>
  );
}

function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  const showsAreasBar = usePreferencesStore((state) => state.showsAreasBar);
  const setShowsAreasBar = usePreferencesStore(
    (state) => state.setShowsAreasBar,
  );

  return (
    <>
      <section className="space-y-2">
        <h3 className="font-heading font-semibold text-sm">Tema</h3>
        <ToggleGroup
          aria-label="Tema"
          spacing={1}
          className="w-full rounded-lg bg-muted/50 p-1 sm:w-fit"
          value={theme ? [theme] : []}
          onValueChange={([next]) => {
            if (next) setTheme(next);
          }}
        >
          {THEMES.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="flex-1 text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground sm:flex-none"
            >
              <Icon />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>
      <SettingsGroup title="Tablero">
        <div className={ROW_CLASS}>
          <label
            htmlFor="settings-areas-bar"
            className="min-w-0 flex-1 cursor-pointer"
          >
            <RowText
              label="Barra de áreas"
              description="Muestra las áreas de la malla bajo el tablero."
            />
          </label>
          <Switch
            id="settings-areas-bar"
            checked={showsAreasBar}
            onCheckedChange={setShowsAreasBar}
          />
        </div>
      </SettingsGroup>
      <p className="text-muted-foreground text-xs">
        Se aplican en este dispositivo.
      </p>
    </>
  );
}

function HelpSection() {
  const isMobile = useIsMobile();

  return (
    <>
      <SettingsGroup title="Soporte">
        <a href={REPORT_URL} className={LINK_ROW_CLASS}>
          <RowText label="Reportar un problema" />
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
        </a>
        <a
          href={RELEASES_URL}
          target="_blank"
          rel="noreferrer"
          className={LINK_ROW_CLASS}
        >
          <RowText label="Novedades" description={`Versión ${version}`} />
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
        </a>
      </SettingsGroup>
      <SettingsGroup title="Preguntas frecuentes">
        {QUESTIONS.map(({ question, answer }, index) => (
          <details
            key={question}
            name="settings-questions"
            open={index === 0}
            className="group"
          >
            <summary
              className={`${LINK_ROW_CLASS} cursor-pointer list-none font-medium text-sm [&::-webkit-details-marker]:hidden`}
            >
              {question}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-3 pb-2.5 text-muted-foreground text-xs">
              {answer}
            </p>
          </details>
        ))}
      </SettingsGroup>
      {!isMobile && (
        <SettingsGroup title="Atajos de teclado">
          {HOTKEYS.map(({ label, hotkey }) => (
            <div key={hotkey} className={ROW_CLASS}>
              <RowText label={label} />
              <KbdHotkey hotkey={hotkey} />
            </div>
          ))}
        </SettingsGroup>
      )}
    </>
  );
}

export function SettingsSection({
  section,
  settings,
}: {
  section: SettingsSectionId;
  settings: TrajectorySettings;
}) {
  if (section === "preferences") return <PreferencesSection />;
  if (section === "help") return <HelpSection />;
  return <TrajectorySection {...settings} />;
}
