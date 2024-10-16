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
        "flex flex-row items-center gap-2 px-2 transition-colors hover:text-muted-foreground",
        className,
      )}
    >
      <Kanban className="size-6" />
      <span
        className={cn(
          "hidden text-lg font-medium sm:inline-block",
          alwaysShow && "inline-block",
        )}
      >
        Mi Malla
      </span>
    </Link>
  );
}
