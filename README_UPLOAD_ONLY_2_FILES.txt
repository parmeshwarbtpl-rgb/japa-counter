NAAM JAAP v2.9.15 — IDENTITY HANDOFF FIX
=============================================

Replace only:
1. ecosystem.js
2. sw.js

Do not edit index.html.

What this fixes:
- when Birthday Reminder is opened from Naam Jaap,
  the signed-in Naam Jaap display name is passed securely
- Birthday saves the display name on that device
- Birthday then shows Parmeshwar and initial P
  instead of Welcome back and B

Privacy:
- only the display name is passed
- it uses a URL fragment (#), which is not sent to GitHub/server
- the fragment is removed immediately
- no shared database or backend was added

Unchanged:
- Google Sign-In
- Apps Script
- Google Sheets sync
- jaap counts/history
- reminders
- user activity data
