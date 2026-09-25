import type { DayId } from '@/types'

/**
 * ROUTINES ARE FIXED.
 * These constants are the app. There is deliberately no settings screen and no
 * code path that writes to any of this - it can only change by editing this file.
 *
 * A routine is not global any more: each person in `people.ts` is assigned one,
 * and a person with no routine yet simply has an empty list of days. Every helper
 * here takes the routine it should work on rather than reaching for a single
 * shared one, so nobody's days can leak into someone else's screen.
 */

/**
 * What a slot is for, rather than which muscle it hits.
 *
 * Skill is the one that behaves differently: it is practice, not a prescription,
 * so it is kept visually apart from the resistance work and never enforces a
 * set or rep count.
 */
export type Category = 'skill' | 'main' | 'structural' | 'isolation'

export const CATEGORIES: { id: Category; name: string; blurb: string }[] = [
  {
    id: 'skill',
    name: 'Skill',
    blurb: 'Movement skill development and calisthenics progression work.',
  },
  {
    id: 'main',
    name: 'Main',
    blurb: 'Primary strength and performance movements.',
  },
  {
    id: 'structural',
    name: 'Structural Strength',
    blurb:
      'Supportive work: unilateral strength, stability, tendon resilience, joint integrity and weak points.',
  },
  {
    id: 'isolation',
    name: 'Isolation',
    blurb: 'Targeted muscle-building exercises.',
  },
]

export const CATEGORY_NAMES: Record<Category, string> = {
  skill: 'Skill',
  main: 'Main',
  structural: 'Structural Strength',
  isolation: 'Isolation',
}

export interface RoutineSlot {
  /** Tracking identity. Slots that share an id share PRs and one progress line. */
  exerciseId: string
  /** Display name for this day. May differ from the canonical name. */
  name: string
  /** What this slot is for. Drives the section it is shown under, everywhere. */
  category: Category
  sets: number
  /** The prescription, or the bottom of it when `repsMax` is set. */
  reps: number
  /** Top of a rep range, e.g. 8 for "6-8". Omitted when the prescription is a single number. */
  repsMax?: number
  /** True when the reps are per side, e.g. a single-leg RDL. */
  perSide?: boolean
  /**
   * No prescription at all - practice, logged however it went.
   *
   * Skill work is open-ended by nature: a handstand session is not two sets of
   * eight. The logger still uses the same rows as everything else so nothing
   * about the structure changes, but nothing is enforced and sets can be added
   * or removed freely.
   */
  freeform?: boolean
  /** Warmups are tick-only. 0 means none prescribed. */
  warmupSets: number
  /** True when the lift carries no external load (reps only). */
  bodyweight: boolean
  /** Slots sharing a group key are performed as a superset. */
  supersetGroup?: string
  /** True when the final prescribed set is a drop set. */
  dropSet?: boolean
  /** Taken to failure rather than to a count - shown as "Max" and never pre-filled. */
  amrap?: boolean
  /** Pre-fills the logger the first time only. Never recorded on its own. */
  startWeight: number | null
  startReps: number | null
}

export interface RoutineDay {
  id: DayId
  name: string
  subtitle: string
  slots: RoutineSlot[]
}

/**
 * Which broad movement pattern a lift belongs to.
 *
 * Comparison across people works at this level rather than exercise by exercise,
 * because two people's routines need not share a single lift. Anything missing
 * from the map below is left out of the comparison rather than guessed at.
 */
export type MuscleGroup = 'legs' | 'push' | 'pull'

export const MUSCLE_GROUPS: { id: MuscleGroup; name: string }[] = [
  { id: 'legs', name: 'Legs' },
  { id: 'push', name: 'Push' },
  { id: 'pull', name: 'Pull' },
]

