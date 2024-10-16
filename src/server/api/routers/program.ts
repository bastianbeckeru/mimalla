import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
//import { institutions } from "@/server/db/schema";

export const programRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      const program = await ctx.db.query.programs.findFirst({
        where: (program, { and, eq }) => and(eq(program.name, input.name)),
      });

      return program ?? null;
    }),
});
