NAAM JAAP v2.9.15 — EMBEDDED SUITE DROP-IN FIX
=================================================

ROOT CAUSE
----------
The live index.html already loads:
    ecosystem.js?v=2915

But it does NOT load:
    embedded-suite.css
    embedded-suite.js

Therefore the My App Suite screen never started.

FIX
---
This package uses the existing ecosystem.js reference.
Do NOT edit index.html.

UPLOAD / REPLACE ONLY THESE 2 FILES:
1. ecosystem.js
2. sw.js

GitHub steps:
- Open japa-counter repository
- Upload files
- Drag ecosystem.js and sw.js
- Choose "Commit changes"

After GitHub Pages deploys:
1. Close the installed Naam Jaap app completely.
2. Open its URL once in Chrome.
3. Refresh twice, or close and reopen.
4. The My App Suite screen should appear first.
5. Tap Naam Jaap Counter to enter the existing login/dashboard.
6. Use the ▦ header button to reopen My Apps.

No changes were made to:
- auth.js
- api.js
- config.js
- Apps Script
- Google Sheets
- jaap counts/history
- reminder logic

IMPORTANT
---------
Do not upload embedded-suite.css or embedded-suite.js for this fix.
They are bundled inside ecosystem.js.
