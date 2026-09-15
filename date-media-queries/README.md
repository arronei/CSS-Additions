# Date and time media queries

Media queries that test the current date and time, written with the ISO 8601 strings that
[Temporal](https://tc39.es/proposal-temporal/) parses.

```css
@media ("2026-09-09" <= date <= "2026-09-15") { .sale-banner { display: block; } }
@media (date >= "--12-20") or (date <= "--01-05") { body { background-image: url(snow.svg); } }
@media (time >= "18:00") { :root { --accent: orange; } }
@media (date >= "2026-11-27T09:00[America/New_York]") { .buy-now { display: inline-block; } }

@media holiday(us, thanksgiving) { … }
@media calendar(hebrew, (month: M07) and (15 <= day <= 22)) { … }
@media (weekday >= saturday) { … }
@media (moon-phase: full-moon) { … }
@media (season: winter) { … }
```

- **`date`** compares with a date (`"2026-09-09"`), a date and time (`"2026-11-27T09:00"`), a moment in a time
  zone (`"2026-11-27T09:00[America/New_York]"` or `"…Z"`), or a month and day of every year (`"--12-25"`).
- **`time`** compares with a local time of day (`"18:00"`).
- **`weekday`**, **`month`**, and **`day`** describe rules such as "the fourth Thursday of November".
- **`calendar()`** makes `month` and `day` follow another calendar, such as `hebrew` or `chinese`.
- **`holiday()`** names a holiday from the spec's registry, optionally for a region.
- **`moon-phase`** and **`season`** follow astronomy. The hemisphere comes from the time zone.

The proposal changes the media query grammar in two places: `<mf-value>` accepts `<string>`, and `<media-in-parens>`
accepts `holiday()` and `calendar()`. Browsers without support treat these queries as unknown, so they never match.

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |
| [polyfill/](polyfill/) | A working JavaScript implementation, a live demo, tests, and notes on where it differs from the spec. |

To rebuild the spec after editing `index.bs`, run this from this folder:

```sh
pip install bikeshed
bikeshed spec spec/index.bs spec/index.html
```
