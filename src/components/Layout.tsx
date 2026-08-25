import { NavLink, Outlet } from 'react-router-dom'
import { Dumbbell, History, LayoutGrid, ListChecks, PlusCircle, TrendingUp, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isEphemeral } from '@/lib/storage'

const NAV = [
  { to: '/', label: 'Home', icon: LayoutGrid, end: true },
  { to: '/log', label: 'Log', icon: PlusCircle, end: false },
  { to: '/routines', label: 'Routine', icon: ListChecks, end: false },
  { to: '/progress', label: 'Progress', icon: TrendingUp, end: false },
  { to: '/maxes', label: 'Maxes', icon: Trophy, end: false },
  { to: '/history', label: 'History', icon: History, end: false },
]

export function Layout() {
  return (
    <div className="min-h-full lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-ink-600/60 lg:bg-ink-950/40 lg:p-6">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-flame to-hot shadow-lg shadow-flame/30">
            <Dumbbell className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight leading-none">IronLog</div>
            <div className="text-[11px] font-medium text-chalk-faint">3-day full body</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
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
          Data lives on this device.
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-600/50 bg-ink-900/85 px-4 py-3 backdrop-blur-lg lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-flame to-hot">
            <Dumbbell className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-black tracking-tight">IronLog</span>
          <span className="ml-auto text-[11px] font-semibold uppercase tracking-widest text-chalk-faint">
            kg
          </span>
        </header>

        <StorageWarning />

        <main className="flex-1 px-4 pb-28 pt-4 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tabs */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-600/60 bg-ink-950/92 pt-1.5 backdrop-blur-lg lg:hidden">
          <div className="flex items-stretch justify-around">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
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

/** Only shows when localStorage is blocked and data is memory-only. */
function StorageWarning() {
  if (!isEphemeral()) return null
  return (
    <div className="mx-4 mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-200 lg:mx-10">
      This browser is blocking local storage, so anything you log will be lost when you close the tab.
      Export a backup from History if you need to keep it.
    </div>
  )
}
