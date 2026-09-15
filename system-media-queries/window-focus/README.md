# Window focus media query

A media feature for whether the window showing the page is the one the user is using, so web apps can dim their title
bars and selections in the background, as native apps do.

```css
@media (window-focus: inactive) {
  .title-bar { background-color: #e5e7eb; color: #6b7280; }
  ::selection { background-color: #d1d5db; }
}
```

- **`window-focus`** is `active` when the page's top-level window has system focus, and `inactive` otherwise.
  `(window-focus)` means active.

## Privacy

| Risk | Protection |
| --- | --- |
| Attention: how long the user looked at the page. | Top-level documents already get this from `focus` and `blur` events. The feature changes in the same task, so it adds nothing, not even more precise timing. |
| Trackers in cross-origin frames could link two windows by the moment focus moves between them. | Frame-scoped exposure through the `window-focus-state` policy. Frames not allowed it see what `document.hasFocus()` already tells them: whether focus is inside the frame. |
| An email could measure reading time with no script. | Where scripting is disabled, the feature is always `active`. |

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |
| [polyfill/](polyfill/) | A JavaScript implementation, a demo, tests, and notes on where it differs from the spec. |
