# Platform media query polyfill

A working JavaScript implementation of [Platform Media Query](../spec/index.bs). It exists to show that the spec's
behavior can be built and is useful. It isn't meant as a production library.

| File | What it is |
| --- | --- |
| [platform-media-query.js](platform-media-query.js) | The polyfill. One script, no dependencies, no build step. It does nothing when the browser supports the feature natively. |
| [demo.html](demo.html) | Shortcut labels, dialog button order, download links, and store badges that follow the platform, with a control to pretend. |
| [test.html](test.html) | Self-checking tests. Open the page and it prints `PASS`/`FAIL` lines. |

## Use it

```html
<script src="platform-media-query.js"></script>
<style>
  .key-mod::after { content: "Ctrl"; }
  @media (platform: macos), (platform: ios) { .key-mod::after { content: "⌘"; } }
</style>
```

The polyfill works out the platform once, from `navigator.userAgentData.platform` where the browser has it and from
the `User-Agent` string otherwise, and rewrites each `@media` rule that uses `platform`. The value doesn't change
while the page is open, as the spec requires.

To try another platform, call `PlatformMediaQuery.pretend('macos')`, and `PlatformMediaQuery.pretend(null)` to go
back. `PlatformMediaQuery.platformFor(uaString)` returns the keyword for any `User-Agent` string.

## Run the tests

```sh
chrome --headless=new --virtual-time-budget=3000 --dump-dom system-media-queries/platform/polyfill/test.html | grep -E "PASS|FAIL"
```

All 7 tests pass in Chrome 152.

## Spec-to-code map

| Spec section | Code |
| --- | --- |
| 2 The `platform` feature | `VALUES`, `evaluate` |
| 2.1 The reported platform | `FROM_HINT`, `platformFor`, `actual` |
| 2.2 Changes | `actual` is computed once |
| Media query syntax | `evaluate` |

## Where the polyfill differs from the spec

1. **User-Agent parsing.** Where the browser has no `navigator.userAgentData`, the polyfill reads the `User-Agent`
   string with a short list of patterns. A browser would know its own platform. The patterns follow the spec's rule
   that the feature agrees with the string, so Safari on an iPad, which sends a Mac user-agent string by default,
   reports `macos`.
2. **No reduced exposure.** The polyfill can't tell whether it is in a private mode. It doesn't need to: the value
   already matches whatever the browser reports there.
3. **Only `@media` rules.** Queries in `<link media>`, `<source media>`, `@import … media`, and `matchMedia()` aren't
   handled, nor are cross-origin style sheets.

## Notes for browser engines

- The engine already computes this value for the `User-Agent` header and `Sec-CH-UA-Platform`. Read it from there, so
  that the feature can't disagree with them, including in desktop mode and in fingerprinting-protection modes.
- Map anything outside the closed list, including Fuchsia and "Unknown", to `other` rather than adding a keyword.
