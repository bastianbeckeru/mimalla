"use client";

import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

// The system picker on mobile, the styled select on desktop.
export function AdaptiveSelect({
  id,
  value,
  options,
  placeholder,
  onValueChange,
}: {
  id: string;
  value: string | null;
  options: { value: string; label: string }[];
  placeholder: string;
  onValueChange: (value: string) => void;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <NativeSelect
        id={id}
        className="w-full"
        value={value ?? ""}
        onChange={(event) => onValueChange(event.target.value)}
      >
        <NativeSelectOption value="" disabled hidden>
          {placeholder}
        </NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    );
  }

  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next: string | null) => {
        if (next) onValueChange(next);
      }}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
