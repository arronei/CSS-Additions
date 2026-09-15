# Keyboard media queries

Media features for whether a hardware keyboard is available and whether an on-screen keyboard is covering the page.

```css
kbd.hint { display: none; }
@media (keyboard: physical) { kbd.hint { display: inline; } }

@media (virtual-keyboard: visible) {
  .bottom-nav, .chat-launcher { display: none; }
}
```

- **`keyboard`** is `physical` when a hardware keyboard is connected and usable, and `none` otherwise. Desktop and laptop
  computers are always `physical`. Switch devices, braille displays, game controllers, and barcode scanners don't count.
- **`virtual-keyboard`** is `visible` when an on-screen keyboard is typing into the page and covering part of it. It isn't
  set by typing into the browser's address bar, its prompts, or other apps, and it never reveals the keyboard's size.

## Privacy

| Risk | Protection |
| --- | --- |
| A keyboard on a phone is rare, and so identifies the user. | On kinds of devices where fewer than 1 in 100 users have a keyboard connected, the platform default is reported unless the user opts in. |
| Assistive technology input devices could reveal a disability. | They aren't hardware keyboards for this feature. |
| Attaching a keyboard happens at one moment in every document. | Delayed change delivery for `keyboard` (up to 10 seconds, at most once a minute), and frame-scoped exposure: cross-origin frames see the platform default. |
| On-screen keyboard size identifies the keyboard app and language. | Only visible or hidden. |
| Frames could learn when the user types into the page around them. | A frame not allowed `virtual-keyboard-state` sees `visible` only when the user is typing into that frame. |

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |
| [polyfill/](polyfill/) | A JavaScript implementation, a demo, tests, and notes on where it differs from the spec. |
