import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type ScrollAreaWrapperProps = {
  className?: string;
  children: React.ReactNode;
};

export default function ScrollAreaWrapper({
  className,
  children,
}: ScrollAreaWrapperProps) {
  return (
    <ScrollArea className={className}>
      {children}
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
