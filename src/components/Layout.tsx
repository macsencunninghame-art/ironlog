import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  Dumbbell,
  History,
  LayoutGrid,
  ListChecks,
  PlusCircle,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from './Avatar'
import { StorageWarning } from './StorageWarning'
import { usePerson } from './PersonScope'

/** Paths are relative to the person, so the same tabs work for everyone. */
const NAV = [
  { sub: '', label: 'Home', icon: LayoutGrid, end: true },
  { sub: '/log', label: 'Log', icon: PlusCircle, end: false },
  { sub: '/routines', label: 'Routine', icon: ListChecks, end: false },
  { sub: '/progress', label: 'Progress', icon: TrendingUp, end: false },
  { sub: '/maxes', label: 'Maxes', icon: Trophy, end: false },
  { sub: '/history', label: 'History', icon: History, end: false },
]

export function Layout() {
  const { person, href } = usePerson()

  return (
    <div className="min-h-full lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-ink-600/60 lg:bg-ink-950/40 lg:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-flame to-hot shadow-lg shadow-flame/30">
            <Dumbbell className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight leading-none">IronLog</div>
            <div className="text-[11px] font-medium text-chalk-faint">3-day full body</div>
          </div>
        </div>

        {/* Whose log this is */}
        <div className="mb-8 rounded-2xl border border-ink-600/70 bg-ink-800/60 p-3">
          <div className="flex items-center gap-3">
            <Avatar person={person} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold leading-tight">{person.name}</div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-chalk-faint">
                Training log
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-ink-700/60 px-3 py-2 text-[11px] font-bold text-chalk-muted transition-colors hover:bg-ink-600/60 hover:text-chalk"
          >
            <Users className="h-3.5 w-3.5" strokeWidth={2.5} />
            Switch person
          </Link>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ sub, label, icon: Icon, end }) => (
            <NavLink
              key={sub}
              to={href(sub)}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-flame/20 to-hot/10 text-chalk shadow-inner ring-1 ring-flame/30'
                    : 'text-chalk-muted hover:bg-ink-700/60 hover:text-chalk',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-5 w-5', isActive && 'text-flame')} strokeWidth={2.3} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-8 text-[11px] leading-relaxed text-chalk-faint">
          All weights in kilograms.
          <br />
          Each person&apos;s log is kept separate on this device.
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-600/50 bg-ink-900/85 px-4 py-3 backdrop-blur-lg lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-flame to-hot">
            <Dumbbell className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-black tracking-tight">IronLog</span>

          <Link
            to="/"
            aria-label={`Signed in as ${person.name}. Switch person.`}
            className="ml-auto flex items-center gap-2 rounded-full border border-ink-600/70 bg-ink-800/70 py-1 pl-1 pr-3 transition-colors active:bg-ink-700"
          >
            <Avatar person={person} size="sm" className="h-7 w-7 text-[10px]" />
            <span className="text-xs font-bold">{person.name}</span>
            <Users className="h-3.5 w-3.5 text-chalk-faint" strokeWidth={2.5} />
          </Link>
        </header>

        <StorageWarning className="mx-4 mt-3 lg:mx-10" />

        <main className="flex-1 px-4 pb-28 pt-4 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tabs */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-600/60 bg-ink-950/92 pt-1.5 backdrop-blur-lg lg:hidden">
          <div className="flex items-stretch justify-around">
            {NAV.map(({ sub, label, icon: Icon, end }) => (
              <NavLink
                key={sub}
                to={href(sub)}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors',
                    isActive ? 'text-flame' : 'text-chalk-faint',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.6 : 2} />
                    <span className="text-[10px] font-bold tracking-tight">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
