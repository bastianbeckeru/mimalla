import { zodResolver } from "@hookform/resolvers/zod";
import { Select } from "@radix-ui/react-select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { Button } from "../ui/button";
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useCurriculumStore } from "@/stores/curriculum";

const formSchema = z.object({
  area: z.number(),
  courseId: z.number(),
});

type Props = {
  pId: number;
  pIndex: number;
};

export default function CourseForm({ pId, pIndex }: Props) {
  const { areas } = useCurriculumStore();

  /* Form */
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      area: undefined,
      courseId: undefined,
    },
  });

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onAddCourse)} className="grid gap-1">
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(+value);
                      if (form.getValues().courseId !== undefined)
                        form.resetField("courseId");
                    }}
                  >
                    <SelectTrigger
                      aria-label="seleccionar área"
                      className="w-full"
                    >
                      <SelectValue placeholder="Selecciona un área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Áreas</SelectLabel>
                        {areas?.map((area, aIndex) => (
                          <SelectItem key={aIndex} value={aIndex.toString()}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select
                    disabled={form.getValues().area === undefined}
                    value={
                      form.getValues().courseId !== undefined
                        ? form.getValues().courseId.toString()
                        : ""
                    }
                    onValueChange={(value) => field.onChange(+value)}
                  >
                    <SelectTrigger
                      aria-label="seleccionar curso"
                      className="w-full"
                    >
                      <SelectValue placeholder="Selecciona un curso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Carreras</SelectLabel>
                        {areas
                          ? areas[form.getValues("area")]?.courses.map(
                              (course) => (
                                <SelectItem
                                  key={course.id}
                                  value={course.id.toString()}
                                >
                                  {course.name}
                                </SelectItem>
                              ),
                            )
                          : null}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            aria-label="crear malla predefinida"
            variant="outline"
            className="mt-1 h-11 w-full"
            type="submit"
            onClick={() => console.log(areas)}
          >
            Importar curso ✨
          </Button>
        </form>
      </Form>
    </>
  );

  function onAddCourse(values: z.infer<typeof formSchema>) {
    console.log("Adding course...", values);
    console.log(pIndex);
  }
}
