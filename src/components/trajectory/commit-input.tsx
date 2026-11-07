"use client";

import { type ComponentProps, useState } from "react";
import { Input } from "@/components/ui/input";

// An input that keeps what the student types to itself and hands it over on
// blur or Enter, so each finished value is one step to undo.
export default function CommitInput({
  value,
  onCommit,
  ...props
}: Omit<
  ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "onBlur"
> & {
  value: string;
  onCommit: (text: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Input
      {...props}
      value={draft ?? value}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft !== null && draft !== value) onCommit(draft);
        setDraft(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        props.onKeyDown?.(event);
      }}
    />
  );
}
