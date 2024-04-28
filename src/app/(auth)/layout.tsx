import { redirect } from "next/navigation";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  if (true) {
    redirect("/");
  }

  return <div className="min-h-screen">{children}</div>;
}
