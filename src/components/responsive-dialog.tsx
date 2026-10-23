"use client";

import { type ReactNode, useState } from "react";
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

const COLLAPSED_SNAP_POINT = 0.6;
const SNAP_POINTS = [COLLAPSED_SNAP_POINT, 1];

type ResponsiveDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: ReactNode;
  description: ReactNode;
  isDescriptionHidden?: boolean;
  headerExtra?: ReactNode;
  children: ReactNode;
};

export function ResponsiveDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  isDescriptionHidden = false,
  headerExtra,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const [snap, setSnap] = useState<string | number | null>(
    COLLAPSED_SNAP_POINT,
  );
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSnap(COLLAPSED_SNAP_POINT);
  }

  const descriptionClassName = isDescriptionHidden ? "sr-only" : undefined;

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={SNAP_POINTS}
        snapPoint={snap}
        onSnapPointChange={setSnap}
      >
        {trigger && (
          <DrawerTrigger render={<Button variant="outline" />}>
            {trigger}
          </DrawerTrigger>
        )}
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {headerExtra}
            <DrawerDescription className={descriptionClassName}>
              {description}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger render={<Button variant="outline" />}>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {headerExtra}
          <DialogDescription className={descriptionClassName}>
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
