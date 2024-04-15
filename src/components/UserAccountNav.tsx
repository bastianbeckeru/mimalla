"use client";

import type { UserProps } from "@/types/user";

import Link from "next/link";
import { signOut } from "next-auth/react";

import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Calendar, Kanban, LogOut, Moon, Sun, User } from "lucide-react";

/* import { useCurriculumStore } from "@/stores/curriculumStore"; */

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  user: UserProps;
}

export function UserAccountNav({ user }: Props) {
  /*   const { reset } = useCurriculumStore(); */
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex size-7 select-none items-center justify-center rounded-full transition-opacity`}
      >
        <Avatar className="h-fit w-fit">
          {user.image ? (
            <AvatarImage alt="Picture" src={user.image} />
          ) : (
            <AvatarFallback>
              <User className="size-4" />
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex select-none items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user?.name && <p className="font-medium">{user?.name}</p>}
            {user?.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user?.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <Kanban className="mr-2 size-4" />
              Malla Curricular
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild disabled>
            <Link href="/user/calendar">
              <Calendar className="mr-2 size-4" />
              Calendario
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            theme == "light" ? setTheme("dark") : setTheme("light");
          }}
        >
          {theme == "light" ? (
            <>
              <Sun className="mr-2 size-4" />
              <span>Modo claro</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 size-4" />
              <span>Modo oscuro</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-0">
          <button
            className="flex h-full w-full items-center rounded-sm p-2 transition-colors hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => {
              /* reset(); */
              void signOut({
                redirect: false,
                callbackUrl: "/",
              });
            }}
          >
            <LogOut className="mr-2 size-4" />
            <span>Cerrar sesión</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
