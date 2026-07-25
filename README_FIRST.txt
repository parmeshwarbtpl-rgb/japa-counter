Souvenir Apps — Unified Safety + Trusted Device Bundle

GOAL
- Birthday Reminder and Naam Jaap Counter use the same Data Safety design/principles.
- Both show an App Family integration.
- No personal data is automatically shared between the two separate web apps.
- Installed apps prioritize local/trusted access instead of forcing a login gate.

WHY DATA WORDING IS NOT IDENTICAL
The safety standard is the same, but the factual data flow differs:
- Birthday Reminder: Google Contacts read-only; contact/profile/reminder data is device-local.
- Naam Jaap Counter: verified account + jaap activity are cloud-synced using Apps Script/Sheets.

LOGIN BEHAVIOUR
- Birthday Reminder installed PWA opens local saved data first. Keep Remember Contacts
  and Quick Google Reconnect enabled through Trusted Device Mode.
- Naam Jaap v2.9.7 opens a previously verified local profile for up to 30 days and
  only asks for Google again when cloud sync needs a valid credential.

Folders in this ZIP:
1. Birthday-Reminder-v5.2-Final
2. Naam-Jaap-v2.9.7
