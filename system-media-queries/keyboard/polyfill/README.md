# Keyboard media queries polyfill

A working JavaScript implementation of [Keyboard Media Queries](../spec/index.bs), as far as page script can see. It
exists to show that the spec's behavior can be built and is useful. It isn't meant as a production library.

| File | What it is |
| --- | --- |
| [keyboard-media-queries.js](keyboard-media-queries.js) | The polyfill. One script, no dependencies, no build step. It does nothing when the browser supports the features natively. |
| [demo.html](demo.html) | Shortcut hints shown only with a keyboard, and a bottom bar that hides while the on-screen keyboard is up. |
| [test.html](test.html) | Self-checking tests. Open the page and it prints `PASS`/`FAIL` lines. |

## Use it

```html
<script src="keyboard-media-queries.js"></script>
<style>
  @media (keyboard: physical) { kbd.hint { display: inline; } }
  @media (virtual-keyboard: visible) { .bottom-nav { display: none; } }
</style>
```

The polyfill rewrites each `@media` rule that uses `keyboard` or `virtual-keyboard`: the feature is evaluated in script
and replaced with a condition the browser already understands. It re-checks when focus moves, when the visual viewport
resizes, when the VirtualKeyboard API reports a change, when the page finishes parsing, and when it loads.

To try other values, call `KeyboardMediaQueries.pretend({ keyboard: 'none', 'virtual-keyboard': 'visible' })`, and
`KeyboardMediaQueries.pretend(null)` to go back.

## Run the tests

```sh
chrome --headless=new --virtual-time-budget=3000 --dump-dom system-media-queries/keyboard/polyfill/test.html | grep -E "PASS|FAIL"
```

All 6 tests pass in Chrome 152. The tests cover query evaluation and the text-field check; the on-screen keyboard
heuristic needs a real phone.

## Spec-to-code map

| Spec section | Code |
| --- | --- |
| 2 `keyboard` | `keyboard` |
| 3 `virtual-keyboard` | `virtualKeyboard`, `typingInto` |
| Media query syntax | `evaluate`, `FEATURES` |

## Where the polyfill differs from the spec

1. **`keyboard` is mostly unknown.** Page script can't tell whether a keyboard is connected. On a device with no touch
   input, which is a desktop or laptop, the polyfill reports `physical`, as the spec does. On touch devices, the feature
   is unknown, so `(keyboard: physical)` and `(keyboard: none)` both fail to match.
2. **`virtual-keyboard` is a heuristic.** The polyfill reports `visible` when a text field has focus and the visual
   viewport has shrunk by more than 150 pixels, or when the VirtualKeyboard API reports a keyboard. Resizing a desktop
   window while typing can fool it.
3. **No privacy protections.** The polyfill doesn't delay changes, apply the rule for devices where keyboards are rare,
   or distinguish assistive technology devices. Script can't see the devices, and a polyfill is part of the page.
4. **Only `@media` rules.** Queries in `<link media>`, `<source media>`, `@import … media`, and `matchMedia()` aren't
   handled, nor are cross-origin style sheets.

## Notes for browser engines

- **`keyboard`.** Use the platform's keyboard state: `Configuration.keyboard` and `hardKeyboardHidden` on Android,
  `GCKeyboard` on iPadOS, and tablet posture on Windows. Exclude devices that the platform identifies as assistive
  technology or game controllers.
- **`virtual-keyboard`.** The engine already knows when it resizes the viewport for the keyboard, and which document the
  keyboard is typing into. Don't set the feature for the browser's own address bar or prompts.
