# IronLog

A gym tracker for a few people on the same device, each with their own routine and their own
log. Mobile-first, all weights in kilograms, no backend, no accounts. Everything lives in your
browser.

## What it does

- **Home** — three tabs, each sized to be taken in at a glance: **Train** (the roster, with each
  person's session count and when they last trained), **Photos** (everyone's most recent shot, with
  a camera on every tile) and **Progress** (**Who's improving**, charting everyone side by side).
- **Dashboard** — suggests your next day, tracks the week's goal of one session per routine day, shows streak,
  volume, sessions and PRs, plus a progression chart and recent activity.
- **Log Workout** — pick Day 1/2/3, tick warmups, log weight × reps per set. PRs flash lime
  as you type. Prescribed sets are pre-filled from last time; add or remove sets on the day.
- **Routine** — read-only view of all three days with warmup, superset and drop-set markers.
- **Training** — everything conditioning. **Running** (Bronco tests and logged runs, each with an
  improvement chart and a comparison across everyone) is built; **Hyrox** and **Tri** are named
  placeholders that say so rather than offering forms that go nowhere.
- **Progress** — line chart per exercise (top set or estimated 1RM) and a 12-week volume bar
  chart, plus **Compare everyone**: who is actually improving, measured against their own numbers.
- **1RM Board** — your tested one-rep maxes, entered by hand, with dated history and a chart.
- **History** — every past session, expandable, filterable by day, deletable. Export/import
  backup, and a **Photos** gallery of the shots taken at each session.

## Who uses it

The roster is hardcoded in `src/lib/people.ts`, the same way the routines are.

| Person | Accent | Routine |
| --- | --- | --- |
| Macsy | Orange | The 3-day full body split |
| Mitchy | Lime | The same split, started ~25% lighter |
| Mezza | Pink | The same split, started ~45% lighter |
| McGinley | Violet | The same split, started ~15% lighter |

Everyone currently trains the same days, from different starting loads — a convenience while the
app fills out, not an assumption. `scaledFullBody3(factor)` builds the split at someone's own
numbers, and anyone can be handed a completely different routine the moment theirs should differ.
Every screen follows from whatever their routine says, including having none at all.

Each person's workouts, photos, tested maxes, PRs, streak and charts are entirely their own. The
person is part of the URL, so `/p/macsy/progress` and `/p/mezza/progress` are different pages, and
**Switch person** in the sidebar (or the name chip in the mobile header) goes back to the picker.

The interface is repainted in whoever's section you are in: their accent drives buttons, active
tabs, links, charts and the ambient background wash. Lime carries dark text where the others carry
white, so a bright accent never leaves a button unreadable. The lime "PR" colour is deliberately
*not* per person — it means the same thing on everyone's screen.

To add someone, add an entry to `PEOPLE` with an unused accent and a routine. Avatars are drawn
from each person's initials rather than uploaded — the app ships no image assets.

## The routines are fixed

Routines live in `src/lib/routine.ts` and are assigned to people in `src/lib/people.ts`. The
days, their exercises and the starting weights are all hardcoded. There is deliberately no
settings screen — the only way to change a routine is to edit that file. This keeps the numbers
behind your charts honest.

Give someone `[]` and they have no training days: rather than showing them someone else's split
or a dashboard of zeroes, Home, Log and Routine say **No routine yet**.

## Comparing people

Absolute load is not comparable — whoever is strongest would always look like they were doing
best, which says nothing about who is improving. So **Compare everyone** measures each person
against their own starting point:

- Each lift's progress is the ratio of the most recent session to the first one it appears in, so
  +15% means the same off 40 kg as off 140 kg.
- Those ratios are averaged **geometrically**, not arithmetically — 1.5x and 0.5x should average
  out to no change, not to +50%.
- Results are grouped by movement pattern (**Legs / Push / Pull**) rather than by exercise, so two
  people can be compared without training a single lift in common. `EXERCISE_GROUPS` maps lifts to
  patterns; anything unmapped is left out rather than guessed at.
- A lift needs two logged sessions before it counts. Drop sets are excluded, as they are from PRs.

The same figures appear in two places: the full breakdown under **Progress → Compare everyone**,
and a compact chart on the home picker. Bars there are coloured per person and share one scale
across all three groups, so a bar twice as long really is twice the improvement — each row is
labelled with the person's initials too, so it reads without matching colours to the legend.

## Getting around

Inside a person's log the bottom bar carries three tabs rather than the seven it had grown to:

| Tab | Holds |
| --- | --- |
| Home | Their dashboard |
| Gym | Log · Routine · Progress · Maxes · History |
| Training | Running · Hyrox · Tri |

Choosing a tab opens the section's first page and a row of pills for the rest of it, so anything
is one tap from anywhere. The pills are sized to fit five across a 360px screen and scroll if a
section ever grows past that. On a desktop the sidebar drops the pills and lists both groups open.

Sections are defined in `src/lib/sections.ts` — adding a page is an entry in that list plus a
route, and the navigation follows.

## Running

Running is deliberately kept out of the lifting log: a Bronco time and a run pace both improve by
going *down*, and letting them near volume or PR detection would quietly corrupt both.

- **Bronco** — 5 × (20-40-60 m shuttles), 1200 m against the clock. One time per test; the chart
  wants to head downwards. Improvement is the first test against the latest.
- **Runs** — distance and time. Pace is derived from those two and never stored, so it cannot
  disagree with the numbers behind it. Improvement averages the first three runs against the last
  three, because pace swings with distance and terrain and a single first run is a poor baseline.
- **Compare** — the same principle as lifting: everyone against their own starting point, so the
  quickest person is not automatically the one improving most. A positive figure always means
  faster.

Times are entered as `5:42` or `1:05:30`. Anything that is not a time is refused rather than
guessed at, and only the leading unit may pass 59 — `90:00` is a legitimate ninety minutes.

### Strava

Not connected, and it cannot be from this app as it stands. Strava's OAuth requires the
`client_secret` in the token exchange and does not document PKCE support, so a static site has
nowhere to keep that secret — putting it in the frontend hands it to anyone who opens devtools.

Linking it would need a small serverless function on Vercel to hold the secret and perform the
exchange, a registered Strava API application, and a stored refresh token per person. `RunEntry`
already carries a `source` field so imported activities can be told apart from hand-entered ones.

## Nothing can be deleted

There is no delete button anywhere in the app — not for a session, a photo, a tested max, a Bronco
or a run. A mis-tap on a phone should never be able to cost someone months of training, and with a
log that lives only on one device there is no second copy to fall back on.

The `delete*` functions still exist in `src/lib/`, deliberately unwired. They are the code-level
escape hatch for an entry that genuinely has to go — callable from the browser console.

The route that needs no console: **Export** from History, edit the JSON by hand, **Import** it
back. Import is the one destructive action left in the app, and it replaces that person's whole
log, so it asks first.

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
| Running | Kept apart from lifting. Never counts toward volume, PRs or the week's goal. |
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

Each person's log is stored in this browser under `ironlog:<person>:workouts`,
`ironlog:<person>:maxes`, `ironlog:<person>:broncos` and `ironlog:<person>:runs` — so
`ironlog:macsy:workouts`, `ironlog:mitchy:maxes`, and so on.

Photos are different. They live in **IndexedDB** (`ironlog-photos`), because a single compressed
photo is larger than an entire training history and a handful would blow the ~5 MB localStorage
quota and take the workouts down with it. Each one is resized to 1280px and re-encoded as JPEG on
the way in, which turns a 4 MB phone shot into roughly 150–300 KB.

## Sharing between devices

With `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` set, the log is also **shared**: every device
keeps its own full copy and syncs with the others in the background. Without those two variables
the app behaves exactly as it always did — everything on the device, nothing uploaded, no network
calls at all. A missing or wrong key degrades to local-only rather than a broken app.

Sync leans on one property: nothing can be edited or deleted, so the data is append-only. Two
devices that have drifted apart have not disagreed about anything — they have each seen entries
the other has not — so merging is a union by id. No conflicts, no last-write-wins, and no way for
a sync to lose an entry. That is also why every read stayed synchronous and instant, and why the
app still works with no signal: a session logged in a basement uploads itself when the signal
returns.

It runs at boot, when the app is brought back to the front, when the connection returns, and
shortly after a write. Nothing is force-refreshed underneath you — pages re-read when they mount,
so a background pull is picked up by the next navigation rather than making a half-typed session
disappear.

Photos sync too: the image goes to Supabase Storage and a row describing it to the table. The row
is written second, so an interrupted upload leaves an orphaned file rather than a row pointing at
an image that is not there.

Setting it up is `supabase/schema.sql` run once in the Supabase SQL editor, then the two variables
in the host's environment. Access is currently open — anyone with the site can read and write —
but RLS is on with permissive policies, so adding logins later is a policy change rather than a
rewrite. No policy grants `DELETE` to anyone.

## Backups

Clearing your browsing data erases this device's copy. If it has synced, the shared database still
has it and the next sync brings it back; if it never synced, it is gone. Without the shared
database configured, nothing leaves the device at all.

Use **Export** on the History page now and again and keep the JSON file somewhere safe.
Backups are per person: the file is named after whoever is logged in and stamped with their
name, and **Import** replaces the log of whoever you are currently in - it will tell you if the
file came from someone else.

Photos can be taken in the app or uploaded, from the home screen, the Log page or the gallery.
The camera is a live preview through `getUserMedia` rather than an `<input capture>` handoff, so
it works on a laptop as well as a phone, and falls back to the file picker where a camera is
missing or blocked. It needs a secure origin — fine on the deployed site and on localhost.

**Photos are not included in the backup.** Putting them in would balloon the JSON from kilobytes
to megabytes. Save any photo you would hate to lose from the gallery — each one has a Save button.

A log written before the app supported more than one person is moved into Macsy's namespace
automatically on first load, so nothing is lost in the upgrade.

If a browser blocks local storage entirely (private mode, blocked cookies), the app falls back
to memory for the session and shows a warning banner rather than crashing.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · D3 · react-router-dom · lucide-react

UI components in `src/components/ui/` are written directly into the project rather than pulled
from a component library, so there is nothing extra to install or initialise.
