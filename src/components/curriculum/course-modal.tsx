import type { ExtendedSlot } from "@/types/curriculum";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { getContrastingShade, parseHexColor } from "@/utils/colors";
import { useIsMobile } from "@/hooks/use-mobile";

type CourseDialogProps = {
  isOpen: boolean;
  onOpenChange: () => void;
  slot: ExtendedSlot | null;
};

export default function CourseModal({
  isOpen,
  onOpenChange,
  slot,
}: CourseDialogProps) {
  if (!slot) return null;

  const { course, color } = slot;

  if (!course) return null;

  const isMobile = useIsMobile();
  const complementaryColor = getContrastingShade(parseHexColor(color));

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent
          //side="bottom"
          className="h-auto max-h-4/5 min-h-3/5"
        >
          <DrawerHeader>
            <DrawerTitle>{course.name}</DrawerTitle>
            <div className="text-muted-foreground mt-1 mb-2 flex flex-row items-center space-x-2 text-sm">
              {course.code && (
                <p
                  className="min-w-fit rounded-sm px-2 py-px font-medium"
                  style={{
                    backgroundColor: color,
                    color: complementaryColor,
                  }}
                >
                  {course.code}
                </p>
              )}
              <p className="min-w-fit rounded-md py-px">
                {course.credits} créditos
              </p>
            </div>
            <DrawerDescription>{course.description}</DrawerDescription>
          </DrawerHeader>

          <ul>
            <h4></h4>
            {course.subsequentIds.map((s) => (
              <li key={s}>s</li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course.name}</DialogTitle>
          <div className="text-muted-foreground mt-1 flex flex-row items-center space-x-2 text-sm">
            {course.code && (
              <p
                className="min-w-fit rounded-sm px-2 py-px font-medium"
                style={{
                  backgroundColor: color,
                  color: complementaryColor,
                }}
              >
                {course.code}
              </p>
            )}
            <p className="min-w-fit rounded-md py-px">
              {course.credits} créditos
            </p>
          </div>
          <DialogDescription>{course.description}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
