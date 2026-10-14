# Brain Games 🧠

A 5-minute daily brain workout, like Elevate or Lumosity, built for one person and one phone.
It installs from the browser, works offline and needs no account or server.

## How it works

- **Daily workout:** 3 short games a day, each from a different skill. Skills rotate so each gets equal time.
- **Skills:** Memory, Focus & Speed, Math & Logic, Words. There are 2 games per skill.

  | Memory | Focus & Speed | Math & Logic | Words |
  |---|---|---|---|
  | Grid Recall | Color Clash | Quick Math | Anagram Rush |
  | Sequence Echo | Odd One Out | Number Pattern | Synonym Match |

- **Adaptive difficulty:** each game has levels 1–10. Score 80%+ to level up; below 50% eases off.
- **Streaks:** finish all 3 games on a day, at any time of day, for it to count.
  - Every 7 days in a row earns a ❄️ streak freeze. You can hold up to 2.
  - A freeze is used automatically when you miss a day.
  - Miss more days than you have freezes and the streak resets.
- **Progress:**
  - A 6-week calendar of the days you played.
  - A trend chart for each skill. Points are weighted by level, so getting harder doesn't look like getting worse.
  - Your level and best score for each game.
- **Backup:** progress is stored only on your phone (localStorage). Use *Settings → Save backup* now and then. *Restore backup* brings it back on a new phone or after clearing browser data.

## Install on Android

1. Open the site in Chrome. With GitHub Pages it's `https://<username>.github.io/<repo>/`.
2. Tap ⋮ → **Add to Home screen** (or **Install app**).
3. Open it from the home screen each morning. It works offline after the first load.

## Development

No build step: plain HTML, CSS and JavaScript modules.

```sh
npm start   # serves on http://localhost:8080
npm test    # unit tests (Node 22+, no dependencies)
```

| Path | What's there |
|---|---|
| `js/core/` | Pure logic: dates, streak and freezes, daily schedule, adaptive levels, state and backup |
| `js/games/` | One module per game. Each has `create(root, { level, onFinish })` and returns a cleanup function |
| `js/data/words.js` | Word lists for the word games |
| `js/app.js` | Screens: Today, game flow, Progress, Settings |
| `sw.js` | Offline cache |

When you add or rename a JS file, add it to the `SHELL` list in `sw.js`; a test checks this.
Bump `CACHE` in `sw.js` when you release changes, so phones pick them up.

## Deploy (GitHub Pages)

`.github/workflows/pages.yml` runs the tests on every push. On `main` it also deploys to GitHub Pages.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
