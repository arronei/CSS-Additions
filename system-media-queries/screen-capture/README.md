# Screen capture media query

A media feature that lets a page hide personal details while the user shares or records their screen, without the page
ever finding out that a capture is happening.

```css
@media (screen-capture: active) {
  .balance, .message-preview, .api-key {
    color: transparent;
    text-shadow: 0 0 0.6em rgb(0 0 0 / 0.6);
  }
}
```

- **`screen-capture`** is `active` for a visible document whose part of the screen is in a capture the browser makes
  (such as `getDisplayMedia()` or casting), a screen recording the operating system reports, or a mirrored display.
  Assistive technology, tab thumbnails, and screenshots don't count.

## Privacy and security

The feature is always a **protected media feature**. Rules under it can change only paint-only properties, like
`color`, `background-color`, `box-shadow`, and `outline`. `display: none` is ignored, and `matchMedia()` always reports
`none`. So:

| Risk | Protection |
| --- | --- |
| Revealing that the user is in a meeting, streaming, or talking to support | Nothing the page can measure changes: not script, layout, resource loading, or timing. |
| Linking documents by the moment a capture starts | No document can observe the moment. |
| Showing the people watching something different from what the user sees | The browser must paint the same thing on the screen and in the capture. |
| Hiding a scam from a fraud team, or abuse from a victim recording evidence | The user can turn the feature off for a capture while it runs, and the browser tells the user when content is hidden. |
| Treating it as copy protection | The spec says it isn't one: screenshots, cameras, and unreported captures aren't covered. |

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |

There is no polyfill: page script can't detect captures made by other apps, and can't implement protected evaluation.
