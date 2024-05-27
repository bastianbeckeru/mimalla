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
  creator: "Jnkyns",
  authors: [{ name: "Jnkyns", url: "" }],
  title: "Mi Malla",
  description:
    "Personalíza tu malla curricular a tu pinta y lleva registro de tu progreso. La flexibilidad está en tus manos.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  keywords: [
    "mi malla",
    "mi malla curricular",
    "mi malla universitaria",
    "mi malla universidad",
    "mi malla udp",
    "mi malla app",
    "mi malla app universitaria",
    "mi malla app universidad",
    "mi malla app udp",
    "malla universitaria",
    "malla curricular",
    "malla curricular universitaria",
    "malla curricular interactiva",
    "app mi malla",
    "app malla curricular",
    "app universitaria",
    "app universitaria malla curricular",
    "herramienta universitaria",
    "organizar cursos",
    "organizar ramos",
    "gestión de cursos",
    "gestión de ramos",
    "planificar estudios",
    "progreso académico",
    "carrera universitaria",
    "seguimiento académico",
    "planificación de carrera",
    "planificación académica",
    "administrar cursos",
    "administrar ramos",
    "programa de estudios",
    "personalizar malla curricular",
    "personalizar mi malla",
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
