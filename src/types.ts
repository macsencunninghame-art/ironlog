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

/**
 * A Bronco: 5 rounds of 20-40-60 m shuttles, 1200 m in total, against the clock.
 * One number, and lower is better.
 */
export interface BroncoEntry {
  id: string
  /** ISO date string. */
  date: string
  /** Total time in seconds. */
  seconds: number
  note?: string
}

/** A run. Pace is derived, never stored, so it can never disagree with the two figures behind it. */
export interface RunEntry {
  id: string
  date: string
  distanceKm: number
  seconds: number
  note?: string
  /** Where it came from. Manual today; kept so an import can be told apart later. */
  source?: 'manual' | 'strava'
}

/**
 * One rep of an interval session: how far, and how long it took.
 * Distance is per rep, so 6 x 400 m is six of these.
 */
export interface IntervalRep {
  seconds: number
}

/**
 * An interval session. The reps carry the detail; everything shown - best rep,
 * average, pace, how much they faded - is worked out from them, never stored,
 * so a summary can never disagree with the reps behind it.
 */
export interface IntervalEntry {
  id: string
  date: string
  /** Distance of a single rep, in metres. */
  distanceM: number
  reps: IntervalRep[]
  /** Recovery between reps, in seconds. Optional - plenty of sessions are by feel. */
  restSeconds?: number
  note?: string
}

/** A swim. Metres rather than kilometres, and paced per 100 m. */
export interface SwimEntry {
  id: string
  date: string
  distanceM: number
  seconds: number
  note?: string
}

/** A ride. Kilometres, and read as speed rather than pace - here faster is a bigger number. */
export interface BikeEntry {
  id: string
  date: string
  distanceKm: number
  seconds: number
  note?: string
}

export interface IronLogBackup {
  app: 'ironlog'
  version: 1
  exportedAt: string
  /** Whose log this is. Optional so backups taken before the roster existed still import. */
  person?: string
  workouts: Workout[]
  maxes: MaxEntry[]
  /** Optional so backups taken before running was tracked still import. */
  broncos?: BroncoEntry[]
  runs?: RunEntry[]
  intervals?: IntervalEntry[]
  swims?: SwimEntry[]
  bikes?: BikeEntry[]
}
