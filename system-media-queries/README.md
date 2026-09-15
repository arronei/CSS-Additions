# System media queries

Media features that describe the user's system rather than the viewport: power saving, the network, window focus, screen
capture, keyboards, accessibility settings, and regional preferences. Each is its own proposal, in its own folder.

A media feature is readable without script: a style sheet can load a resource only when a query matches, and so report
the value to a server from an email, a page with script blocked, or a CSS injection. Every spec here therefore has a
detailed privacy analysis of its own features, security considerations, and answers to the W3C security and privacy
questionnaire, built on a shared set of protections.

| Proposal | What it adds | Main protections |
| --- | --- | --- |
| [Privacy protections](privacy-protections/) | The shared threat model and mechanisms: protected evaluation, delayed change delivery, frame-scoped exposure, and reduced-exposure contexts | — |
| [Reduced power preference](power-saver/) | `(prefers-reduced-power: reduce)` | Delayed change delivery; no battery level |
| [Network](network/) | `(network: offline)`, `(connection: metered)` | Matches `navigator.onLine`; `connection` is delayed and fixed when the IP address is hidden |
| [Window focus](window-focus/) | `(window-focus: inactive)` | Matches `focus`/`blur` timing; frame-scoped; fixed without script |
| [Screen capture](screen-capture/) | `(screen-capture: active)` | Always protected: the page can hide content but can't detect the capture |
| [Keyboard](keyboard/) | `(keyboard: physical)`, `(virtual-keyboard: visible)` | Assistive technology excluded; rare values opt-in; frame-scoped; delayed |
| [Accessibility preferences](accessibility-preferences/) | `prefers-bold-text`, `prefers-button-shapes`, `prefers-differentiate-without-color`, `prefers-on-off-labels`, `prefers-reduced-caret-blink` | Protected unless the user shares; still adapts in private browsing |
| [Regional preferences](regional-preferences/) | `hour-cycle`, `measurement-system`, `temperature-unit`, `first-day-of-week` | Matches `Intl`; only `Accept-Language` without script; fixed per document |

The specs link to the privacy protections spec for the mechanisms they use. Specs with a polyfill have it in their own
`polyfill/` folder: [network](network/polyfill/), [window focus](window-focus/polyfill/),
[keyboard](keyboard/polyfill/), and [regional preferences](regional-preferences/polyfill/). The others describe state
that page script can't observe.

To build every spec, run this from this folder:

```sh
pip install bikeshed
for spec in */spec/index.bs; do bikeshed spec "$spec" "${spec%.bs}.html"; done
```
