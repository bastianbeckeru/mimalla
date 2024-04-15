import { api } from "@/trpc/server";

export default async function UserPage() {
  return (
    <>
      <h1>Authorized</h1>
      <h1 className="font-bold">Gente que quizás conozcas</h1>
      <div className="p-2">Hola</div>
    </>
  );
}
