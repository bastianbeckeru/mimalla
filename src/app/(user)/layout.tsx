import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";

interface UserLayoutProps {
  children: React.ReactNode;
}

export default async function UserLayout({ children }: UserLayoutProps) {
  const session = await getServerAuthSession();

  if (!session) {
    console.log("Not logged in.");
    console.log("Redirecting...");
    redirect("/login");
  }
  return <div className="min-h-screen">{children}</div>;
}
