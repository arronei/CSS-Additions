# Network media queries polyfill

A working JavaScript implementation of [Network Media Queries](../spec/index.bs). It exists to show that the spec's
behavior can be built and is useful. It isn't meant as a production library.

| File | What it is |
| --- | --- |
| [network-media-queries.js](network-media-queries.js) | The polyfill. One script, no dependencies, no build step. It does nothing when the browser supports the features natively. |
| [demo.html](demo.html) | An offline banner, a control that needs the network, and a hero video that becomes a still image on a metered connection, with controls to pretend. |
| [test.html](test.html) | Self-checking tests. Open the page and it prints `PASS`/`FAIL` lines. |

## Use it

```html
<script src="network-media-queries.js"></script>
<style>
  @media (network: offline) { .offline-banner { display: block; } }
  @media (connection: metered) { .hero video { display: none; } }
</style>
```

The polyfill rewrites each `@media` rule that uses `network` or `connection`: the feature is evaluated in script and
replaced with a condition the browser already understands, and the browser does the rest. It re-checks when the
browser fires `online` or `offline`, when `navigator.connection` changes, when the page finishes parsing, and when it
loads. After adding a style sheet, call `NetworkMediaQueries.update()`.

To try other values, call `NetworkMediaQueries.pretend({ network: 'offline', connection: 'metered' })`, and
`NetworkMediaQueries.pretend(null)` to go back.

## Run the tests

Open `test.html` in a browser, or run it headless:

```sh
chrome --headless=new --virtual-time-budget=3000 --dump-dom system-media-queries/network/polyfill/test.html | grep -E "PASS|FAIL"
```

All 5 tests pass in Chrome 152.

## Spec-to-code map

| Spec section | Code |
| --- | --- |
| 2 `network` | `actual`, the `online` and `offline` listeners |
| 3 `connection` | `actual`, the `navigator.connection` listener |
| Media query syntax | `evaluate`, `FEATURES` |

## Where the polyfill differs from the spec

1. **Metered connections.** The spec takes `metered` from the operating system, which page script can't read. The
   polyfill uses `navigator.connection.type === 'cellular'`, which only Chromium provides. Elsewhere, `connection` is
   always `unmetered`.
2. **No privacy protections.** The polyfill doesn't delay changes to `connection`, and doesn't detect
   reduced-exposure contexts. Those protections limit what a page learns; a polyfill is part of the page, and already
   knows whatever it reads.
3. **Only `@media` rules.** Queries in `<link media>`, `<source media>`, `@import … media`, and `matchMedia()` aren't
   handled. Neither are cross-origin style sheets, which script can't read.

## Notes for browser engines

- **`network`.** Evaluate it from the same state as `navigator.onLine`, and change it in the task that fires `online`
  or `offline`, so script and style never disagree.
- **`connection`.** Use the operating system's cost information: `NET_CAPABILITY_NOT_METERED` on Android,
  `isExpensive` and `isConstrained` on Apple platforms, `ConnectionCost` on Windows. Deliver changes with the delayed
  change delivery algorithm in [Privacy Protections for Media Features](../../privacy-protections/spec/index.bs).
