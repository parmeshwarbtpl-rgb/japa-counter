# Google Login + Device/User History Setup

This version uses Google Identity Services with server-side token verification. It stores the Google ID token only in browser `sessionStorage`, sends it in a POST request body, and never writes the token or the raw device ID to Google Sheets.

## What this adds

- Mandatory Sign in with Google
- Server-side Google ID token verification
- Verified User ID (`sub`), name, and email
- Pseudonymous hashed Device Key
- New `Users`, `Devices`, and `User_Activity` sheets
- User-specific History screen
- Account blocking through the `Users` sheet
- Optional Google Workspace domain restriction
- Public legacy GET actions disabled


## Production verification note

Google recommends using an official server-side Google API client library to verify ID tokens in production. Google Apps Script cannot directly use the normal Node/Java/Python client libraries, so this package uses Google's official `tokeninfo` verification endpoint with strict `aud`, `iss`, `exp`, and verified-email checks plus short caching. This is practical for a small, low-volume Apps Script app. For a high-traffic public service, move token verification to Cloud Run or Cloud Functions with an official Google Auth library.

## Step 1 — Create a Google Web OAuth Client ID

In Google Cloud Console / Google Auth Platform:

1. Select or create a project.
2. Configure the OAuth consent screen.
3. Create an OAuth Client ID of type **Web application**.
4. Add this Authorized JavaScript origin:

```text
https://parmeshwarbtpl-rgb.github.io
```

For local testing, you may also add:

```text
http://localhost:8080
```

A redirect URI is not required for the JavaScript popup callback used by this package.

Copy the Client ID. It ends with:

```text
.apps.googleusercontent.com
```

## Step 2 — Configure the frontend

Open `config.js` and replace:

```javascript
GOOGLE_CLIENT_ID: "984438160673-ru9ed5qrbh4hrrl63lpliaakn6da6i87.apps.googleusercontent.com"
```

with your real Web Client ID.

Do not place a Google Client Secret in GitHub. A Web Client ID is public; a Client Secret is not used by this frontend.

## Step 3 — Update Google Apps Script

The `apps-script` folder contains:

```text
01_Server_SECURE_REPLACEMENT.gs
06_Auth.gs
07_UserActivity.gs
08_OfflineSync.gs
99_Auth_Setup.gs
```

### Critical security step

Replace the contents of the existing `01_Server.gs` with the contents of:

```text
01_Server_SECURE_REPLACEMENT.gs
```

Do not keep the old public `doGet` action router. If it remains active, unauthenticated users may bypass Google login through the old GET URLs.

Then add/update the other four `.gs` files in the Apps Script project.

The secure router calls the existing functions:

```text
getDashboard()
addCount(number)
saveMantra(mantra)
resetToday()
resetAll()
```

Keep the files containing those functions.

## Step 4 — Set the Client ID on the backend

Open `99_Auth_Setup.gs` and paste the same Web Client ID into:

```javascript
var googleClientId = '984438160673-ru9ed5qrbh4hrrl63lpliaakn6da6i87.apps.googleusercontent.com';
```

Run this function once:

```text
setupSecureAuthentication
```

Approve the requested Apps Script permissions.

The setup automatically creates these sheets:

- `Users`
- `Devices`
- `User_Activity`
- `Sync_Operations`

If the Apps Script project is not bound to the Google Sheet, paste the Sheet ID in `setAuthSpreadsheetId()` and run that function once.

## Step 5 — Optional access restrictions

### Allow only one Google Workspace domain

In `setAllowedEmailDomain()`, enter a domain such as:

```javascript
var domain = 'example.com';
```

Run the function once. Leave it empty to allow any verified Google account.

### Block a user

Open the `Users` sheet and change the user's `Status` from:

```text
ACTIVE
```

to:

```text
BLOCKED
```

The next authenticated request will be rejected.

## Step 6 — Deploy Apps Script again

Use:

```text
Deploy → Manage deployments → Edit → New version → Deploy
```

Recommended Web App settings:

```text
Execute as: Me
Who has access: Anyone
```

The endpoint may be public, but all application actions are protected by server-side Google token verification.

If Google gives you a new `/exec` URL, update `API_URL` in `config.js`.

## Step 7 — Upload the frontend to GitHub Pages

Upload the frontend files from the package root to the repository root. Do not upload the `apps-script` folder to GitHub if you do not want backend source code publicly visible.

After deployment, open the live app and force refresh:

```text
Ctrl + Shift + R
```

On mobile, clear the old PWA/site cache or remove and reinstall the app if the old screen remains.

## Where the usage records appear

### Users

Shows the verified Google user, first/last login, login count, last device key, and status.

### Devices

Shows the pseudonymous Device Key, user, coarse device/browser data, first/last seen, and request count.

### User_Activity

Shows who performed each count, mantra change, and reset, along with the Device Key and counter snapshot.

## Privacy and limitations

- Google passwords are never available to the app.
- ID tokens are not stored in Google Sheets or `localStorage`.
- Raw device IDs are hashed on the server with a private pepper before storage.
- Device information is approximate; browsers do not reliably expose an exact physical phone model.
- Clearing site data creates a new local device ID and therefore a new Device Key.
- Google login identifies the Google account, not necessarily the human holding a shared device.


## v2.6 Offline Safe setup

The `08_OfflineSync.gs` file adds an idempotency register named `Sync_Operations`. Each queued count/mantra operation has a stable unique ID. Once that ID is marked `DONE`, a retry returns the stored result rather than applying the action again.

Run `setupSecureAuthentication()` again after adding `08_OfflineSync.gs` so the new sheet is created. Then deploy a new Web App version before uploading the v2.6 frontend.

Offline access stores a locally cached verified profile for seven days, but it does not store a long-lived Google token. Reconnection requires Google sign-in before the queue can sync.
