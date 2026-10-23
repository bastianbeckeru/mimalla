import { cn } from "cn";
import { HeartIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { version } from "../../package.json";

export default function Footer({
  className,
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("border-t", className)}>
      <div className="mx-auto flex max-w-300 flex-col items-center justify-between gap-x-6 gap-y-1.5 px-4 pt-6 pb-8 text-center text-muted-foreground text-sm sm:flex-row sm:flex-wrap sm:gap-y-3 sm:px-6 sm:py-7 sm:text-left">
        <p>
          Desarrollado con{" "}
          <HeartIcon
            aria-label="amor"
            className="inline size-3.5 fill-current align-[-2px] text-destructive"
          />
          , por estudiantes para estudiantes.
        </p>

        <div className="flex items-center gap-4">
          <ThemeToggle variant="icon" className="size-10 rounded-xl" />
          <span>v{version}</span>
        </div>
      </div>
    </footer>
  );
}
