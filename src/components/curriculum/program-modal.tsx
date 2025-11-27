'use client';

import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

import { useIsMobile } from '@/hooks/use-mobile';
import { type Program, ProgramStats } from './program-stats';

type ProgramModalProps = {
  program: Program | null;
};

const snapPoints = [0.6, 1];

export default function ProgramModal({ program }: ProgramModalProps) {
  if (!program || !program.stats || program.stats.length === 0) return null;

  const isMobile = useIsMobile();
  const [snap, setSnap] = useState<string | number | null>(snapPoints[0]!);

  if (isMobile) {
    return (
      <Drawer
        snapPoints={snapPoints}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
        fadeFromIndex={0}
      >
        <DrawerTrigger asChild>
          <Button variant='outline'>Ver estadísticas</Button>
        </DrawerTrigger>
        <DrawerContent className='h-full'>
          <DrawerHeader className=''>
            <DrawerTitle>Estadísticas</DrawerTitle>
            <DrawerDescription className='sr-only'>
              Visualización de estadísticas del programa académico{' '}
              {program.name}.
            </DrawerDescription>
          </DrawerHeader>
          <div className='flex-1 overflow-y-auto p-4'>
            <ProgramStats program={program} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>Ver estadísticas</Button>
      </DialogTrigger>
      <DialogContent className='max-h-[80dvh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Estadísticas</DialogTitle>
          <DialogDescription className='sr-only'>
            Visualización de estadísticas del programa académico {program.name}.
          </DialogDescription>
        </DialogHeader>

        <ProgramStats program={program} />
      </DialogContent>
    </Dialog>
  );
}
