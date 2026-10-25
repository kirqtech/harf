/*!
 * Harf — Arabic transliteration engine
 * Dependency-free. Builds token-level Latin alternatives for Arabic text
 * and parses typed input against those alternatives.
 */
(function (global) {
  'use strict';

  var DEFAULT_SETTINGS = {
    gh: 'gh',   // gh | 3'
    kh: 'kh',   // kh | 7' | 5
    qaf: 'q',   // q | 9
    haa: '7'    // 7 | H
  };

  var SHORT_VOWELS = {
    '\u064E': 'a', // fatha
    '\u0650': 'i', // kasra
    '\u064F': 'u'  // damma
  };

  var TANWEEN = {
    '\u064B': 'an', // fathatan
    '\u064D': 'in', // kasratan
    '\u064C': 'un'  // dammatan
  };

  var SHADDA = '\u0651';
  var SUKUN = '\u0652';
  var TATWEEL = '\u0640';

  var DIACRITIC_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF]/;
  var STRIP_DIACRITICS_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF\u0640]/g;
  var ARABIC_RE = /[\u0621-\u064A\u066E-\u0674\u0679-\u06D3\u06FA-\u06FF]/;

  var SIMPLE_LETTERS = {
    '\u0628': 'b',  // ب
    '\u062A': 't',  // ت
    '\u062B': 'th', // ث
    '\u062C': 'j',  // ج
    '\u062F': 'd',  // د
    '\u0630': 'dh', // ذ
    '\u0631': 'r',  // ر
    '\u0632': 'z',  // ز
    '\u0633': 's',  // س
    '\u0634': 'sh', // ش
    '\u0635': 'S',  // ص
    '\u0636': 'D',  // ض
    '\u0637': 'T',  // ط
    '\u0639': '3',  // ع
    '\u0641': 'f',  // ف
    '\u0643': 'k',  // ك
    '\u0644': 'l',  // ل
    '\u0645': 'm',  // م
    '\u0646': 'n',  // ن
    '\u0647': 'h',  // ه
    '\u067E': 'p',  // پ
    '\u0686': 'ch', // چ
    '\u0698': 'zh', // ژ
    '\u06AF': 'g',  // گ
    '\u06A4': 'v',  // ڤ
    '\u06A9': 'k',  // ک
    '\u06CC': ''    // ی handled with yaa context
  };

  function normalizeSettings(settings) {
    var s = settings || {};
    var out = {
      gh: DEFAULT_SETTINGS.gh,
      kh: DEFAULT_SETTINGS.kh,
      qaf: DEFAULT_SETTINGS.qaf,
      haa: DEFAULT_SETTINGS.haa
    };

    if (s.gh === "3'") out.gh = "3'";
    if (s.kh === "7'" || s.kh === '5') out.kh = s.kh;
    if (s.qaf === '9') out.qaf = '9';
    if (s.haa === 'H') out.haa = 'H';

    return out;
  }

  function unique(list) {
    var seen = Object.create(null);
    return list.filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function makeToken(variants, canonical, source) {
    var options = unique(variants);
    if (options.indexOf(canonical) === -1) options.unshift(canonical);
    return {
      variants: options,
      canonical: canonical,
      source: source || ''
    };
  }

  function isArabic(ch) {
    return !!ch && ARABIC_RE.test(ch);
  }

  function isShortVowel(ch) {
    return !!ch && Object.prototype.hasOwnProperty.call(SHORT_VOWELS, ch);
  }

  function isDiacritic(ch) {
    return !!ch && DIACRITIC_RE.test(ch);
  }

  function hasTashkeel(text) {
    return /[\u064B-\u0650\u0652]/.test(text);
  }

  function isLongWawAt(chars, index) {
    var next = chars[index + 1];
    return next !== SHADDA && !isShortVowel(next);
  }

  function isLongYaaAt(chars, index) {
    var next = chars[index + 1];
    return next !== SHADDA && !isShortVowel(next);
  }

  function canonicalWaw(chars, index, raw) {
    var prev = chars[index - 1] || '';
    var next = chars[index + 1] || '';

    if (index === 0) return 'w';
    if (isShortVowel(next) || next === SHADDA) return 'w';
    if (prev === '\u064F') return 'oo'; // damma before waw = long u
    if (prev === '\u064E' || prev === '\u0650' || prev === SUKUN || prev === SHADDA) return 'w';
    if (prev === '\u0627' || prev === '\u0648' || prev === '\u064A' || prev === '\u0649') return 'w';
    if (!hasTashkeel(raw)) return 'oo';
    return 'w';
  }

  function canonicalYaa(chars, index, raw) {
    var prev = chars[index - 1] || '';
    var next = chars[index + 1] || '';

    if (index === 0) return 'y';
    if (isShortVowel(next) || next === SHADDA) return 'y';
    if (prev === '\u0650') return 'ee'; // kasra before yaa = long i
    if (prev === '\u064E' || prev === '\u064F' || prev === SUKUN || prev === SHADDA) return 'y';
    if (prev === '\u0627' || prev === '\u0648' || prev === '\u064A' || prev === '\u0649') return 'y';
    if (!hasTashkeel(raw)) return 'ee';
    return 'y';
  }

  function previousLetter(chars, index) {
    for (var i = index; i >= 0; i -= 1) {
      if (isArabic(chars[i])) return { index: i, char: chars[i] };
    }
    return null;
  }

  /**
   * Arabic text can encode a shadda before or after the vowel of the same
   * cluster. Normalize combining marks so the tokenizer always sees shadda
   * first, then the vowel. This keeps vocalized data from any source behaving
   * consistently without changing the Arabic that is displayed.
   */
  function normalizeDiacriticOrder(chars) {
    var out = [];
    var i = 0;

    while (i < chars.length) {
      if (!isDiacritic(chars[i])) {
        out.push(chars[i]);
        i += 1;
        continue;
      }

      var run = [];
      while (i < chars.length && isDiacritic(chars[i])) {
        run.push(chars[i]);
        i += 1;
      }

      run.sort(function (a, b) {
        function priority(mark) {
          if (mark === SHADDA) return 0;
          if (Object.prototype.hasOwnProperty.call(SHORT_VOWELS, mark)) return 1;
          if (Object.prototype.hasOwnProperty.call(TANWEEN, mark)) return 1;
          if (mark === SUKUN) return 2;
          return 3;
        }
        return priority(a) - priority(b);
      });

      out.push.apply(out, run);
    }

    return out;
  }

  /**
   * Turn a single Arabic word into ordered transliteration tokens.
   * Each token accepts multiple spellings, but all aliases remain case-sensitive.
   */
  function buildTokens(raw, settings) {
    var s = normalizeSettings(settings);
    var chars = normalizeDiacriticOrder(Array.from(String(raw || '')));
    var tokens = [];
    var skipped = Object.create(null);
    var lastLetterToken = null;
    var lastLetterIndex = -1;

    function pushLetter(token) {
      tokens.push(token);
      lastLetterToken = token;
      lastLetterIndex = tokens.length - 1;
    }

    for (var i = 0; i < chars.length; i += 1) {
      if (skipped[i]) continue;

      var ch = chars[i];
      var next = chars[i + 1] || '';

      if (ch === SHADDA) {
        var base = previousLetter(chars, i - 1);
        var beforeBase = previousLetter(chars, base ? base.index - 1 : -1);
        var isAlreadyDoubled = !!(base && beforeBase && base.char === beforeBase.char);

        if (lastLetterToken && !isAlreadyDoubled && lastLetterIndex >= 0) {
          var doubled = makeToken(lastLetterToken.variants.slice(), lastLetterToken.canonical, lastLetterToken.source);
          // A shadda can be encoded before or after the vowel attached to its letter.
          // Insert the doubled consonant beside the letter rather than after the vowel.
          tokens.splice(lastLetterIndex + 1, 0, doubled);
          lastLetterToken = doubled;
          lastLetterIndex += 1;
        }
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(TANWEEN, ch)) {
        tokens.push(makeToken([TANWEEN[ch]], TANWEEN[ch], ch));
        // In the common tanween + alif spelling, the alif is silent.
        if (ch === '\u064B' && (next === '\u0627' || next === '\u0671')) {
          skipped[i + 1] = true;
        }
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(SHORT_VOWELS, ch)) {
        // Long vowels already carry the vowel sound. Do not print it twice.
        if (ch === '\u064E' && (next === '\u0627' || next === '\u0649' || next === '\u0671')) {
          continue;
        }
        // The fatha on the letter before ta marbuta supplies the final "a".
        if (ch === '\u064E' && next === '\u0629') {
          continue;
        }
        if (ch === '\u064F' && next === '\u0648' && isLongWawAt(chars, i + 1)) {
          continue;
        }
        if (ch === '\u0650' && next === '\u064A' && isLongYaaAt(chars, i + 1)) {
          continue;
        }

        tokens.push(makeToken([SHORT_VOWELS[ch]], SHORT_VOWELS[ch], ch));
        continue;
      }

      if (ch === SUKUN || ch === TATWEEL) continue;

      if (ch === '\u0621' || ch === '\u0623' || ch === '\u0625' || ch === '\u0624' || ch === '\u0626') {
        pushLetter(makeToken(['2'], '2', ch));
        continue;
      }

      if (ch === '\u0622') { // آ
        pushLetter(makeToken(['2a', 'aa'], '2a', ch));
        continue;
      }

      if (ch === '\u0627' || ch === '\u0671') { // ا / ٱ
        if (i === 0) {
          if (isShortVowel(next)) {
            // Alif wasl in words such as اِسْم — the vowel below it is pronounced.
            continue;
          }
          pushLetter(makeToken(['a', 'aa'], 'a', ch));
        } else {
          pushLetter(makeToken(['aa', 'a'], 'aa', ch));
        }
        continue;
      }

      if (ch === '\u0649') { // ى
        pushLetter(makeToken(['aa', 'a'], 'aa', ch));
        continue;
      }

      if (ch === '\u0629') { // ة
        pushLetter(makeToken(['a', 'h'], 'a', ch));
        continue;
      }

      if (ch === '\u0648') { // و
        var waw = canonicalWaw(chars, i, raw);
        pushLetter(makeToken([waw, 'oo', 'uu', 'w'], waw, ch));
        continue;
      }

      if (ch === '\u064A' || ch === '\u06CC') { // ي / ی
        var yaa = canonicalYaa(chars, i, raw);
        pushLetter(makeToken([yaa, 'ee', 'ii', 'y'], yaa, ch));
        continue;
      }

      if (ch === '\u063A') { // غ
        pushLetter(makeToken(['gh', "3'"], s.gh, ch));
        continue;
      }

      if (ch === '\u062E') { // خ
        pushLetter(makeToken(['kh', "7'", '5'], s.kh, ch));
        continue;
      }

      if (ch === '\u062D') { // ح
        pushLetter(makeToken(['H', '7'], s.haa, ch));
        continue;
      }

      if (ch === '\u0642') { // ق
        pushLetter(makeToken(['q', '9'], s.qaf, ch));
        continue;
      }

      if (ch === '\u0638') { // ظ
        pushLetter(makeToken(['Z', 'DH'], 'Z', ch));
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(SIMPLE_LETTERS, ch) && SIMPLE_LETTERS[ch]) {
        var simple = SIMPLE_LETTERS[ch];
        pushLetter(makeToken([simple], simple, ch));
        continue;
      }

      // Punctuation, numbers and unsupported marks are decorative in the drill.
      // They are omitted from the typing target.
    }

    return tokens;
  }

  function transliterate(raw, settings) {
    var settingsSnapshot = settings;
    return buildTokens(raw, settingsSnapshot).map(function (token) {
      return token.canonical;
    }).join('');
  }

  /**
   * Parse typed input against a word's tokens. Alternatives and partial aliases
   * are supported. The returned candidate describes the closest valid prefix.
   */
  function parseInput(tokens, input) {
    input = input == null ? '' : String(input);
    var best = null;

    function score(candidate, previous) {
      if (!previous) return true;
      if (candidate.consumed !== previous.consumed) return candidate.consumed > previous.consumed;
      if (candidate.complete !== previous.complete) return candidate.complete;
      if ((candidate.partial === null) !== (previous.partial === null)) return candidate.partial === null;
      if (candidate.ti !== previous.ti) return candidate.ti > previous.ti;
      return candidate.segments.length > previous.segments.length;
    }

    function consider(segments, ti, pos, partial, leftover) {
      var consumed = partial ? pos + partial.typed.length : pos;
      var candidate = {
        segments: segments,
        ti: ti,
        pos: pos,
        consumed: consumed,
        partial: partial,
        leftover: leftover,
        complete: !partial && ti === tokens.length && pos === input.length,
        validPrefix: leftover.length === 0
      };
      if (score(candidate, best)) best = candidate;
    }

    function walk(ti, pos, segments) {
      if (ti >= tokens.length || pos >= input.length) {
        consider(segments, ti, pos, null, input.slice(pos));
        return;
      }

      var remaining = input.slice(pos);
      var found = false;

      for (var i = 0; i < tokens[ti].variants.length; i += 1) {
        var variant = tokens[ti].variants[i];

        if (remaining.indexOf(variant) === 0) {
          found = true;
          walk(ti + 1, pos + variant.length, segments.concat({
            tokenIndex: ti,
            variant: variant,
            typed: variant
          }));
        } else if (variant.indexOf(remaining) === 0) {
          found = true;
          consider(segments, ti, pos, {
            tokenIndex: ti,
            variant: variant,
            typed: remaining
          }, '');
        }
      }

      if (!found) {
        consider(segments, ti, pos, null, remaining);
      }
    }

    walk(0, 0, []);

    if (!best) {
      best = {
        segments: [],
        ti: 0,
        pos: 0,
        consumed: 0,
        partial: null,
        leftover: input,
        complete: false,
        validPrefix: input.length === 0
      };
    }

    return best;
  }

  function stripDiacritics(text) {
    return String(text || '').replace(STRIP_DIACRITICS_RE, '');
  }

  function hasArabic(text) {
    return ARABIC_RE.test(String(text || ''));
  }

  function splitWords(text) {
    return String(text || '').trim().split(/\s+/).filter(function (word) {
      return word && hasArabic(word);
    });
  }

  global.HarfTranslit = {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    normalizeSettings: normalizeSettings,
    buildTokens: buildTokens,
    transliterate: transliterate,
    parseInput: parseInput,
    stripDiacritics: stripDiacritics,
    hasArabic: hasArabic,
    splitWords: splitWords
  };
})(window);
