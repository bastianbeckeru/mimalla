import { useState, type ReactNode } from "react";
import type { GradeProps } from "@/types/user";
import { useCurriculumStore } from "@/stores/curriculum";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";

type Props = {
  enrollmentId: number;
  grade: GradeProps;
  children: ReactNode;
};

const formSchema = z.object({
  gradeName: z.string().min(3).max(30),
  gradeValue: z.string().refine((value) => {
    return (
      value === null ||
      value === "" ||
      (typeof value === "string" &&
        parseFloat(value) >= 0 &&
        parseFloat(value) <= 7)
    );
  }),
  gradeWeight: z.string().refine((value) => {
    const numericValue = parseFloat(value);
    return numericValue >= 0 && numericValue <= 100;
  }),
});

export default function Grade({ enrollmentId, grade, children }: Props) {
  const { updateGrade, removeGrade } = useCurriculumStore();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gradeName: grade.name,
      gradeValue: grade.value?.toString(),
      gradeWeight: grade.weight.toString(),
    },
  });

  return (
    <div className="flex flex-col space-y-1">
      {!isEditing ? (
        <div className="flex w-full flex-row items-center justify-between gap-4">
          <p className="w-full">{grade.name}</p>
          <p>{grade.value?.toFixed(1).replace(".", ",")}</p>
          <p>{grade.weight}%</p>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <MoreVertical className="size-4 transition-colors hover:text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 size-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Button
                  variant="destructiveGhost"
                  size="icon"
                  onClick={() =>
                    removeGrade(enrollmentId, {
                      id: grade.id,
                      name: grade.name,
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
        <div className="flex h-9 w-full flex-row items-center gap-2 py-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex w-full flex-row items-end justify-between"
            >
              <div className="flex flex-row gap-2">
                <FormField
                  control={form.control}
                  name="gradeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Nombre"
                          {...field}
                          className="h-9"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {grade.subgrades.length == 0 && (
                  <FormField
                    control={form.control}
                    name="gradeValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="any"
                            placeholder="Nota"
                            className="h-9 w-10"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="gradeWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="any"
                          placeholder="Peso"
                          className="h-9 w-10"
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

      <div className="ml-2 mr-20 flex flex-col">{children}</div>
    </div>
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedGrade = {
      id: grade.id,
      name: values.gradeName.trim(),
      value: parseFloat(values.gradeValue),
      weight: parseFloat(values.gradeWeight),
      excluded: grade.excluded,
    };

    updateGrade(enrollmentId, updatedGrade);

    setIsEditing(false);
    form.reset(values);
  }
}
