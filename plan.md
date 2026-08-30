# Weighted Football Team Randomizer — Plan

## Context

Nothing exists yet. This is a greenfield Next.js (App Router) + MongoDB app,
to be created at `/Users/haider/Documents/footy`. No code has been written —
this plan is the thing to review before `create-next-app` is run.

**Revision 2** — changes from your comments on the first draft:

- Clarified that the landing-page player selection *is* the "pool for the day"
  (comment on the team-split bullet) — the plan already worked this way, the
  wording just didn't say why it exists.
- The wheel must be **true random with a randomised spin force each time**, and
  using a library is acceptable if that gets there faster (comment on decision
  6). Reworked decision 6 and step 3 accordingly.
- **Admin can directly edit a player's locked rating**, behind a confirmation
  warning, and every rating change must be revertible (your follow-up message).
  Added decision 8, a `ratingHistory` field, and step 6a.

The app has three features:

1. **Public landing page** — a weighted wheel picker plus a player list with
   weights and recent form (`L L L W W`). Pick a subset of players, spin, get
   Team A (left) and Team B (right). No login.
2. **Public rating form** — anyone with an email can rate the players the
   admin has opened polls for, out of 10. The average becomes a player's
   locked initial weight when the admin closes that player's poll.
3. **Admin panel** — password-gated. Add players, open/close polls, view and
   disregard individual votes, and record match results (+2 win / −1 loss).

## Decisions confirmed with the user

- **Team split: snake draft.** Spin the wheel repeatedly. Each spin picks one
  player out of the remaining pool (probability proportional to their shifted
  weight), removes them from the pool, and assigns them in snake order —
  A, B, B, A, A, B, B, A, with a coin flip deciding which side leads. Weight
  drives *when* a player is picked, and the snake keeps the early (heavier)
  picks from stacking on one side. Teams are equal in size, the leading side
  taking the extra player on an odd pool. There is no cap on how many times a
  user can re-spin.
  *(Revised after the first build: strict A/B/A/B alternation gave Team A the
  1st and 3rd picks and so systematically the heavier squad — 28.5 vs 3.0 in a
  test run. Snake fixes that without changing anything else.)*
- **The player checkboxes on the landing page are the pool for the day.** Not
  everyone is available every day, so the user ticks whoever showed up and only
  those players get wheel slices. Selection is per-visit and isn't persisted —
  no "session" or "match day" concept in the data model.
- **Vote validation: email + one vote per player.** The voter types an email,
  format-validated only. No email sending, no OTP, no login. A given email can
  rate a given player exactly once — re-submitting overwrites the previous
  rating for that player rather than adding a second one. The admin sees every
  vote with the voter's email attached.
- **Admin auth: password in an env var.** A single `ADMIN_PASSWORD` in
  `.env.local`. The login form posts it, the server compares, and sets a signed
  httpOnly cookie. Middleware guards `/admin/*` and `/api/admin/*`. No user
  collection, no NextAuth.
- **Weight can go negative.** `weight = lockedRating + 2·wins − losses`. The
  raw value — negative or not — is what the player list and the admin panel
  display. Players added by the admin start at a locked rating of 0 until a
  poll closes for them.
- **Negative weights are handled by shifting inside the randomizer only.**
  Before a spin, the selected players' weights are shifted so the minimum
  becomes non-negative. The shift is never surfaced in the UI.
- **Spin feel: a fresh randomised force every spin** — random rotation count
  (~4–8), random duration, random landing offset inside the winning slice, so
  no two spins look alike. Confirmed; see decision 6 for how this sits on top
  of the crypto-backed weighted draw.

## Proposed technical decisions

These are my recommendations, not things you confirmed. Flag any you disagree
with and I'll revise before implementing.

1. **The shift is `w − min + 1`, not `w − min`.** A plain `w − min` gives the
   lowest-weighted selected player a slice of exactly zero, so they could never
   be drafted, and if every selected player has the same weight, every slice is
   zero and the wheel has nothing to pick from. Adding 1 keeps the floor player
   pickable and keeps the ratios sane at the scale weights actually live at
   (roughly 0–10). Still invisible to the user.
