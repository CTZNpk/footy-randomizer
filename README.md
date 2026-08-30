# Footy

Weighted football team randomizer. Players are rated by their peers, that average
becomes their starting weight, and match results move it from there. A wheel picks
players for two teams, with a slice size proportional to weight.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill it in
npm run dev
```

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Mongo connection string |
| `MONGODB_DB` | Database name |
| `ADMIN_PASSWORD` | The single admin password |
| `AUTH_SECRET` | Long random string used to sign the admin session cookie |

## How weight works

```
weight = lockedRating + 2 × wins − 1 × losses
```

`lockedRating` starts at 0 and is set when the admin closes a player's rating poll,
snapshotting the average of every rating that has not been disregarded. Draws move
nothing. Weight is derived from match history at read time, so editing or deleting a
match corrects every weight automatically.

Weight can go negative and is displayed as-is. The wheel shifts the selected players'
weights so the lowest becomes 1 before turning them into slice angles, which keeps every
slice non-zero. That shift is never shown.

## How the draft works

Each spin draws one player from the weighted distribution, removes them from the wheel,
and assigns them in snake order — A, B, B, A, A, B, B, A. Weight decides *when* a player
is picked; the snake stops the early picks from stacking on one side. Team A picks first
and takes the extra player when the pool is odd, which leaves it around 1.1 weight
heavier on average — small next to the spread of any individual draft.

## Routes

| Route | Who | What |
| --- | --- | --- |
| `/` | anyone | Pick today's pool, spin, get Team A and Team B |
| `/rate` | anyone | Rate players whose poll is open, identified by email |
| `/admin/players` | admin | Add players, open/close polls, edit and revert ratings |
| `/admin/votes` | admin | Review ratings, disregard and restore individual votes |
| `/admin/matches` | admin | Record, edit and delete match results |

## Tests

```bash
npm test
```

Covers the pure logic: rating averages, weight arithmetic, form strings, wheel slice
normalisation, and the weighted alternating draft.
