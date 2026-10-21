import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] lg:mx-16">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
