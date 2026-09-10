import React, { createContext, useContext, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { findPerson, personPath, themeVars, type Person } from '@/lib/people'
import type { RoutineDay } from '@/lib/routine'
import { setActivePerson } from '@/lib/storage'
import { Layout } from './Layout'

interface PersonScopeValue {
  person: Person
  /** This person's days. Empty when their routine has not been written yet. */
  routine: RoutineDay[]
  /** Absolute path to a page inside this person's section, e.g. href('/log?day=2'). */
  href: (sub?: string) => string
}

const PersonContext = createContext<PersonScopeValue | null>(null)

export function usePerson(): PersonScopeValue {
  const value = useContext(PersonContext)
  if (!value) throw new Error('usePerson must be called inside a person route.')
  return value
}

/**
 * Everything under /p/:personId renders through here.
 *
 * It points storage at the right person during render, before any page below has a
 * chance to read a workout, and turns an unknown name in the URL back to the picker.
 */
export function PersonScope() {
  const { personId } = useParams<{ personId: string }>()
  const person = findPerson(personId)

  const value = useMemo(
    () =>
      person
        ? { person, routine: person.routine, href: (sub = '') => personPath(person.id, sub) }
        : null,
    [person],
  )

  // Deliberately during render, not in an effect: children render immediately after
  // this and read from storage as they go, so the switch has to have happened first.
  if (person) setActivePerson(person.id)

  if (!person || !value) return <Navigate to="/" replace />

  return (
    <PersonContext.Provider value={value}>
      {/* Every accent class below resolves through these variables, so the whole
          interface takes on this person's colours. */}
      <div
        className="app-glow min-h-full"
        style={themeVars(person.theme) as React.CSSProperties}
      >
        <Layout />
      </div>
    </PersonContext.Provider>
  )
}
