# Form factor media query

A media feature for the kind of device a page is shown on, for the designs that capability queries can't express: a
television read from across a room, a watch, a car, an e-ink reader.

```css
@media (form-factor: tv) { :root { font-size: 24px; } .hover-only-toolbar { display: none; } }
@media (form-factor: watch) { .sidebar, .related { display: none; } }
@media (form-factor: automotive) { button { min-block-size: 4rem; font-size: 1.5rem; } }
@media (form-factor: eink) { * { animation: none !important; } }
```

- **`form-factor`** is `desktop`, `mobile`, `tablet`, `tv`, `watch`, `xr`, `eink`, `automotive`, or `other`. A device
  can have several, so a keyword matches when it is one of them: on a watch, both `(form-factor: watch)` and
  `(form-factor: mobile)` match. To exclude one, write `(form-factor: mobile) and (not (form-factor: watch))`.

The values are the ones `Sec-CH-UA-Form-Factors` already defines, plus `tv`, which that client hint is missing. The
spec flags that mismatch and asks for the hint to add it.

## Privacy

Unlike [platform](../platform/), this feature does reveal more than every site gets today: the form factor is a
client hint a site has to request, and which isn't shared with cross-origin frames unless the top-level site
delegates it. The spec keeps both limits.

| Risk | Protection |
| --- | --- |
| Identifying users of rare devices, such as a watch or an e-ink reader | The closed list, plus the fact that those devices are already recognizable from viewport size, `update: slow`, and `environment-blending`. |
| Third-party tracking | The same `ch-ua-form-factors` permissions policy that delegates the client hint. Frames without it get only the coarse mobile or desktop value their own requests already carry. |
| Fingerprinting protection modes | The feature falls back to that same coarse value, so a watch looks like a phone rather than a watch. |
| Linking visits by a change | The value is fixed when the page loads. |
| Sites refusing to serve unusual devices | The spec says the feature is for adapting, never for excluding, and the fallbacks are built so an unrecognized device gets a usable layout. |

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |
| [polyfill/](polyfill/) | A JavaScript implementation, a demo, tests, and notes on where it differs from the spec. |
