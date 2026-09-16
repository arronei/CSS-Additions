# Platform media query

A media feature for the family of the user's operating system, so a style sheet can follow that platform's
conventions without script.

```css
.key-mod::after { content: "Ctrl"; }
@media (platform: macos), (platform: ios) { .key-mod::after { content: "⌘"; } }

@media (platform: windows) { .dialog-buttons .accept { order: -1; } }
@media (platform: macos) { .download-exe { display: none; } .download-dmg { display: inline; } }
```

- **`platform`** is `windows`, `macos`, `ios`, `android`, `linux`, `chromeos`, or `other`. The list is closed:
  anything else is `other`, and browsers may not invent keywords.

## Privacy

The design rests on one rule: the value must be the same platform the browser already reports in its `User-Agent`
header and in `navigator.userAgentData.platform`, even when that isn't the platform it's running on.

| Risk | Protection |
| --- | --- |
| Adding to a fingerprint | Nothing is added. Every request already carries the platform in its header, and script can read it. Measured separately, the whole user-agent string is worth 7 to 10 bits of identifying information, while the platform alone is 1.2 to 2.3 bits. |
| Identifying users of unusual systems | The closed list. A system with no keyword reports `other`, along with browsers that decline to say. |
| Fighting the browser's own disguises | An iPad in desktop mode reports `macos`, Chrome on Android in desktop mode reports `linux`, and a browser that normalizes the platform for privacy gets the same normalization here. |
| Linking visits by a change | The value is fixed when the page loads. |
| Encouraging user-agent sniffing | The spec says plainly that this isn't feature detection, that `@supports` and capability features are, and that sites which gate features on it break browsers. |

## Not specified, on purpose

OS version (where nearly all the entropy is, and which Safari and Chrome both froze), device model, CPU architecture
and bitness, and the browser or engine. Each rejection is argued in the spec, along with the strongest alternative:
features for the conventions themselves, such as how the modifier key is written.

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |
| [polyfill/](polyfill/) | A JavaScript implementation, a demo, tests, and notes on where it differs from the spec. |
