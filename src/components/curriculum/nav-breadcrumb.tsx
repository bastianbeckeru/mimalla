import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Logo from "../Logo";
import { Slash } from "lucide-react";

type NavigationProps = {
  institution: {
    name: string;
    acronym: string;
  };
  program: {
    name: string;
  };
};

export function NavigationBreadcrumb({
  institution,
  program,
}: NavigationProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-lg">
        <BreadcrumbItem className="hover:text-foreground">
          <Logo />
        </BreadcrumbItem>
        <BreadcrumbSeparator className="[&>svg]:size-6">
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbEllipsis className="size-4 sm:hidden" />
          <BreadcrumbLink
            href={`/${institution.acronym.toLowerCase()}`}
            className="hidden sm:inline-block"
          >
            {institution.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="[&>svg]:size-6">
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold">
            {program.name}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
