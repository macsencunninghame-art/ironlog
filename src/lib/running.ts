import type { BroncoEntry, IntervalEntry, IntervalRep, RunEntry } from '@/types'
import { activeKey, readJSON, storageKey, writeJSON } from './storage'
import { PEOPLE, type Person } from './people'
import { uid } from './utils'
import { syncSoon } from './sync'

/**
 * Running: Bronco tests and logged runs.
 *
 * Kept apart from the lifting log because the numbers behave in the opposite
 * direction - on a Bronco and on pace, lower is better - and mixing them into
 * volume or PR detection would quietly corrupt both.
 */

// ---------------------------------------------------------------- time helpers

/** `5:42` or `1:05:30` -> seconds. Null when it is not a time at all. */
export function parseTime(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const parts = trimmed.split(':').map((p) => p.trim())
  if (parts.length > 3 || parts.some((p) => p === '' || !/^\d*\.?\d+$/.test(p))) return null

  const numbers = parts.map(Number)
  if (numbers.some((n) => Number.isNaN(n) || n < 0)) return null
  // Only the leading unit may exceed 59: 90:00 is a legitimate ninety minutes.
  if (numbers.slice(1).some((n) => n >= 60)) return null

  const seconds = numbers.reduce((total, n) => total * 60 + n, 0)
  return seconds > 0 ? seconds : null
}

/** Seconds -> `5:42`, or `1:05:30` once it passes an hour. */
export function fmtTime(seconds: number): string {
  const whole = Math.round(seconds)
  const h = Math.floor(whole / 3600)
  const m = Math.floor((whole % 3600) / 60)
  const s = whole % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

/** Seconds per kilometre for one run. */
export function paceOf(run: RunEntry): number {
  return run.distanceKm > 0 ? run.seconds / run.distanceKm : 0
}

export function fmtPace(secondsPerKm: number): string {
  return `${fmtTime(secondsPerKm)} /km`
}

// ---------------------------------------------------------------- storage

function sortByDate<T extends { date: string }>(rows: T[], newestFirst = true): T[] {
  return [...rows].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
    return newestFirst ? -diff : diff
  })
}

