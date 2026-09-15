// Polyfill for Regional Preference Media Queries:
// https://arronei.github.io/CSS-Additions/system-media-queries/regional-preferences/spec/
//
// Rewrites @media rules in the page's style sheets. Each (hour-cycle), (measurement-system), (temperature-unit), and
// (first-day-of-week) feature is evaluated here, from the locale Intl uses, and replaced with a condition the browser
// already understands. The values don't change while the page is open, as the spec requires.
(() => {
  'use strict';

  if (matchMedia('(hour-cycle: h12), (hour-cycle: h23)').matches) return; // Supported natively.

  const TRUE = '(min-width: 0px)';
  const FALSE = '(not (min-width: 0px))';
  const UNKNOWN = '(x-regional-unknown)'; // An unknown feature: the browser applies three-valued logic.

  const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const FEATURES = {
    'hour-cycle': ['h12', 'h23'],
    'measurement-system': ['metric', 'uksystem', 'ussystem'],
    'temperature-unit': ['celsius', 'fahrenheit'],
    'first-day-of-week': WEEKDAYS,
  };
  const MIGHT_USE = /\b(hour-cycle|measurement-system|temperature-unit|first-day-of-week)\b/i;

  // ponytail: copied from CLDR 48 supplemental measurementData, including its temperature category. Every other region
  // is metric and Celsius. Update by hand if CLDR changes these lists.
  const US_SYSTEM = ['US', 'LR'];
  const UK_SYSTEM = ['GB', 'MM'];
  const FAHRENHEIT = ['US', 'BS', 'BZ', 'KY', 'PR', 'PW'];

  // The spec's feature values for a Unicode locale identifier.
  function valuesFor(tag) {
    const locale = new Intl.Locale(tag);
    const region = locale.maximize().region ?? '001';
    const keyword = (key) => new RegExp(`-u(?:-[a-z0-9]{2,8})*?-${key}-([a-z0-9]{3,8})`, 'i').exec(locale.toString())?.[1];
    const cycle = (locale.getHourCycles?.() ?? locale.hourCycles)?.[0];
    const week = locale.getWeekInfo?.() ?? locale.weekInfo;
    const ms = keyword('ms');
    const mu = keyword('mu');
    let measurement = 'metric';
    if (FEATURES['measurement-system'].includes(ms)) measurement = ms;
    else if (US_SYSTEM.includes(region)) measurement = 'ussystem';
    else if (UK_SYSTEM.includes(region)) measurement = 'uksystem';
    return {
      'hour-cycle': cycle && (/^h1[12]$/.test(cycle) ? 'h12' : 'h23'),
      'measurement-system': measurement,
      'temperature-unit': (mu ? mu === 'fahrenhe' : FAHRENHEIT.includes(region)) ? 'fahrenheit' : 'celsius',
      'first-day-of-week': week && WEEKDAYS[week.firstDay - 1],
    };
  }

  function evaluate(mediaText, state) {
    return mediaText.replace(/\(\s*([a-z-]+)\s*(?::\s*([a-z0-9-]+)\s*)?\)/gi, (group, name, value) => {
      const values = FEATURES[name.toLowerCase()];
      if (!values) return group;
      const current = state[name.toLowerCase()];
      if (value !== undefined && !values.includes(value.toLowerCase())) return UNKNOWN;
      if (current === undefined) return UNKNOWN; // This browser's Intl can't tell.
      return value === undefined || current === value.toLowerCase() ? TRUE : FALSE;
    });
  }

  // The regional locale: the locale Intl uses when script doesn't give one.
  const actual = valuesFor(new Intl.DateTimeFormat().resolvedOptions().locale);
  const written = new WeakMap(); // CSSMediaRule -> { original, raw: what we set, text: what the browser kept }
  let pinned = null;

  function update() {
    const state = { ...actual, ...pinned };
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

  window.RegionalPreferenceMediaQueries = {
    // The media text the polyfill would give the browser for a state such as { 'hour-cycle': 'h23' }.
    evaluate: (mediaText, state) => evaluate(mediaText, { ...actual, ...state }),
    // The feature values for a locale, such as valuesFor('en-GB').
    valuesFor,
    // The values for this page.
    values: { ...actual },
    // Re-evaluate the page's style sheets, for example after adding one.
    update,
    // Pretend to be in another locale, such as pretend('de-CH'), or pass null to use the page's locale again.
    pretend(tag) {
      pinned = tag && valuesFor(tag);
      update();
    },
  };

  update();
  addEventListener('DOMContentLoaded', update);
  addEventListener('load', update);
})();
