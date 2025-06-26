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
    <header className={cn("z-10 px-4 lg:px-0", className)}>
      <nav className="flex h-16 items-center justify-between py-4">
        <Logo />
        <Searchbar />
      </nav>
    </header>
  );
}