export const EXERCISE_GROUPS: Record<string, MuscleGroup> = {
  'barbell-squats': 'legs',
  'barbell-deadlifts': 'legs',
  'split-squats': 'legs',
  'one-legged-rdls': 'legs',
  'adductor-machine': 'legs',
  'abductor-machine': 'legs',
  'calf-training': 'legs',
  'incline-dumbbell-press': 'push',
  'incline-barbell-bench-press': 'push',
  'lateral-raises': 'push',
  'one-arm-pullup-training': 'pull',
  'weighted-pullups-volume': 'pull',
  'weighted-pullups-heavy': 'pull',
  'weighted-muscle-ups': 'pull',
  'chest-supported-row': 'pull',
  'machine-preacher-curls': 'pull',
  'hammer-curls': 'pull',
  'pull-ups': 'pull',
  'bodyweight-rows': 'pull',
  'db-preacher-curls': 'pull',
  'flat-bench-press': 'push',
  'push-ups': 'push',
  'skull-crushers': 'push',
  'goblet-squats': 'legs',
  'standing-calf-raise': 'legs',
  'seated-calf-raise': 'legs',
  'cable-curls': 'pull',
  // Handstand and one-arm pullup work is skill practice rather than a loaded
  // pattern, so it is deliberately left out of the cross-person comparison.
  // Knee and leg raises are core, and there is no core group. Unmapped lifts are
  // left out of the comparison rather than filed under a pattern they are not.
}

/** "2 x 10", "2 x 6-8", "3 x Max", or "Practice" for open-ended skill work. */
export function prescription(slot: RoutineSlot): string {
  if (slot.freeform) return 'Practice'
  const reps = slot.amrap
    ? 'Max'
    : slot.repsMax && slot.repsMax > slot.reps
      ? `${slot.reps}-${slot.repsMax}`
      : `${slot.reps}`
  return `${slot.sets} x ${reps}${slot.perSide ? ' per leg' : ''}`
}

/**
 * The slots of a day, split into its categories, in the order they are written.
 *
 * The routine is the source of order - this never sorts - so the exercises read
 * exactly as they were written down, grouped under the heading they belong to.
 */
export function slotsByCategory(
  slots: RoutineSlot[],
): { category: Category; slots: { slot: RoutineSlot; index: number }[] }[] {
  const out: {
    category: Category
    slots: { slot: RoutineSlot; index: number }[]
  }[] = []
  slots.forEach((slot, index) => {
    const last = out[out.length - 1]
    if (last && last.category === slot.category) last.slots.push({ slot, index })
    else out.push({ category: slot.category, slots: [{ slot, index }] })
  })
  return out
}

/**
 * Which category a logged exercise was done under.
 *
 * Looks in the day it was logged against first, then anywhere in the routine, so
 * history logged under an earlier version of a routine still gets a label where
 * the exercise is still in use. Returns undefined rather than guessing when it
 * is not - an unlabelled row is better than a wrong label.
 */
export function categoryOf(
  routine: RoutineDay[],
  dayId: DayId,
  exerciseId: string,
): Category | undefined {
  const day = getDay(routine, dayId)
  const onDay = day?.slots.find((s) => s.exerciseId === exerciseId)
  if (onDay) return onDay.category
  return findSlot(routine, exerciseId)?.category
}

/** Every category this routine actually uses, in the canonical order. */
export function categoriesIn(routine: RoutineDay[]): Category[] {
  const used = new Set<Category>()
  for (const day of routine) for (const slot of day.slots) used.add(slot.category)
  return CATEGORIES.map((c) => c.id).filter((id) => used.has(id))
}

/**
 * What to call an exercise for this person.
 *
 * Their own routine wins. Two people can train the same lift under different
 * names - one person's "BB Back Squat" is another's "BB Squats" - and history,
 * charts and the logger should all use the name they actually see on the day.
 * `EXERCISE_NAMES` is the fallback, for history of a lift no longer in their
 * routine, and `dayId` is honoured first so a day that renames a slot is
 * reflected in the session logged against it.
 */
export function exerciseName(routine: RoutineDay[], exerciseId: string, dayId?: DayId): string {
  if (dayId !== undefined) {
    const onDay = getDay(routine, dayId)?.slots.find((s) => s.exerciseId === exerciseId)
    if (onDay) return onDay.name
  }
  return findSlot(routine, exerciseId)?.name ?? EXERCISE_NAMES[exerciseId] ?? exerciseId
}

export function groupOf(exerciseId: string): MuscleGroup | undefined {
  return EXERCISE_GROUPS[exerciseId]
}

