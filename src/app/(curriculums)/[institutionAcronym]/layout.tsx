import fs from "fs";
import path from "path";

import Navbar from "@/components/navbar";

export const dynamicParams = false;

export async function generateStaticParams() {
  const curriculumsDir = path.join(
    process.cwd(),
    "src",
    "server",
    "db",
    "curriculums",
  );

  const institutions = fs
    .readdirSync(curriculumsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  return institutions.map((institution) => ({
    institutionAcronym: institution,
  }));
}

export type InstitutionParams = {
  params: {
    institutionAcronym: string;
  };
};

export default function InstitutionLayout({
  children,
}: InstitutionParams & { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr]">
      <Navbar className="h-16 py-4" />
      {/*       <div className="absolute inset-0 z-[-10] bg-[linear-gradient(to_right,#8080801e_1px,transparent_1px),linear-gradient(to_bottom,#8080801e_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,#4f4f4f1e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1e_1px,transparent_1px)]" /> */}
      {children}
    </div>
  );
}
