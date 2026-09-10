import type { MaxEntry } from '@/types'
import { activeKey, readJSON, writeJSON } from './storage'
import { uid } from './utils'
import { syncSoon } from './sync'

/**
 * Tested one-rep maxes.
 *
 * Deliberately separate from training PRs: these are numbers you went and tested,
 * entered by hand. If they fed into PR detection, a heavy tested max would mean
 * no working set ever registered as a PR again.
 *
 * This is the one part of the app that is user-editable.
 */

export interface MaxLift {
  id: string
  name: string
  /** Shown when the board is empty, purely as a hint of what belongs here. */
  note?: string
}

export const MAX_LIFTS: MaxLift[] = [
  { id: 'flat-bench', name: 'Flat Bench Press' },
  { id: 'bb-back-squat', name: 'BB Back Squat' },
  { id: 'deadlift', name: 'Deadlift' },
  { id: 'overhead-press', name: 'Overhead Press' },
  { id: 'weighted-pullup', name: 'Weighted Pull Up', note: 'Added weight' },
  { id: 'weighted-dip', name: 'Weighted Dip', note: 'Added weight' },
  { id: 'weighted-muscle-up', name: 'Weighted Muscle Up', note: 'Added weight' },
]

export function readMaxes(): MaxEntry[] {
  const stored = readJSON<MaxEntry[]>(activeKey('maxes'), [])
  return Array.isArray(stored) ? stored : []
}

export function writeMaxes(entries: MaxEntry[]): void {
  writeJSON(activeKey('maxes'), entries)
  syncSoon()
}

/** Full dated history for one lift, oldest first. */
export function historyFor(liftId: string): MaxEntry[] {
  return readMaxes()
    .filter((m) => m.liftId === liftId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/** The most recently dated entry - what the board shows as current. */
export function currentMax(liftId: string): MaxEntry | null {
  const history = historyFor(liftId)
  return history.length ? history[history.length - 1] : null
}

/** Best ever recorded, which may predate the current entry if you deload. */
export function bestMax(liftId: string): MaxEntry | null {
  const history = historyFor(liftId)
  if (!history.length) return null
  return history.reduce((best, e) => (e.weight > best.weight ? e : best), history[0])
}

export function addMax(liftId: string, weight: number, date: Date): MaxEntry {
  const entry: MaxEntry = {
    id: uid(),
    liftId,
    weight,
    date: date.toISOString(),
  }
  writeMaxes([...readMaxes(), entry])
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
export function deleteMax(id: string): void {
  writeMaxes(readMaxes().filter((m) => m.id !== id))
}

/** Change since the first entry, for the trend pill on each card. */
export function maxDelta(liftId: string): number | null {
  const history = historyFor(liftId)
  if (history.length < 2) return null
  return history[history.length - 1].weight - history[0].weight
}
