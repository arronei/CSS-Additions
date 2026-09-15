# CSS Additions

Proposals for new CSS features. Each proposal has its own folder, with its spec in `spec/` and any supporting
material, such as a polyfill, alongside it.

| Proposal | What it adds |
| --- | --- |
| [Date and time media queries](date-media-queries/) | Media features and functions that test the current date and time: `(date >= "2026-09-09")`, `(time >= "18:00")`, `(weekday: saturday)`, `holiday(us, thanksgiving)`, `calendar(hebrew, (month: M07))`, `(moon-phase: full-moon)`, and `(season: winter)`. |
| [System media queries](system-media-queries/) | Seven proposals for media features about the user's system, each with a detailed privacy analysis, built on a shared privacy protections spec: `(prefers-reduced-power: reduce)`, `(network: offline)`, `(connection: metered)`, `(window-focus: inactive)`, `(screen-capture: active)`, `(keyboard: physical)`, `(virtual-keyboard: visible)`, accessibility settings such as `(prefers-button-shapes: show)`, and regional preferences such as `(hour-cycle: h23)`. |

Specs are written in [Bikeshed](https://speced.github.io/bikeshed/). To build one:

```sh
pip install bikeshed
bikeshed spec <proposal>/spec/index.bs <proposal>/spec/index.html
```
