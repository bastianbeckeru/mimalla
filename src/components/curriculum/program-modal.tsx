"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Program, ProgramStats } from "./program-stats";
import { Button } from "../ui/button";

type ProgramModalProps = {
  program: Program | null;
};

export default function ProgramModal({ program }: ProgramModalProps) {
  if (!program) return null;
  if (!program.stats) return null;
  if (program.stats.length === 0) return null;

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Ver estadísticas</Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[75dvh] max-h-[75dvh] min-h-[25dvh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle hidden>{program.name}</SheetTitle>
          </SheetHeader>

          <ProgramStats program={program} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Ver estadísticas</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle hidden>{program.name}</DialogTitle>
        </DialogHeader>
        <ProgramStats program={program} />
      </DialogContent>
    </Dialog>
  );
}
