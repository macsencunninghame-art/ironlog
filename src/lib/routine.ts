import type { DayId } from '@/types'

/**
 * THE ROUTINE IS FIXED.
 * These constants are the app. There is deliberately no settings screen and no
 * code path that writes to any of this - it can only change by editing this file.
 */

export interface RoutineSlot {
  /** Tracking identity. Slots that share an id share PRs and one progress line. */
  exerciseId: string
  /** Display name for this day. May differ from the canonical name. */
  name: string
  sets: number
  reps: number
  /** Warmups are tick-only. 0 means none prescribed. */
  warmupSets: number
  /** True when the lift carries no external load (reps only). */
  bodyweight: boolean
  /** Slots sharing a group key are performed as a superset. */
  supersetGroup?: string
  /** True when the final prescribed set is a drop set. */
  dropSet?: boolean
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

/** Canonical names, used wherever an exercise is shown outside its day. */
export const EXERCISE_NAMES: Record<string, string> = {
  'barbell-squats': 'Barbell Squats',
  'one-arm-pullup-training': 'One Arm Pullup Training',
  'weighted-pullups-volume': 'Weighted Pullups (Volume)',
  'weighted-pullups-heavy': 'Weighted Pullups (Heavy)',
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
}

export const ROUTINE: RoutineDay[] = [
  {
    id: 1,
    name: 'Full Body A',
    subtitle: 'Squat / Pull / Arms',
    slots: [
      {
        exerciseId: 'barbell-squats',
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

export const DAY_IDS: DayId[] = [1, 2, 3]

export function getDay(dayId: DayId): RoutineDay {
  const day = ROUTINE.find((d) => d.id === dayId)
  if (!day) throw new Error(`Unknown day ${dayId}`)
  return day
}

/** Every distinct tracked exercise, in the order it first appears in the week. */
export function allTrackedExercises(): { id: string; name: string; bodyweight: boolean }[] {
  const seen = new Map<string, { id: string; name: string; bodyweight: boolean }>()
  for (const day of ROUTINE) {
    for (const slot of day.slots) {
      if (!seen.has(slot.exerciseId)) {
        seen.set(slot.exerciseId, {
          id: slot.exerciseId,
          name: EXERCISE_NAMES[slot.exerciseId] ?? slot.name,
          bodyweight: slot.bodyweight,
        })
      }
    }
  }
  return [...seen.values()]
}

export function findSlot(exerciseId: string): RoutineSlot | undefined {
  for (const day of ROUTINE) {
    const slot = day.slots.find((s) => s.exerciseId === exerciseId)
    if (slot) return slot
  }
  return undefined
}
