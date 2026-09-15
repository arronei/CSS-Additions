// Polyfill for Network Media Queries: https://arronei.github.io/CSS-Additions/system-media-queries/network/spec/
//
// Rewrites @media rules in the page's style sheets. Each (network) and (connection) feature is evaluated here and
// replaced with a condition the browser already understands, so the browser still handles and/or/not and
// everything else. Re-evaluates when the browser goes online or offline, or the connection changes.
(() => {
  'use strict';

  if (matchMedia('(network: online), (network: offline)').matches) return; // Supported natively.

  const TRUE = '(min-width: 0px)';
  const FALSE = '(not (min-width: 0px))';
  const UNKNOWN = '(x-network-unknown)'; // An unknown feature: the browser applies the spec's three-valued logic.

  // Feature -> [its values, the value that is false in a boolean context].
  const FEATURES = {
    network: [['online', 'offline'], 'offline'],
    connection: [['unmetered', 'metered'], null],
  };
  const MIGHT_USE = /\b(network|connection)\b/i;

  // ponytail: navigator.connection.type is the only signal browsers expose, and only Chromium has it. The spec's
  // "metered" comes from the operating system, which page script can't read, so cellular stands in for it.
  const actual = () => ({
    network: navigator.onLine ? 'online' : 'offline',
    connection: navigator.connection?.type === 'cellular' ? 'metered' : 'unmetered',
  });

  // Replaces each (feature) and (feature: value) group for this spec's features. Anything else, including range
  // syntax, which discrete features don't allow, is left for the browser, which treats it as unknown.
  function evaluate(mediaText, state) {
    return mediaText.replace(/\(\s*([a-z-]+)\s*(?::\s*([a-z0-9-]+)\s*)?\)/gi, (group, name, value) => {
      const feature = FEATURES[name.toLowerCase()];
      if (!feature) return group;
      const [values, falsy] = feature;
      const current = state[name.toLowerCase()];
      if (value === undefined) return current !== falsy ? TRUE : FALSE;
      if (!values.includes(value.toLowerCase())) return UNKNOWN;
      return current === value.toLowerCase() ? TRUE : FALSE;
    });
  }

  const written = new WeakMap(); // CSSMediaRule -> { original, raw: what we set, text: what the browser kept }
  let pinned = null;

  function update() {
    const state = { ...actual(), ...pinned };
    for (const sheet of document.styleSheets) visit(sheet, state);
  }

  function visit(parent, state) {
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
        if (MIGHT_USE.test(original)) {
          const raw = evaluate(original, state);
          if (raw !== saved?.raw) {
            rule.media.mediaText = raw;
            written.set(rule, { original, raw, text: rule.media.mediaText });
          }
        }
      }
      if (rule.cssRules) visit(rule, state);
      if (rule.styleSheet) visit(rule.styleSheet, state);
    }
  }

  window.NetworkMediaQueries = {
    // The media text the polyfill would give the browser, for a state such as { network: 'offline' }.
    evaluate: (mediaText, state) => evaluate(mediaText, { ...actual(), ...state }),
    // Re-evaluate the page's style sheets, for example after adding one.
    update,
    // Pretend some features have other values, such as { connection: 'metered' }, or pass null to stop.
    pretend(state) {
      pinned = state;
      update();
    },
  };

  update();
  addEventListener('online', update);
  addEventListener('offline', update);
  navigator.connection?.addEventListener('change', update);
  addEventListener('DOMContentLoaded', update);
  addEventListener('load', update);
})();
