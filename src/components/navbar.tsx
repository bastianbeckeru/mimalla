import { cn } from "cn";
import Logo from "@/components/Logo";
import { Searchbar } from "@/components/search-bar";
import { getCatalog } from "@/server/db/curriculums";

type NavbarProps = {
  className?: string;
  children?: React.ReactNode;
};

export default function Navbar({ className, children }: NavbarProps) {
  return (
    <header className={cn("z-10 px-4 lg:px-0", className)}>
      <nav className="flex h-16 items-center justify-between py-4">
        <Logo alwaysShow />
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Searchbar catalog={getCatalog()} />
          {children}
        </div>
      </nav>
    </header>
  );
}
