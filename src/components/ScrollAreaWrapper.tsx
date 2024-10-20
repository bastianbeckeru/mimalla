import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

type ScrollAreaWrapperProps = {
  className?: string;
  children: React.ReactNode;
};

export default function ScrollAreaWrapper({
  className,
  children,
}: ScrollAreaWrapperProps) {
  return (
    <ScrollArea className={cn(className)}>
      {children}
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