/** Canonical names, used wherever an exercise is shown outside its day. */
export const EXERCISE_NAMES: Record<string, string> = {
  'barbell-squats': 'Barbell Squats',
  'one-arm-pullup-training': 'One Arm Pullup Training',
  'weighted-pullups-volume': 'Weighted Pull-Up (Volume)',
  'weighted-pullups-heavy': 'Weighted Pull-Up (Heavy)',
  'adductor-machine': 'Adductor Machine',
  'abductor-machine': 'Abductor Machine',
  'lateral-raises': 'Lateral Raises',
  'machine-preacher-curls': 'Machine Preacher Curls',
  'calf-training': 'Calf Training',
  'hammer-curls': 'Hammer Curls',
  'barbell-deadlifts': 'Barbell Deadlifts',
  'incline-dumbbell-press': 'Incline Dumbbell Press',
  'weighted-muscle-ups': 'Weighted Muscle Ups',
  'split-squats': 'Split Squats',
  'incline-barbell-bench-press': 'Incline Barbell Bench Press',
  'chest-supported-row': 'Chest Supported Row Machine',
  'one-legged-rdls': 'One-legged RDLs',
  'pull-ups': 'Pull Ups',
  'flat-bench-press': 'Flat Bench Press',
  'db-preacher-curls': 'DB Preacher Curls',
  'skull-crushers': 'Skull Crushers',
  'push-ups': 'Push Ups',
  'bodyweight-rows': 'Bodyweight Rows',
  'goblet-squats': 'Goblet Squats',
  'knee-raises': 'Knee Raises',
  'lying-leg-raises': 'Lying Leg Raises',
  'handstand-practice': 'Handstand Practice',
  'l-sit-to-handstand': 'L-Sit to Handstand Practice',
  'standing-calf-raise': 'Standing Calf Raise',
  'seated-calf-raise': 'Seated Calf Raise',
  'cable-curls': 'Cable Curl',
}

/** Macsy's three-day full body split. */
export const FULL_BODY_3: RoutineDay[] = [
  {
    id: 1,
    name: 'Full Body A',
    subtitle: 'Squat / Pull / Arms',
    slots: [
      {
        exerciseId: 'barbell-squats',
        category: 'main',
        name: 'Barbell Squats',
        sets: 2,
        reps: 6,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 60,
        startReps: 8,
      },
      {
        exerciseId: 'one-arm-pullup-training',
        category: 'skill',
        name: 'One Arm Pullup Training',
        sets: 2,
        reps: 3,
        warmupSets: 2,
        bodyweight: true,
        startWeight: null,
        startReps: 3,
      },
      {
        exerciseId: 'weighted-pullups-volume',
        category: 'main',
        name: 'Weighted Pullups',
        sets: 2,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 30,
        startReps: 10,
      },
      {
        exerciseId: 'adductor-machine',
        category: 'structural',
        name: 'Adductor Machine',
        sets: 2,
        reps: 12,
        warmupSets: 0,
        bodyweight: false,
        supersetGroup: 'a-adduct',
        startWeight: 63,
        startReps: 10,
      },
      {
        exerciseId: 'abductor-machine',
        category: 'structural',
        name: 'Abductor Machine',
        sets: 2,
        reps: 12,
        warmupSets: 0,
        bodyweight: false,
        supersetGroup: 'a-adduct',
        startWeight: 63,
        startReps: 10,
      },
      {
        exerciseId: 'lateral-raises',
        category: 'isolation',
        name: 'Cable Lateral Raises',
        sets: 3,
        reps: 15,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 16.3,
        startReps: 12,
      },
      {
        exerciseId: 'machine-preacher-curls',
        category: 'isolation',
        name: 'Machine Preacher Curls',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 75,
        startReps: 10,
      },
      {
        exerciseId: 'calf-training',
        category: 'structural',
        name: 'Calf Training',
        sets: 3,
        reps: 20,
        warmupSets: 0,
        bodyweight: true,
        startWeight: null,
        startReps: 20,
      },
      {
        exerciseId: 'hammer-curls',
        category: 'isolation',
        name: 'Hammer Curls',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        dropSet: true,
        startWeight: 20,
        startReps: 10,
      },
    ],
  },
  {
    id: 2,
    name: 'Full Body B',
    subtitle: 'Deadlift / Press / Muscle Up',
    slots: [
      {
        exerciseId: 'barbell-deadlifts',
        category: 'main',
        name: 'Barbell Deadlifts',
        sets: 2,
        reps: 6,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 120,
        startReps: 6,
      },
      {
        exerciseId: 'incline-dumbbell-press',
        category: 'main',
        name: 'Incline Dumbbell Press',
        sets: 2,
        reps: 8,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 35,
        startReps: 6,
      },
      {
        exerciseId: 'weighted-muscle-ups',
        category: 'main',
        name: 'Weighted Muscle Ups',
        sets: 2,
        reps: 5,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 5,
        startReps: 3,
      },
      {
        exerciseId: 'split-squats',
        category: 'structural',
        name: 'Split Squats',
        sets: 2,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 40,
        startReps: 10,
      },
      {
        exerciseId: 'lateral-raises',
        category: 'isolation',
        name: 'Lateral Raises',
        sets: 3,
        reps: 15,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 16.3,
        startReps: 12,
      },
      {
        exerciseId: 'machine-preacher-curls',
        category: 'isolation',
        name: 'Machine Preacher Curls',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 75,
        startReps: 10,
      },
      {
        exerciseId: 'hammer-curls',
        category: 'isolation',
        name: 'Hammer Curls',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 20,
        startReps: 10,
      },
    ],
  },
  {
    id: 3,
    name: 'Full Body C',
    subtitle: 'Pull / Bench / Row',
    slots: [
      {
        exerciseId: 'weighted-pullups-heavy',
        category: 'main',
        name: 'Weighted Pullups',
        sets: 2,
        reps: 6,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 45,
        startReps: 6,
      },
      {
        exerciseId: 'incline-barbell-bench-press',
        category: 'main',
        name: 'Incline Barbell Bench Press',
        sets: 2,
        reps: 8,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 70,
        startReps: 8,
      },
      {
        exerciseId: 'chest-supported-row',
        category: 'main',
        name: 'Chest Supported Row Machine',
        sets: 2,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 140,
        startReps: 10,
      },
      {
        exerciseId: 'one-legged-rdls',
        category: 'structural',
        name: 'One-legged RDLs',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 20,
        startReps: 10,
      },
      {
        exerciseId: 'calf-training',
        category: 'structural',
        name: 'Calf Training',
        sets: 3,
        reps: 20,
        warmupSets: 0,
        bodyweight: true,
        startWeight: null,
        startReps: 20,
      },
      {
        exerciseId: 'machine-preacher-curls',
        category: 'isolation',
        name: 'Machine Preacher Curls',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 75,
        startReps: 10,
      },
      {
        exerciseId: 'hammer-curls',
        category: 'isolation',
        name: 'Hammer Curls',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        dropSet: true,
        startWeight: 20,
        startReps: 10,
      },
    ],
  },
]

