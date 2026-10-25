import type { Metadata } from "next";
import Builder from "@/components/builder/builder";

export const metadata: Metadata = {
  title: "Constructor de mallas | Mi Malla",
};

export default function BuilderPage() {
  return <Builder />;
}
