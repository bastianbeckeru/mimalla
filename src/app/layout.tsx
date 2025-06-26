import "@/styles/globals.css";

import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";

import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  creator: "Jnkyns",
  authors: [{ name: "Jnkyns", url: "" }],
  title: "Mi Malla",
  description:
    "Personalíza tu malla curricular a tu pinta y lleva registro de tu progreso. La flexibilidad está en tus manos.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  keywords: [
    "malla curricular",
    "malla universitaria",
    "plan de estudios",
    "personalizar malla",
    "seguimiento académico",
    "organización de cursos",
    "universidad",
    "progreso académico",
  ],
  openGraph: {
    title: "Mi Malla - Toma el Control de tu Malla.",
    description:
      "Personalíza tu malla curricular a tu pinta y lleva registro de tu progreso. La flexibilidad está en tus manos.",
    url: "https://mimalla.vercel.app",
  },
};

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800"], // base, medium, semi-bold, bold, extra-bold
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("font-sans", montserrat.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
