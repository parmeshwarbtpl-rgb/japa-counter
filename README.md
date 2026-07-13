# Naam Jaap Counter v2.x

A mobile-first Progressive Web App for digital mantra/Naam Jaap counting with Google Sheets synchronization through a Google Apps Script Web App.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript (ES6)
- Google Apps Script backend
- Google Sheets database
- GitHub Pages hosting
- Web Speech API
- Progressive Web App manifest and service worker

## Current Features

- Dashboard with today and lifetime counters
- One-tap `+1` counter
- Supported mantra selection
- Google Sheets synchronization
- Reset today and reset lifetime actions
- History screen backed by `getHistory()`
- SPA-style Dashboard, History and Settings navigation
- Voice ON/OFF
- Auto Speak ON/OFF
- Device voice selection
- Local daily target and progress bar
- Toast messages and loading/error states
- Installable PWA foundation
- Offline app-shell caching
- Responsive mobile layout

## Project Structure

```text
index.html
css/
  style.css
js/
  api.js
  settings.js
  history.js
  ui.js
  app.js
icons/
  icon-192.png
  icon-512.png
manifest.json
sw.js
README.md
```

## Google Apps Script APIs

The frontend expects these GET actions:

- `getDashboard`
- `addCount?num=1`
- `saveMantra?mantra=...`
- `resetToday`
- `resetAll`
- `getHistory?limit=100`

Update `API_URL` in `js/api.js` after deploying a new Apps Script Web App.

## Expected Dashboard Response

The frontend supports a direct response or a nested `data`, `dashboard`, or `result` object. Common fields:

```json
{
  "today": 12,
  "lifetime": 1200,
  "mantra": "ॐ नमः शिवाय"
}
```

It also recognizes aliases such as `todayCount`, `daily`, `life`, `lifetimeCount`, `total`, and `selectedMantra`.

## Expected History Response

The frontend accepts an array directly or inside `history`, `rows`, `items`, `data`, or `result`.

Object row example:

```json
{
  "date": "13/07/2026",
  "time": "10:30 AM",
  "mantra": "ॐ नमः शिवाय",
  "count": 108,
  "increment": 1
}
```

Array row format is also supported:

```text
[Date, Time, Mantra, Count, Increment]
```

## Local Development

Service workers require HTTP/HTTPS. Do not open `index.html` directly with `file://`.

Example local server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Deployment

1. Deploy the Google Apps Script project as a Web App.
2. Set access permissions appropriate for your users.
3. Copy the `/exec` URL into `API_URL` in `js/api.js`.
4. Push this frontend to the GitHub Pages branch.
5. Open the HTTPS GitHub Pages URL.
6. Test Dashboard, `+1`, mantra save, reset APIs and History.
7. Install the PWA from the browser install prompt.

## Important Note

Voice and daily target preferences are stored locally in the browser. Counter and history data remain synchronized through Google Apps Script and Google Sheets.

## Configured Backend

This package is currently configured with the supplied Google Apps Script Web App `/exec` endpoint in `js/api.js`.


## v2.2.1 Mantra selection fix

- Moved the mantra selector into the main counter card.
- Keeps the selected mantra visible when the backend returns a partial success response.
- Preserves current counters during mantra-only updates.
- Added compatible request parameter aliases.
- Bumped the PWA cache so browsers receive the corrected files.
