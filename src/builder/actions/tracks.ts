import type { Draft, Handlers, Track, TrackAction } from "@/types/builder";

function nextTrackId(draft: Draft) {
  return Math.max(0, ...draft.curriculum.tracks.map((track) => track.id)) + 1;
}

function hasTrack(draft: Draft, trackId: number) {
  return draft.curriculum.tracks.some((track) => track.id === trackId);
}

export const trackHandlers: Handlers<TrackAction> = {
  addTrack: (draft, { name }) => {
    const { curriculum } = draft;
    const track: Track = { id: nextTrackId(draft), name, credentialType: null };
    return {
      ...draft,
      curriculum: { ...curriculum, tracks: [...curriculum.tracks, track] },
    };
  },

  editTrack: (draft, { trackId, changes }) => {
    const { curriculum } = draft;
    return {
      ...draft,
      curriculum: {
        ...curriculum,
        tracks: curriculum.tracks.map((track) =>
          track.id === trackId ? { ...track, ...changes } : track,
        ),
      },
    };
  },

  deleteTrack: (draft, { trackId }) => {
    const { curriculum } = draft;
    return {
      ...draft,
      curriculum: {
        ...curriculum,
        tracks: curriculum.tracks.filter((track) => track.id !== trackId),
        courses: curriculum.courses.map((course) =>
          course.trackIds.includes(trackId)
            ? {
                ...course,
                trackIds: course.trackIds.filter((id) => id !== trackId),
              }
            : course,
        ),
      },
    };
  },

  assignTracks: (draft, { courseId, trackIds }) => {
    const { curriculum } = draft;
    const assigned = [
      ...new Set(trackIds.filter((trackId) => hasTrack(draft, trackId))),
    ].toSorted((a, b) => a - b);
    return {
      ...draft,
      curriculum: {
        ...curriculum,
        courses: curriculum.courses.map((course) =>
          course.id === courseId ? { ...course, trackIds: assigned } : course,
        ),
      },
    };
  },
};
