# Accessibility preference media queries

Media features for five accessibility settings that operating systems offer and web pages can't see, designed so that
the people who use them aren't made easier to identify.

```css
@media (prefers-button-shapes: show) {
  a, .link-button { text-decoration-line: underline; }
  .icon-button { outline: 1px solid currentColor; outline-offset: 2px; }
}
@media (prefers-differentiate-without-color: differentiate) {
  .chart .series-2 { stroke-dasharray: 6 3; }
}
@media (prefers-on-off-labels: show) {
  .switch .state-glyph { color: inherit; } /* transparent otherwise */
}
@media (prefers-reduced-caret-blink: reduce) {
  .code-editor { caret-animation: manual; }
}
@media (prefers-bold-text: bold) {
  .display-heading { -webkit-text-stroke: 0.03em currentColor; }
}
```

| Feature | Setting |
| --- | --- |
| `prefers-bold-text: bold` | Bold Text on iOS, iPadOS, and Android |
| `prefers-button-shapes: show` | Button Shapes on iOS and iPadOS, toolbar button shapes on macOS, "always underline links" |
| `prefers-differentiate-without-color: differentiate` | Differentiate Without Color on iOS, iPadOS, and macOS |
| `prefers-on-off-labels: show` | On/Off Labels on iOS and iPadOS |
| `prefers-reduced-caret-blink: reduce` | Cursor blink settings on Windows, macOS, and GNOME |

## Privacy

These settings are used disproportionately by people with low vision, color vision deficiency, epilepsy, and cognitive
disabilities, and each is uncommon: a setting that 2% of users turn on reveals 5.6 bits about each of them. So every
feature is a **protected media feature**, with a sharing choice in the browser:

| | Private (the default) | Shared (the user opts in) |
| --- | --- | --- |
| What rules can change | Paint-only properties: colors, outlines, underlines, shadows, stroke patterns, caret | Anything |
| `matchMedia()` and computed style | Always `no-preference` | The setting |
| Resource loading and layout | Unchanged | Can differ |
| Cross-origin frames | Protected | Protected, unless the embedder allows `accessibility-preferences` |
| Private browsing, documents without script | Protected | Protected |
| Changes to the setting | Painted immediately; not observable | Delayed change delivery |

Pages still adapt in private browsing, unlike existing accessibility features, which some browsers turn off there to
avoid fingerprinting. None of the features may be derived from whether assistive technology is running.

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |

There is no polyfill: browsers don't expose these settings to script.

## License

This document and all associated files in the github project are licensed under [CC0](https://creativecommons.org/publicdomain/zero/1.0/) ![](https://licensebuttons.net/p/zero/1.0/80x15.png).
This means you can reuse, remix, or otherwise appropriate this project for your own use **without restriction**.
(The actual legal meaning can be found at the above link.)
Don't ask me for permission to use any part of this project, **just use it**.
I would appreciate attribution, but that is not required by the license.
