// Polyfill for Platform Media Query: https://arronei.github.io/CSS-Additions/system-media-queries/platform/spec/
//
// Rewrites @media rules in the page's style sheets. Each (platform) feature is evaluated here and replaced with a
// condition the browser already understands, so the browser still handles and/or/not and everything else. The value
// comes from navigator.userAgentData.platform where it exists, and from the User-Agent string otherwise, which is
// what the spec requires: the feature agrees with the platform the browser already reports.
(() => {
  'use strict';

  const VALUES = ['windows', 'macos', 'ios', 'android', 'linux', 'chromeos', 'other'];

  if (matchMedia(VALUES.map((v) => `(platform: ${v})`).join(', ')).matches) return; // Supported natively.

  const TRUE = '(min-width: 0px)';
  const FALSE = '(not (min-width: 0px))';
  const UNKNOWN = '(x-platform-unknown)'; // An unknown feature: the browser applies three-valued logic.

  // The spec's mapping from navigator.userAgentData.platform.
  const FROM_HINT = {
    'android': 'android',
    'chrome os': 'chromeos',
    'chromium os': 'chromeos',
    'ios': 'ios',
    'linux': 'linux',
    'macos': 'macos',
    'windows': 'windows',
  };

  // The platform a User-Agent string reports. Order matters: "CrOS" and "Android" both also say Linux, and Safari on
  // an iPad says Macintosh by default, which the spec wants reported as macos.
  function platformFor(ua) {
    if (/Windows/i.test(ua)) return 'windows';
    if (/CrOS/i.test(ua)) return 'chromeos';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Mac OS X|Macintosh/i.test(ua)) return 'macos';
    if (/Linux|X11|FreeBSD|OpenBSD|NetBSD/i.test(ua)) return 'linux';
    return 'other';
  }

  const actual = navigator.userAgentData?.platform
    ? (FROM_HINT[navigator.userAgentData.platform.toLowerCase()] ?? 'other')
    : platformFor(navigator.userAgent);

  function evaluate(mediaText, current) {
    return mediaText.replace(/\(\s*([a-z-]+)\s*(?::\s*([a-z0-9-]+)\s*)?\)/gi, (group, name, value) => {
      if (name.toLowerCase() !== 'platform') return group;
      if (value === undefined) return TRUE; // Every value is true in a boolean context.
      if (!VALUES.includes(value.toLowerCase())) return UNKNOWN;
      return current === value.toLowerCase() ? TRUE : FALSE;
    });
  }

  const written = new WeakMap(); // CSSMediaRule -> { original, raw: what we set, text: what the browser kept }
  let pinned = null;

  function update() {
    const current = pinned ?? actual;
    for (const sheet of document.styleSheets) visit(sheet, current);
  }

  function visit(parent, current) {
    let rules;
    try {
      rules = parent.cssRules;
    } catch {
      return; // A cross-origin style sheet can't be read.
    }
    for (const rule of rules ?? []) {
      if (rule instanceof CSSMediaRule) {
        let saved = written.get(rule);
        if (saved && rule.media.mediaText !== saved.text) saved = null; // Changed by script since we wrote it.
        const original = saved?.original ?? rule.media.mediaText;
        if (/\bplatform\b/i.test(original)) {
          const raw = evaluate(original, current);
          if (raw !== saved?.raw) {
            rule.media.mediaText = raw;
            written.set(rule, { original, raw, text: rule.media.mediaText });
          }
        }
      }
      if (rule.cssRules) visit(rule, current);
      if (rule.styleSheet) visit(rule.styleSheet, current);
    }
  }

  window.PlatformMediaQuery = {
    // The media text the polyfill would give the browser when the platform is `current`.
    evaluate: (mediaText, current = pinned ?? actual) => evaluate(mediaText, current),
    // The platform this page reports.
    value: actual,
    // The platform a User-Agent string reports, for testing.
    platformFor,
    // Re-evaluate the page's style sheets, for example after adding one.
    update,
    // Pretend to be on another platform, such as pretend('macos'), or pass null to stop.
    pretend(current) {
      pinned = current;
      update();
    },
  };

  update();
  addEventListener('DOMContentLoaded', update);
  addEventListener('load', update);
})();
