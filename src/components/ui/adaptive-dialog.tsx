"use client";

import { cn } from "cn";
import * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

// Dialog on desktop, drawer on mobile. Both share the Dialog API, so drawer
// parts are typed as their dialog counterparts.
const dialogParts = {
  Root: Dialog,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Footer: DialogFooter,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
};

const drawerParts = {
  Root: Drawer,
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Footer: DrawerFooter,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Close: DrawerClose,
} as unknown as typeof dialogParts;

const AdaptiveDialogContext = React.createContext<{
  isDrawer: boolean;
  parts: typeof dialogParts;
} | null>(null);

function useAdaptiveDialog() {
  const context = React.useContext(AdaptiveDialogContext);
  if (!context) {
    throw new Error("AdaptiveDialog parts must be used within AdaptiveDialog.");
  }
  return context;
}

function AdaptiveDialog(props: React.ComponentProps<typeof Dialog>) {
  const isDrawer = useIsMobile();
  const parts = isDrawer ? drawerParts : dialogParts;
  const contextValue = React.useMemo(
    () => ({ isDrawer, parts }),
    [isDrawer, parts],
  );

  return (
    <AdaptiveDialogContext.Provider value={contextValue}>
      <parts.Root {...props} />
    </AdaptiveDialogContext.Provider>
  );
}

function AdaptiveDialogTrigger(
  props: React.ComponentProps<typeof DialogTrigger>,
) {
  const { Trigger } = useAdaptiveDialog().parts;
  return <Trigger {...props} />;
}

function AdaptiveDialogContent({
  showCloseButton,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const { isDrawer, parts } = useAdaptiveDialog();
  return <parts.Content {...(!isDrawer && { showCloseButton })} {...props} />;
}

function AdaptiveDialogHeader(
  props: React.ComponentProps<typeof DialogHeader>,
) {
  const { Header } = useAdaptiveDialog().parts;
  return <Header {...props} />;
}

// Drawer content has no padding of its own, so the body adds it.
function AdaptiveDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isDrawer } = useAdaptiveDialog();
  return (
    <div
      data-slot="adaptive-dialog-body"
      className={cn(
        isDrawer && "overflow-y-auto px-4 pt-4 last:pb-4",
        className,
      )}
      {...props}
    />
  );
}

function AdaptiveDialogFooter({
  showCloseButton,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  const { isDrawer, parts } = useAdaptiveDialog();
  return <parts.Footer {...(!isDrawer && { showCloseButton })} {...props} />;
}

function AdaptiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const { Title } = useAdaptiveDialog().parts;
  return <Title {...props} />;
}

function AdaptiveDialogDescription(
  props: React.ComponentProps<typeof DialogDescription>,
) {
  const { Description } = useAdaptiveDialog().parts;
  return <Description {...props} />;
}

function AdaptiveDialogClose(props: React.ComponentProps<typeof DialogClose>) {
  const { Close } = useAdaptiveDialog().parts;
  return <Close {...props} />;
}

export {
  AdaptiveDialog,
  AdaptiveDialogBody,
  AdaptiveDialogClose,
  AdaptiveDialogContent,
  AdaptiveDialogDescription,
  AdaptiveDialogFooter,
  AdaptiveDialogHeader,
  AdaptiveDialogTitle,
  AdaptiveDialogTrigger,
};
