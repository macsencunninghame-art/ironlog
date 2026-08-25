import type { DayId, SetEntry, Workout } from '@/types'
import { DAY_IDS, findSlot } from './routine'
import { startOfWeek, weekKey } from './utils'

/** Epley estimate. Reps of 1 return the load itself. */
export function epley(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return weight * (1 + reps / 30)
}

export interface PR {
  topSetWeight: number
  topSetReps: number
  e1rm: number
  bodyweight: boolean
}

/** Sets that are allowed to count: completed, filled in, and never a drop set. */
function countableSets(workouts: Workout[], exerciseId: string): SetEntry[] {
  const out: SetEntry[] = []
  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      if (ex.exerciseId !== exerciseId) continue
      for (const set of ex.sets) {
        if (!set.done || set.isDropSet) continue
        if (set.reps === null || set.reps <= 0) continue
        out.push(set)
      }
    }
  }
  return out
}

export function isBodyweight(exerciseId: string): boolean {
  return findSlot(exerciseId)?.bodyweight ?? false
}

/**
 * Current PR for an exercise, or null when nothing has been logged yet.
 * Weighted lifts track heaviest load (reps break ties) alongside best e1RM.
 * Bodyweight lifts have no load, so their PR is simply the best rep count.
 */
export function getPR(workouts: Workout[], exerciseId: string): PR | null {
  const bodyweight = isBodyweight(exerciseId)
  const sets = countableSets(workouts, exerciseId).filter((s) =>
    bodyweight ? true : s.weight !== null && s.weight > 0,
  )
  if (!sets.length) return null

  if (bodyweight) {
    const bestReps = Math.max(...sets.map((s) => s.reps ?? 0))
    return { topSetWeight: 0, topSetReps: bestReps, e1rm: 0, bodyweight: true }
  }

  let topSetWeight = 0
  let topSetReps = 0
  let e1rm = 0
  for (const set of sets) {
    const w = set.weight as number
    const r = set.reps as number
    if (w > topSetWeight || (w === topSetWeight && r > topSetReps)) {
      topSetWeight = w
      topSetReps = r
    }
    e1rm = Math.max(e1rm, epley(w, r))
  }
  return { topSetWeight, topSetReps, e1rm, bodyweight: false }
}

export interface PRCheck {
  isPR: boolean
  beatsTopSet: boolean
  beatsE1rm: boolean
  /** True the very first time a lift is ever recorded - nothing to beat yet. */
  isFirst: boolean
}

const NO_PR: PRCheck = { isPR: false, beatsTopSet: false, beatsE1rm: false, isFirst: false }

/**
 * Does this set beat the standing PR?
 * With no history at all the first entry counts as a PR, by design.
 */
export function checkPR(
  pr: PR | null,
  weight: number | null,
  reps: number | null,
  isDropSet: boolean,
  bodyweight: boolean,
): PRCheck {
  if (isDropSet) return NO_PR
  if (reps === null || reps <= 0) return NO_PR
  if (!bodyweight && (weight === null || weight <= 0)) return NO_PR

  if (!pr) return { isPR: true, beatsTopSet: true, beatsE1rm: !bodyweight, isFirst: true }

  if (bodyweight) {
    const beats = reps > pr.topSetReps
    return { isPR: beats, beatsTopSet: beats, beatsE1rm: false, isFirst: false }
  }

  const w = weight as number
  const beatsTopSet = w > pr.topSetWeight || (w === pr.topSetWeight && reps > pr.topSetReps)
  const beatsE1rm = epley(w, reps) > pr.e1rm
  return { isPR: beatsTopSet || beatsE1rm, beatsTopSet, beatsE1rm, isFirst: false }
}

/** Completed working sets only. Bodyweight lifts contribute no load. */
export function workoutVolume(workout: Workout): number {
  let total = 0
  for (const ex of workout.exercises) {
    for (const set of ex.sets) {
      if (!set.done) continue
      if (set.weight === null || set.reps === null) continue
      total += set.weight * set.reps
    }
  }
  return total
}

export function completedSetCount(workout: Workout): number {
  return workout.exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.done).length, 0)
}

export interface WeekBucket {
  key: string
  start: Date
  volume: number
  sessions: number
}

/** Volume per week for the last `weeks` weeks, oldest first, gaps included. */
export function weeklyVolume(workouts: Workout[], weeks = 12): WeekBucket[] {
  const buckets = new Map<string, WeekBucket>()
  const thisWeek = startOfWeek(new Date())

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisWeek)
    start.setDate(start.getDate() - i * 7)
    buckets.set(weekKey(start), { key: weekKey(start), start, volume: 0, sessions: 0 })
  }

  for (const workout of workouts) {
    const key = weekKey(new Date(workout.date))
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.volume += workoutVolume(workout)
    bucket.sessions += 1
  }

  return [...buckets.values()]
}

/** Which of the three days are already done in the current Mon-Sun week. */
export function daysDoneThisWeek(workouts: Workout[]): Set<DayId> {
  const key = weekKey(new Date())
  const done = new Set<DayId>()
  for (const workout of workouts) {
    if (weekKey(new Date(workout.date)) === key) done.add(workout.dayId)
  }
  return done
}

