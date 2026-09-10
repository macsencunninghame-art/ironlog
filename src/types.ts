/**
 * Which day of a person's routine a session belongs to.
 *
 * Was `1 | 2 | 3` when everyone shared one three-day split. Routines are now
 * per person and can be any length, so the valid ids are whatever that person's
 * routine defines - see `dayIds()`.
 */
export type DayId = number

/** A single logged working set. */
export interface SetEntry {
  weight: number | null
  reps: number | null
  done: boolean
  /** Drop sets never count toward PRs. Fixed at creation so added sets stay clean. */
  isDropSet: boolean
}

export interface LoggedExercise {
  exerciseId: string
  /** One flag per prescribed warmup set. Warmups are tick-only: no load, no PRs. */
  warmupsDone: boolean[]
  sets: SetEntry[]
}

export interface Workout {
  id: string
  dayId: DayId
  /** ISO date string. */
  date: string
  exercises: LoggedExercise[]
}

/** A tested one-rep max. Entered by hand, kept apart from training PRs. */
export interface MaxEntry {
  id: string
  liftId: string
  weight: number
  date: string
}

export interface PersonalRecord {
  /** Heaviest load ever lifted; reps break ties. */
  topSetWeight: number
  topSetReps: number
  /** Best Epley estimate ever produced. */
  e1rm: number
}

export interface IronLogBackup {
  app: 'ironlog'
  version: 1
  exportedAt: string
  /** Whose log this is. Optional so backups taken before the roster existed still import. */
  person?: string
  workouts: Workout[]
  maxes: MaxEntry[]
}
