import type { PropsWithChildren } from "react";
import { getServerAuthSession } from "@/server/auth";
import { Montserrat } from "next/font/google";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const mont = Montserrat({
  subsets: ["latin"],
});

export default async function MarketingLayout({ children }: PropsWithChildren) {
  return (
    // DELETE THIS DIV AT THE FUTURE
    <div className={`flex h-screen flex-col font-sans ${mont.className}`}>
      <Navbar />
      <main className={`flex flex-1 items-center justify-center scroll-smooth`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

/*  
<>
  <Navbar />
  <main
    className={`flex-1 scroll-smooth font-sans ${mont.className}`}
  >
    {children}
  </main>
  <Footer />
</>
*/
