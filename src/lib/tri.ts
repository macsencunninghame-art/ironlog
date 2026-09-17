import type { BikeEntry, BikeIntervalEntry, IntervalRep, SwimEntry, SwimIntervalEntry } from '@/types'
import { activeKey, readJSON, storageKey, writeJSON } from './storage'
import { syncSoon } from './sync'
import { fmtTime } from './running'
import { uid } from './utils'

/**
 * Swimming and cycling.
 *
 * Both are the same shape as a run - a distance and a time - but they are read
 * differently, and getting that wrong would make the numbers lie:
 *
 *   swim   metres, paced per 100 m, lower is better
 *   bike   kilometres, read as speed in km/h, HIGHER is better
 *
 * The direction matters wherever "improvement" is worked out, which is why the
 * two live in separate functions rather than one clever shared one.
 */

function sortByDate<T extends { date: string }>(rows: T[], newestFirst = true): T[] {
  return [...rows].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
    return newestFirst ? -diff : diff
  })
}

/**
 * How many sessions each end of the trend gets.
 *
 * The two windows must not overlap, or a session counts as both the start and
 * the end and the comparison collapses to zero - which is what two sessions and
 * a window of three used to read as, however much faster the second one was.
 */
function edgeWindow(length: number, sample: number): number {
  return Math.max(1, Math.min(sample, Math.floor(length / 2)))
}

function edgeMean(values: number[], count: number, fromEnd: boolean): number {
  const slice = fromEnd ? values.slice(-count) : values.slice(0, count)
  return slice.reduce((n, v) => n + v, 0) / slice.length
}

/** Percent improvement against the person's own start, in whichever direction is better. */
function improved(chronological: number[], sample: number, lowerIsBetter: boolean): number | null {
  if (chronological.length < 2) return null
  const window = edgeWindow(chronological.length, sample)
  const first = edgeMean(chronological, window, false)
  const last = edgeMean(chronological, window, true)
  if (first <= 0) return null
  return lowerIsBetter ? ((first - last) / first) * 100 : ((last - first) / first) * 100
}

// ---------------------------------------------------------------- swim

/** Seconds per 100 m - how swimming is universally paced. */
export function swimPace(entry: SwimEntry): number {
  return entry.distanceM > 0 ? (entry.seconds / entry.distanceM) * 100 : 0
}

export function fmtSwimPace(secondsPer100: number): string {
  return `${fmtTime(secondsPer100)} /100m`
}

