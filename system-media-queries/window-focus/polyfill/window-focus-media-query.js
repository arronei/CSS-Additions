// Polyfill for Window Focus Media Query: https://arronei.github.io/CSS-Additions/system-media-queries/window-focus/spec/
//
// Rewrites @media rules in the page's style sheets. Each (window-focus) feature is evaluated here and replaced with a
// condition the browser already understands, so the browser still handles and/or/not and everything else.
// Re-evaluates when the window gains or loses focus.
(() => {
  'use strict';

  if (matchMedia('(window-focus: active), (window-focus: inactive)').matches) return; // Supported natively.

  const TRUE = '(min-width: 0px)';
  const FALSE = '(not (min-width: 0px))';
  const UNKNOWN = '(x-window-focus-unknown)'; // An unknown feature: the browser applies three-valued logic.

  const VALUES = ['active', 'inactive'];
  const MIGHT_USE = /\bwindow-focus\b/i;

  // Top-level documents and same-origin frames follow the window. A cross-origin frame can't read the top-level
  // document, so it gets the spec's restricted value, which is whether focus is inside the frame.
  function actual() {
    let focused;
    try {
      focused = window.top.document.hasFocus();
    } catch {
      focused = document.hasFocus();
    }
    return focused ? 'active' : 'inactive';
  }

  function evaluate(mediaText, current) {
    return mediaText.replace(/\(\s*([a-z-]+)\s*(?::\s*([a-z0-9-]+)\s*)?\)/gi, (group, name, value) => {
      if (name.toLowerCase() !== 'window-focus') return group;
      if (value === undefined) return current === 'active' ? TRUE : FALSE;
      if (!VALUES.includes(value.toLowerCase())) return UNKNOWN;
      return current === value.toLowerCase() ? TRUE : FALSE;
    });
  }

  const written = new WeakMap(); // CSSMediaRule -> { original, raw: what we set, text: what the browser kept }
  let pinned = null;

  function update() {
    const current = pinned ?? actual();
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
        if (MIGHT_USE.test(original)) {
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

  // Focus has finished moving by the next task, so hasFocus() is settled.
  const soon = () => setTimeout(update);

  window.WindowFocusMediaQuery = {
    // The media text the polyfill would give the browser when the feature is `current` ('active' or 'inactive').
    evaluate: (mediaText, current = actual()) => evaluate(mediaText, current),
    // Re-evaluate the page's style sheets, for example after adding one.
    update,
    // Pretend the window is 'active' or 'inactive', or pass null to follow the window again.
    pretend(current) {
      pinned = current;
      update();
    },
  };

  update();
  let top = window;
  try {
    if (window.top.document) top = window.top;
  } catch {
    // A cross-origin top-level window can't be watched, and doesn't need to be for the restricted value.
  }
  for (const target of new Set([window, top])) {
    target.addEventListener('focus', soon);
    target.addEventListener('blur', soon);
  }
  document.addEventListener('visibilitychange', soon);
  addEventListener('pageshow', update);
  addEventListener('DOMContentLoaded', update);
  addEventListener('load', update);
})();
