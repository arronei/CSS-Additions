// Polyfill for Date and Time Media Queries: https://arronei.github.io/CSS-Additions/date-media-queries/spec/
//
// Rewrites @media rules in the page's style sheets. Each date feature, holiday(), and calendar() is evaluated here
// and replaced with a condition the browser already understands, so the browser still handles and/or/not, width,
// and everything else. Needs Temporal.
(() => {
  'use strict';

  if (typeof Temporal === 'undefined') {
    console.warn('date-media-queries: this browser has no Temporal, so the polyfill does nothing.');
    return;
  }
  if (matchMedia('(date)').matches) return; // Supported natively.

  const TRUE = '(min-width: 0px)';
  const FALSE = '(not (min-width: 0px))';
  const UNKNOWN = '(x-date-unknown)'; // An unknown feature: the browser applies the spec's three-valued logic.

  const FEATURE = /^(min-|max-)?(date|time|weekday|month|day|moon-phase|season)$/i;
  const MIGHT_USE = /\b(date|time|weekday|month|day|moon-phase|season|holiday|calendar)\b/i;
  const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const PHASES = ['new-moon', 'first-quarter', 'full-moon', 'last-quarter'];
  const BETWEEN = ['waxing-crescent', 'waxing-gibbous', 'waning-gibbous', 'waning-crescent'];
  const SEASONS = ['winter', 'spring', 'summer', 'autumn'];

  // ponytail: generated once from tzdb 2026d (zone.tab, zone1970.tab, backward), latitude < 0. Regenerate if zones
  // are added. Legacy links that the database points at a southern zone but that are northern were removed by hand.
  const SOUTH = new Set(`
    Africa/Blantyre Africa/Brazzaville Africa/Bujumbura Africa/Dar_es_Salaam Africa/Gaborone Africa/Harare
    Africa/Johannesburg Africa/Kigali Africa/Kinshasa Africa/Luanda Africa/Lubumbashi Africa/Lusaka
    Africa/Maputo Africa/Maseru Africa/Mbabane Africa/Nairobi Africa/Windhoek America/Araguaina
    America/Argentina/Buenos_Aires America/Argentina/Catamarca America/Argentina/ComodRivadavia
    America/Argentina/Cordoba America/Argentina/Jujuy America/Argentina/La_Rioja America/Argentina/Mendoza
    America/Argentina/Rio_Gallegos America/Argentina/Salta America/Argentina/San_Juan America/Argentina/San_Luis
    America/Argentina/Tucuman America/Argentina/Ushuaia America/Asuncion America/Bahia America/Belem
    America/Buenos_Aires America/Campo_Grande America/Catamarca America/Cordoba America/Coyhaique America/Cuiaba
    America/Eirunepe America/Fortaleza America/Guayaquil America/Jujuy America/La_Paz America/Lima
    America/Maceio America/Manaus America/Mendoza America/Montevideo America/Noronha America/Porto_Acre
    America/Porto_Velho America/Punta_Arenas America/Recife America/Rio_Branco America/Rosario America/Santarem
    America/Santiago America/Sao_Paulo Antarctica/Casey Antarctica/Davis Antarctica/DumontDUrville
    Antarctica/Macquarie Antarctica/Mawson Antarctica/McMurdo Antarctica/Palmer Antarctica/Rothera
    Antarctica/South_Pole Antarctica/Syowa Antarctica/Troll Antarctica/Vostok Asia/Dili Asia/Jakarta
    Asia/Jayapura Asia/Makassar Asia/Pontianak Asia/Ujung_Pandang Atlantic/South_Georgia Atlantic/St_Helena
    Atlantic/Stanley Australia/ACT Australia/Adelaide Australia/Brisbane Australia/Broken_Hill
    Australia/Canberra Australia/Currie Australia/Darwin Australia/Eucla Australia/Hobart Australia/LHI
    Australia/Lindeman Australia/Lord_Howe Australia/Melbourne Australia/NSW Australia/North Australia/Perth
    Australia/Queensland Australia/South Australia/Sydney Australia/Tasmania Australia/Victoria Australia/West
    Australia/Yancowinna Brazil/Acre Brazil/DeNoronha Brazil/East Brazil/West Chile/Continental
    Chile/EasterIsland Indian/Antananarivo Indian/Chagos Indian/Christmas Indian/Cocos Indian/Comoro
    Indian/Kerguelen Indian/Mahe Indian/Mauritius Indian/Mayotte Indian/Reunion NZ NZ-CHAT Pacific/Apia
    Pacific/Auckland Pacific/Bougainville Pacific/Chatham Pacific/Easter Pacific/Efate Pacific/Enderbury
    Pacific/Fakaofo Pacific/Fiji Pacific/Funafuti Pacific/Galapagos Pacific/Gambier Pacific/Guadalcanal
    Pacific/Kanton Pacific/Marquesas Pacific/Nauru Pacific/Niue Pacific/Norfolk Pacific/Noumea Pacific/Pago_Pago
    Pacific/Pitcairn Pacific/Port_Moresby Pacific/Rarotonga Pacific/Samoa Pacific/Tahiti Pacific/Tongatapu
    Pacific/Wallis US/Samoa`.split(/\s+/));

  // 6.3 Holiday registry. A string is a media condition; a function tests a Temporal.PlainDate.
  const HOLIDAYS = {
    ':new-years-day': '(date = "--01-01")',
    ':valentines-day': '(date = "--02-14")',
    ':halloween': '(date = "--10-31")',
    ':christmas-eve': '(date = "--12-24")',
    ':christmas': '(date = "--12-25")',
    ':new-years-eve': '(date = "--12-31")',
    ':easter': (d) => d.equals(easter(d.year)),
    ':good-friday': (d) => d.equals(easter(d.year).subtract({ days: 2 })),
    ':orthodox-easter': (d) => d.equals(orthodoxEaster(d.year)),
    ':lunar-new-year': 'calendar(chinese, (month: M01) and (day = 1))',
    ':mid-autumn-festival': 'calendar(chinese, (month: M08) and (day = 15))',
    ':rosh-hashanah': 'calendar(hebrew, (month: M01) and (day <= 2))',
    ':yom-kippur': 'calendar(hebrew, (month: M01) and (day = 10))',
    ':passover': 'calendar(hebrew, (month: M07) and (15 <= day <= 22))',
    'il:passover': 'calendar(hebrew, (month: M07) and (15 <= day <= 21))',
    ':hanukkah': (d) => [0, 1, 2, 3, 4, 5, 6, 7].some((i) => {
      const hebrew = d.subtract({ days: i }).withCalendar('hebrew');
      return hebrew.monthCode === 'M03' && hebrew.day === 25;
    }),
    'us:thanksgiving': '(month: 11) and (weekday: thursday) and (22 <= day <= 28)',
    'us:independence-day': '(date = "--07-04")',
    'us:memorial-day': '(month: 5) and (weekday: monday) and (day >= 25)',
    'us:labor-day': '(month: 9) and (weekday: monday) and (day <= 7)',
    'us:mothers-day': '(month: 5) and (weekday: sunday) and (8 <= day <= 14)',
    'us:fathers-day': '(month: 6) and (weekday: sunday) and (15 <= day <= 21)',
    'ca:thanksgiving': '(month: 10) and (weekday: monday) and (8 <= day <= 14)',
    'ca:canada-day': '(date = "--07-01")',
    'gb:mothers-day': (d) => d.equals(easter(d.year).subtract({ days: 21 })),
    'mx:dia-de-muertos': '("--11-01" <= date <= "--11-02")',
  };

  // Rewriting media text.

  function substitute(text, calendar, now) {
    // holiday() and calendar() first, because they contain parentheses of their own.
    const call = /\b(calendar|holiday)\(/gi;
    let out = '';
    let last = 0;
    for (let match; (match = call.exec(text)); ) {
      const open = match.index + match[0].length - 1;
      const close = closingParen(text, open);
      if (close < 0) break;
      const args = text.slice(open + 1, close);
      const isCalendar = match[1].toLowerCase() === 'calendar';
      out += text.slice(last, match.index) + (isCalendar ? calendarFunction(args, now) : holidayFunction(args, now));
      last = call.lastIndex = close + 1;
    }
    text = out + text.slice(last);
    // Then every innermost parenthesized group that is one of this spec's features.
    return text.replace(/\((?:[^()"']|"[^"]*"|'[^']*')*\)/g, (group) => feature(group.slice(1, -1), calendar, now) ?? group);
  }

  function closingParen(text, open) {
    let depth = 0;
    for (let i = open; i < text.length; i++) {
      const c = text[i];
      if (c === '"' || c === "'") i = text.indexOf(c, i + 1);
      else if (c === '(') depth++;
      else if (c === ')' && --depth === 0) return i;
      if (i < 0) return -1;
    }
    return -1;
  }

  // 6.1 calendar(name, condition)
  function calendarFunction(args, now) {
    const match = /^\s*([\w-]+)\s*,([\s\S]*)$/.exec(args);
    if (!match) return UNKNOWN;
    let calendar;
    try {
      calendar = Temporal.PlainDate.from('2000-01-01').withCalendar(match[1].toLowerCase()).calendarId;
    } catch {
      return UNKNOWN;
    }
    const condition = substitute(match[2], calendar, now);
    if (matchMedia(condition).media === 'not all') return UNKNOWN; // Not a media condition, so no calendar().
    return `(${condition})`;
  }

  // 6.2 holiday([region,] name)
  function holidayFunction(args, now) {
    const match = /^\s*(?:([\w-]+)\s*,\s*)?([\w-]+)\s*$/.exec(args);
    if (!match) return UNKNOWN;
    const region = (match[1] ?? '').toLowerCase();
    if (match[1] !== undefined && !/^[a-z]{2}$/.test(region)) return UNKNOWN;
    const name = match[2].toLowerCase();
    const rule = HOLIDAYS[`${region}:${name}`] ?? HOLIDAYS[`:${name}`];
    if (!rule) return UNKNOWN;
    if (typeof rule === 'function') return rule(now.toPlainDate()) ? TRUE : FALSE;
    const condition = substitute(rule, 'iso8601', now);
    if (condition.includes(UNKNOWN)) return UNKNOWN;
    return matchMedia(condition).matches ? TRUE : FALSE;
  }

  // One feature in parentheses: boolean, plain, or range context. Returns undefined when it isn't ours.
  function feature(inner, calendar, now) {
    const tokens = inner.match(/"[^"]*"|'[^']*'|[<>]=?|[=:]|[^\s<>=:"']+/g) ?? [];
    const at = tokens.findIndex((t) => FEATURE.test(t));
    if (at < 0) return undefined;
    const [, prefix = '', name] = FEATURE.exec(tokens[at]);
    const discrete = /^(moon-phase|season)$/i.test(name);
    const test = (op, value) => {
      const c = compare(name.toLowerCase(), value, calendar, now);
      if (c === undefined) return undefined;
      return { '<': c < 0, '<=': c <= 0, '>': c > 0, '>=': c >= 0, '=': c === 0 }[op];
    };
    const flip = { '<': '>', '<=': '>=', '>': '<', '>=': '<=', '=': '=' };
    const isOp = (t) => t in flip;
    let result;
    if (tokens.length === 1) {
      result = prefix ? undefined : true;
    } else if (tokens.length === 3 && at === 0 && tokens[1] === ':') {
      if (!(prefix && discrete)) result = test({ '': '=', 'min-': '>=', 'max-': '<=' }[prefix.toLowerCase()], tokens[2]);
    } else if (prefix || discrete) {
      result = undefined; // Range context is only for range features, without a prefix.
    } else if (tokens.length === 3 && at === 0 && isOp(tokens[1])) {
      result = test(tokens[1], tokens[2]);
    } else if (tokens.length === 3 && at === 2 && isOp(tokens[1])) {
      result = test(flip[tokens[1]], tokens[0]);
    } else if (tokens.length === 5 && at === 2 && tokens[1][0] === tokens[3][0] && /^[<>]/.test(tokens[1])) {
      const low = test(flip[tokens[1]], tokens[0]);
      const high = test(tokens[3], tokens[4]);
      result = low === undefined || high === undefined ? undefined : low && high;
    }
    return result === undefined ? UNKNOWN : result ? TRUE : FALSE;
  }

  // The current value of a feature compared with a value token: -1, 0, 1, or undefined for an invalid value.
  function compare(name, token, calendar, now) {
    const string = /^["']/.test(token) ? token.slice(1, -1) : undefined;
    const ident = string === undefined ? token.toLowerCase() : undefined;
    try {
      switch (name) {
        case 'date': return string === undefined ? undefined : compareDate(now, parseDate(string));
        case 'time': return string === undefined ? undefined : compareTime(now, string);
        case 'weekday': return WEEKDAYS.includes(ident) ? Math.sign(now.dayOfWeek - WEEKDAYS.indexOf(ident) - 1) : undefined;
        case 'month': return compareMonth(now.withCalendar(calendar).monthCode, ident);
        case 'day': return /^\d+$/.test(ident) && +ident >= 1 ? Math.sign(now.withCalendar(calendar).day - ident) : undefined;
        case 'moon-phase': return [...PHASES, ...BETWEEN].includes(ident) ? +(moonPhase(now) !== ident) : undefined;
        case 'season': return SEASONS.includes(ident) ? +(season(now) !== ident) : undefined;
      }
    } catch {
      return undefined; // Temporal rejected the string.
    }
  }

  // 4.1 Parse a date string.
  function parseDate(s) {
    const head = s.split('[')[0];
    const hasTime = /[Tt ]/.test(head);
    if (/\[!?[^=\]]+\]/.test(s)) return { instant: Temporal.ZonedDateTime.from(s).toInstant() };
    if (hasTime && /[Tt ].*[Zz+-]/.test(head)) return { instant: Temporal.Instant.from(s) };
    if (hasTime) return { dateTime: Temporal.PlainDateTime.from(s) };
    try {
      return { date: Temporal.PlainDate.from(s) };
    } catch {
      return { monthDay: Temporal.PlainMonthDay.from(s) };
    }
  }

  // 4.1 Compare the current date with a parsed date string.
  function compareDate(now, v) {
    if (v.instant) return Temporal.Instant.compare(now.toInstant(), v.instant);
    if (v.dateTime) return Temporal.PlainDateTime.compare(now.toPlainDateTime(), v.dateTime);
    if (v.date) return Temporal.PlainDate.compare(now.toPlainDate(), v.date);
    const month = +v.monthDay.monthCode.slice(1);
    return Math.sign((now.month - month) * 100 + now.day - v.monthDay.day);
  }

  // 4.2 Parse a time string, then compare.
  function compareTime(now, s) {
    if (!/^[Tt]?\d\d(?:(:?)\d\d(?:\1\d\d(?:[.,]\d{1,9})?)?)?$/.test(s)) return undefined;
    return Temporal.PlainTime.compare(now.toPlainTime(), Temporal.PlainTime.from(/^[Tt]/.test(s) ? s : `T${s}`));
  }

  // 5.4 month: an integer or a month code, compared as month codes.
  function compareMonth(current, ident) {
    let code;
    if (/^\d+$/.test(ident) && +ident >= 1 && +ident <= 99) code = `M${ident.padStart(2, '0').slice(-2)}`;
    else if (/^m(00l|0[1-9]l?|[1-9]\dl?)$/.test(ident)) code = ident.toUpperCase();
    else return undefined;
    return current < code ? -1 : current > code ? 1 : 0;
  }

  // Astronomy, from Meeus, Astronomical Algorithms, 2nd edition.

  const RAD = Math.PI / 180;
  // ponytail: a fixed Delta T (TT - UT) for the 2020s. It drifts by about a second a year, well inside the spec's
  // one-minute tolerance for decades. Use a Delta T table if the polyfill needs to be right for other centuries.
  const DELTA_T_MS = 69000;
  const fromJDE = (jde) => Temporal.Instant.fromEpochMilliseconds(Math.round((jde - 2440587.5) * 864e5) - DELTA_T_MS);
  const localDate = (instant, now) => instant.toZonedDateTimeISO(now.timeZoneId).toPlainDate();

  // Chapter 49. k is an integer for a new moon, plus 0.25, 0.5, or 0.75 for the other principal phases.
  function phaseJDE(k) {
    const T = k / 1236.85;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = (2.5534 + 29.1053567 * k - 0.0000014 * T ** 2 - 0.00000011 * T ** 3) * RAD;
    const m = (201.5643 + 385.81693528 * k + 0.0107582 * T ** 2 + 0.00001238 * T ** 3 - 0.000000058 * T ** 4) * RAD;
    const F = (160.7108 + 390.67050284 * k - 0.0016118 * T ** 2 - 0.00000227 * T ** 3 + 0.000000011 * T ** 4) * RAD;
    const O = (124.7746 - 1.56375588 * k + 0.0020672 * T ** 2 + 0.00000215 * T ** 3) * RAD;
    const { sin, cos } = Math;
    const quarter = (((k % 1) + 1) % 1) * 4;
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T ** 2 - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
    if (quarter === 0 || quarter === 2) {
      const full = quarter === 2;
      jde += (full ? -0.40614 : -0.4072) * sin(m) + (full ? 0.17302 : 0.17241) * E * sin(M)
        + (full ? 0.01614 : 0.01608) * sin(2 * m) + (full ? 0.01043 : 0.01039) * sin(2 * F)
        + (full ? 0.00734 : 0.00739) * E * sin(m - M) - (full ? 0.00515 : 0.00514) * E * sin(m + M)
        + (full ? 0.00209 : 0.00208) * E * E * sin(2 * M) - 0.00111 * sin(m - 2 * F) - 0.00057 * sin(m + 2 * F)
        + 0.00056 * E * sin(2 * m + M) - 0.00042 * sin(3 * m) + 0.00042 * E * sin(M + 2 * F)
        + 0.00038 * E * sin(M - 2 * F) - 0.00024 * E * sin(2 * m - M) - 0.00017 * sin(O) - 0.00007 * sin(m + 2 * M)
        + 0.00004 * sin(2 * m - 2 * F) + 0.00004 * sin(3 * M) + 0.00003 * sin(m + M - 2 * F)
        + 0.00003 * sin(2 * m + 2 * F) - 0.00003 * sin(m + M + 2 * F) + 0.00003 * sin(m - M + 2 * F)
        - 0.00002 * sin(m - M - 2 * F) - 0.00002 * sin(3 * m + M) + 0.00002 * sin(4 * m);
    } else {
      jde += -0.62801 * sin(m) + 0.17172 * E * sin(M) - 0.01183 * E * sin(m + M) + 0.00862 * sin(2 * m)
        + 0.00804 * sin(2 * F) + 0.00454 * E * sin(m - M) + 0.00204 * E * E * sin(2 * M) - 0.0018 * sin(m - 2 * F)
        - 0.0007 * sin(m + 2 * F) - 0.0004 * sin(3 * m) - 0.00034 * E * sin(2 * m - M) + 0.00032 * E * sin(M + 2 * F)
        + 0.00032 * E * sin(M - 2 * F) - 0.00028 * E * E * sin(m + 2 * M) + 0.00027 * E * sin(2 * m + M)
        - 0.00017 * sin(O) - 0.00005 * sin(m - M - 2 * F) + 0.00004 * sin(2 * m + 2 * F) - 0.00004 * sin(m + M + 2 * F)
        + 0.00004 * sin(m - 2 * M) + 0.00003 * sin(m + M - 2 * F) + 0.00003 * sin(3 * M) + 0.00002 * sin(2 * m - 2 * F)
        + 0.00002 * sin(m - M + 2 * F) - 0.00002 * sin(3 * m + M);
      const W = 0.00306 - 0.00038 * E * cos(M) + 0.00026 * cos(m) - 0.00002 * cos(m - M) + 0.00002 * cos(m + M)
        + 0.00002 * cos(2 * F);
      jde += quarter === 1 ? W : -W;
    }
    const planetary = [
      [299.77 + 0.107408 * k - 0.009173 * T * T, 325], [251.88 + 0.016321 * k, 165], [251.83 + 26.651886 * k, 164],
      [349.42 + 36.412478 * k, 126], [84.66 + 18.206239 * k, 110], [141.74 + 53.303771 * k, 62],
      [207.14 + 2.453732 * k, 60], [154.84 + 7.30686 * k, 56], [34.52 + 27.261239 * k, 47],
      [207.19 + 0.121824 * k, 42], [291.34 + 1.844379 * k, 40], [161.72 + 24.198154 * k, 37],
      [239.56 + 25.513099 * k, 35], [331.55 + 3.592518 * k, 23],
    ];
    for (const [angle, amount] of planetary) jde += amount * 1e-6 * sin(angle * RAD);
    return jde;
  }

  // 5.6 moon-phase
  function moonPhase(now) {
    const today = now.toPlainDate();
    const k = Math.floor((today.year + (today.dayOfYear - 1) / today.daysInYear - 2000) * 12.3685);
    let previous;
    for (let q = (k - 1) * 4; q <= (k + 2) * 4; q++) {
      const c = Temporal.PlainDate.compare(localDate(fromJDE(phaseJDE(q / 4)), now), today);
      const phase = ((q % 4) + 4) % 4;
      if (c === 0) return PHASES[phase];
      if (c < 0) previous = phase;
    }
    return BETWEEN[previous];
  }

  // Chapter 27, tables 27.B and 27.C (years 1000 to 3000). i is 0 to 3: March equinox to December solstice.
  function seasonJDE(year, i) {
    const Y = (year - 2000) / 1000;
    const [a, b, c, d, e] = [
      [2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057],
      [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.0003],
      [2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078],
      [2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032],
    ][i];
    const jde0 = a + b * Y + c * Y ** 2 + d * Y ** 3 + e * Y ** 4;
    const T = (jde0 - 2451545) / 36525;
    const W = (35999.373 * T - 2.47) * RAD;
    const dL = 1 + 0.0334 * Math.cos(W) + 0.0007 * Math.cos(2 * W);
    const S = [
      [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186], [182, 27.85, 445267.112],
      [156, 73.14, 45036.886], [136, 171.52, 22518.443], [77, 222.54, 65928.934], [74, 296.72, 3034.906],
      [70, 243.58, 9037.513], [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.232],
      [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417], [18, 155.12, 67555.328],
      [17, 288.79, 4562.452], [16, 198.04, 62894.029], [14, 199.76, 31436.921], [12, 95.39, 14577.848],
      [12, 287.11, 31931.756], [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074],
    ].reduce((sum, [A, B, C]) => sum + A * Math.cos((B + C * T) * RAD), 0);
    return jde0 + (0.00001 * S) / dL;
  }

  // 5.7 season
  function season(now) {
    const today = now.toPlainDate();
    const passed = [0, 1, 2, 3].filter((i) =>
      Temporal.PlainDate.compare(localDate(fromJDE(seasonJDE(today.year, i)), now), today) <= 0).length;
    const north = ['winter', 'spring', 'summer', 'autumn', 'winter'][passed];
    return SOUTH.has(now.timeZoneId) ? SEASONS[(SEASONS.indexOf(north) + 2) % 4] : north;
  }

  // 6.3 Easter algorithms, from chapter 8.
  function easter(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const n = h + l - 7 * m + 114;
    return Temporal.PlainDate.from({ year, month: Math.floor(n / 31), day: (n % 31) + 1 });
  }

  function orthodoxEaster(year) {
    const a = year % 4, b = year % 7, c = year % 19;
    const d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, n = d + e + 114;
    return Temporal.PlainDate.from({ year, month: Math.floor(n / 31), day: (n % 31) + 1 })
      .add({ days: Math.floor(year / 100) - Math.floor(year / 400) - 2 });
  }

  // Applying it to the page.

  const written = new WeakMap(); // CSSMediaRule -> { original, raw: what we set, text: what the browser kept }
  let pinned = null;

  const currentInstant = () =>
    pinned ?? Temporal.Now.zonedDateTimeISO().round({ smallestUnit: 'second', roundingMode: 'trunc' });

  function update(now = currentInstant()) {
    for (const sheet of document.styleSheets) visit(sheet, now);
  }

  // ponytail: walks every rule on every tick. Cache the date rules and watch for new style sheets if a page with
  // thousands of rules shows the cost.
  function visit(parent, now) {
    let rules;
    try {
      rules = parent.cssRules;
    } catch {
      return; // A cross-origin style sheet can't be read.
    }
    for (const rule of rules ?? []) {
      if (rule instanceof CSSMediaRule) {
        let state = written.get(rule);
        if (state && rule.media.mediaText !== state.text) state = null; // Changed by script since we wrote it.
        const original = state?.original ?? rule.media.mediaText;
        if (MIGHT_USE.test(original)) {
          const raw = substitute(original, 'iso8601', now);
          if (raw !== state?.raw) {
            rule.media.mediaText = raw;
            written.set(rule, { original, raw, text: rule.media.mediaText });
          }
        }
      }
      if (rule.cssRules) visit(rule, now);
      if (rule.styleSheet) visit(rule.styleSheet, now);
    }
  }

  function tick() {
    update();
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }

  window.DateMediaQueries = {
    // The media text that the polyfill would give the browser for `mediaText` at `now`, a Temporal.ZonedDateTime.
    evaluate: (mediaText, now) => substitute(mediaText, 'iso8601', now),
    // Re-evaluate the page's style sheets now.
    update,
    // Pretend the current date and time is `now` (a Temporal.ZonedDateTime), or pass null to use the clock again.
    pretend(now) {
      pinned = now;
      update();
    },
    meeus: { phaseJDE, seasonJDE },
  };

  tick();
  addEventListener('DOMContentLoaded', () => update());
  addEventListener('load', () => update());
})();