/** The day numbers this routine defines, in order. */
export function dayIds(routine: RoutineDay[]): DayId[] {
  return routine.map((d) => d.id)
}

/**
 * A day within a routine, or undefined when the routine does not define it.
 *
 * Deliberately not throwing: a person's routine can be edited after they have
 * already logged sessions against it, and old history should still render.
 */
export function getDay(routine: RoutineDay[], dayId: DayId): RoutineDay | undefined {
  return routine.find((d) => d.id === dayId)
}

/** What to call a day, falling back to its number for history under an edited routine. */
export function dayLabel(routine: RoutineDay[], dayId: DayId): string {
  return getDay(routine, dayId)?.name ?? `Day ${dayId}`
}

/** Every distinct tracked exercise, in the order it first appears in the week. */
export function allTrackedExercises(
  routine: RoutineDay[],
): { id: string; name: string; bodyweight: boolean; category: Category }[] {
  const seen = new Map<
    string,
    { id: string; name: string; bodyweight: boolean; category: Category }
  >()
  for (const day of routine) {
    for (const slot of day.slots) {
      if (!seen.has(slot.exerciseId)) {
        seen.set(slot.exerciseId, {
          id: slot.exerciseId,
          name: slot.name,
          bodyweight: slot.bodyweight,
          category: slot.category,
        })
      }
    }
  }
  // A routine may call two separately tracked lifts the same thing - the volume
  // and heavy weighted pull-ups are both just "Weighted Pull-Up" on the day. That
  // reads fine inside a day, but a picker listing both needs them told apart, so
  // a clashing name falls back to the canonical one.
  const out = [...seen.values()]
  const clashes = new Set(out.map((e) => e.name).filter((name, i, all) => all.indexOf(name) !== i))
  return out.map((e) => (clashes.has(e.name) ? { ...e, name: EXERCISE_NAMES[e.id] ?? e.name } : e))
}

