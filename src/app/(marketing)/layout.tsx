import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
