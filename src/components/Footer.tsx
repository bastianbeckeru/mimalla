import { cn } from "@/lib/utils";
/* import ModeToggle from "./ModeToggle"; */

import { Kanban } from "lucide-react";
import DiscordIcon from "./icons/DiscordIcon";

export default function Footer({
  className,
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn(className)}>
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Kanban className="size-5" />
          <p className="text-center text-sm leading-loose md:text-left">
            Desarrollado con ❤️, de un estudiante para estudiantes.
          </p>
        </div>

        <div className="flex flex-row items-center gap-4">
          <a
            aria-label="Discord"
            target="_blank"
            rel="noreferrer"
            href="https://discord.gg/wez3cJDzXk"
            className="flex items-center justify-center"
          >
            <DiscordIcon className="size-5 transition-colors hover:text-muted-foreground" />
          </a>
          {/* <ModeToggle /> */}
        </div>
      </div>
    </footer>
  );
}

/*
{" "}
  <a
    target="_blank"
    rel="noreferrer"
    href="https://www.linkedin.com/in/bastianaviles"
    className="font-medium underline underline-offset-4"
  >
    un estudiante
  </a>
{" "}
*/
