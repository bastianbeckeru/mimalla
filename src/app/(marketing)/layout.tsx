import Link from "next/link";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] gap-y-4">
      <Navbar className="mx-auto w-full max-w-310 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="bg-card hover:bg-muted inline-flex h-11 items-center rounded-xl border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors sm:h-10 sm:px-4.5"
        >
          Abrir mi malla
        </Link>
      </Navbar>
      {children}
      <Footer className="mt-auto" />
    </div>
  );
}
