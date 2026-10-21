"use client";

import { useState } from "react";
import {
  type Program,
  ProgramStats,
} from "@/components/curriculum/program-stats";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

type ProgramModalProps = {
  program: Program | null;
};

const initialSnapPoint = 0.6;
const snapPoints = [initialSnapPoint, 1];

export default function ProgramModal({ program }: ProgramModalProps) {
  const isMobile = useIsMobile();
  const [snap, setSnap] = useState<string | number | null>(initialSnapPoint);

  if (!program?.stats || program.stats.length === 0) return null;

  if (isMobile) {
    return (
      <Drawer
        snapPoints={snapPoints}
        snapPoint={snap}
        onSnapPointChange={setSnap}
      >
        <DrawerTrigger render={<Button variant="outline" />}>
          Ver estadísticas
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="">
            <DrawerTitle>Estadísticas</DrawerTitle>
            <DrawerDescription className="sr-only">
              Visualización de estadísticas del programa académico{" "}
              {program.name}.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <ProgramStats program={program} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Ver estadísticas
      </DialogTrigger>
      <DialogContent className="max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Estadísticas</DialogTitle>
          <DialogDescription className="sr-only">
            Visualización de estadísticas del programa académico {program.name}.
          </DialogDescription>
        </DialogHeader>

        <ProgramStats program={program} />
      </DialogContent>
    </Dialog>
  );
}
