import "@/styles/globals.css";
import { Montserrat } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const mont = Montserrat({
  subsets: ["latin"],
});

export const metadata = {
  title: "Mi Malla",
  description: "Personaliza tu malla y visualiza tu progreso.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  keywords: ["Malla Interactiva", "Universidad", "Herramienta Universitaria"],
  creator: "Jnkyns",
  authors: [{ name: "Jnkyns", url: "" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`font-sans ${mont.className}`}>
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <SpeedInsights />
            <Analytics />
            <Toaster />
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
