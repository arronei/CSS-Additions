// Polyfill for Form Factor Media Query:
// https://arronei.github.io/CSS-Additions/system-media-queries/form-factor/spec/
//
// Rewrites @media rules in the page's style sheets. Each (form-factor) feature is evaluated here and replaced with a
// condition the browser already understands. A device can have several form factors, so the feature matches a keyword
// when that keyword is one of them. The values come from the Sec-CH-UA-Form-Factors client hint where the browser
// exposes it, and from the coarse mobile signal plus a few User-Agent tokens otherwise.
(() => {
  'use strict';

  const VALUES = ['desktop', 'mobile', 'tablet', 'tv', 'watch', 'xr', 'eink', 'automotive', 'other'];

  if (matchMedia(VALUES.map((v) => `(form-factor: ${v})`).join(', ')).matches) return; // Supported natively.

  const TRUE = '(min-width: 0px)';
  const FALSE = '(not (min-width: 0px))';
  const UNKNOWN = '(x-form-factor-unknown)'; // An unknown feature: the browser applies three-valued logic.

  // The spec's coarse form factor: the mobile bit that every site already receives.
  const coarseFor = (ua, mobile) =>
    (mobile ?? /Mobile|Android|iPhone|iPad|Watch/i.test(ua)) ? 'mobile' : 'desktop';

  // ponytail: heuristics for devices the browser doesn't classify for us. The client hint is the real source; these
  // tokens only cover the cases where guessing beats reporting a plain desktop, and `tv` isn't in the hint at all.
  function guessFor(ua) {
    const guesses = [];
    if (/SmartTV|Smart-TV|SMART-TV|GoogleTV|AppleTV|HbbTV|NetCast|Web0S|WebOS|Tizen|BRAVIA|Roku|CrKey/i.test(ua)) guesses.push('tv');
    if (/OculusBrowser|Quest|Pico|VisionOS/i.test(ua)) guesses.push('xr');
    if (/Watch/i.test(ua)) guesses.push('watch');
    if (/Kobo|reMarkable|Boox|Kindle/i.test(ua)) guesses.push('eink');
    return guesses;
  }

  function fallback(ua = navigator.userAgent, mobile = navigator.userAgentData?.mobile) {
    const factors = new Set([coarseFor(ua, mobile), ...guessFor(ua)]);
    // ponytail: (update: slow) is the closest capability the platform already exposes for e-ink.
    if (matchMedia('(update: slow)').matches) factors.add('eink');
    return [...factors];
  }

  let actual = fallback();
  let pinned = null;

  function evaluate(mediaText, factors) {
    return mediaText.replace(/\(\s*([a-z-]+)\s*(?::\s*([a-z0-9-]+)\s*)?\)/gi, (group, name, value) => {
      if (name.toLowerCase() !== 'form-factor') return group;
      if (value === undefined) return TRUE; // Every value is true in a boolean context.
      if (!VALUES.includes(value.toLowerCase())) return UNKNOWN;
      return factors.includes(value.toLowerCase()) ? TRUE : FALSE;
    });
  }

  const written = new WeakMap(); // CSSMediaRule -> { original, raw: what we set, text: what the browser kept }

  function update() {
    const factors = pinned ?? actual;
    for (const sheet of document.styleSheets) visit(sheet, factors);
  }

  function visit(parent, factors) {
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
        if (/\bform-factor\b/i.test(original)) {
          const raw = evaluate(original, factors);
          if (raw !== saved?.raw) {
            rule.media.mediaText = raw;
            written.set(rule, { original, raw, text: rule.media.mediaText });
          }
        }
      }
      if (rule.cssRules) visit(rule, factors);
      if (rule.styleSheet) visit(rule.styleSheet, factors);
    }
  }

  window.FormFactorMediaQuery = {
    // The media text the polyfill would give the browser for a list of form factors.
    evaluate: (mediaText, factors = pinned ?? actual) => evaluate(mediaText, factors),
    // The form factors of this page. Replaced once the client hint resolves.
    get value() {
      return [...actual];
    },
    // The parts the spec defines separately, for testing.
    coarseFor,
    guessFor,
    // Re-evaluate the page's style sheets, for example after adding one.
    update,
    // Pretend to be another kind of device, such as pretend(['watch', 'mobile']), or pass null to stop.
    pretend(factors) {
      pinned = factors;
      update();
    },
  };

  update();
  addEventListener('DOMContentLoaded', update);
  addEventListener('load', update);

  // The client hint is the real source, and it resolves asynchronously.
  navigator.userAgentData?.getHighEntropyValues?.(['formFactors']).then((values) => {
    const reported = (values.formFactors ?? []).map((f) => (VALUES.includes(f.toLowerCase()) ? f.toLowerCase() : 'other'));
    if (!reported.length) return;
    // The hint has no value for a television, so the spec's `tv` still comes from the fallback.
    actual = [...new Set([...reported, ...guessFor(navigator.userAgent)])];
    update();
  }).catch(() => {});
})();
