# Regional preference media queries

Media features for the user's clock, units, temperature scale, and first day of the week, so a page can show them the
way the user reads them without script.

```css
.h23, .celsius, .km { display: none; }
@media (hour-cycle: h23) { .h12 { display: none; } .h23 { display: inline; } }
@media (temperature-unit: celsius) { .fahrenheit { display: none; } .celsius { display: inline; } }
@media (measurement-system: metric) { .miles { display: none; } .km { display: inline; } }
@media (first-day-of-week: monday) { .month .sun { order: 7; } }
```

- **`hour-cycle`** is `h12` or `h23`. The rare `h11` and `h24` are combined with them.
- **`measurement-system`** is `metric`, `uksystem`, or `ussystem`, from the `-u-ms-` keyword or CLDR.
- **`temperature-unit`** is `celsius` or `fahrenheit`, from the `-u-mu-` keyword or CLDR.
- **`first-day-of-week`** is `monday` through `sunday`, as `Intl.Locale.prototype.getWeekInfo()` reports.

## Privacy

| Risk | Protection |
| --- | --- |
| Settings that differ from the locale's defaults can suggest where the user comes from. | The values must match what `Intl` gives script in the same document. A browser that keeps operating system settings out of `Intl` keeps them out of these features too. |
| A style sheet could report the settings without script. | Where script is disabled, and in private browsing, the values come only from the `Accept-Language` locale, which every request already sends. |
| A change could link documents. | The values are fixed when the document is created. |

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |
| [polyfill/](polyfill/) | A JavaScript implementation, a demo, tests, and notes on where it differs from the spec. |
