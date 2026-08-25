# IronLog

A personal gym tracker for one fixed 3-day full body split. Mobile-first, all weights in
kilograms, no backend, no accounts. Everything lives in your browser.

## What it does

- **Dashboard** — suggests your next day, tracks the week's 3-workout goal, shows streak,
  volume, sessions and PRs, plus a progression chart and recent activity.
- **Log Workout** — pick Day 1/2/3, tick warmups, log weight × reps per set. PRs flash lime
  as you type. Prescribed sets are pre-filled from last time; add or remove sets on the day.
- **Routine** — read-only view of all three days with warmup, superset and drop-set markers.
- **Progress** — line chart per exercise (top set or estimated 1RM) and a 12-week volume bar chart.
- **1RM Board** — your tested one-rep maxes, entered by hand, with dated history and a chart.
- **History** — every past session, expandable, filterable by day, deletable. Export/import backup.

## The routine is fixed

The three days, their exercises and the starting weights are hardcoded in
`src/lib/routine.ts`. There is deliberately no settings screen — the only way to change the
routine is to edit that file. This keeps the numbers behind your charts honest.

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
| Week | Monday to Sunday. Goal is all 3 days, in any order, on any days. |
| Streak | Consecutive weeks where all 3 days were logged. |
| Tested 1RMs | Entirely separate from training PRs. They never affect PR detection. |

Weighted Pullups are tracked as two separate lifts — Volume (Day 1, higher reps) and Heavy
(Day 3, lower reps) — so progress in both rep ranges stays meaningful. Preacher Curls, Hammer
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

Everything is stored in this browser under `ironlog:workouts` and `ironlog:maxes`. Nothing is
sent anywhere. That means:

- Clearing your browsing data **erases your training log**.
- The log does not sync between your phone and your laptop — they each keep their own.

Use **Export** on the History page now and again and keep the JSON file somewhere safe.
**Import** restores it, replacing whatever is currently stored.

If a browser blocks local storage entirely (private mode, blocked cookies), the app falls back
to memory for the session and shows a warning banner rather than crashing.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · D3 · react-router-dom · lucide-react

UI components in `src/components/ui/` are written directly into the project rather than pulled
from a component library, so there is nothing extra to install or initialise.
