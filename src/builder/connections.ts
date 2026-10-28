import { findCourse } from "@/builder/draft";
import { getMisplacedPrerequisiteIds } from "@/builder/prerequisites";
import type { Box } from "@/builder/routing";
import type { Curriculum } from "@/types/builder";

// A card is one slot of a course as the grid lays it out.
export type ConnectionCard = Box & { id: string; courseId: number };

// Seen from the focused course: its prerequisites lead into it, and it leads
// into its successors.
export type ConnectionKind = "prerequisite" | "successor";

export type Connection = {
  id: string;
  kind: ConnectionKind;
  isMisplaced: boolean;
  from: ConnectionCard;
  to: ConnectionCard;
};

// How a course stands toward the focused course.
export type ConnectionRole = "focused" | "related" | "misplaced" | "unrelated";

function getEnd(card: ConnectionCard) {
  return card.column + card.duration - 1;
}

// Links a prerequisite to one card of the course that requires it, from the
// prerequisite's card that ends closest before it. When none ends before it,
// the prerequisite is misplaced and the link comes from its nearest card.
function connect(
  cards: ConnectionCard[],
  prerequisiteId: number,
  to: ConnectionCard,
  kind: ConnectionKind,
): Connection | null {
  const candidates = cards.filter((card) => card.courseId === prerequisiteId);
  const earlier = candidates.filter((card) => getEnd(card) < to.column);
  const from =
    earlier.length > 0
      ? earlier.reduce((best, card) =>
          getEnd(card) > getEnd(best) ? card : best,
        )
      : candidates.reduce<ConnectionCard | undefined>(
          (best, card) =>
            !best ||
            Math.abs(card.column - to.column) <
              Math.abs(best.column - to.column)
              ? card
              : best,
          undefined,
        );
  if (!from) return null;
  return {
    id: `${from.id}->${to.id}`,
    kind,
    isMisplaced: earlier.length === 0,
    from,
    to,
  };
}

// The prerequisites and successors of a course, linked to each of its cards
// and theirs. A link is the same whichever end is focused.
export function getConnections(
  curriculum: Curriculum,
  cards: ConnectionCard[],
  courseId: number,
): Connection[] {
  const course = findCourse(curriculum, courseId);
  if (!course) return [];
  const cardsOf = (id: number) => cards.filter((card) => card.courseId === id);

  const prerequisites = cardsOf(courseId).flatMap((card) =>
    course.prerequisiteIds.map((id) =>
      connect(cards, id, card, "prerequisite"),
    ),
  );
  const successors = curriculum.courses
    .filter((successor) => successor.prerequisiteIds.includes(courseId))
    .flatMap((successor) =>
      cardsOf(successor.id).map((card) =>
        connect(cards, courseId, card, "successor"),
      ),
    );
  return [...prerequisites, ...successors].filter(
    (connection) => connection !== null,
  );
}

export function getConnectionRole(
  curriculum: Curriculum,
  focusedCourseId: number | null,
  courseId: number,
): ConnectionRole | null {
  if (focusedCourseId === null) return null;
  const focused = findCourse(curriculum, focusedCourseId);
  if (!focused) return null;
  if (courseId === focusedCourseId) return "focused";

  if (focused.prerequisiteIds.includes(courseId))
    return getMisplacedPrerequisiteIds(curriculum, focusedCourseId).includes(
      courseId,
    )
      ? "misplaced"
      : "related";
  if (
    findCourse(curriculum, courseId)?.prerequisiteIds.includes(focusedCourseId)
  )
    return getMisplacedPrerequisiteIds(curriculum, courseId).includes(
      focusedCourseId,
    )
      ? "misplaced"
      : "related";
  return "unrelated";
}
