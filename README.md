# CSS Additions

Proposals for new CSS features. Each proposal has its own folder, with its spec in `spec/` and any supporting
material, such as a polyfill, alongside it.

| Proposal | What it adds |
| --- | --- |
| [Date and time media queries](date-media-queries/) | Media features and functions that test the current date and time: `(date >= "2026-09-09")`, `(time >= "18:00")`, `(weekday: saturday)`, `holiday(us, thanksgiving)`, `calendar(hebrew, (month: M07))`, `(moon-phase: full-moon)`, and `(season: winter)`. |
| [System media queries](system-media-queries/) | Nine proposals for media features about the user's system, each with a detailed privacy analysis, built on a shared privacy protections spec: `(prefers-reduced-power: reduce)`, `(network: offline)`, `(connection: metered)`, `(window-focus: inactive)`, `(screen-capture: active)`, `(keyboard: physical)`, `(virtual-keyboard: visible)`, accessibility settings such as `(prefers-button-shapes: show)`, regional preferences such as `(hour-cycle: h23)`, `(platform: macos)`, and `(form-factor: tv)`. |

Specs are written in [Bikeshed](https://speced.github.io/bikeshed/). To build one:

```sh
pip install bikeshed
bikeshed spec <proposal>/spec/index.bs <proposal>/spec/index.html
```

## License

This document and all associated files in the github project are licensed under [CC0](https://creativecommons.org/publicdomain/zero/1.0/) ![](https://licensebuttons.net/p/zero/1.0/80x15.png).
This means you can reuse, remix, or otherwise appropriate this project for your own use **without restriction**.
(The actual legal meaning can be found at the above link.)
Don't ask me for permission to use any part of this project, **just use it**.
I would appreciate attribution, but that is not required by the license.