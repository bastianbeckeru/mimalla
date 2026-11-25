import {
  getAreaShade,
  isHexColor,
  toLowerCaseHexColor,
} from "@/curriculum/colors";
import type { AreaAction, Draft, Handlers } from "@/types/builder";
import type { Area, AreaId } from "@/types/curriculum";

function hasArea(draft: Draft, areaId: AreaId) {
  return draft.curriculum.areas.some((area) => area.id === areaId);
}

function updateArea(
  draft: Draft,
  areaId: AreaId,
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
  addArea: (draft, { id, name }) => {
    const { curriculum } = draft;
    const area = {
      id,
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
