import type { BikeEntry, SwimEntry } from '@/types'
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

function edgeMean(values: number[], count: number, fromEnd: boolean): number {
  const slice = fromEnd ? values.slice(-count) : values.slice(0, count)
  return slice.reduce((n, v) => n + v, 0) / slice.length
}

/** Percent improvement against the person's own start, in whichever direction is better. */
function improved(chronological: number[], sample: number, lowerIsBetter: boolean): number | null {
  if (chronological.length < 2) return null
  const first = edgeMean(chronological, sample, false)
  const last = edgeMean(chronological, sample, true)
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