export function findSlot(routine: RoutineDay[], exerciseId: string): RoutineSlot | undefined {
  for (const day of routine) {
    const slot = day.slots.find((s) => s.exerciseId === exerciseId)
    if (slot) return slot
  }
  return undefined
}

/**
 * Mitchy's three days.
 *
 * Starting weights are placeholders - nobody has told the app what he actually
 * lifts, so they are only the first pre-fill. After one logged session the
 * logger fills from what he did last time and these stop mattering.
 *
 * Supersets are expressed by rounds: a superset done three times is three sets
 * of each of its members, sharing a group key.
 */
export const MITCHY_FULL_BODY: RoutineDay[] = [
  {
    id: 1,
    name: 'Full Body 1',
    subtitle: 'Squat / Pull / Incline',
    slots: [
      {
        exerciseId: 'barbell-squats',
        category: 'main',
        name: 'BB Squats',
        sets: 2,
        reps: 10,
        warmupSets: 2,
        bodyweight: false,
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'pull-ups',
        category: 'main',
        name: 'Pull Ups',
        sets: 2,
        reps: 8,
        warmupSets: 0,
        bodyweight: true,
        startWeight: null,
        startReps: 8,
      },
      {
        exerciseId: 'incline-dumbbell-press',
        category: 'main',
        name: 'DB Incline Bench',
        sets: 2,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'db-preacher-curls',
        category: 'isolation',
        name: 'DB Preacher Curls',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        supersetGroup: 'fb1-arms',
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'lateral-raises',
        category: 'isolation',
        name: 'Lateral Raises',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        supersetGroup: 'fb1-arms',
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'skull-crushers',
        category: 'isolation',
        name: 'Skull Crushers',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        supersetGroup: 'fb1-arms',
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'knee-raises',
        category: 'isolation',
        name: 'Knee Raises',
        sets: 2,
        reps: 0,
        warmupSets: 0,
        bodyweight: true,
        amrap: true,
        supersetGroup: 'fb1-core',
        startWeight: null,
        startReps: null,
      },
      {
        exerciseId: 'calf-training',
        category: 'structural',
        name: 'Calf Raises',
        sets: 2,
        reps: 20,
        warmupSets: 0,
        bodyweight: true,
        supersetGroup: 'fb1-core',
        startWeight: null,
        startReps: 20,
      },
    ],
  },
  {
    id: 2,
    name: 'Full Body 2',
    subtitle: 'Bench / Split Squat / Row',
    slots: [
      {
        exerciseId: 'flat-bench-press',
        category: 'main',
        name: 'Bench Press',
        sets: 2,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'split-squats',
        category: 'structural',
        name: 'DB Split Squats',
        sets: 2,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'chest-supported-row',
        category: 'main',
        name: 'Chest Supported BB Row',
        sets: 2,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'one-legged-rdls',
        category: 'structural',
        name: "Single Leg RDL's",
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'db-preacher-curls',
        category: 'isolation',
        name: 'DB Preacher Curls',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        supersetGroup: 'fb2-arms',
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'lateral-raises',
        category: 'isolation',
        name: 'Lateral Raises',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        supersetGroup: 'fb2-arms',
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'skull-crushers',
        category: 'isolation',
        name: 'Skull Crushers',
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        supersetGroup: 'fb2-arms',
        startWeight: null,
        startReps: 10,
      },
    ],
  },
  {
    id: 3,
    name: 'Quick Full Body 3',
    subtitle: 'Bodyweight supersets',
    slots: [
      {
        exerciseId: 'push-ups',
        category: 'main',
        name: 'Push Ups',
        sets: 3,
        reps: 0,
        warmupSets: 0,
        bodyweight: true,
        amrap: true,
        supersetGroup: 'fb3-upper',
        startWeight: null,
        startReps: null,
      },
      {
        exerciseId: 'bodyweight-rows',
        category: 'main',
        name: 'Bodyweight Rows',
        sets: 3,
        reps: 0,
        warmupSets: 0,
        bodyweight: true,
        amrap: true,
        supersetGroup: 'fb3-upper',
        startWeight: null,
        startReps: null,
      },
      {
        exerciseId: 'goblet-squats',
        category: 'structural',
        name: 'Goblet Squats',
        sets: 3,
        reps: 15,
        warmupSets: 0,
        bodyweight: false,
        supersetGroup: 'fb3-lower',
        startWeight: null,
        startReps: 15,
      },
      {
        exerciseId: 'one-legged-rdls',
        category: 'structural',
        name: "Single Leg RDL's",
        sets: 3,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        supersetGroup: 'fb3-lower',
        startWeight: null,
        startReps: 10,
      },
      {
        exerciseId: 'calf-training',
        category: 'structural',
        name: 'Calf Raises',
        sets: 3,
        reps: 20,
        warmupSets: 0,
        bodyweight: true,
        supersetGroup: 'fb3-lower',
        startWeight: null,
        startReps: 20,
      },
      {
        exerciseId: 'lying-leg-raises',
        category: 'isolation',
        name: 'Lying Leg Raises',
        sets: 1,
        reps: 0,
        warmupSets: 0,
        bodyweight: true,
        amrap: true,
        startWeight: null,
        startReps: null,
      },
    ],
  },
]

