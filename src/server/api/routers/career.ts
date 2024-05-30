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
                  courseId: true,
                },
              },
            },
          },
        },
      });

      // Career areas
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
          OR: [
            {
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
            {
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
          ],
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
                where: {
                  enrollments: {
                    some: {
                      period: {
                        curriculumId: curriculum.id,
                      },
                    },
                  },
                },
                select: {
                  code: true,
                  name: true,
                },
              },
              prerequisiteCourses: {
                where: {
                  enrollments: {
                    some: {
                      period: {
                        curriculumId: curriculum.id,
                      },
                    },
                  },
                },
                select: {
                  code: true,
                  name: true,
                },
              },
              prerequisiteCredits: true,
            },
          },
        },
      });

      // Courses without areas
      const coursesWithoutArea = await ctx.db.course.findMany({
        where: {
          areas: {
            none: {},
          },
          enrollments: {
            some: {
              period: {
                curriculumId: curriculum.id,
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
              name: true,
            },
          },
          prerequisiteCourses: {
            select: {
              code: true,
              name: true,
            },
          },
          prerequisiteCredits: true,
        },
      });

      if (coursesWithoutArea.length > 0) {
        const NoArea = {
          name: "none",
          color: "#f1f5f9",
          courses: coursesWithoutArea,
        };
        areas.push(NoArea);
      }

      return { curriculum, areas };
    }),

  getAreas: publicProcedure
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
          id: true,
        },
      });

      // Career areas
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
          OR: [
            {
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
            {
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
          ],
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
                where: {
                  enrollments: {
                    some: {
                      period: {
                        curriculumId: curriculum.id,
                      },
                    },
                  },
                },
                select: {
                  code: true,
                  name: true,
                },
              },
              prerequisiteCourses: {
                where: {
                  enrollments: {
                    some: {
                      period: {
                        curriculumId: curriculum.id,
                      },
                    },
                  },
                },
                select: {
                  code: true,
                  name: true,
                },
              },
              prerequisiteCredits: true,
            },
          },
        },
      });

      // Courses without areas
      const coursesWithoutArea = await ctx.db.course.findMany({
        where: {
          areas: {
            none: {},
          },
          enrollments: {
            some: {
              period: {
                curriculumId: curriculum.id,
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
              name: true,
            },
          },
          prerequisiteCourses: {
            select: {
              code: true,
              name: true,
            },
          },
          prerequisiteCredits: true,
        },
      });

      if (coursesWithoutArea.length > 0) {
        const NoArea = {
          name: "none",
          color: "#f1f5f9",
          courses: coursesWithoutArea,
        };
        areas.push(NoArea);
      }

      return areas;
    }),
});