2. **Match results are the unit of scoring, not per-player clicks.** The admin
   records a match: pick the Team A roster, the Team B roster, and which side
   won. The server then applies +2 to every winner and −1 to every loser in one
   write, and stores the match. This is what makes the `L L L W W` streak
   possible at all — a bare `wins`/`losses` counter has no ordering. Matches
   are editable and deletable, and deleting one reverses its weight effect.
3. **Derive weight, don't store it.** Store `lockedRating` on the player and
   derive `weight` from the player's match history at read time. That way a
   corrected or deleted match can't leave a stale weight behind. Player counts
   here are small (tens), so there's no performance argument for denormalizing.
4. **Ratings are stored per (email, player) pair** in a `votes` collection with
   a unique compound index, each carrying a `disregarded` boolean. "Disregard a
   rating" flips that flag rather than deleting the row, so the admin can see
   what was thrown out and undo it. The live average excludes disregarded
   votes.
5. **Closing a poll snapshots the average into `lockedRating`.** After that,
   later votes (if the poll is reopened) don't move the weight until the admin
   closes the poll again, which re-snapshots. Reopening does not clear votes.
6. **Wheel: hand-rolled SVG first, library as fallback — and the spin is
   genuinely random.** Two separate requirements here, and it's worth keeping
   them apart:
   - *The outcome is random.* The winner of each spin is drawn from
     `crypto.getRandomValues` (not `Math.random`) against the shifted weight
     distribution. This is the real randomness and it is decided before the
     animation starts.
   - *The spin looks random.* Every spin gets a fresh randomised force — a
     random number of full rotations (roughly 4–8), a random easing duration,
     and a random landing offset within the winning slice so the pointer never
     stops at the same spot twice. The wheel then animates to whatever angle
     lands on the already-drawn winner.
   I'll build this as SVG arcs plus a CSS transform because the slice angles
   have to come from our shifted weights regardless, and that's maybe 60 lines.
   **If it doesn't feel good, I'll swap in a spin-wheel library** — but the
   weighted draw stays ours either way, because most libraries pick the winner
   themselves and won't respect our weights.
7. **Admin rating edits are guarded and reversible.** The admin can set any
   player's `lockedRating` directly. Because that silently rewrites the whole
   basis of a player's weight, it is protected two ways: the edit dialog states
   the current value, the new value, and the resulting weight change, and
   requires an explicit confirm (not a blur-to-save inline field). And every
   change to `lockedRating` — manual edit *and* poll-close snapshot — appends
   to a `ratingHistory` on the player, so any change can be reverted to the
   previous value with one click. Nothing about ratings is destructive.
8. **Stack:** Next.js App Router with TypeScript, Tailwind, the official
   `mongodb` driver (no Mongoose — the schema here is four small collections),
   and Route Handlers for the API. Server Components for the read paths,
   client components for the wheel and the forms.

## Data model

Four collections in one database.

- **`players`** — `name`, `lockedRating` (number, 0 until a poll closes),
  `pollOpen` (boolean), `active` (boolean, for soft-deleting a player without
  destroying match history), `ratingHistory` (append-only array of
  `{ from, to, source, at }` where `source` is `"poll-close"` or
  `"admin-edit"` or `"revert"`), `createdAt`.
- **`votes`** — `playerId`, `voterEmail` (lowercased), `rating` (integer 1–10),
  `disregarded` (boolean), `createdAt`, `updatedAt`. Unique compound index on
  `(playerId, voterEmail)`.
- **`matches`** — `playedAt`, `teamA` (array of playerId), `teamB` (array of
  playerId), `winner` (`"A"` | `"B"` | `"draw"`), `createdAt`. A draw applies
  no weight change to anyone and shows as `D` in the streak.
- **`settings`** — not needed for v1; the +2/−1 deltas are constants in the
  code. Mentioned only so it's clear I'm deliberately not adding it.

## Plan

