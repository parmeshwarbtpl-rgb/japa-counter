# Changelog

All notable changes to Naam Jaap Counter are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows semantic versioning where practical during the v2.x development cycle.

## [Unreleased]

### Planned

- Optional theme selection
- History date filters and grouping
- Additional accessibility and UI refinements

## [2.6.0] - 2026-07-13

### Added

- Durable IndexedDB queue for offline counts and mantra changes
- `localStorage` compatibility fallback
- Seven-day verified offline profile on the same device
- `Sync_Operations` Google Sheet register
- Stable unique operation IDs for duplicate-safe synchronization
- Automatic retry when internet connectivity returns
- **Continue Offline** and **Sign in to Sync** flows

### Changed

- Every tap is stored locally before cloud synchronization
- Dashboard can load cached values while offline
- Reset Today and Reset Lifetime are disabled offline to prevent conflicts

### Security

- Live Google ID token remains required before queued operations can reach Google Sheets
- Explicit sign-out removes the local verified offline profile

## [2.5.0] - 2026-07-13

### Added

- Live current date, time, and device timezone
- Daily Jaap reminder settings
- Notification permission flow and test notification
- Phone calendar export for more reliable reminders

### Changed

- Updated Service Worker cache for clock and reminder assets

## [2.3.1] - 2026-07-13

### Added

- Google Identity Services authentication
- Server-side Google ID token verification
- User and device audit sheets
- User activity history
- Pseudonymous hashed Device Key
- Google account profile display and sign-out

### Security

- ID tokens are sent in authenticated POST bodies, not URL parameters
- OAuth Client Secret is not used or stored in the frontend
- Spreadsheet text values are sanitized before writing

## [2.2.0] - 2026-07-13

### Added

- Fast optimistic tap counting
- Batched Google Sheets synchronization for rapid taps
- Responsive Dashboard, History, and Settings views
- Daily target progress
- Voice selection, Voice ON/OFF, and Auto Speak
- Toast messages, loading states, and tap animations
- Installable PWA foundation

## [2.0.0] - 2026-07-13

### Added

- Initial Google Apps Script backend integration
- Today and Lifetime counters
- Mantra selection and persistence
- Counter reset APIs
- Google Sheets History
- Mobile-first frontend and browser Text-to-Speech