export function getBroncos(): BroncoEntry[] {
  const stored = readJSON<BroncoEntry[]>(activeKey('broncos'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function getBroncosFor(personId: string): BroncoEntry[] {
  const stored = readJSON<BroncoEntry[]>(storageKey(personId, 'broncos'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function addBronco(seconds: number, date: Date, note?: string): BroncoEntry {
  const entry: BroncoEntry = { id: uid(), date: date.toISOString(), seconds, note }
  writeJSON(activeKey('broncos'), [...getBroncos(), entry])
  syncSoon()
  return entry
}

/**
 * Deliberately not wired to any button.
 *
 * Nothing can be deleted from inside the app: a mis-tap should never be able to
 * cost someone months of training. This stays exported as the code-level escape
 * hatch - callable from the browser console, or from a one-off script - for the
 * rare entry that genuinely has to go.
 *
 * The route that needs no console at all is Export from History, editing the
 * JSON by hand, and Importing it back.
 */
export function deleteBronco(id: string): void {
  writeJSON(
    activeKey('broncos'),
    getBroncos().filter((b) => b.id !== id),
  )
}

export function getRuns(): RunEntry[] {
  const stored = readJSON<RunEntry[]>(activeKey('runs'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function getRunsFor(personId: string): RunEntry[] {
  const stored = readJSON<RunEntry[]>(storageKey(personId, 'runs'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function addRun(
  distanceKm: number,
  seconds: number,
  date: Date,
  note?: string,
): RunEntry {
  const entry: RunEntry = {
    id: uid(),
    date: date.toISOString(),
    distanceKm,
    seconds,
    note,
    source: 'manual',
  }
  writeJSON(activeKey('runs'), [...getRuns(), entry])
  syncSoon()
  return entry
}

/**
 * Deliberately not wired to any button.
 *
 * Nothing can be deleted from inside the app: a mis-tap should never be able to
 * cost someone months of training. This stays exported as the code-level escape
 * hatch - callable from the browser console, or from a one-off script - for the
 * rare entry that genuinely has to go.
 *
 * The route that needs no console at all is Export from History, editing the
 * JSON by hand, and Importing it back.
 */
export function deleteRun(id: string): void {
  writeJSON(
    activeKey('runs'),
    getRuns().filter((r) => r.id !== id),
  )
}

// ---------------------------------------------------------------- progression

/** The two ends of a trend must not overlap, or a short history compares a session with itself. */
function edgeWindow(length: number, sample: number): number {
  return Math.max(1, Math.min(sample, Math.floor(length / 2)))
}

/** Mean of the first or last few values, to stop one good day defining a trend. */
function edgeMean(values: number[], count: number, fromEnd: boolean): number {
  const slice = fromEnd ? values.slice(-count) : values.slice(0, count)
  return slice.reduce((n, v) => n + v, 0) / slice.length
}

/**
 * Percentage faster, against the person's own starting point.
 *
 * Both Bronco time and pace are "lower is better", so the sign is flipped
 * relative to the lifting comparison: a positive number always means improved.
 */
function fasterBy(chronological: number[], sample: number): number | null {
  if (chronological.length < 2) return null
  const window = edgeWindow(chronological.length, sample)
  const first = edgeMean(chronological, window, false)
  const last = edgeMean(chronological, window, true)
  if (first <= 0) return null
  return ((first - last) / first) * 100
}

export interface BroncoStats {
  entries: number
  latest: BroncoEntry | null
  /** Fastest ever - the one worth chasing. */
  best: BroncoEntry | null
  /** Percent faster from first test to latest. */
  improvedPct: number | null
}

export function broncoStats(rows: BroncoEntry[]): BroncoStats {
  if (!rows.length) return { entries: 0, latest: null, best: null, improvedPct: null }

  const chronological = sortByDate(rows, false)
  return {
    entries: rows.length,
    latest: chronological[chronological.length - 1],
    best: chronological.reduce((b, e) => (e.seconds < b.seconds ? e : b), chronological[0]),
    // A Bronco is a discrete test done rarely, so first against latest, not a mean.
    improvedPct: fasterBy(chronological.map((e) => e.seconds), 1),
  }
}

export interface RunStats {
  runs: number
  totalKm: number
  latest: RunEntry | null
  /** Quickest pace over any run, whatever the distance. */
  bestPace: number | null
  /** Percent faster on pace, first three runs against the last three. */
  improvedPct: number | null
}

export function runStats(rows: RunEntry[]): RunStats {
  if (!rows.length) {
    return { runs: 0, totalKm: 0, latest: null, bestPace: null, improvedPct: null }
  }

  const chronological = sortByDate(rows, false).filter((r) => r.distanceKm > 0 && r.seconds > 0)
  const paces = chronological.map(paceOf)

  return {
    runs: rows.length,
    totalKm: rows.reduce((n, r) => n + r.distanceKm, 0),
    latest: chronological[chronological.length - 1] ?? null,
    bestPace: paces.length ? Math.min(...paces) : null,
    // Averaged over three at each end: pace swings with distance and terrain,
    // so a single first run makes a poor baseline.
    improvedPct: fasterBy(paces, 3),
  }
}

// ---------------------------------------------------------------- comparison

export interface RunningProgress {
  person: Person
  bronco: BroncoStats
  run: RunStats
}

/** Everyone's running, for the comparison charts. */
export function runningForEveryone(): RunningProgress[] {
  return PEOPLE.map((person) => ({
    person,
    bronco: broncoStats(getBroncosFor(person.id)),
    run: runStats(getRunsFor(person.id)),
  }))
}

// ---------------------------------------------------------------- intervals

export function getIntervals(): IntervalEntry[] {
  const stored = readJSON<IntervalEntry[]>(activeKey('intervals'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function getIntervalsFor(personId: string): IntervalEntry[] {
  const stored = readJSON<IntervalEntry[]>(storageKey(personId, 'intervals'), [])
  return Array.isArray(stored) ? sortByDate(stored) : []
}

export function addInterval(
  distanceM: number,
  reps: IntervalRep[],
  date: Date,
  restSeconds?: number,
  note?: string,
): IntervalEntry {
  const entry: IntervalEntry = {
    id: uid(),
    date: date.toISOString(),
    distanceM,
    reps,
    restSeconds,
    note,
  }
  writeJSON(activeKey('intervals'), [...getIntervals(), entry])
  syncSoon()
  return entry
}

export interface IntervalSummary {
  reps: number
  /** Metres covered in the working reps, ignoring recovery. */
  totalM: number
  best: number
  average: number
  /**
   * The session's pace, in seconds per kilometre. Named `rate` rather than
   * `pace` because swimming and cycling summarise the same way and one of them
   * reads as a speed.
   */
  rate: number
  /**
   * How much slower the last rep was than the first, as a percentage.
   * Negative means they finished faster than they started.
   */
  fade: number | null
}

export function summarise(entry: IntervalEntry): IntervalSummary | null {
  const times = entry.reps.map((r) => r.seconds).filter((n) => n > 0)
  if (!times.length || entry.distanceM <= 0) return null

  const total = times.reduce((n, t) => n + t, 0)
  const average = total / times.length
  const first = times[0]
  const last = times[times.length - 1]

  return {
    reps: times.length,
    totalM: entry.distanceM * times.length,
    best: Math.min(...times),
    average,
    rate: (average / entry.distanceM) * 1000,
    fade: times.length > 1 && first > 0 ? ((last - first) / first) * 100 : null,
  }
}

export interface IntervalStats {
  sessions: number
  /** Quickest single rep at the most recently used distance. */
  bestRep: { seconds: number; distanceM: number } | null
  totalKm: number
  /** Percent faster on average rep pace, first three sessions against the last three. */
  improvedPct: number | null
}

export function intervalStats(rows: IntervalEntry[]): IntervalStats {
  if (!rows.length) return { sessions: 0, bestRep: null, totalKm: 0, improvedPct: null }

  const chronological = sortByDate(rows, false)
  const summaries = chronological
    .map((e) => ({ entry: e, summary: summarise(e) }))
    .filter((x): x is { entry: IntervalEntry; summary: IntervalSummary } => x.summary !== null)

  // The fastest single rep, carrying its distance. Comparing a 200 against a 400
  // would be meaningless, so the figure is always shown with what it was run over
  // rather than pretending one number ranks them all.
  let bestRep: IntervalStats['bestRep'] = null
  let totalM = 0
  for (const { entry, summary } of summaries) {
    totalM += summary.totalM
    const betterPace = !bestRep || summary.best / entry.distanceM < bestRep.seconds / bestRep.distanceM
    if (betterPace) bestRep = { seconds: summary.best, distanceM: entry.distanceM }
  }

  return {
    sessions: rows.length,
    bestRep,
    totalKm: totalM / 1000,
    improvedPct: fasterBy(summaries.map((x) => x.summary.rate), 3),
  }
}
