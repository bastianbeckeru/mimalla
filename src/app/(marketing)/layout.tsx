import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-16 grid min-h-dvh grid-rows-[auto_1fr_auto]">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
