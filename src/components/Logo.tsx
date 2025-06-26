import Link from "next/link";
import { cn } from "@/lib/utils";
import { Kanban } from "lucide-react";

type LogoProps = {
  alwaysShow?: boolean;
  className?: string;
};

export default function Logo({ alwaysShow = false, className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "hover:text-muted-foreground flex flex-row items-center gap-2 pr-2 transition-colors",
        className,
      )}
    >
      <Kanban className="size-6" />
      <span
        className={cn(
          "hidden text-lg font-semibold sm:inline-block",
          alwaysShow && "inline-block",
        )}
      >
        Mi Malla
      </span>
    </Link>
  );
}
