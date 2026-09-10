# IronLog

A gym tracker for a few people on the same device, each with their own routine and their own
log. Mobile-first, all weights in kilograms, no backend, no accounts. Everything lives in your
browser.

## What it does

- **Home** — pick who is lifting. Everyone gets their own routine and log; the card shows their
  session count and when they last trained.
- **Dashboard** — suggests your next day, tracks the week's goal of one session per routine day, shows streak,
  volume, sessions and PRs, plus a progression chart and recent activity.
- **Log Workout** — pick Day 1/2/3, tick warmups, log weight × reps per set. PRs flash lime
  as you type. Prescribed sets are pre-filled from last time; add or remove sets on the day.
- **Routine** — read-only view of all three days with warmup, superset and drop-set markers.
- **Progress** — line chart per exercise (top set or estimated 1RM) and a 12-week volume bar chart.
- **1RM Board** — your tested one-rep maxes, entered by hand, with dated history and a chart.
- **History** — every past session, expandable, filterable by day, deletable. Export/import backup.

## Who uses it

The roster is hardcoded in `src/lib/people.ts`, the same way the routines are.

| Person | Accent | Routine |
| --- | --- | --- |
| Macsy | Orange | The 3-day full body split |
| Mitchy | Lime | None yet |
| Mezza | Pink | None yet |

Each person's workouts, tested maxes, PRs, streak and charts are entirely their own, and so are
the days they train. Nothing one person logs can appear in another's numbers. The person is part
of the URL, so `/p/macsy/progress` and `/p/mezza/progress` are different pages, and **Switch
person** in the sidebar (or the name chip in the mobile header) goes back to the picker.

Someone whose routine has not been written yet has no training days. Rather than showing them
someone else's split or a dashboard of zeroes, the pages that need days — Home, Log, Routine and
Progress — say **No routine yet**. History and the 1RM Board still work, since neither depends
on a routine.

To add someone, add an entry to `PEOPLE` with an unused accent and either an existing routine or
a new one. Avatars are drawn from each person's initials rather than uploaded — the app ships no
image assets and stores nothing on a server.

## The routines are fixed

Routines live in `src/lib/routine.ts` and are assigned to people in `src/lib/people.ts`. The
days, their exercises and the starting weights are all hardcoded. There is deliberately no
settings screen — the only way to change a routine is to edit that file. This keeps the numbers
behind your charts honest.

`FULL_BODY_3` is the 3-day full body split, currently Macsy's. A person can be given an existing
routine or a new one; give someone `[]` and they have no training days yet.

## How things are counted

| Rule | Behaviour |
| --- | --- |
| Warmups | Ticked off only. No weight, no reps, excluded from volume and PRs. |
| Drop sets | Recorded in history, excluded from PR detection. |
| Top Set PR | Heaviest load ever lifted. More reps breaks a tie at equal weight. |
| e1RM PR | Best Epley estimate: `weight × (1 + reps / 30)`. Beating either counts as a PR. |
| First entry | The first time a lift is logged it counts as a PR — nothing to beat yet. |
| Bodyweight lifts | Reps only. Their PR is the best rep count, and they add no volume. |
| Volume | `weight × reps` across completed working sets. |
| Week | Monday to Sunday. Goal is every day of that person's routine, in any order. |
| Streak | Consecutive weeks where every day of their routine was logged. |
| Tested 1RMs | Entirely separate from training PRs. They never affect PR detection. |

Within the full body split, Weighted Pullups are tracked as two separate lifts — Volume
(Day 1, higher reps) and Heavy (Day 3, lower reps) — so progress in both rep ranges stays meaningful. Preacher Curls, Hammer
Curls, Lateral Raises and Calf Training are shared across the days they appear on.

## Run it locally

Requires Node 18 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

To check a production build locally:

```bash
npm run build
```

```bash
npm run preview
```

## Deploy to Vercel

1. Push this folder to a new GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Vercel detects the **Vite** preset automatically. Leave everything as-is:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy. No environment variables are needed.

`vercel.json` adds a rewrite so deep links like `/progress` resolve to the app rather than a 404.

### Add it to your phone

Once deployed, open the URL in your phone's browser and choose **Add to Home Screen**. It
launches full-screen and your data persists between sessions.

## Your data

Each person's data is stored in this browser under `ironlog:<person>:workouts` and
`ironlog:<person>:maxes` - so `ironlog:macsy:workouts`, `ironlog:mitchy:maxes`, and so on.
Nothing is sent anywhere. That means:

- Clearing your browsing data **erases your training log**.
- The log does not sync between your phone and your laptop — they each keep their own.

Use **Export** on the History page now and again and keep the JSON file somewhere safe.
Backups are per person: the file is named after whoever is logged in and stamped with their
name, and **Import** replaces the log of whoever you are currently in - it will tell you if the
file came from someone else.

A log written before the app supported more than one person is moved into Macsy's namespace
automatically on first load, so nothing is lost in the upgrade.

If a browser blocks local storage entirely (private mode, blocked cookies), the app falls back
to memory for the session and shows a warning banner rather than crashing.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · D3 · react-router-dom · lucide-react

UI components in `src/components/ui/` are written directly into the project rather than pulled
from a component library, so there is nothing extra to install or initialise.
