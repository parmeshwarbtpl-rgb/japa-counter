# Naam Jaap Counter v2.7 — Mantra-wise Mala Tracking

## New behavior

- Each Google user has a separate count for every mantra.
- Changing the mantra loads that mantra's own Today and Lifetime totals.
- One mala equals 108 jaap.
- At 108, 216, 324, and every next multiple of 108, the app shows a completion message.
- The Mala Progress card shows:
  - current mala count out of 108
  - malas completed today
  - lifetime malas for the selected mantra
- Offline counts remain separated by mantra and retain their original local date.
- Reset Today and Reset Lifetime affect only the selected mantra.

## New Google Sheets

### Mantra_Progress
One row per user and mantra. Stores lifetime totals.

### Mantra_Daily
One row per user, mantra, and local date. Stores date-wise totals and mala progress.

## One-time migration

When a user opens v2.7 for the first time, the existing Dashboard Today and Lifetime totals are assigned once to the currently selected mantra. All other mantras start from zero.
