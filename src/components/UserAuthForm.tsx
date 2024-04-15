"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import GoogleIcon from "./icons/GoogleIcon";

export function UserAuthForm() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <div className="grid gap-6">
      <Button
        variant="outline"
        disabled={isLoading}
        onClick={() => {
          setIsLoading(true);
          void signIn("google");
        }}
      >
        {isLoading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <>
            <GoogleIcon className="mr-2 size-4" />
          </>
        )}
        Continuar con Google
      </Button>
    </div>
  );
}
