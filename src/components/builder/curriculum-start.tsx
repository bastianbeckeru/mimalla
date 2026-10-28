"use client";

import CurriculumSetupForm from "@/components/builder/curriculum-setup-form";
import ImportButton from "@/components/builder/import-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Action, Draft } from "@/types/builder";

export default function CurriculumStart({
  dispatch,
  onStart,
  onLoad,
}: {
  dispatch: (action: Action) => void;
  onStart: () => void;
  onLoad: (draft: Draft) => void;
}) {
  return (
    <Card className="m-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Nueva malla</CardTitle>
        <p className="text-muted-foreground">
          Completa los datos del programa para comenzar a armar su malla.
        </p>
      </CardHeader>
      <CardContent>
        <CurriculumSetupForm
          onSubmit={(termSystem, details) => {
            dispatch({ type: "createCurriculum", termSystem, details });
            onStart();
          }}
        >
          <Button type="submit">Comenzar</Button>
        </CurriculumSetupForm>
      </CardContent>
      <CardFooter className="justify-center gap-2 text-muted-foreground">
        ¿Ya tienes un archivo?
        <ImportButton onLoad={onLoad} />
      </CardFooter>
    </Card>
  );
}
