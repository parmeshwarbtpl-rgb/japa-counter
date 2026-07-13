# Naam Jaap Counter v2.6 — Offline Safe

A mobile-first Progressive Web App for digital mantra/Naam Jaap counting with secure Google Login, Google Sheets synchronization, voice support, reminders, and durable offline counting.

**Live app:** https://parmeshwarbtpl-rgb.github.io/japa-counter/

## Screenshots

### Dashboard

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Naam Jaap Counter dashboard with mantra selector and one-tap counter" width="460">
</p>

### Offline synchronization register

<p align="center">
  <img src="docs/screenshots/sync-operations.png" alt="Google Sheets Sync Operations register used for duplicate-safe offline synchronization" width="900">
</p>

## Features

### Counter and mantra

- One-tap `+1` Naam Jaap counter
- Today and Lifetime totals
- Mantra selection with Google Sheets persistence
- Daily target with progress percentage and animated progress bar
- Fast optimistic counting for responsive mobile use
- Tap pulse, vibration feedback, loading states, and toast messages

### Supported mantras

- ॐ नमः शिवाय
- ॐ गं गणपतये नमः
- श्री राम जय राम जय जय राम
- ॐ नमो भगवते वासुदेवाय
- हरे कृष्ण हरे कृष्ण

### Secure account and activity tracking

- Google Identity Services login
- Server-side Google ID token verification
- Verified user profile and pseudonymous hashed Device Key
- User, device, login, and activity records in Google Sheets
- Google ID tokens remain session-only
- No Google password or OAuth client secret is stored by the app

### Offline-safe synchronization

- App shell available from the Service Worker cache after one successful online visit
- Verified offline access on the same device for up to 7 days
- Every tap saved immediately in IndexedDB
- `localStorage` compatibility fallback when IndexedDB is unavailable
- Pending counts survive refresh, app close, and device restart
- Offline mantra changes are queued in order
- Automatic synchronization after internet access and Google sign-in return
- Stable operation IDs prevent an already-completed offline operation from being applied twice
- Reset actions are disabled offline to prevent destructive sync conflicts

### History, voice, and reminders

- Google Sheets-based Jaap History
- Hindi browser Text-to-Speech
- Voice ON/OFF and Auto Speak ON/OFF
- Voice selection based on voices available on the device
- Live local date, time, and timezone
- Daily Jaap reminder settings
- Test notification and phone calendar export

### Progressive Web App

- Installable on supported mobile and desktop browsers
- Responsive mobile-first design
- Web App Manifest and Service Worker
- Offline app shell and local settings
- Android Chrome and iOS Home Screen support

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Authentication | Google Identity Services |
| Backend | Google Apps Script Web App |
| Database | Google Sheets |
| Offline storage | IndexedDB with localStorage fallback |
| Hosting | GitHub Pages + Google Apps Script |
| Speech | Web Speech API |
| PWA | Web App Manifest + Service Worker |

## Architecture

```text
GitHub Pages PWA
      │
      ├── Google Identity Services
      │          │
      │          └── Google ID token
      │
      ├── IndexedDB offline queue
      │
      └── Authenticated POST requests
                 │
                 ▼
       Google Apps Script Web App
                 │
                 ▼
             Google Sheets
```

## Google Sheets

The application uses or creates the following sheets:

- `Dashboard`
- `History`
- `Settings`
- `Users`
- `Devices`
- `User_Activity`
- `Sync_Operations`

`Sync_Operations` is the duplicate-prevention register for durable offline synchronization. Do not delete recent rows while users may still have unsynced operations on their devices.

## Offline behavior

| Feature | Offline behavior |
|---|---|
| Open installed/cached app | Yes, after one successful online visit |
| Tap to count | Yes, saved locally |
| Close or restart app | Pending counts remain |
| Change mantra | Yes, queued |
| Voice and daily target | Yes, device-dependent |
| Live clock | Yes |
| Local reminder | Available while the browser/PWA can run it |
| History | Internet and Google sign-in required |
| Reset Today/Lifetime | Disabled offline |
| Google Sheets sync | Runs after internet access and Google sign-in return |

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

## Apps Script files

```text
apps-script/
  01_Server_SECURE_REPLACEMENT.gs
  06_Auth.gs
  07_UserActivity.gs
  08_OfflineSync.gs
  99_Auth_Setup.gs
```

Deploy the Apps Script backend before publishing the matching frontend version.

## Configuration

Set the public frontend values in `config.js`:

```javascript
window.APP_CONFIG = Object.freeze({
  API_URL: "YOUR_APPS_SCRIPT_WEB_APP_URL",
  GOOGLE_CLIENT_ID: "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com",
  APP_VERSION: "2.6.0-offline-safe"
});
```

The Google OAuth Client ID is a public identifier. Never place a Google OAuth Client Secret in the frontend repository.

## Deployment

1. Configure Google OAuth and add the GitHub Pages origin.
2. Update and deploy the Google Apps Script Web App as a new version.
3. Keep Web App access set to `Anyone` while authentication is enforced inside the secure API router.
4. Upload the frontend files to the GitHub repository root.
5. Enable GitHub Pages from the `main` branch and `/(root)` folder.
6. Open the app online once before testing offline mode.

See `SETUP_GOOGLE_LOGIN.md` and `DEPLOY_ORDER.txt` for the detailed setup sequence.

## Important date-boundary note

The existing `addCount(number)` backend updates the Dashboard when an offline batch is synchronized. If a device stays offline across midnight, the Dashboard **Today** total may attribute that batch to the reconnect/sync day. The operation keeps its original client date in `Sync_Operations` and activity details. A fully historical per-day counter would require a larger database refactor.

## Changelog

Release history is documented in [CHANGELOG.md](CHANGELOG.md).

## License

This project is licensed under the [MIT License](LICENSE).
