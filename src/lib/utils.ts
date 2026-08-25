import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/** Trims trailing zeros so 16.30 reads as 16.3 and 60.0 reads as 60. */
export function fmtKg(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return Number(value.toFixed(2)).toString()
}

export function fmtVolume(kg: number): string {
  if (kg >= 1000) return `${Number((kg / 1000).toFixed(1))}t`
  return `${Math.round(kg)}`
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

export function fmtDateLong(iso: string): string {
  const d = new Date(iso)
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

export function fmtShortDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

export function relativeDay(iso: string): string {
  const then = startOfDay(new Date(iso))
  const now = startOfDay(new Date())
  const days = Math.round((now.getTime() - then.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return 'Last week'
  return fmtShortDate(iso)
}

export function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/** Monday-based week start, per the locked spec. */
export function startOfWeek(d: Date): Date {
  const copy = startOfDay(d)
  const dow = copy.getDay() // 0 = Sunday
  const shift = dow === 0 ? 6 : dow - 1
  copy.setDate(copy.getDate() - shift)
  return copy
}

export function weekKey(d: Date): string {
  const s = startOfWeek(d)
  return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`
}

/** Local-time ISO date input value (yyyy-mm-dd), avoiding UTC drift. */
export function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Parses a yyyy-mm-dd input value as local midnight. */
export function fromDateInputValue(value: string): Date {
  const [y, m, day] = value.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, day ?? 1)
}
