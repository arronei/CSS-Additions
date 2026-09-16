# Reduced power preference media query

A media feature that reports when the device is saving power, as Low Power Mode, Battery Saver, and Energy Saver do,
so pages can do less.

```css
@media (prefers-reduced-power: reduce) {
  .hero video { display: none; }
  .hero { background-image: url(hero-still.jpg); }
  .spinner, .confetti { animation: none; }
}
```

- **`prefers-reduced-power`** is `reduce` when an operating system or browser power-saving mode is on, and
  `no-preference` otherwise. It is never a battery level, and it isn't `reduce` just because the device is on battery.

## Privacy

| Risk | Protection |
| --- | --- |
| The Battery Status API showed that battery changes can link a user's visits to different sites. | Delayed change delivery: hidden documents learn of a change only when they become visible; visible ones after a random delay of up to 60 seconds, and at most once every 10 minutes. |
| A mode that turns on at 20% suggests the battery level, which can be exploited in pricing. | Only a mode, never a level. The user can turn the feature off, or report `reduce` at all times. |
| A style sheet can report the value without script. | Private browsing modes and documents with script disabled always see `no-preference`. |

The feature isn't restricted in cross-origin frames, because embedded ads and video use much of a page's energy.

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |

There is no polyfill: browsers don't expose power-saving modes to script.

## License

This document and all associated files in the github project are licensed under [CC0](https://creativecommons.org/publicdomain/zero/1.0/) ![](https://licensebuttons.net/p/zero/1.0/80x15.png).
This means you can reuse, remix, or otherwise appropriate this project for your own use **without restriction**.
(The actual legal meaning can be found at the above link.)
Don't ask me for permission to use any part of this project, **just use it**.
I would appreciate attribution, but that is not required by the license.
