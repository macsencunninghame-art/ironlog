import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Dumbbell, Users, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SECTIONS, sectionForPath } from '@/lib/sections'
import { Avatar } from './Avatar'
import { StorageWarning } from './StorageWarning'
import { usePerson } from './PersonScope'

export function Layout() {
  const { person, routine, href } = usePerson()
  const { pathname } = useLocation()

  const current = sectionForPath(person.id, pathname)
  const subPages = current.pages

  return (
    <div className="min-h-full lg:flex">
      {/* Desktop sidebar: the groups shown open, since there is room for them */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-ink-600/60 lg:bg-ink-950/40 lg:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent2 shadow-lg shadow-accent/30">
            <Dumbbell className="h-6 w-6 text-accent-fg" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight leading-none">IronLog</div>
            <div className="text-[11px] font-medium text-chalk-faint">Training log</div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-ink-600/70 bg-ink-800/60 p-3">
          <div className="flex items-center gap-3">
            <Avatar person={person} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold leading-tight">{person.name}</div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-chalk-faint">
                {routine.length ? `${routine.length}-day routine` : 'No routine yet'}
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

        <nav className="flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <div key={section.id}>
              {section.pages.length === 0 ? (
                <SidebarLink to={href(section.landing)} end={section.end} label={section.label} icon={section.icon} />
              ) : (
                <>
                  <div className="mb-1.5 flex items-center gap-2 px-2">
                    <section.icon className="h-3.5 w-3.5 text-chalk-faint" strokeWidth={2.4} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-chalk-faint">
                      {section.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {section.pages.map((page) => (
                      <SidebarLink
                        key={page.sub}
                        to={href(page.sub)}
                        label={page.label}
                        muted={page.placeholder}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-8 text-[11px] leading-relaxed text-chalk-faint">
          All weights in kilograms.
          <br />
          Each person&apos;s routine and log are their own.
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-600/50 bg-ink-900/85 px-4 py-3 backdrop-blur-lg lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2">
            <Dumbbell className="h-5 w-5 text-accent-fg" strokeWidth={2.5} />
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

        {/* Pills for the pages within the section you are in */}
        {subPages.length > 0 && (
          <div className="sticky top-[60px] z-10 border-b border-ink-600/40 bg-ink-900/80 backdrop-blur-lg lg:hidden">
            {/* Sized so all five Gym pills fit a 360px screen; still scrolls if a
                future section adds more. */}
            <div className="no-scrollbar flex gap-1 overflow-x-auto px-4 py-2">
              {subPages.map((page) => (
                <NavLink
                  key={page.sub}
                  to={href(page.sub)}
                  className={({ isActive }) =>
                    cn(
                      'shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors',
                      isActive
                        ? 'bg-accent text-accent-fg'
                        : page.placeholder
                          ? 'bg-ink-800 text-chalk-faint'
                          : 'bg-ink-800 text-chalk-muted',
                    )
                  }
                >
                  {page.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        <StorageWarning className="mx-4 mt-3 lg:mx-10" />

        <main className="flex-1 px-4 pb-28 pt-4 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tabs: one per section, so three rather than seven */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-600/60 bg-ink-950/92 pt-1.5 backdrop-blur-lg lg:hidden">
          <div className="flex items-stretch justify-around">
            {SECTIONS.map((section) => {
              const active = section.id === current.id
              const Icon = section.icon
              return (
                <Link
                  key={section.id}
                  to={href(section.landing)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors',
                    active ? 'text-accent' : 'text-chalk-faint',
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.6 : 2} />
                  <span className="w-full truncate text-center text-[10px] font-bold tracking-tight">
                    {section.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  end,
  muted,
}: {
  to: string
  label: string
  icon?: LucideIcon
  end?: boolean
  muted?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all',
          isActive
            ? 'bg-gradient-to-r from-accent/20 to-accent2/10 text-chalk shadow-inner ring-1 ring-accent/30'
            : muted
              ? 'text-chalk-faint hover:bg-ink-700/60 hover:text-chalk-muted'
              : 'text-chalk-muted hover:bg-ink-700/60 hover:text-chalk',
        )
      }
    >
      {({ isActive }) => (
        <>
          {Icon && <Icon className={cn('h-5 w-5', isActive && 'text-accent')} strokeWidth={2.3} />}
          {label}
        </>
      )}
    </NavLink>
  )
}