/** Nearest sensible plate or stack increment: 2.5 kg on the big lifts, 0.5 kg on the small ones. */
function roundLoad(kg: number): number {
  if (kg >= 20) return Math.max(2.5, Math.round(kg / 2.5) * 2.5)
  return Math.max(0.5, Math.round(kg * 2) / 2)
}

/**
 * The same split at a different starting strength.
 *
 * Everyone currently trains `FULL_BODY_3`; only the numbers they start from
 * differ. Prescribed sets and reps are untouched - only the pre-fill weights
 * move - and bodyweight lifts stay bodyweight.
 *
 * This is a starting point, not a constraint: give a person a hand-written
 * routine in `people.ts` whenever theirs should genuinely differ.
 */
export function scaledFullBody3(factor: number): RoutineDay[] {
  return FULL_BODY_3.map((day) => ({
    ...day,
    slots: day.slots.map((slot) => ({
      ...slot,
      startWeight: slot.startWeight === null ? null : roundLoad(slot.startWeight * factor),
    })),
  }))
}

/**
 * Macsy's four-day split.
 *
 * Written in the four categories, in the order they are trained: skill practice
 * first while fresh, then the main lifts, then the structural work that holds
 * them together, then isolation. `slotsByCategory` reads the order straight off
 * this list, so what is written here is what every screen shows.
 *
 * Exercise ids are deliberately reused where the movement is the same as before
 * - BB Back Squat is still `barbell-squats`, the two weighted pull-up slots are
 * still the volume and heavy ids - so his existing PRs and progression lines
 * carry straight over. The calf raises and cable curl are new ids because they
 * are genuinely new movements; they simply start with no history.
 *
 * Skill slots carry no prescription at all. They are `freeform`, so nothing is
 * enforced and sets can be added or removed freely.
 */
