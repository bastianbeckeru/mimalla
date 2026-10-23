import { cn } from "cn";
import { Figtree } from "next/font/google";
import Link from "next/link";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        figtree.variable,
        "grid min-h-dvh grid-rows-[auto_1fr_auto] gap-y-4 font-sans [--font-heading:var(--font-figtree)] [--font-sans:var(--font-figtree)]",
      )}
    >
      <Navbar className="mx-auto w-full max-w-310 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center whitespace-nowrap rounded-xl border bg-card px-3.5 font-semibold text-sm transition-colors hover:bg-muted sm:h-10 sm:px-4.5"
        >
          Abrir mi malla
        </Link>
      </Navbar>
      {children}
      <Footer className="mt-auto" />
    </div>
  );
}
