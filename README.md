<div align="center">
  <img src="public/favicon.svg" alt="Budgeting Tool" width="150" />
  <h1>Budgeting Tool</h1>
  <p>A simple, local-first way to understand where your money goes.</p>
  <p><strong>Works offline · Syncs across devices · Installs like an app</strong></p>
  <p><a href="https://budget.ctrlvish.me"><strong>Open the app →</strong></a></p>
</div>

## Why I built it

I used to manage my budget in an Excel file stored in iCloud. Moving between my phone and laptop sometimes caused stale copies, overwrites, and manual re-syncing. I built this app to keep the control of manual budgeting without the trouble of passing one file between devices.

## What it does

- Tracks income and expenses manually
- Groups spending into **needs**, **wants**, and **savings**
- Supports custom budget percentages inspired by the 50/30/20 rule
- Shows monthly and yearly spending breakdowns
- Saves templates for transactions entered often
- Works offline and can be installed as a PWA
- Optionally syncs a signed-in user's data across devices

## Install the app

- **iPhone or iPad:** Open [budget.ctrlvish.me](https://budget.ctrlvish.me) in Safari → **Share** → **Add to Home Screen**.
- **Android:** Open [budget.ctrlvish.me](https://budget.ctrlvish.me) in Chrome → open the browser menu → **Install app** or **Add to Home screen**.

## How it works

Budget data is written to the device first, so the app does not need an internet connection for everyday use.

```text
React interface → Dexie → IndexedDB on the device ↔ Dexie Cloud when signed in
```

The PWA service worker keeps the app available offline. IndexedDB keeps the user's budget data. Dexie Cloud handles optional authentication and cross-device sync.

## Built with

`React` · `TypeScript` · `Vite` · `Tailwind CSS` · `Dexie` · `Dexie Cloud` · `IndexedDB` · `Vite PWA`

## Run locally

```bash
npm install
npm run dev
```

Cloud sync requires a Dexie Cloud database URL:

```env
VITE_DEXIE_CLOUD_URL=your_database_url
```

---

If you are a **recruiter, hiring manager, or interviewer**, read the [engineering case study](docs/engineering-case-study.md) for the design decisions, trade-offs, and lessons behind this project!
