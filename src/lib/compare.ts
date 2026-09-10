import type { Workout } from '@/types'
import { MUSCLE_GROUPS, findSlot, groupOf, type MuscleGroup, type RoutineDay } from './routine'
import { PEOPLE, type Person } from './people'
import { getWorkoutsFor } from './workouts'
import { epley } from './stats'

/**
 * Comparing people fairly.
 *
 * Absolute load is not comparable: whoever is strongest would always look like
 * they are doing best, which says nothing about who is actually improving. So
 * everyone is measured against their own starting point instead - each lift's
 * progress is a ratio of their latest performance to their first, and a ratio of
 * 1.15 means the same "up 15%" whether it came off 40 kg or 140 kg.
 *
 * Comparison is by movement pattern rather than by exercise, because two people's
 * routines need not share a single lift. A lift with no group mapped is left out
 * rather than guessed at.
 */

/** Best countable effort in one session: e1RM for loaded lifts, reps for bodyweight. */
function sessionBest(workout: Workout, exerciseId: string, bodyweight: boolean): number | null {
  const entry = workout.exercises.find((e) => e.exerciseId === exerciseId)
  if (!entry) return null

  let best: number | null = null
  for (const set of entry.sets) {
    // Warmups are not recorded as sets at all; drop sets are excluded from PRs
    // and are excluded here for the same reason - they measure fatigue, not progress.
    if (!set.done || set.isDropSet) continue
    if (set.reps === null || set.reps <= 0) continue

    const value = bodyweight ? set.reps : set.weight === null ? null : epley(set.weight, set.reps)
    if (value === null) continue
    if (best === null || value > best) best = value
  }
  return best
}

/** Growth ratio for one lift: latest session over first session. Null without two sessions. */
function exerciseRatio(
  workouts: Workout[],
  routine: RoutineDay[],
  exerciseId: string,
): number | null {
  const bodyweight = findSlot(routine, exerciseId)?.bodyweight ?? false

  const values = [...workouts]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((w) => sessionBest(w, exerciseId, bodyweight))
    .filter((v): v is number => v !== null && v > 0)

  if (values.length < 2) return null
  return values[values.length - 1] / values[0]
}

/**
 * The average of several growth ratios.
 *
 * Geometric, not arithmetic: ratios compound, and a mean of 1.5x and 0.5x should
 * come out at no change rather than at +50%.
 */
function geometricMean(ratios: number[]): number {
  const sum = ratios.reduce((n, r) => n + Math.log(r), 0)
  return Math.exp(sum / ratios.length)
}

export interface GroupProgress {
  group: MuscleGroup
  /** Percentage change against their own baseline. Null until two sessions of one lift. */
  changePct: number | null
  /** How many lifts backed the figure, so a thin result can say so. */
  exercises: number
}

export interface PersonProgress {
  person: Person
  sessions: number
  groups: GroupProgress[]
  /** Across every tracked lift, not an average of the group figures. */
  overallPct: number | null
}

export function progressFor(person: Person): PersonProgress {
  const workouts = getWorkoutsFor(person.id)

  // Every lift this person has actually logged, not everything their routine lists.
  const logged = new Set<string>()
  for (const w of workouts) for (const e of w.exercises) logged.add(e.exerciseId)

  const ratios = new Map<string, number>()
  for (const id of logged) {
    const ratio = exerciseRatio(workouts, person.routine, id)
    if (ratio !== null) ratios.set(id, ratio)
  }

  const groups: GroupProgress[] = MUSCLE_GROUPS.map(({ id }) => {
    const inGroup = [...ratios.entries()].filter(([exerciseId]) => groupOf(exerciseId) === id)
    return {
      group: id,
      changePct: inGroup.length ? (geometricMean(inGroup.map(([, r]) => r)) - 1) * 100 : null,
      exercises: inGroup.length,
    }
  })

  const all = [...ratios.values()]
  return {
    person,
    sessions: workouts.length,
    groups,
    overallPct: all.length ? (geometricMean(all) - 1) * 100 : null,
  }
}

/** Everyone, most improved first. People without enough data sort to the bottom. */
export function compareEveryone(): PersonProgress[] {
  return PEOPLE.map(progressFor).sort((a, b) => {
    if (a.overallPct === null && b.overallPct === null) return 0
    if (a.overallPct === null) return 1
    if (b.overallPct === null) return -1
    return b.overallPct - a.overallPct
  })
}
