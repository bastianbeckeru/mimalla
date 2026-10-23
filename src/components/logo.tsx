import { cn } from "cn";
import Link from "next/link";

type LogoProps = {
  alwaysShow?: boolean;
  className?: string;
};

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-6", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={3.2}
      strokeLinecap="round"
    >
      <path d="M10.5 10V21.5M16 10V15M21.5 10V18.5" />
    </svg>
  );
}

export default function Logo({ alwaysShow = false, className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex flex-row items-center gap-2 pr-2 transition-colors hover:text-muted-foreground",
        className,
      )}
    >
      <LogoMark className="size-8" />
      <span
        className={cn(
          "hidden font-semibold text-lg sm:inline-block",
          alwaysShow && "inline-block",
        )}
      >
        Mi Malla
      </span>
    </Link>
  );
}
