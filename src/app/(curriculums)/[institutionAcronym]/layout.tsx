import type { PropsWithChildren } from 'react';

import fs from 'fs';
import path from 'path';
import Navbar from '@/components/navbar';

export const dynamicParams = false;
export async function generateStaticParams() {
  const curriculumsDir = path.join(
    process.cwd(),
    'src',
    'server',
    'db',
    'curriculums'
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
  params: Promise<{
    institutionAcronym: string;
  }>;
};

export default function InstitutionLayout({
  children,
}: InstitutionParams & PropsWithChildren) {
  return (
    <div className='grid min-h-dvh w-dvw grid-rows-[auto_1fr] lg:px-16'>
      <Navbar className='' />
      <main className='flex-1 overflow-hidden py-0 lg:py-4'>{children}</main>
    </div>
  );
}
