import { cn } from "cn";
import DiscordIcon from "@/components/icons/DiscordIcon";

export default function Footer({
  className,
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("px-4 lg:px-0", className)}>
      <div className="flex flex-col items-center justify-between gap-4 py-8 text-muted-foreground md:h-20 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-relaxed md:text-left">
            Desarrollado con ❤️, por{" "}
            <span className="font-medium underline underline-offset-4">
              estudiantes
            </span>{" "}
            para estudiantes.
          </p>
        </div>

        <div className="flex flex-row items-center gap-4">
          <a
            aria-label="Discord"
            target="_blank"
            rel="noreferrer"
            href="https://discord.gg/wez3cJDzXk"
            className="flex items-center justify-center [&>svg]:size-5 [&>svg]:transition-colors [&>svg]:hover:text-foreground"
          >
            <DiscordIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
