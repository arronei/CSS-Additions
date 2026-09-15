# Regional preference media queries polyfill

A working JavaScript implementation of [Regional Preference Media Queries](../spec/index.bs). It exists to show that the
spec's behavior can be built and is useful. It isn't meant as a production library.

| File | What it is |
| --- | --- |
| [regional-preference-media-queries.js](regional-preference-media-queries.js) | The polyfill. One script, no dependencies, no build step. It does nothing when the browser supports the features natively. |
| [demo.html](demo.html) | A time, temperature, distance, and calendar that follow the locale, with a control to pretend to be in another. |
| [test.html](test.html) | Self-checking tests. Open the page and it prints `PASS`/`FAIL` lines. |

## Use it

```html
<script src="regional-preference-media-queries.js"></script>
<style>
  .h23 { display: none; }
  @media (hour-cycle: h23) { .h12 { display: none; } .h23 { display: inline; } }
</style>
```

The polyfill works out the four values once, from the locale that `Intl` uses when script doesn't give one, and
rewrites each `@media` rule that uses them. The values don't change while the page is open, as the spec requires.

To try another locale, call `RegionalPreferenceMediaQueries.pretend('de-CH')`, and
`RegionalPreferenceMediaQueries.pretend(null)` to go back. `RegionalPreferenceMediaQueries.valuesFor('en-GB')` returns
the values for any locale.

## Run the tests

```sh
chrome --headless=new --virtual-time-budget=3000 --dump-dom system-media-queries/regional-preferences/polyfill/test.html | grep -E "PASS|FAIL"
```

All 9 tests pass in Chrome 152.

## Spec-to-code map

| Spec section | Code |
| --- | --- |
| 2 The regional locale | `actual`, `valuesFor` (region from `Intl.Locale.prototype.maximize()`) |
| 3.1 `hour-cycle` | `valuesFor`, using `getHourCycles()` |
| 3.2 `measurement-system` | `valuesFor`, `US_SYSTEM`, `UK_SYSTEM` |
| 3.3 `temperature-unit` | `valuesFor`, `FAHRENHEIT` |
| 3.4 `first-day-of-week` | `valuesFor`, using `getWeekInfo()` |
| Media query syntax | `evaluate`, `FEATURES` |

## Where the polyfill differs from the spec

1. **CLDR data.** The measurement system and temperature lists are copied from CLDR 48. A region that CLDR moves later
   keeps its old value until the lists are updated.
2. **The user's own settings.** The polyfill uses `Intl.DateTimeFormat().resolvedOptions().locale`, which only keeps the
   Unicode extension keywords that date formatting uses. A browser that applies an operating system setting to
   `Intl`'s hour cycle is followed; `ms`, `mu`, and `fw` from the operating system aren't.
3. **Older browsers.** Where `Intl.Locale` has neither `getWeekInfo()` nor `weekInfo`, `first-day-of-week` is unknown,
   and where it has neither `getHourCycles()` nor `hourCycles`, `hour-cycle` is unknown.
4. **No reduced exposure.** The spec uses only the `Accept-Language` locale in private browsing and where script is
   disabled. The polyfill can't tell whether it is in a private mode, and doesn't run without script.
5. **Only `@media` rules.** Queries in `<link media>`, `<source media>`, `@import … media`, and `matchMedia()` aren't
   handled, nor are cross-origin style sheets.

## Notes for browser engines

- Compute the values from the same locale object the realm's `Intl` default locale uses, with ICU's locale data, when the
  document is created. Then they can't disagree with script.
- Add operating system settings to that locale only if `Intl` receives them too.
