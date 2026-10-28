"use client";

import { cn } from "cn";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

type ThemeToggleProps = {
  id?: string;
  variant?: "default" | "icon";
  className?: string;
};

export function ThemeToggle({
  id,
  variant = "default",
  className,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isIcon = variant === "icon";
  const handleThemeChange = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <Button
      aria-label="Cambiar tema"
      id={id}
      className={cn(!isIcon && "press-blur min-w-28", className)}
      onClick={handleThemeChange}
      size={isIcon ? "icon" : "default"}
      variant={isIcon ? "ghost" : "outline"}
    >
      <SunIcon className="block dark:hidden" />
      <MoonIcon className="hidden dark:block" />
      <span className={cn(isIcon && "sr-only")}>
        {!isIcon && (
          <>
            <span className="inline dark:hidden">Claro</span>
            <span className="hidden dark:inline">Oscuro</span>
          </>
        )}
      </span>
    </Button>
  );
}
