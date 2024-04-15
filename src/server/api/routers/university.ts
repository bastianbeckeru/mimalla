import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const universityRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.university.findMany({
      include: {
        faculties: {
          orderBy: {
            id: "asc",
          },
          where: {
            id: 1,
          },
          include: {
            careers: {
              orderBy: {
                demreCode: "asc",
              },
            },
          },
        },
      },
    });
  }),

  getFaculties: publicProcedure.query(({ ctx }) => {
    return ctx.db.faculty.findMany({
      orderBy: {
        id: "asc",
      },
      where: {
        university: {
          acronym: "UDP",
        },
      },
      select: {
        name: true,
        careers: {
          orderBy: {
            demreCode: "asc",
          },
          select: {
            name: true,
            siesCode: true,
          },
        },
      },
    });
  }),

  getCareers: publicProcedure.query(({ ctx }) => {
    return ctx.db.career.findMany({
      where: {
        faculty: {
          university: {
            acronym: "UDP",
          },
        },
        curriculum: {
          some: {
            id: {
              not: undefined,
            },
          },
        },
        NOT: {
          name: {
            contains: "Psicología",
          },
        },
      },
    });
  }),
});
