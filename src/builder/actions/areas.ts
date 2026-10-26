import {
  getAreaShade,
  isHexColor,
  toLowerCaseHexColor,
} from "@/builder/colors";
import type { Area, AreaAction, Draft, Handlers } from "@/types/builder";

function nextAreaId(draft: Draft) {
  return Math.max(0, ...draft.curriculum.areas.map((area) => area.id)) + 1;
}

function hasArea(draft: Draft, areaId: number) {
  return draft.curriculum.areas.some((area) => area.id === areaId);
}

function updateArea(
  draft: Draft,
  areaId: number,
  update: (area: Area) => Area,
): Draft {
  const { curriculum } = draft;
  return {
    ...draft,
    curriculum: {
      ...curriculum,
      areas: curriculum.areas.map((area) =>
        area.id === areaId ? update(area) : area,
      ),
    },
  };
}

export const areaHandlers: Handlers<AreaAction> = {
  addArea: (draft, { name }) => {
    const { curriculum } = draft;
    const area = {
      id: nextAreaId(draft),
      name,
      color: getAreaShade(draft.baseColor, curriculum.areas.length),
    };

    return {
      ...draft,
      curriculum: { ...curriculum, areas: [...curriculum.areas, area] },
    };
  },

  editArea: (draft, { areaId, changes }) =>
    updateArea(draft, areaId, (area) => ({ ...area, ...changes })),

  deleteArea: (draft, { areaId }) => {
    const { curriculum } = draft;
    return {
      ...draft,
      handColoredAreaIds: draft.handColoredAreaIds.filter(
        (id) => id !== areaId,
      ),
      curriculum: {
        ...curriculum,
        areas: curriculum.areas.filter((area) => area.id !== areaId),
        courses: curriculum.courses.map((course) =>
          course.areaId === areaId ? { ...course, areaId: null } : course,
        ),
      },
    };
  },

  setAreaColor: (draft, { areaId, color }) => {
    if (!isHexColor(color) || !hasArea(draft, areaId)) return draft;

    const colored = updateArea(draft, areaId, (area) => ({
      ...area,
      color: toLowerCaseHexColor(color),
    }));
    return {
      ...colored,
      handColoredAreaIds: [
        ...draft.handColoredAreaIds.filter((id) => id !== areaId),
        areaId,
      ],
    };
  },

  setBaseColor: (draft, { color }) => {
    if (!isHexColor(color)) return draft;

    const baseColor = toLowerCaseHexColor(color);
    const { curriculum } = draft;
    return {
      ...draft,
      baseColor,
      curriculum: {
        ...curriculum,
        areas: curriculum.areas.map((area, index) =>
          draft.handColoredAreaIds.includes(area.id)
            ? area
            : { ...area, color: getAreaShade(baseColor, index) },
        ),
      },
    };
  },

  assignArea: (draft, { courseId, areaId }) => {
    if (areaId !== null && !hasArea(draft, areaId)) return draft;

    const { curriculum } = draft;
    return {
      ...draft,
      curriculum: {
        ...curriculum,
        courses: curriculum.courses.map((course) =>
          course.id === courseId ? { ...course, areaId } : course,
        ),
      },
    };
  },
};
