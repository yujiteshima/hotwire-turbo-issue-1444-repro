# hotwire-turbo-issue-1444-repro

Minimal repro for Turbo Issue #1444 (links with **empty `target`** are ignored since 8.0.14).

## What this shows
- On **Turbo 8.0.13**, links with `data-turbo-method="DELETE"` work even when `target` is bare/empty/`_self`.
- On **Turbo 8.0.14**, the same links are **ignored** (regression).

The project serves two pages referencing Turbo via CDN:
- `/v8_0_13` → `@hotwired/turbo@8.0.13`
- `/v8_0_14` → `@hotwired/turbo@8.0.14`

## Usage
```bash
npm install
npm start
# open http://localhost:3000 and try the links
```

The server increments an in-memory counter whenever DELETE `/logout` is called.  
You can see the counter in the page, or via:
```bash
curl -s http://localhost:3000/_count
curl -X POST http://localhost:3000/_reset
```

## Tests (Playwright)
```bash
npm test
# or interactive: npm run test:ui
```
- The 8.0.13 test asserts that all three links send DELETEs.
- The 8.0.14 test is marked with `test.fixme` to document the regression.
  - Once the bug is fixed upstream, remove `test.fixme` and keep the assertion.

## Proposed upstream fix (summary)
Treat empty `target` (including `target` and `target=""`) **equivalent to `_self`**.  
Only exclude links whose `target` value is **not `_self`** (e.g. `_blank`).  
This brings 8.0.14 back in line with 8.0.13 behavior.

## License
MIT
