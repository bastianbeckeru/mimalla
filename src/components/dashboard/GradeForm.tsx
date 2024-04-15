import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { GradeProps } from "@/types/user";
import { useCurriculumStore } from "@/stores/curriculum";

type Props = {
  enrollmentId: number;
  grades: GradeProps[];
};

export default function GradeForm({ enrollmentId, grades }: Props) {
  const [showForm, setShowForm] = useState(false);
  const { addGrade } = useCurriculumStore();

  const formSchema = z.object({
    gradeName: z.string().min(3).max(30),
    gradeValue: z
      .string()
      .optional()
      .refine((value) => {
        return (
          value === undefined ||
          value === "" ||
          (typeof value === "string" &&
            parseFloat(value) >= 0 &&
            parseFloat(value) <= 7)
        );
      }),
    gradeWeight: z
      .string()
      .optional()
      .refine((value) => {
        return (
          value === undefined ||
          value === "" ||
          (typeof value === "string" &&
            parseFloat(value) >= 0 &&
            parseFloat(value) <= 100)
        );
      }),
    gradeGroup: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gradeName: "",
      gradeValue: "",
      gradeWeight: "",
      gradeGroup: "none",
    },
  });

  return (
    <div className="mt-4 flex h-14 w-full items-end">
      {showForm ? (
        <div className="flex w-full flex-row items-end justify-center gap-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex w-full flex-row items-end justify-between gap-2"
            >
              <div className="flex flex-row items-end gap-2">
                <FormField
                  control={form.control}
                  name="gradeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input autoFocus placeholder="Control" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gradeGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anidar</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger
                            aria-label="anidar en otra nota"
                            className="w-26"
                          >
                            <SelectValue placeholder="No anidar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem key="none" value="none">
                              No anidar
                            </SelectItem>
                            {grades.map((grade, gIndex) => {
                              return (
                                <SelectItem
                                  key={gIndex}
                                  value={grade.id.toString()}
                                >
                                  {grade.name}
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gradeValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nota</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          max={7}
                          placeholder="7,0"
                          {...field}
                          className="w-12"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gradeWeight"
                  render={({ field }) => (
                    <FormItem
                      className={`${
                        form.getValues().gradeGroup !== "none" && "hidden"
                      }`}
                    >
                      <FormLabel>Peso</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="any"
                          min={0}
                          max={100}
                          placeholder="20%"
                          className="w-12"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <Button variant="default" type="submit">
                Aceptar
              </Button>
            </form>
          </Form>
          <Button
            variant="secondary"
            onClick={() => {
              setShowForm(false);
              form.reset();
            }}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full border border-foreground/10"
          onClick={() => setShowForm(true)}
        >
          <Plus className="size-4" />
          Añadir nota
        </Button>
      )}
    </div>
  );

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newGrade = {
      name: values.gradeName.trim(),
      value: values.gradeValue ? parseFloat(values.gradeValue) : null,
      weight: values.gradeWeight ? parseFloat(values.gradeWeight) : undefined,
      parentGradeId:
        values.gradeGroup !== "none" ? parseInt(values.gradeGroup) : undefined,
    };

    addGrade(enrollmentId, newGrade);

    setShowForm(false);
    form.reset();
  }
}
