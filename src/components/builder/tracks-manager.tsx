"use client";

import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Action, CredentialType, Draft } from "@/types/builder";

const NEW_TRACK_NAME = "Nuevo plan";
const NO_CREDENTIAL_LABEL = "Sin credencial";

const CREDENTIAL_LABELS: Record<CredentialType, string> = {
  professional: "Título profesional",
  academic: "Grado académico",
  technical: "Título técnico",
  certificate: "Certificado",
  mention: "Mención",
};

const CREDENTIAL_ITEMS = [
  { value: null, label: NO_CREDENTIAL_LABEL },
  ...Object.entries(CREDENTIAL_LABELS).map(([value, label]) => ({
    value: value as CredentialType,
    label,
  })),
];

export default function TracksManager({
  draft,
  dispatch,
}: {
  draft: Draft;
  dispatch: (action: Action) => void;
}) {
  const { tracks, courses } = draft.curriculum;

  function countCourses(trackId: number) {
    return courses.filter((course) => course.trackIds.includes(trackId)).length;
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <GraduationCap />
            Planes
          </Button>
        }
      />
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-96 gap-2"
      >
        <span className="font-medium text-muted-foreground text-xs">
          Planes
        </span>
        {tracks.length === 0 && (
          <p className="text-muted-foreground text-xs">
            Un plan agrupa los cursos que hay que aprobar para alcanzar un hito,
            como el Plan Común, la licenciatura o el título. Asigna cursos a
            cada plan desde el panel del curso.
          </p>
        )}
        {tracks.map((track) => {
          const courseCount = countCourses(track.id);
          return (
            <div key={track.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Input
                  aria-label="Nombre del plan"
                  aria-invalid={track.name.trim() === ""}
                  value={track.name}
                  onChange={(event) =>
                    dispatch({
                      type: "editTrack",
                      trackId: track.id,
                      changes: { name: event.target.value },
                    })
                  }
                />
                <Select
                  items={CREDENTIAL_ITEMS}
                  value={track.credentialType}
                  onValueChange={(credentialType: CredentialType | null) =>
                    dispatch({
                      type: "editTrack",
                      trackId: track.id,
                      changes: { credentialType },
                    })
                  }
                >
                  <SelectTrigger
                    aria-label="Credencial que otorga"
                    className="w-40 shrink-0"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CREDENTIAL_ITEMS.map((item) => (
                      <SelectItem key={item.label} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Eliminar ${track.name || "el plan"}`}
                  onClick={() =>
                    dispatch({ type: "deleteTrack", trackId: track.id })
                  }
                >
                  <Trash2 />
                </Button>
              </div>
              <p
                className={
                  courseCount === 0
                    ? "text-destructive text-xs"
                    : "text-muted-foreground text-xs"
                }
              >
                {courseCount === 0
                  ? "Sin cursos: asígnale al menos uno para poder descargar la malla."
                  : `${courseCount} ${courseCount === 1 ? "curso" : "cursos"}`}
              </p>
            </div>
          );
        })}
        <Button
          variant="ghost"
          className="self-start"
          onClick={() => dispatch({ type: "addTrack", name: NEW_TRACK_NAME })}
        >
          <Plus />
          Agregar plan
        </Button>
      </PopoverContent>
    </Popover>
  );
}
