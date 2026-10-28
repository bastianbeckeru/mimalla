"use client";

import { GraduationCap } from "lucide-react";
import PropertyRow, {
  propertyControlClassName,
} from "@/components/builder/property-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Action, Course, Track } from "@/types/builder";

const NO_TRACK_LABEL = "Sin plan";

export default function TrackSelect({
  course,
  tracks,
  dispatch,
}: {
  course: Course;
  tracks: Track[];
  dispatch: (action: Action) => void;
}) {
  const selected = tracks.filter((track) => course.trackIds.includes(track.id));

  return (
    <PropertyRow
      icon={GraduationCap}
      label="Planes"
      htmlFor="builder-course-tracks"
    >
      <Select
        multiple
        items={tracks.map((track) => ({ value: track.id, label: track.name }))}
        value={course.trackIds}
        disabled={tracks.length === 0}
        onValueChange={(trackIds: number[]) =>
          dispatch({ type: "assignTracks", courseId: course.id, trackIds })
        }
      >
        <SelectTrigger
          id="builder-course-tracks"
          className={`${propertyControlClassName} w-full`}
        >
          <SelectValue placeholder={NO_TRACK_LABEL}>
            <span className="truncate">
              {selected.length === 0
                ? NO_TRACK_LABEL
                : selected.map((track) => track.name).join(", ")}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {tracks.map((track) => (
            <SelectItem key={track.id} value={track.id}>
              {track.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PropertyRow>
  );
}
