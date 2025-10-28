import { ModifiedCourse } from "@/types/curriculum";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SlotExtended } from "@/utils/curriculum-grid";
import { getContrastingShade, hexToRgba, parseHexColor } from "@/utils/colors";

type CourseDialogProps = {
  isOpen: boolean;
  onOpenChange: () => void;
  slot: SlotExtended | null;
};

export default function CourseDialog({
  isOpen,
  onOpenChange,
  slot,
}: CourseDialogProps) {
  if (!slot) return null;

  const { course, color } = slot;

  if (!course) return null;

  const complementaryColor = getContrastingShade(parseHexColor(color));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course.name}</DialogTitle>
          <div className="text-muted-foreground mt-1 flex flex-row items-center space-x-2 text-sm">
            {course.code && (
              <p
                className="text-background min-w-fit rounded-sm px-2 py-px"
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
