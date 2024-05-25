"use client";

import { useEffect } from "react";
import { useCurriculumStore } from "@/stores/curriculum";
import CurriculumDashboard from "./CurriculumDashboard";

import { Button } from "../ui/button";
import { Kanban, Loader2, Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

export default function View() {
  const router = useRouter();
  const { curriculum, areas, setData, version, updateVersion } =
    useCurriculumStore();

  const currentVersion = "1.1.1";
  const isUpToDate = version === currentVersion;

  const getCareerAreas = api.career.getAreas.useQuery(
    { siesCode: curriculum?.career.siesCode },
    {
      enabled: false,
      refetchInterval: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (getCareerAreas.isSuccess &&
      getCareerAreas.data) {
        setData({ curriculum: curriculum, areas: getCareerAreas.data });
        updateVersion(currentVersion);
    }

    const delay = setTimeout(() => {
      if (!curriculum) {
        router.push("/dashboard/create");
      }
    }, 3000);
    return () => clearTimeout(delay);
  }, [curriculum, router, getCareerAreas]);

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
        <aside className="hidden border-r bg-muted/20 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            {/* LOGO */}
            <div className="flex h-14 items-center justify-start border-b px-4 lg:h-16">
              <Link href="/" className="flex items-center gap-2">
                <Kanban className="size-6" />
                <span className="text-lg font-medium">Mi Malla</span>
              </Link>
            </div>
            <Sidebar />
          </div>
        </aside>

        <div className="flex h-full flex-col overflow-hidden">
          <header className="relative flex h-14 items-center gap-4 border-b bg-muted/20 px-4 md:justify-center lg:h-16 lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="size-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col p-4">
                <div className="h-10 border-b pl-2 pr-8">
                  <Link href="/" className="flex flex-row items-center gap-2">
                    <Kanban className="size-6" />
                    <span className="text-lg font-medium">Mi Malla</span>
                  </Link>
                </div>
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
                "absolute right-4 top-auto flex flex-col bg-emerald-600 text-foreground",
                isUpToDate ? "hidden" : "",
              )}
              onClick={() => {
                if(!getCareerAreas.isLoading){
                  getCareerAreas.refetch();
                }
              }}
            >
              <p className="text-xs">Nueva Versión</p>
              Actualizar ✨
            </Button>
          </header>
          <ScrollArea className="h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)]">
            <CurriculumDashboard curriculum={curriculum} />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
