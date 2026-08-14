## Engineering case study

### Why I built it

I used to manage my budget in an Excel file stored in iCloud. Using the same file on my phone and laptop sometimes caused stale copies, overwrites, and manual re-syncing.

I wanted a budgeting tool that:

- Works on both phone and laptop
- Keeps working without internet
- Can sync without passing files between devices
- Makes manual expense logging quick

I kept manual logging on purpose. Entering each transaction makes me more aware of how I spend my money.

### What the app does

1. Tracks income and expenses using a percentage-based budget inspired by the 50/30/20 rule.
2. Expenses are grouped into needs, wants, and savings. The percentages are customisable, but must add up to 100%.
3. Users can also create categories and save templates for transactions they enter often.

### How it works

The app is local-first. Data is saved to the device before it is synced anywhere else.

```text
React interface → Dexie → IndexedDB on the device ↔ Dexie Cloud when signed in
```

- IndexedDB stores the budget data. Dexie provides a simpler way to read, write, query, and react to changes in that data.
- Signing in is optional. Signed-in users can sync their budget across devices through Dexie Cloud. Users who do not sign in can still use the app locally.
- The app is also a Progressive Web App (PWA). Its files are cached by a service worker (from `vite-plugin-pwa`), so it can open without internet and can be installed from the browser.
- The PWA cache and IndexedDB have different jobs: the cache keeps the app available, while IndexedDB keeps the user's budget data.

### Why I chose this design

### Dexie and IndexedDB

`localStorage` only stores strings and can block the page while it works. IndexedDB is better suited to structured data such as transactions, categories, and settings.
Using raw IndexedDB would require more database code. Dexie gives the app a smaller API, indexed queries, schema versions, and reactive React hooks.

#### Dexie Cloud

I first planned a fully local app, but that did not solve the cross-device problem. Dexie Cloud added authentication and sync to the local database without requiring me to build a separate API and server database.

This was a good fit for a small project, but it also creates a dependency on the Dexie platform and gives me less backend control than a custom service would.

#### Progressive Web App

A budgeting tool is useful on a phone and a laptop. A PWA lets both use the same codebase, supports installation, and avoids maintaining separate native apps.

The trade-off is that browser capabilities and installation behaviour vary between platforms.

### Data decisions

#### Store money as cents

JavaScript uses floating-point numbers, which can produce rounding errors with decimals. The app stores `$10.25` as the integer `1025` and only formats it as dollars for display.

#### Use UUIDs for records

Two offline devices could create the same auto-incrementing ID. UUIDs allow each device to create records independently with a very low risk of a collision during sync.

#### Keep categories separate

A transaction stores a category ID instead of copying the category name and budget group. This avoids duplicate information becoming inconsistent.

The app blocks deletion of a category while a transaction or template still uses it. This prevents broken references without deleting the user's financial history.

#### Derive values when possible

Dashboard totals are calculated from transactions rather than stored separately. This avoids totals becoming stale when a transaction changes.

Transaction templates also speed up manual logging without creating transactions automatically. A logged transaction can keep the template ID, so related state can be derived from the records and dates instead of relying on a monthly flag that must be reset.

### What I learned

The main lesson was that offline access and cross-device sync are separate problems. IndexedDB makes local use possible, while the sync layer coordinates data between devices.

I also learned that small data-model choices matter. Most of which came up during the development process, not at the start. Integer money values, stable IDs, references, and derived totals make the app easier to extend.

See [Future improvements](future-improvements.md) for the next changes I would make.
