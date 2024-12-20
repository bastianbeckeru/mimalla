import { cn } from "@/lib/utils";
import Logo from "./Logo";
import { Searchbar } from "./search-bar";

//import { useSession } from "next-auth/react";

type NavbarProps = {
  className?: string;
};

export default function Navbar({ className }: NavbarProps) {
  //const { data: session } = useSession();

  return (
    <header className={cn("container z-10 h-16 py-4", className)}>
      <nav className="flex items-center justify-between">
        <Logo />
        <Searchbar />
      </nav>
    </header>
  );
}