### 1. Project scaffold

- `npx create-next-app@latest footy` with TypeScript, Tailwind, App Router, ESLint,
  no `src/` dir. Add the `mongodb` dependency.
- `lib/mongodb.ts` — a cached `MongoClient` promise, the standard pattern that
  survives Next's dev-mode hot reload without opening a new pool per request.
- `lib/db.ts` — typed collection accessors and the index creation
  (`votes` unique compound index, `players.name`).
- `.env.local.example` documenting `MONGODB_URI`, `MONGODB_DB`,
  `ADMIN_PASSWORD`, `AUTH_SECRET`.
- **Verify:** `npm run dev` serves the default page; a scratch route can read
  from Mongo and returns a document count.

### 2. Domain layer

- `lib/constants.ts` — `WIN_DELTA = 2`, `LOSS_DELTA = -1`, `WHEEL_SHIFT = 1`,
  `RATING_MIN`/`RATING_MAX`, `STREAK_LENGTH = 5`.
- `lib/weights.ts` — pure functions, no DB access:
  - average of a player's non-disregarded votes,
  - weight from `lockedRating` plus a list of that player's match outcomes,
  - the last-N form string,
  - the shift-and-normalize step that turns selected players' weights into
    wheel slice fractions.
- `lib/draft.ts` — pure. Given players with slice fractions and a seedable RNG,
  run the alternating draft and return `{ teamA, teamB, order }` where `order`
  is the sequence of picks so the wheel can animate them one at a time.
- **Verify:** unit tests (see Verification below) — this is the only part of
  the app with real logic in it, so it's the part that gets tested.

### 3. Public landing page

- `app/page.tsx` (Server Component) — loads all active players with their
  derived weight and form string, passes them to a client component.
- `components/PlayerList.tsx` — checkbox list, each row showing name, weight
  (one decimal, negative rendered as-is), and the `W L L W W` streak as small
  coloured pills. Select-all / clear.
- `components/Wheel.tsx` — SVG wheel whose slice angles come from the shifted
  weights of the *currently selected* players. Each spin: draw the winner from
  the weighted distribution using `crypto.getRandomValues`, then animate with a
  freshly randomised force (random rotation count, duration and in-slice
  landing offset) so no two spins look alike. On settle, the drafted player is
  removed and the wheel re-renders with the remaining pool re-sliced, until
  everyone is drafted.
- `lib/random.ts` — the crypto-backed RNG and the weighted-pick function,
  with an injectable source so tests can seed it deterministically.
- `components/TeamsPanel.tsx` — Team A left, Team B right, filling in as the
  draft proceeds; shows each team's player count and total (unshifted) weight.
  A "Spin again" button resets and re-runs.
- **Verify:** manual — select 6 players, spin, confirm 3v3, confirm re-spinning
  gives a different order and a visibly different spin (different rotation
  count / duration), confirm a player with a negative weight can still be
  drafted.

### 4. Rating form

- `app/rate/page.tsx` — lists only players with `pollOpen: true`. One email
  field at the top, then a 1–10 selector per player. Rating a player is
  optional; only the ones the voter actually rates get submitted.
- `app/api/votes/route.ts` — `POST`. Validates email format and that each
  rating is an integer in range and that each `playerId` is a real player with
  an open poll. Upserts one vote per `(playerId, email)`. Rejects the whole
  submission if any player's poll is closed, rather than silently dropping it.
- Prefill: if the email has voted before, `GET /api/votes?email=` returns their
  existing ratings so the form shows what they previously submitted.
- **Verify:** manual — submit, re-submit with a changed rating for the same
  email, confirm one row updated rather than two rows created.

### 5. Admin auth

- `app/admin/login/page.tsx` — a single password field.
- `app/api/admin/login/route.ts` — constant-time compare against
  `ADMIN_PASSWORD`, set a signed httpOnly `admin_session` cookie signed with
  `AUTH_SECRET`. A matching logout route clears it.
- `middleware.ts` — protects `/admin/*` (except the login page) and
  `/api/admin/*`; unauthenticated page requests redirect to login, API requests
  get a 401.
