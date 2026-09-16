# Network media queries

Media features for whether the browser is online and whether the connection is metered.

```css
@media (network: offline) {
  .needs-network { opacity: 0.5; pointer-events: none; }
  .offline-banner { display: block; }
}

@media (connection: metered), (prefers-reduced-data: reduce) {
  .hero video { display: none; }
}
```

- **`network`** is `online` or `offline`, exactly as `navigator.onLine` reports, changing in the same task as the
  `online` and `offline` events. `(network)` means online.
- **`connection`** is `metered` when the operating system reports the network as metered or constrained (cellular
  data, hotspots, networks marked as metered, Low Data Mode), and `unmetered` otherwise. It never reveals the network's
  type, speed, or name.

## Privacy

| Risk | Protection |
| --- | --- |
| `network` reveals whether the browser is online. | Nothing that `navigator.onLine` doesn't reveal, to the same documents, at the same moments. |
| `connection` reveals cellular versus Wi-Fi, and when the user leaves home. | Only the operating system's metered flag. Servers usually learn the same from the IP address. |
| A network change could link visits once the IP address is hidden. | Contexts where the browser hides the IP address, and other reduced-exposure contexts, always see `unmetered`. |
| Changes happen at one moment in every document. | Delayed change delivery for `connection`: up to 60 seconds, at most once every 10 minutes. |

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |
| [polyfill/](polyfill/) | A JavaScript implementation, a demo, tests, and notes on where it differs from the spec. |

## License

This document and all associated files in the github project are licensed under [CC0](https://creativecommons.org/publicdomain/zero/1.0/) ![](https://licensebuttons.net/p/zero/1.0/80x15.png).
This means you can reuse, remix, or otherwise appropriate this project for your own use **without restriction**.
(The actual legal meaning can be found at the above link.)
Don't ask me for permission to use any part of this project, **just use it**.
I would appreciate attribution, but that is not required by the license.