export const MACSY_FOUR_DAY: RoutineDay[] = [
  {
    id: 1,
    name: 'Ground & Grip',
    subtitle: 'Squat / Pull-Up / Row',
    slots: [
      {
        exerciseId: 'handstand-practice',
        name: 'Handstand Practice',
        category: 'skill',
        sets: 1,
        reps: 0,
        freeform: true,
        warmupSets: 0,
        bodyweight: true,
        startWeight: null,
        startReps: null,
      },
      {
        exerciseId: 'l-sit-to-handstand',
        name: 'L-Sit to Handstand Practice',
        category: 'skill',
        sets: 1,
        reps: 0,
        freeform: true,
        warmupSets: 0,
        bodyweight: true,
        startWeight: null,
        startReps: null,
      },
      {
        exerciseId: 'barbell-squats',
        name: 'BB Back Squat',
        category: 'main',
        sets: 2,
        reps: 6,
        repsMax: 8,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 60,
        startReps: 6,
      },
      {
        exerciseId: 'weighted-pullups-volume',
        name: 'Weighted Pull-Up',
        category: 'main',
        sets: 2,
        reps: 8,
        repsMax: 10,
        warmupSets: 0,
        bodyweight: false,
        dropSet: true,
        startWeight: 30,
        startReps: 8,
      },
      {
        exerciseId: 'chest-supported-row',
        name: 'Chest Supported Row',
        category: 'main',
        sets: 2,
        reps: 10,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 140,
        startReps: 10,
      },
      {
        exerciseId: 'standing-calf-raise',
        name: 'Standing Calf Raise',
        category: 'structural',
        sets: 3,
        reps: 20,
        repsMax: 25,
        warmupSets: 0,
        bodyweight: false,
        startWeight: null,
        startReps: 20,
      },
      {
        exerciseId: 'one-legged-rdls',
        name: 'Single-Leg RDL',
        category: 'structural',
        sets: 3,
        reps: 10,
        repsMax: 12,
        perSide: true,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 20,
        startReps: 10,
      },
      {
        exerciseId: 'machine-preacher-curls',
        name: 'Preacher Curl',
        category: 'isolation',
        sets: 3,
        reps: 10,
        repsMax: 12,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 75,
        startReps: 10,
      },
      {
        exerciseId: 'hammer-curls',
        name: 'Hammer Curl',
        category: 'isolation',
        sets: 3,
        reps: 10,
        repsMax: 12,
        warmupSets: 0,
        bodyweight: false,
        dropSet: true,
        startWeight: 20,
        startReps: 10,
      },
    ],
  },
  {
    id: 2,
    name: 'Press & Hinge',
    subtitle: 'Incline / Deadlift / Muscle-Up',
    slots: [
      {
        exerciseId: 'handstand-practice',
        name: 'Handstand Practice',
        category: 'skill',
        sets: 1,
        reps: 0,
        freeform: true,
        warmupSets: 0,
        bodyweight: true,
        startWeight: null,
        startReps: null,
      },
      {
        exerciseId: 'one-arm-pullup-training',
        name: 'One-Arm Pull-Up Progression Practice',
        category: 'skill',
        sets: 1,
        reps: 0,
        freeform: true,
        warmupSets: 0,
        bodyweight: true,
        startWeight: null,
        startReps: null,
      },
      {
        exerciseId: 'incline-barbell-bench-press',
        name: 'Incline BB Bench',
        category: 'main',
        sets: 2,
        reps: 8,
        repsMax: 10,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 70,
        startReps: 8,
      },
      {
        exerciseId: 'barbell-deadlifts',
        name: 'Deadlift',
        category: 'main',
        sets: 2,
        reps: 5,
        repsMax: 7,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 120,
        startReps: 5,
      },
      {
        exerciseId: 'weighted-muscle-ups',
        name: 'Weighted Muscle-Up',
        category: 'main',
        sets: 2,
        reps: 3,
        repsMax: 5,
        warmupSets: 2,
        bodyweight: false,
        dropSet: true,
        startWeight: 5,
        startReps: 3,
      },
      {
        exerciseId: 'adductor-machine',
        name: 'Adductor Machine',
        category: 'structural',
        sets: 3,
        reps: 10,
        repsMax: 12,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 63,
        startReps: 10,
      },
      {
        exerciseId: 'abductor-machine',
        name: 'Abductor Machine',
        category: 'structural',
        sets: 3,
        reps: 10,
        repsMax: 12,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 63,
        startReps: 10,
      },
      {
        exerciseId: 'machine-preacher-curls',
        name: 'Preacher Curl',
        category: 'isolation',
        sets: 3,
        reps: 10,
        repsMax: 12,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 75,
        startReps: 10,
      },
      {
        exerciseId: 'hammer-curls',
        name: 'Hammer Curl',
        category: 'isolation',
        sets: 3,
        reps: 10,
        repsMax: 12,
        warmupSets: 0,
        bodyweight: false,
        dropSet: true,
        startWeight: 20,
        startReps: 10,
      },
    ],
  },
  {
    id: 3,
    name: 'Pull Peak',
    subtitle: 'Heavy Pull-Up / Squat / Legs',
    slots: [
      {
        exerciseId: 'handstand-practice',
        name: 'Handstand Practice',
        category: 'skill',
        sets: 1,
        reps: 0,
        freeform: true,
        warmupSets: 0,
        bodyweight: true,
        startWeight: null,
        startReps: null,
      },
      {
        exerciseId: 'l-sit-to-handstand',
        name: 'L-Sit to Handstand Practice',
        category: 'skill',
        sets: 1,
        reps: 0,
        freeform: true,
        warmupSets: 0,
        bodyweight: true,
        startWeight: null,
        startReps: null,
      },
      {
        exerciseId: 'weighted-pullups-heavy',
        name: 'Weighted Pull-Up',
        category: 'main',
        sets: 2,
        reps: 5,
        repsMax: 7,
        warmupSets: 2,
        bodyweight: false,
        dropSet: true,
        startWeight: 45,
        startReps: 5,
      },
      {
        exerciseId: 'barbell-squats',
        name: 'BB Back Squat',
        category: 'main',
        sets: 2,
        reps: 6,
        repsMax: 8,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 60,
        startReps: 6,
      },
      {
        exerciseId: 'one-legged-rdls',
        name: 'Single-Leg RDL',
        category: 'structural',
        sets: 3,
        reps: 10,
        repsMax: 12,
        perSide: true,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 20,
        startReps: 10,
      },
      {
        exerciseId: 'standing-calf-raise',
        name: 'Standing Calf Raise',
        category: 'structural',
        sets: 3,
        reps: 20,
        repsMax: 25,
        warmupSets: 0,
        bodyweight: false,
        startWeight: null,
        startReps: 20,
      },
      {
        exerciseId: 'lateral-raises',
        name: 'Cable Lateral Raise',
        category: 'isolation',
        sets: 3,
        reps: 12,
        repsMax: 15,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 16.3,
        startReps: 12,
      },
      {
        exerciseId: 'cable-curls',
        name: 'Cable Curl',
        category: 'isolation',
        sets: 3,
        reps: 10,
        repsMax: 12,
        warmupSets: 0,
        bodyweight: false,
        dropSet: true,
        startWeight: null,
        startReps: 10,
      },
    ],
  },
  {
    id: 4,
    name: 'Hinge & Rise',
    subtitle: 'Deadlift / Incline / Muscle-Up',
    slots: [
      {
        exerciseId: 'handstand-practice',
        name: 'Handstand Practice',
        category: 'skill',
        sets: 1,
        reps: 0,
        freeform: true,
        warmupSets: 0,
        bodyweight: true,
        startWeight: null,
        startReps: null,
      },
      {
        exerciseId: 'one-arm-pullup-training',
        name: 'One-Arm Pull-Up Progression Practice',
        category: 'skill',
        sets: 1,
        reps: 0,
        freeform: true,
        warmupSets: 0,
        bodyweight: true,
        startWeight: null,
        startReps: null,
      },
      {
        exerciseId: 'barbell-deadlifts',
        name: 'Deadlift',
        category: 'main',
        sets: 2,
        reps: 5,
        repsMax: 7,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 120,
        startReps: 5,
      },
      {
        exerciseId: 'incline-dumbbell-press',
        name: 'Incline DB Bench',
        category: 'main',
        sets: 2,
        reps: 8,
        repsMax: 10,
        warmupSets: 2,
        bodyweight: false,
        startWeight: 35,
        startReps: 8,
      },
      {
        exerciseId: 'weighted-muscle-ups',
        name: 'Weighted Muscle-Up',
        category: 'main',
        sets: 2,
        reps: 3,
        repsMax: 5,
        warmupSets: 2,
        bodyweight: false,
        dropSet: true,
        startWeight: 5,
        startReps: 3,
      },
      {
        exerciseId: 'split-squats',
        name: 'Bulgarian Split Squat',
        category: 'structural',
        sets: 3,
        reps: 8,
        repsMax: 10,
        perSide: true,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 40,
        startReps: 8,
      },
      {
        exerciseId: 'seated-calf-raise',
        name: 'Seated Calf Raise',
        category: 'structural',
        sets: 3,
        reps: 20,
        repsMax: 25,
        warmupSets: 0,
        bodyweight: false,
        startWeight: null,
        startReps: 20,
      },
      {
        exerciseId: 'lateral-raises',
        name: 'Cable Lateral Raise',
        category: 'isolation',
        sets: 3,
        reps: 12,
        repsMax: 15,
        warmupSets: 0,
        bodyweight: false,
        startWeight: 16.3,
        startReps: 12,
      },
      {
        exerciseId: 'cable-curls',
        name: 'Cable Curl',
        category: 'isolation',
        sets: 3,
        reps: 10,
        repsMax: 12,
        warmupSets: 0,
        bodyweight: false,
        dropSet: true,
        startWeight: null,
        startReps: 10,
      },
    ],
  },
]
