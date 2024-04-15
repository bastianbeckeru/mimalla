import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input } from "../ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, EyeOff, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useCurriculumStore } from "@/stores/curriculum";
import type { SubgradeProps } from "@/types/user";

type Props = {
  enrollmentId: number;
  gradeId: number;
  subgrade: SubgradeProps;
};

const formSchema = z.object({
  subgradeName: z.string().min(3).max(30),
  subgradeValue: z.string().refine((value) => {
    return (
      value === null ||
      value === "" ||
      (typeof value === "string" &&
        parseFloat(value) >= 0 &&
        parseFloat(value) <= 7)
    );
  }),
});

export default function Subgrade({ enrollmentId, gradeId, subgrade }: Props) {
  const { updateGrade, removeGrade } = useCurriculumStore();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subgradeName: subgrade.name,
      subgradeValue: subgrade.value?.toString(),
    },
  });

  return (
    <>
      {!isEditing ? (
        <div
          className={`flex w-full flex-row items-center space-x-4 text-sm ${
            subgrade.excluded && "text-muted-foreground"
          }`}
        >
          <div className="h-full w-px bg-foreground"></div>

          <p className="w-full">{subgrade.name}</p>
          <p>{subgrade.value?.toFixed(1).replace(".", ",")}</p>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <MoreVertical className="size-4 transition-colors hover:text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-32">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() =>
                    updateGrade(enrollmentId, {
                      ...subgrade,
                      excluded: !subgrade.excluded,
                      parentGradeId: gradeId,
                    })
                  }
                >
                  {subgrade.excluded ? (
                    <>
                      <Eye className="mr-2 size-4" />
                      <span>Incluir</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-2 size-4" />
                      <span>Excluir</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 size-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Button
                  aria-label="Remover nota anidada"
                  variant="destructiveGhost"
                  size="icon"
                  onClick={() =>
                    removeGrade(enrollmentId, {
                      id: subgrade.id,
                      name: subgrade.name,
                      parentGradeId: gradeId,
                    })
                  }
                >
                  <Trash2 className="mr-2 size-4" />
                  <span>Remover</span>
                </Button>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex h-9 w-full flex-row items-center space-x-2">
          <div className="h-full w-px bg-foreground"></div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex w-full flex-row items-end justify-between"
            >
              <div className="flex flex-row gap-2">
                <FormField
                  control={form.control}
                  name="subgradeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nombre"
                          className="h-9"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subgradeValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nota"
                          className="h-9 w-12"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <Button variant="default" size="sm" type="submit">
                Aceptar
              </Button>
            </form>
          </Form>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsEditing(false);
              form.reset();
            }}
          >
            Cancelar
          </Button>
        </div>
      )}
    </>
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedSubgrade = {
      id: subgrade.id,
      name: values.subgradeName.trim(),
      value: parseFloat(values.subgradeValue),
      excluded: subgrade.excluded,
      parentGradeId: gradeId,
    };

    updateGrade(enrollmentId, updatedSubgrade);

    setIsEditing(false);
    form.reset(values);
  }
}