- **Verify:** manual — hitting `/admin` logged out redirects; hitting
  `/api/admin/players` with no cookie returns 401; a tampered cookie is
  rejected.

### 6. Admin — players and polls

- `app/admin/players/page.tsx` — table of every player with locked rating,
  derived weight, W/L record, poll state, and per-row actions.
- `app/api/admin/players/route.ts` — `GET` list, `POST` create (name only;
  `lockedRating` 0, `pollOpen` false).
- `app/api/admin/players/[id]/route.ts` — `PATCH` rename / deactivate,
  `DELETE` soft-delete.
- `app/api/admin/players/[id]/poll/route.ts` — `POST` to open, `DELETE` to
  close. **Closing computes the average of non-disregarded votes and writes it
  to `lockedRating`.** Closing a poll with zero usable votes is rejected with a
  clear message rather than locking in a 0.
- **Verify:** manual — add a player, open their poll, confirm they appear on
  `/rate`, close it, confirm they vanish from `/rate` and their locked rating
  equals the average of the votes cast.

### 6a. Admin — editing a locked rating

- Rating edit lives on the player row in `app/admin/players/page.tsx`: an
  "Edit rating" action opening a confirm dialog that shows current rating, new
  rating, and the resulting weight before/after. No inline save-on-blur.
- `app/api/admin/players/[id]/rating/route.ts` — `PATCH` sets `lockedRating`
  and appends to `ratingHistory`; `DELETE` reverts to the previous
  `ratingHistory` entry (also appending a `"revert"` entry, so a revert is
  itself in the audit trail and nothing is lost).
- The poll-close snapshot in step 6 writes a `"poll-close"` history entry
  through the same code path, so an accidental poll close is revertible too.
- A "Rating history" expander on the row shows every change with source and
  timestamp, each with a revert-to-this action.
- **Verify:** manual — edit a rating, confirm the dialog blocks a stray click,
  confirm the weight moves, revert it, confirm the weight and the history both
  return to the prior state.

### 7. Admin — votes review

- `app/admin/votes/page.tsx` — grouped by player: every vote with voter email,
  rating, timestamp, and a toggle to disregard/restore. Shows live average both
  including and excluding disregarded votes, so the admin can see the effect
  before closing the poll.
- `app/api/admin/votes/[id]/route.ts` — `PATCH` to flip `disregarded`.
- **Verify:** manual — disregard a vote, confirm the average shifts, close the
  poll, confirm the locked rating matches the excluding-disregarded average.

### 8. Admin — matches and scoring

