# External queries

## Disclaimer

This proposal is an exploratory idea and is likely to be controversial. `@script` lets a style sheet start
script, which CSS has never been able to do, and `@api` lets a style sheet read answers from a server. The
spec describes protections for both, but they are neither exhaustive nor complete. Treat it as a starting point
to build on and refine.

---

Style rules that ask a source outside CSS a yes-or-no question. A one-line `@api` rule names a web API, a
one-line `@script` rule names a JavaScript module, and `@param` asks a named source a question.

```css
@api --moon-phase url("https://moon.example/phase");
@api --solar-eclipse url("https://sky.example/eclipse");
@script --moon-calc url("/queries/moon.js");

/* GET https://moon.example/phase?param=full → {"result": true} */
@param(--moon-phase, "full") { .moon { background-image: url(full-moon.svg); } }
@param(--moon-phase, "first-quarter") or (--moon-phase, "last-quarter") { … }
@param(--moon-phase, "full") and (--solar-eclipse, "partial") { .sky { filter: brightness(0.6); } }
@error(--moon-phase, 404) { .moon { display: none; } }

/* Calls the default export of /queries/moon.js with "new" */
@param(--moon-calc, "new") { .moon { opacity: 0.2; } }

.badge { content: if(param(--moon-calc, "full"): "Full moon tonight"; else: none); }
```

- **`@api --name url(…);`** declares a web API. Each question is one `GET` request, with its values
  comma-separated in one `?param=` (`?param=between,10,20`), answered with `{"result": true}` served as
  `application/external-query+json`. Each question is asked once per page load. Cross-origin APIs must allow it
  with CORS.
- **`@script --name url(…);`** declares a JavaScript module. Each question calls its default export with the
  values; the function returns `true`, `false`, or a promise of one. An optional `watch(refresh, signal)` export
  lets the module say when answers may have changed.
- **URL modifiers** go after the URL, inside `url("…")`:
  - `timeout(10s)` makes a question an error if it hasn't answered in that time.
  - `cross-origin(use-credentials)` sends cookies to a cross-origin API, which must allow credentials in CORS.
    By default, cookies go only to the page's own origin.
  - `referrer-policy(no-referrer)` and the other referrer policies control the `Referer` header.
  - `integrity("sha384-…")`, on `@script` only, runs the module only if its contents match. With it, a page can
    allow the module in its Content Security Policy by hash.
- Declarations go anywhere at the top level of a style sheet. Names are shared across the document, and when two
  declarations use the same name, the last one wins, as with `@keyframes`. A declaration asks nothing until a
  question uses it, the way `@font-face` downloads nothing until a font is used.
- **`@param(--name, values…)`** applies when the source answers true. The values are passed to the source as
  written, and the source decides what they mean: `@param(--moon, "between", 10, 20)`. They can be left out:
  `@param(--store-open)`. `and`, `or`, and `not` combine questions, including questions to different sources.
  A name that isn't declared never matches.
- **`@error(--name, kinds…)`** applies when the source can't answer: an HTTP status such as `404`,
  `unavailable` when the question couldn't be asked, `invalid` when the answer wasn't true or false, or
  `timeout`. With no kinds, it matches any error. `and`, `or`, and `not` work here too:
  `@error(--store) or (--hours)`.
- **`param(--name, values…)`** asks the same questions inside `if()`.

Answers load the way web fonts do, and a keyword after `url()` chooses how, with the same names as
`font-display`:

| Keyword | Rendering waits | A later answer |
| --- | --- | --- |
| `block` (default) | up to about 3s | applies whenever it arrives |
| `swap` | about 100ms at most | applies whenever it arrives |
| `fallback` | about 100ms at most | applies if it arrives within about 3s, otherwise ignored |
| `optional` | about 100ms at most | ignored for this page view; cached for the next |

```css
@api --moon-phase url("https://moon.example/phase");             /* hero image: worth the wait */
@api --store-open url("/api/store/open") swap;                    /* small badge: never wait */
@api --sale url("/api/sale/active" timeout(5s)) fallback;         /* banner: only if it's fast */
@api --holiday url("/api/holiday/theme") optional;                /* whole theme: skip if late */
@script --flags url("/queries/flags.js" integrity("sha384-…")) swap;
```

Until a source answers, none of its `@param` or `@error` rules apply, including `@param not (…)`. An ignored
late answer, or a late error, never applies, so the page keeps the styles written outside them.

Browsers without support ignore `@api` and `@script`, and drop `@param` and `@error` rules with everything in
them, so styles a page needs without an answer go outside them.

| Folder | Contents |
| --- | --- |
| [spec/](spec/) | The specification. [index.bs](spec/index.bs) is the Bikeshed source, and [index.html](spec/index.html) is the rendered spec. |

To rebuild the spec after editing `index.bs`, run this from this folder:

```sh
pip install bikeshed
bikeshed spec spec/index.bs spec/index.html
```

## License

This document and all associated files in the github project are licensed under [CC0](https://creativecommons.org/publicdomain/zero/1.0/) ![](https://licensebuttons.net/p/zero/1.0/80x15.png).
This means you can reuse, remix, or otherwise appropriate this project for your own use **without restriction**.
(The actual legal meaning can be found at the above link.)
Don't ask me for permission to use any part of this project, **just use it**.
I would appreciate attribution, but that is not required by the license.
