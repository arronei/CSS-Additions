# Window focus media query polyfill

A working JavaScript implementation of [Window Focus Media Query](../spec/index.bs). It exists to show that the spec's
behavior can be built and is useful. It isn't meant as a production library.

| File | What it is |
| --- | --- |
| [window-focus-media-query.js](window-focus-media-query.js) | The polyfill. One script, no dependencies, no build step. It does nothing when the browser supports the feature natively. |
| [demo.html](demo.html) | An app window whose title bar and text selection dim when you switch to another window. |
| [test.html](test.html) | Self-checking tests. Open the page and it prints `PASS`/`FAIL` lines. |

## Use it

```html
<script src="window-focus-media-query.js"></script>
<style>
  @media (window-focus: inactive) { .title-bar { background-color: #e5e7eb; } }
</style>
```

The polyfill rewrites each `@media` rule that uses `window-focus`: the feature is evaluated in script and replaced with
a condition the browser already understands. It re-checks on `focus` and `blur` events, on `visibilitychange`, when a
page is restored from the back/forward cache, when the page finishes parsing, and when it loads. After adding a style
sheet, call `WindowFocusMediaQuery.update()`.

To try the other state, call `WindowFocusMediaQuery.pretend('inactive')`, and `WindowFocusMediaQuery.pretend(null)` to
follow the window again.

## Run the tests

```sh
chrome --headless=new --virtual-time-budget=3000 --dump-dom system-media-queries/window-focus/polyfill/test.html | grep -E "PASS|FAIL"
```

All 5 tests pass in Chrome 152.

## Spec-to-code map

| Spec section | Code |
| --- | --- |
| 2 The `window-focus` feature | `actual`, the `focus` and `blur` listeners |
| 2.1 Frames | `actual`: a cross-origin frame falls back to `document.hasFocus()` |
| Media query syntax | `evaluate`, `VALUES` |

## Where the polyfill differs from the spec

1. **Frames allowed by the embedding page.** The spec lets a cross-origin frame follow the window when the embedding
   page allows `window-focus-state`. Script in the frame can't see that permission or the top-level window, so the
   polyfill always gives cross-origin frames the restricted value.
2. **Timing.** The value changes one task after the `focus` or `blur` event, rather than in the same task.
3. **Documents without script.** The spec makes the feature `active` where scripting is disabled. The polyfill is a
   script, so it doesn't run there, and the query doesn't match at all.
4. **Only `@media` rules.** Queries in `<link media>`, `<source media>`, `@import … media`, and `matchMedia()` aren't
   handled, nor are cross-origin style sheets.

## Notes for browser engines

- Evaluate the feature from the top-level traversable's system focus, the state that HTML's focus update steps already
  use, and invalidate it in the same task that fires `focus` or `blur` at the window.
- For a document not allowed to use `window-focus-state`, use the has focus steps, which `document.hasFocus()` already
  implements.