- `app/admin/matches/page.tsx` — a form to record a match: two roster pickers
  (a player can't be on both sides), a winner selector (A / B / draw), a date.
  Below it, the match history with edit and delete.
- `app/api/admin/matches/route.ts` — `GET` list, `POST` create.
- `app/api/admin/matches/[id]/route.ts` — `PATCH`, `DELETE`.
- Because weight is derived (decision 3), no weight fields need rewriting on
  edit or delete — the derived value simply changes.
- **Verify:** manual — record a match, confirm every winner's weight rose by 2
  and every loser's fell by 1 on the landing page, confirm the streak pills
  updated, then delete the match and confirm everything reverts exactly.

### 9. Polish

- Empty states (no players, no open polls, fewer than 2 selected for a spin).
- Loading and error states on every form.
- Basic responsive layout — the teams panel stacks vertically on mobile rather
  than staying left/right.
- `README.md` with setup, env vars, and how to run.

## Verification

**Unit tests** (`lib/weights.ts`, `lib/draft.ts` — the pure logic):

- Average ignores disregarded votes; a player with only disregarded votes has
  no usable average.
- `weight` = locked rating + 2·wins − losses; draws move nothing.
- Form string shows the most recent N results, newest last, and is shorter than
  N when the player has played fewer matches.
- Shift: a set containing a negative weight produces all-positive slices; a set
  where every weight is identical produces equal non-zero slices; the lowest
  player's slice is never zero.
- Draft with a fixed-seed RNG is deterministic; produces an even split for even
  counts and gives Team A the extra player for odd counts; every selected
  player lands on exactly one team; a heavily-weighted player is drafted early
  across many seeded runs.
- Submitting a rating outside 1–10 or a malformed email is rejected.
- Weighted pick: with a stubbed RNG returning a known value, the pick lands on
  the expected slice at each boundary; across many draws the empirical
  frequencies track the weights.
- Rating history: an edit then a revert restores the original `lockedRating`
  and leaves an audit trail of three entries, not zero.

**Manual walkthrough** (end to end, once implemented):

1. Log into `/admin`, add four players. Confirm all four show weight 0 on `/`.
2. Open polls for all four. Rate them from two different emails on `/rate`.
   Re-submit from one email with a different rating; confirm no duplicate.
3. In admin, disregard one vote; confirm the average shown moves.
4. Close all four polls; confirm the landing page weights now equal the
   locked averages and `/rate` is empty.
5. Select all four on `/`, spin; confirm a 2v2 split and that re-spinning
   reshuffles.
6. Record a match with the two teams the wheel produced, mark Team A the
   winner. Confirm on `/` that Team A's players gained 2 and Team B's lost 1,
   and each shows a single `W` or `L` pill.
7. Record three more matches so a player reaches a negative weight; confirm the
   landing page shows the negative number and that the player is still drafted
   sometimes.
8. Delete a match; confirm the weights and streaks revert exactly.
9. Edit a player's locked rating from the admin panel. Confirm the dialog shows
   the before/after weight and cannot be triggered by a single stray click.
   Revert it and confirm the landing page returns to the previous weight.

---

## Implementation notes (what changed during the build)

The plan was followed as written except for these, all found while verifying:

1. **Revert is "revert to any history entry", not "undo the last change."** The
   first version only reverted the most recent change, and because a revert is
   itself a history entry, clicking Revert twice ping-ponged between two values
   instead of stepping further back. Replaced by
   `POST /api/admin/players/[id]/rating/revert` taking the history index, which
   is what step 6a's "revert-to-this action" described anyway.
2. **Spin planning moved out of the wheel and into `lib/draft.ts`.** `planSpins`
   is pure and computes every spin's rotation and duration up front, so the
   randomised force is unit-tested rather than buried in a component effect.
   `Wheel` is now purely presentational.
3. **Admin pages are Server Components.** `page.tsx` loads through `lib/queries`
   and renders a client child that mutates and calls `router.refresh()`. This
   removed the fetch-in-`useEffect` pattern, which React 19's lint rules reject.
   The `GET` handlers on `/api/admin/players`, `/api/admin/votes` and
   `/api/admin/matches` became dead once the pages read the DB directly and were
   deleted; the mutating handlers remain.
4. **`middleware.ts` is `proxy.ts`** — the middleware convention is deprecated in
   Next 16.
5. Two bugs fixed during browser verification: the wheel unmounted when the pool
   dropped below `MIN_POOL_SIZE`, deadlocking the last pick; and `PlayerList` was
   rendered twice for responsive layout, producing duplicate checkboxes. Layout
   now uses CSS `order` on a single instance.
6. All dates render as ISO slices rather than `toLocaleDateString()`, which
   produced a server/client hydration mismatch.
7. **The draft is a snake, not a strict alternation** (see the revised decision
   above). `SNAKE_ORDER` lives in `lib/constants.ts`; `draftTeams` falls back to
   the other side when the snake's turn would overfill a team, which keeps the
   halves the right size for odd pools.
8. **Which side leads the snake is itself a coin flip.** A fixed A-leading snake
   still gave Team A picks 1, 4 and 5 against Team B's 2, 3 and 6, worth about
   1.1 weight to Team A averaged over 20,000 drafts. Flipping the lead removes
   it (17.88 vs 17.92 on a pool whose even split is 17.90). A regression test in
   `lib/__tests__/draft.test.ts` holds the gap under 0.25.
