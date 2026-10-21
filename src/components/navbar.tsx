import { cn } from "cn";
import Logo from "@/components/Logo";
import { Searchbar } from "@/components/search-bar";

type NavbarProps = {
  className?: string;
};

export default function Navbar({ className }: NavbarProps) {
  return (
    <header className={cn("z-10 px-4 lg:px-0", className)}>
      <nav className="flex h-16 items-center justify-between py-4">
        <Logo />
        <Searchbar />
      </nav>
    </header>
  );
}