export function getSwims(): SwimEntry[] {
  const stored = readJSON<SwimEntry[]>(activeKey('swims'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function getSwimsFor(personId: string): SwimEntry[] {
  const stored = readJSON<SwimEntry[]>(storageKey(personId, 'swims'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function addSwim(distanceM: number, seconds: number, date: Date, note?: string): SwimEntry {
  const entry: SwimEntry = { id: uid(), date: date.toISOString(), distanceM, seconds, note }
  writeJSON(activeKey('swims'), [...getSwims(), entry])
  syncSoon()
  return entry
}

export interface SwimStats {
  swims: number
  totalM: number
  bestPace: number | null
  improvedPct: number | null
}

export function swimStats(rows: SwimEntry[]): SwimStats {
  if (!rows.length) return { swims: 0, totalM: 0, bestPace: null, improvedPct: null }

  const paces = sortByDate(rows, false)
    .filter((s) => s.distanceM > 0 && s.seconds > 0)
    .map(swimPace)

  return {
    swims: rows.length,
    totalM: rows.reduce((n, s) => n + s.distanceM, 0),
    bestPace: paces.length ? Math.min(...paces) : null,
    improvedPct: improved(paces, 3, true),
  }
}

// ---------------------------------------------------------------- bike

/** Kilometres per hour. The one figure in the app where bigger is better. */
export function bikeSpeed(entry: BikeEntry): number {
  return entry.seconds > 0 ? entry.distanceKm / (entry.seconds / 3600) : 0
}

export function fmtSpeed(kmh: number): string {
  return `${kmh.toFixed(1)} km/h`
}

export function getBikes(): BikeEntry[] {
  const stored = readJSON<BikeEntry[]>(activeKey('bikes'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function getBikesFor(personId: string): BikeEntry[] {
  const stored = readJSON<BikeEntry[]>(storageKey(personId, 'bikes'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function addBike(distanceKm: number, seconds: number, date: Date, note?: string): BikeEntry {
  const entry: BikeEntry = { id: uid(), date: date.toISOString(), distanceKm, seconds, note }
  writeJSON(activeKey('bikes'), [...getBikes(), entry])
  syncSoon()
  return entry
}

export interface BikeStats {
  rides: number
  totalKm: number
  bestSpeed: number | null
  improvedPct: number | null
}

export function bikeStats(rows: BikeEntry[]): BikeStats {
  if (!rows.length) return { rides: 0, totalKm: 0, bestSpeed: null, improvedPct: null }

  const speeds = sortByDate(rows, false)
    .filter((b) => b.distanceKm > 0 && b.seconds > 0)
    .map(bikeSpeed)

  return {
    rides: rows.length,
    totalKm: rows.reduce((n, b) => n + b.distanceKm, 0),
    bestSpeed: speeds.length ? Math.max(...speeds) : null,
    // Speed rises as you improve, so this one is not inverted.
    improvedPct: improved(speeds, 3, false),
  }
}

// ---------------------------------------------------------------- interval sessions
//
// Same shape for both - a rep distance and one time per rep - but read in each
// discipline's own terms, because the rate that matters differs and the direction
// of "better" differs with it.

export interface IntervalSummary {
  reps: number
  best: number
  average: number
  /** Pace or speed, in whatever the discipline is read in. */
  rate: number
  /** How much slower the last rep was than the first, as a percentage. */
  fade: number | null
}

function summariseReps(reps: IntervalRep[], rate: (average: number) => number): IntervalSummary | null {
  const times = reps.map((r) => r.seconds).filter((n) => n > 0)
  if (!times.length) return null

  const average = times.reduce((n, t) => n + t, 0) / times.length
  const first = times[0]
  const last = times[times.length - 1]

  return {
    reps: times.length,
    best: Math.min(...times),
    average,
    rate: rate(average),
    fade: times.length > 1 && first > 0 ? ((last - first) / first) * 100 : null,
  }
}

// ---- swim intervals: seconds per 100 m, lower is better

export function getSwimIntervals(): SwimIntervalEntry[] {
  const stored = readJSON<SwimIntervalEntry[]>(activeKey('swimIntervals'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function addSwimInterval(
  distanceM: number,
  reps: IntervalRep[],
  date: Date,
  restSeconds?: number,
): SwimIntervalEntry {
  const entry: SwimIntervalEntry = {
    id: uid(),
    date: date.toISOString(),
    distanceM,
    reps,
    restSeconds,
  }
  writeJSON(activeKey('swimIntervals'), [...getSwimIntervals(), entry])
  syncSoon()
  return entry
}

export function summariseSwimInterval(entry: SwimIntervalEntry): IntervalSummary | null {
  if (entry.distanceM <= 0) return null
  return summariseReps(entry.reps, (average) => (average / entry.distanceM) * 100)
}

// ---- bike intervals: km/h, higher is better

export function getBikeIntervals(): BikeIntervalEntry[] {
  const stored = readJSON<BikeIntervalEntry[]>(activeKey('bikeIntervals'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function addBikeInterval(
  distanceKm: number,
  reps: IntervalRep[],
  date: Date,
  restSeconds?: number,
): BikeIntervalEntry {
  const entry: BikeIntervalEntry = {
    id: uid(),
    date: date.toISOString(),
    distanceKm,
    reps,
    restSeconds,
  }
  writeJSON(activeKey('bikeIntervals'), [...getBikeIntervals(), entry])
  syncSoon()
  return entry
}

export function summariseBikeInterval(entry: BikeIntervalEntry): IntervalSummary | null {
  if (entry.distanceKm <= 0) return null
  return summariseReps(entry.reps, (average) => entry.distanceKm / (average / 3600))
}

export interface IntervalSessionStats {
  sessions: number
  best: number | null
  /** Percent improvement on the session rate, first three against the last three. */
  improvedPct: number | null
}

/** `lowerIsBetter` flips both the "best" pick and the direction of improvement. */
function sessionStats(rates: number[], bests: number[], lowerIsBetter: boolean): IntervalSessionStats {
  return {
    sessions: rates.length,
    best: bests.length ? (lowerIsBetter ? Math.min(...bests) : Math.max(...bests)) : null,
    improvedPct: improved(rates, 3, lowerIsBetter),
  }
}

export function swimIntervalStats(rows: SwimIntervalEntry[]): IntervalSessionStats {
  const summaries = sortByDate(rows, false)
    .map(summariseSwimInterval)
    .filter((s): s is IntervalSummary => s !== null)
  return sessionStats(
    summaries.map((s) => s.rate),
    summaries.map((s) => s.rate),
    true,
  )
}

export function bikeIntervalStats(rows: BikeIntervalEntry[]): IntervalSessionStats {
  const summaries = sortByDate(rows, false)
    .map(summariseBikeInterval)
    .filter((s): s is IntervalSummary => s !== null)
  return sessionStats(
    summaries.map((s) => s.rate),
    summaries.map((s) => s.rate),
    false,
  )
}
