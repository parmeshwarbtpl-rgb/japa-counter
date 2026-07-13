# Naam Jaap Counter v2.6 — Offline Safe

A mobile-first PWA for Naam Jaap counting with Google Login, Google Sheets synchronization, live date/time, safe reminders, and durable offline counting.

## v2.6 Offline Safe

- App shell works from the Service Worker cache after the app has been opened online once.
- A verified user profile may continue offline on the same device for up to 7 days.
- Google ID tokens remain session-only and are not stored as long-term offline credentials.
- Every count is saved to IndexedDB immediately; localStorage is used only as a compatibility fallback.
- App close, refresh, or device restart does not remove queued counts.
- Offline mantra changes are queued in order.
- Internet reconnection shows **Sign in to Sync** when fresh Google authentication is required.
- Queued operations receive stable unique IDs.
- The Apps Script `Sync_Operations` register prevents a completed operation ID from being applied twice.
- Reset actions are disabled offline to prevent destructive synchronization conflicts.

## Safe offline authentication model

Offline access does not bypass Google authentication on the server. The device stores only:

- verified user ID, name, and email
- hashed Device Key returned by the server
- verification time and seven-day local expiry
- cached dashboard values
- pending count/mantra operations

A live Google ID token is still required before queued changes can reach Google Sheets. Explicit **Sign Out** removes the device's offline-access profile.

## Frontend files

```text
index.html
style.css
config.js
offline.js
api.js
auth.js
settings.js
history.js
ui.js
reminder.js
app.js
manifest.json
sw.js
icon-192.png
icon-512.png
.nojekyll
```

## Apps Script patch files

```text
apps-script/
  01_Server_SECURE_REPLACEMENT.gs
  06_Auth.gs
  07_UserActivity.gs
  08_OfflineSync.gs
  99_Auth_Setup.gs
```

Deploy the Apps Script patch before the frontend.

## Google Sheets created by setup

- `Users`
- `Devices`
- `User_Activity`
- `Sync_Operations`

`Sync_Operations` is an internal idempotency register. Do not delete recent rows while users may still have unsynced device operations.

## Existing backend functions retained

The secure router still calls the existing project functions:

- `getDashboard()`
- `addCount(number)`
- `saveMantra(mantra)`
- `resetToday()`
- `resetAll()`

## Offline behavior

| Feature | Offline behavior |
|---|---|
| Open installed/cached app | Yes, after one successful online visit |
| Tap to count | Yes, saved locally |
| Close/restart app | Pending counts remain |
| Change mantra | Yes, queued |
| Voice and daily target | Yes, device-dependent |
| Live clock | Yes |
| Local reminder | Yes while browser/PWA can run it |
| History | Online sign-in required |
| Reset Today/Lifetime | Disabled offline |
| Google Sheets sync | Runs after internet + Google sign-in |

## Date boundary note

The existing legacy `addCount(number)` backend updates the Dashboard when a saved batch is synchronized. If a device stays offline across midnight, the Dashboard's **Today** total may attribute that batch to the reconnect/sync day. The operation keeps its original client date in `Sync_Operations` and the activity details. A fully historical per-day counter would require a larger database refactor.

## Deployment

Read `DEPLOY_ORDER.txt` and `SETUP_GOOGLE_LOGIN.md`.
