# Date and time media queries polyfill

A working JavaScript implementation of [Date and Time Media Queries](../spec/index.bs). It exists to show that the
spec's behavior can be built and is useful. It isn't meant as a production library.

| File | What it is |
| --- | --- |
| [date-media-queries.js](date-media-queries.js) | The polyfill. One script, no dependencies, no build step. It does nothing when the browser supports the features natively. |
| [demo.html](demo.html) | The spec's examples as live `@media` rules, with a control to pretend it's another date or time zone. |
| [test.html](test.html) | Self-checking tests for the normative behavior. Open the page and it prints `PASS`/`FAIL` lines. |

## Use it

```html
<script src="date-media-queries.js"></script>
<style>
  @media ("2026-09-09" <= date <= "2026-09-15") { .sale-banner { display: block; } }
</style>
```

The polyfill needs `Temporal`. In a browser without it, load a Temporal polyfill first.

It rewrites each `@media` rule that uses these features: every date feature, `holiday()`, and `calendar()` is
evaluated in script and replaced with a condition the browser already understands, and the browser does the rest. It
re-checks every second, when the page finishes parsing, and when it loads.

To try another date, call `DateMediaQueries.pretend(Temporal.ZonedDateTime.from("2026-12-25T08:00[Europe/London]"))`,
and `DateMediaQueries.pretend(null)` to go back to the clock.

## Run the tests

Open `test.html` in a browser, or run it headless:

```sh
chrome --headless=new --virtual-time-budget=3000 --dump-dom date-media-queries/polyfill/test.html | grep -E "PASS|FAIL"
```

All 16 tests pass in Chrome 152.

## Spec-to-code map

| Spec section | Code |
| --- | --- |
| 2 Syntax | `substitute`, `closingParen`, `feature` |
| 3 The current date and time | `currentInstant`, `tick` |
| 4.1 Date strings | `parseDate`, `compareDate` |
| 4.2 Time strings | `compareTime` |
| 5.1–5.5 `date`, `time`, `weekday`, `month`, `day` | `compare`, `compareMonth` |
| 5.6 `moon-phase` | `moonPhase`, `phaseJDE` |
| 5.7 `season` | `season`, `seasonJDE`, `SOUTH` |
| 6.1 `calendar()` | `calendarFunction` |
| 6.2 `holiday()` | `holidayFunction` |
| 6.3 Holiday registry | `HOLIDAYS`, `easter`, `orthodoxEaster` |

## Where the polyfill differs from the spec

1. **Only `@media` rules.** Queries in `<link media>`, `<source media>`, `@import … media`, and `matchMedia()` aren't
   handled. Neither are cross-origin style sheets, which script can't read.
2. **Timing.** Style sheets that come after the script are rewritten when the page finishes parsing, so their date
   rules apply a moment late. They never apply early.
3. **Strings.** CSS escapes inside date strings aren't decoded.
4. **Hemisphere.** The list of southern time zones was generated from tzdb 2026d. A zone added later counts as
   northern until the list is regenerated.
5. **Delta T.** Astronomical times use a fixed 69-second Delta T, which is accurate enough for the 2020s and 2030s.

## Notes for browser engines

- **Evaluation.** Hook the features into the same machinery as `prefers-color-scheme`: they are environment values
  that change without a DOM mutation. Schedule one timer for the next instant any query in the document can change,
  rather than polling.
- **Parsing.** Reuse the engine's Temporal parser for strings. The spec's parsing steps are Temporal's own abstract
  operations, so a string means the same thing in CSS as in `Temporal.PlainDate.from()`.
- **Calendars.** `calendar()` and the registry use the same ICU calendars as `Intl.DateTimeFormat`.
