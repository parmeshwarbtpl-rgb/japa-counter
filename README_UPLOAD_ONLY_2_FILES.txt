NAAM JAAP v2.9.15 — FINAL MOBILE HEADER FIX
================================================

VIDEO CHECK RESULT
------------------
The previous ecosystem header CSS was loading, but mobile-ui-fix.js loaded
after it and restored the old narrow rules:
- title width 126px
- profile max width 116px
- profile name max width 62px
- status hidden

THIS FIX
--------
Replace only:
1. mobile-ui-fix.js
2. sw.js

Do not replace ecosystem.js.
Do not edit index.html.

Expected header:
Row 1:
[Logo] Naam Jaap Counter          [Apps]

        Google Sheets • Synced

Row 2:
[Photo] Parmeshwar
        Naam Jaap • Trusted Device

After upload:
1. Wait for GitHub Pages deployment.
2. Close Chrome and the installed app completely.
3. Open the direct URL once in Chrome.
4. Refresh twice.
5. Close Chrome.
6. Reopen the installed Naam Jaap app.

Unchanged:
- embedded Your Apps launcher
- identity handoff to Birthday Reminder
- profile photo and profile data
- Google Sign-In
- Apps Script and Google Sheets
- jaap count/history
- reminders
