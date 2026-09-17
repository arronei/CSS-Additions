# Form factor media query polyfill

A working JavaScript implementation of [Form Factor Media Query](../spec/index.bs), as far as page script can see. It
exists to show that the spec's behavior can be built and is useful. It isn't meant as a production library.

| File | What it is |
| --- | --- |
| [form-factor-media-query.js](form-factor-media-query.js) | The polyfill. One script, no dependencies, no build step. It does nothing when the browser supports the feature natively. |
| [demo.html](demo.html) | A news card that adapts to a television, a watch, a car, or an e-ink screen, with checkboxes to pretend. |
| [test.html](test.html) | Self-checking tests. Open the page and it prints `PASS`/`FAIL` lines. |

## Use it

```html
<script src="form-factor-media-query.js"></script>
<style>
  @media (form-factor: tv) { :root { font-size: 24px; } }
  @media (form-factor: mobile) and (not (form-factor: watch)) { .sidebar { display: none; } }
</style>
```

A device can have several form factors, so a keyword matches when it is one of them. The polyfill starts from the
coarse mobile signal plus a few `User-Agent` tokens, then replaces that with the `Sec-CH-UA-Form-Factors` client hint
once `getHighEntropyValues()` resolves, and rewrites each `@media` rule that uses `form-factor`.

To try another device, call `FormFactorMediaQuery.pretend(['watch', 'mobile'])`, and
`FormFactorMediaQuery.pretend(null)` to go back.

## Run the tests

```sh
chrome --headless=new --virtual-time-budget=3000 --dump-dom system-media-queries/form-factor/polyfill/test.html | grep -E "PASS|FAIL"
```

All 8 tests pass in Chrome 152.

## Spec-to-code map

| Spec section | Code |
| --- | --- |
| 2 The `form-factor` feature | `VALUES`, `evaluate` |
| 2.1 Where the value comes from | `getHighEntropyValues(['formFactors'])`, `fallback` |
| 2.2 Televisions | `guessFor` |
| 2.5 Reduced exposure, the coarse form factor | `coarseFor` |

## Where the polyfill differs from the spec

1. **Guessing.** Only Chromium exposes `formFactors`, and only asynchronously. Everywhere else the polyfill guesses:
   the mobile bit, `User-Agent` tokens for televisions, headsets, watches and e-readers, and `(update: slow)` for
   e-ink. A browser knows the answer; these patterns will misclassify devices.
2. **Timing.** When the client hint is available, the page starts with the guess and switches when the promise
   resolves. The spec fixes the value when the document is created.
3. **No frame or privacy limits.** The polyfill doesn't apply the `ch-ua-form-factors` policy in cross-origin frames,
   and can't detect a private mode. Those limits keep information from a page; a polyfill is part of the page.
4. **Only `@media` rules.** Queries in `<link media>`, `<source media>`, `@import … media`, and `matchMedia()` aren't
   handled, nor are cross-origin style sheets.

## Notes for browser engines

- An engine that implements `Sec-CH-UA-Form-Factors` already computes this list. Use the same list, add `tv` for
  television and set-top devices, and map anything else to `other`. Chromium currently derives the hint from the
  mobile bit, so the feature will be as coarse as the hint until the engine classifies devices further.
- Apply the `ch-ua-form-factors` permissions policy, the one that already delegates the hint, and fall back to the
  coarse form factor where it isn't allowed.
