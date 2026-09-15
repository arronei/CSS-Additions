// Polyfill for Keyboard Media Queries: https://arronei.github.io/CSS-Additions/system-media-queries/keyboard/spec/
//
// Rewrites @media rules in the page's style sheets. Each (keyboard) and (virtual-keyboard) feature is evaluated here
// and replaced with a condition the browser already understands, so the browser still handles and/or/not and
// everything else. Re-evaluates when focus moves or the viewport changes size.
(() => {
  'use strict';

  if (matchMedia('(virtual-keyboard: hidden), (virtual-keyboard: visible)').matches) return; // Supported natively.

  const TRUE = '(min-width: 0px)';
  const FALSE = '(not (min-width: 0px))';
  const UNKNOWN = '(x-keyboard-unknown)'; // An unknown feature: the browser applies three-valued logic.

  // Feature -> [its values, the value that is false in a boolean context].
  const FEATURES = {
    keyboard: [['none', 'physical'], 'none'],
    'virtual-keyboard': [['hidden', 'visible'], 'hidden'],
  };
  const MIGHT_USE = /\b(virtual-)?keyboard\b/i;

  // ponytail: page script can't tell whether a keyboard is connected. A device with no touch input is a desktop or
  // laptop, for which the spec says physical. Anything else is unknown, so (keyboard) queries don't match there.
  const keyboard = () => (navigator.maxTouchPoints === 0 ? 'physical' : undefined);

  const TEXT_INPUT = /^(text|search|email|url|tel|password|number|date|datetime-local|month|time|week)$/;
  const typingInto = (el) => !!el && (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'IFRAME'
    || (el.tagName === 'INPUT' && TEXT_INPUT.test(el.type)));

  let tallest = 0;
  let width = 0;

  // ponytail: a heuristic. On-screen keyboards shrink the visual viewport by far more than 150px while a text field
  // has focus; multiplying by the scale ignores pinch zoom. Resizing a desktop window while typing can fool it. The
  // VirtualKeyboard API reports the keyboard directly, but only for pages that let it overlay their content.
  function virtualKeyboard() {
    if (navigator.virtualKeyboard?.boundingRect.height > 0) return 'visible';
    const viewport = window.visualViewport;
    if (!viewport) return 'hidden';
    const height = viewport.height * viewport.scale;
    if (innerWidth !== width) {
      width = innerWidth; // Rotated or resized: measure again.
      tallest = height;
    }
    tallest = Math.max(tallest, height);
    return typingInto(document.activeElement) && tallest - height > 150 ? 'visible' : 'hidden';
  }

  const actual = () => ({ keyboard: keyboard(), 'virtual-keyboard': virtualKeyboard() });

  function evaluate(mediaText, state) {
    return mediaText.replace(/\(\s*([a-z-]+)\s*(?::\s*([a-z0-9-]+)\s*)?\)/gi, (group, name, value) => {
      const feature = FEATURES[name.toLowerCase()];
      if (!feature) return group;
      const [values, falsy] = feature;
      const current = state[name.toLowerCase()];
      if (value !== undefined && !values.includes(value.toLowerCase())) return UNKNOWN;
      if (current === undefined) return UNKNOWN;
      if (value === undefined) return current !== falsy ? TRUE : FALSE;
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

  const soon = () => setTimeout(update);

  window.KeyboardMediaQueries = {
    // The media text the polyfill would give the browser, for a state such as { 'virtual-keyboard': 'visible' }.
    evaluate: (mediaText, state) => evaluate(mediaText, { ...actual(), ...state }),
    // Re-evaluate the page's style sheets, for example after adding one.
    update,
    // Pretend some features have other values, such as { keyboard: 'none' }, or pass null to stop.
    pretend(state) {
      pinned = state;
      update();
    },
    typingInto,
  };

  update();
  visualViewport?.addEventListener('resize', update);
  navigator.virtualKeyboard?.addEventListener('geometrychange', update);
  addEventListener('focusin', soon);
  addEventListener('focusout', soon);
  addEventListener('DOMContentLoaded', update);
  addEventListener('load', update);
})();
