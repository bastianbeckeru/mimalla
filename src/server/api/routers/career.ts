import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const careerRouter = createTRPCRouter({
  getCurriculum: publicProcedure
    .input(
      z.object({
        siesCode: z.string(),
        //year: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const curriculum = await ctx.db.curriculum.findFirstOrThrow({
        where: { careerId: input.siesCode },
        select: {
          career: {
            select: {
              siesCode: true,
              name: true,
              faculty: {
                select: { name: true, university: { select: { name: true } } },
              },
            },
          },
          id: true,
          startedAt: true,
          updatedAt: true,
          periods: {
            orderBy: {
              position: "asc",
            },
            select: {
              id: true,
              enrollments: {
                orderBy: {
                  position: "asc",
                },
                select: {
                  id: true,
                  position: true,
                  mutable: true,
                  status: true,
                  grades: {
                    select: {
                      id: true,
                      name: true,
                      value: true,
                      weight: true,
                      excluded: true,
                      subgrades: {
                        select: {
                          id: true,
                          name: true,
                          value: true,
                          excluded: true,
                        },
                      },
                    },
                  },
                  course: {
                    where: {
                      areas: {
                        none: {},
                      },
                    },
                    select: {
                      id: true,
                      name: true,
                      code: true,
                      credits: true,
                      dependentCourses: {
                        select: {
                          code: true,
                        },
                      },
                      prerequisiteCourses: {
                        select: {
                          code: true,
                        },
                      },
                    },
                  },
                  courseId: true,
                },
              },
            },
          },
        },
      });

      const areas = await ctx.db.area.findMany({
        orderBy: [
          {
            name: "asc",
          },
          {
            color: "asc",
          },
        ],
        where: {
          faculty: {
            careers: {
              some: {
                curriculum: {
                  some: {
                    id: curriculum.id,
                  },
                },
              },
            },
          },
          AND: {
            courses: {
              some: {
                enrollments: {
                  some: {
                    period: {
                      curriculumId: curriculum.id,
                    },
                  },
                },
              },
            },
          },
        },
        select: {
          name: true,
          color: true,
          courses: {
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
              dependentCourses: {
                select: {
                  code: true,
                },
              },
              prerequisiteCourses: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      });

      const egArea = await ctx.db.area.findFirst({
        where: {
          courses: {
            some: {
              enrollments: {
                some: {
                  period: {
                    curriculumId: curriculum.id,
                  },
                },
              },
            },
          },
          NOT: {
            faculty: {
              careers: {
                some: {
                  curriculum: {
                    some: {
                      id: curriculum.id,
                    },
                  },
                },
              },
            },
          },
        },
        select: {
          name: true,
          color: true,
          courses: {
            where: {
              NOT: {
                areas: {
                  some: {
                    faculty: {
                      careers: {
                        some: {
                          curriculum: {
                            some: {
                              id: curriculum.id,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            select: {
              id: true,
              name: true,
              code: true,
              credits: true,
              dependentCourses: {
                select: {
                  code: true,
                },
              },
              prerequisiteCourses: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      });

      if (egArea != null) {
        areas.push(egArea);
      }

      return { curriculum, areas };
    }),
});
