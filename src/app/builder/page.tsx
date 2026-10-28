import type { Metadata } from "next";
import Builder from "@/components/builder/builder";

export const metadata: Metadata = {
  title: "Constructor | Mi Malla",
};

export default function BuilderPage() {
  return <Builder />;
}
