"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCareerAreas } from "./serverFunctions";
import { useCurriculumStore } from "@/stores/curriculum";
import CurriculumDashboard from "./CurriculumDashboard";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { toast } from "../ui/use-toast";
import { Loader2, Menu } from "lucide-react";

export default function View() {
  const router = useRouter();
  const { curriculum, setData, version, updateVersion } = useCurriculumStore();

  const currentVersion = "1.1.1";
  const isUpToDate = version === currentVersion;

  useEffect(() => {
    const delay = setTimeout(() => {
      if (!curriculum) {
        router.push("/dashboard/create");
      }
    }, 2000);
    return () => clearTimeout(delay);
  }, [curriculum, router]);

  if (!curriculum) {
    return (
      <div className="size-screen flex justify-center overflow-hidden">
        <Loader2 className="mt-64 size-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        {/* SIDEBAR on MD devices */}
        <aside className="hidden border-r bg-muted/20 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <Sidebar />
          </div>
        </aside>

        <div className="flex h-full flex-col overflow-hidden">
          <header className="relative flex h-14 items-center justify-center border-b bg-muted/20 pl-12 md:px-6 lg:h-16">
            {/* SIDEBAR on SM devices */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-auto shrink-0 md:hidden"
                >
                  <Menu className="size-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>

            <div
              className={cn(
                "flex flex-col items-center justify-center space-y-px px-2",
                isUpToDate ? "" : "hidden md:flex",
              )}
            >
              <h1 className="font-semibold">{curriculum.career?.name}</h1>
              <p className="text-xs/3 text-muted-foreground">
                {curriculum.career?.faculty.university.name}
              </p>
            </div>

            <Button
              className={cn(
                "absolute right-4 top-auto flex flex-row items-center justify-center bg-emerald-600 text-foreground hover:bg-emerald-500",
                isUpToDate ? "hidden" : "",
              )}
              onClick={async () => {
                if (curriculum.career) {
                  const areas = await getCareerAreas(
                    curriculum.career.siesCode,
                  );
                  console.log("Actualizando...");

                  setData({ curriculum: curriculum, areas: areas });
                  updateVersion(currentVersion);

                  toast({
                    description: (
                      <div className="flex flex-row items-start justify-center space-x-2">
                        <p>✅</p>
                        <p className="font-bold">
                          Se ha actualizado a la versión{" "}
                          <span>{currentVersion}</span> exitosamente.
                        </p>
                      </div>
                    ),
                  });
                }
              }}
            >
              <div className="flex flex-col">
                <p className="text-xs italic">Nueva Versión ✨</p>
                <p className="text-sm font-bold tracking-widest">Actualizar</p>
              </div>
            </Button>
          </header>

          {/* MAIN CONTENT */}
          <ScrollArea className="h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)]">
            <CurriculumDashboard curriculum={curriculum} />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
