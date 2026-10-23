import "@/styles/globals.css";

import { Analytics } from "@vercel/analytics/next";
import { cn } from "cn";
import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";

const montserratHeading = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("font-sans", inter.variable, montserratHeading.variable)}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
