import { Info } from "lucide-react";
import { getApplicableYear } from "@/utils/curriculum";

export default function VersionHint({
  effectiveYears,
  entryYear,
}: {
  effectiveYears: number[];
  entryYear: number | null;
}) {
  if (entryYear === null || effectiveYears.length < 2) return null;

  return (
    <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
      <Info className="size-3.5 shrink-0" />
      Se usará la malla {getApplicableYear(effectiveYears, entryYear)}, que
      corresponde a tu año de ingreso.
    </p>
  );
}