export function workoutsThisWeek(workouts: Workout[]): Workout[] {
  const key = weekKey(new Date())
  return workouts.filter((w) => weekKey(new Date(w.date)) === key)
}

export function volumeThisWeek(workouts: Workout[]): number {
  return workoutsThisWeek(workouts).reduce((n, w) => n + workoutVolume(w), 0)
}

/**
 * Consecutive weeks where all three days were logged.
 * The current week only counts once it is complete, so a part-finished week
 * never breaks a run that is still live.
 */
export function currentStreak(workouts: Workout[]): number {
  if (!workouts.length) return 0

  const byWeek = new Map<string, Set<DayId>>()
  for (const workout of workouts) {
    const key = weekKey(new Date(workout.date))
    if (!byWeek.has(key)) byWeek.set(key, new Set())
    byWeek.get(key)!.add(workout.dayId)
  }

  const complete = (key: string) => (byWeek.get(key)?.size ?? 0) >= 3

  const cursor = startOfWeek(new Date())
  let streak = 0

  if (complete(weekKey(cursor))) streak += 1
  cursor.setDate(cursor.getDate() - 7)

  while (complete(weekKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 7)
  }

  return streak
}

/** Most recent date each day was trained, for the suggestion logic. */
function lastTrained(workouts: Workout[]): Map<DayId, number> {
  const map = new Map<DayId, number>()
  for (const workout of workouts) {
    const t = new Date(workout.date).getTime()
    const prev = map.get(workout.dayId)
    if (prev === undefined || t > prev) map.set(workout.dayId, t)
  }
  return map
}

/**
 * What to train next. Prefers a day not yet done this week; otherwise whichever
 * day was trained longest ago. Never blocks a fourth or fifth session.
 */
export function suggestNextDay(workouts: Workout[]): DayId {
  const done = daysDoneThisWeek(workouts)
  const last = lastTrained(workouts)
  const outstanding = DAY_IDS.filter((d) => !done.has(d))
  const pool = outstanding.length ? outstanding : DAY_IDS

  return [...pool].sort((a, b) => {
    const aLast = last.get(a) ?? -1
    const bLast = last.get(b) ?? -1
    if (aLast !== bLast) return aLast - bLast
    return a - b
  })[0]
}

/** Total PRs across every logged session, counted as they happened. */
export function totalPRCount(workouts: Workout[]): number {
  const chronological = [...workouts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  const running = new Map<string, PR | null>()
  let count = 0

  for (const workout of chronological) {
    for (const ex of workout.exercises) {
      const bodyweight = isBodyweight(ex.exerciseId)
      for (const set of ex.sets) {
        if (!set.done) continue
        const pr = running.get(ex.exerciseId) ?? null
        const check = checkPR(pr, set.weight, set.reps, set.isDropSet, bodyweight)
        if (check.isPR) count += 1
        running.set(ex.exerciseId, mergeSet(pr, set, bodyweight))
      }
    }
  }
  return count
}

function mergeSet(pr: PR | null, set: SetEntry, bodyweight: boolean): PR | null {
  if (set.isDropSet || set.reps === null || set.reps <= 0) return pr
  if (!bodyweight && (set.weight === null || set.weight <= 0)) return pr

  if (bodyweight) {
    return {
      topSetWeight: 0,
      topSetReps: Math.max(pr?.topSetReps ?? 0, set.reps),
      e1rm: 0,
      bodyweight: true,
    }
  }

  const w = set.weight as number
  const r = set.reps
  const base = pr ?? { topSetWeight: 0, topSetReps: 0, e1rm: 0, bodyweight: false }
  const better = w > base.topSetWeight || (w === base.topSetWeight && r > base.topSetReps)
  return {
    topSetWeight: better ? w : base.topSetWeight,
    topSetReps: better ? r : base.topSetReps,
    e1rm: Math.max(base.e1rm, epley(w, r)),
    bodyweight: false,
  }
}

export interface SeriesPoint {
  date: Date
  weight: number
  reps: number
  e1rm: number
}

/** Best working set per session for one exercise, oldest first. */
export function exerciseSeries(workouts: Workout[], exerciseId: string): SeriesPoint[] {
  const bodyweight = isBodyweight(exerciseId)
  const points: SeriesPoint[] = []

  for (const workout of workouts) {
    let best: SeriesPoint | null = null
    for (const ex of workout.exercises) {
      if (ex.exerciseId !== exerciseId) continue
      for (const set of ex.sets) {
        if (!set.done || set.isDropSet) continue
        if (set.reps === null || set.reps <= 0) continue
        if (!bodyweight && (set.weight === null || set.weight <= 0)) continue

        const weight = bodyweight ? 0 : (set.weight as number)
        const metric = bodyweight ? set.reps : epley(weight, set.reps)
        if (!best || metric > best.e1rm) {
          best = { date: new Date(workout.date), weight, reps: set.reps, e1rm: metric }
        }
      }
    }
    if (best) points.push(best)
  }

  return points.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** Exercises that actually have data, for the Progress selector. */
export function exercisesWithData(workouts: Workout[]): Set<string> {
  const ids = new Set<string>()
  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      if (ex.sets.some((s) => s.done)) ids.add(ex.exerciseId)
    }
  }
  return ids
}
