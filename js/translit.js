/*!
 * Harf - Arabic transliteration engine
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
      if (item == null || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  /**
   * Words can be plain Arabic strings or dataset entries shaped like:
   * `{ arabic: 'حبيبي', solutions: ['7abeebi', '7abibi'] }`.
   * Always normalize so callers do not have to care which form they received.
   */
  function normalizeEntry(entry) {
    var arabic = '';
    var arabicPlain = '';
    var rawSolutions = [];
    var translationEn = '';
    var dialect = '';
    var notes = '';

    if (typeof entry === 'string') {
      arabic = entry;
      if (global && global.HarfData && typeof global.HarfData.lookupWord === 'function') {
        var found = global.HarfData.lookupWord(arabic);
        if (found) {
          arabicPlain = found.arabic_plain || '';
          rawSolutions = found.translit || found.solutions || [];
          translationEn = found.translation_en || '';
          dialect = found.dialect || '';
          notes = found.notes || '';
        }
      }
    } else if (entry && typeof entry === 'object') {
      // `arabic` is the display form (often vocalized); `arabic_plain` is the
      // normalized form used for matching and lookup.
      arabic = entry.arabic || entry.arabic_plain || entry.word || '';
      arabicPlain = entry.arabic_plain || '';
      rawSolutions = (Array.isArray(entry.translit) && entry.translit.length)
        ? entry.translit
        : (entry.solutions || entry.solution || entry.translit || []);
      translationEn = entry.translation_en || entry.translation || '';
      dialect = entry.dialect || '';
      notes = entry.notes || '';

      if ((!translationEn || !arabicPlain) && global && global.HarfData && typeof global.HarfData.lookupWord === 'function') {
        var meta = global.HarfData.lookupWord(arabic);
        if (meta) {
          if (!rawSolutions.length) {
            rawSolutions = meta.translit || meta.solutions || [];
          }
          arabicPlain = arabicPlain || meta.arabic_plain || '';
          translationEn = translationEn || meta.translation_en || '';
          dialect = dialect || meta.dialect || '';
          notes = notes || meta.notes || '';
        }
      }
    }

    if (!arabicPlain) {
      arabicPlain = String(arabic || '').replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF\u0640]/g, '');
    }

    if (!Array.isArray(rawSolutions)) {
      rawSolutions = rawSolutions ? [rawSolutions] : [];
    }

    var solutions = unique(rawSolutions.map(function (solution) {
      return String(solution == null ? '' : solution).trim();
    }).filter(function (solution) {
      return solution.length > 0;
    }));

    return {
      arabic: String(arabic || ''),
      arabic_plain: String(arabicPlain || ''),
      solutions: solutions,
      translit: solutions,
      translation_en: translationEn,
      dialect: dialect,
      notes: notes
    };
  }

  function entryArabic(entry) {
    return normalizeEntry(entry).arabic;
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

        var vowel = SHORT_VOWELS[ch];
        // Levantine Arabizi often writes kasra as "e" and damma as "o"
        // (Taleb / Talib, ktub / ktob). Keep the standard Latin vowel first.
        var vowelVariants = [vowel];
        if (ch === '\u0650') vowelVariants.push('e');
        if (ch === '\u064F') vowelVariants.push('o');

        tokens.push(makeToken(vowelVariants, vowel, ch));
        continue;
      }

      if (ch === SUKUN || ch === TATWEEL) continue;

      if (ch === '\u0621' || ch === '\u0623' || ch === '\u0625' || ch === '\u0624' || ch === '\u0626') {
        // Hamza is often written as 2, left as a plain alif-like "a", or
        // dropped entirely in casual texting (e.g. "2ana" / "ana" / "na").
        pushLetter(makeToken(['2', 'a', ''], '2', ch));
        continue;
      }

      if (ch === '\u0622') { // آ
        pushLetter(makeToken(['2a', 'aa'], '2a', ch));
        continue;
      }

      if (ch === '\u0627' || ch === '\u0671') { // ا / ٱ
        if (i === 0) {
          if (isShortVowel(next)) {
            // Alif wasl in words such as اِسْم: the vowel below it is pronounced.
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
        // Taa marbuta is pronounced "a" in formal reading, but Levantine
        // speakers commonly write it as "eh" / "e" (and sometimes "h").
        pushLetter(makeToken(['a', 'eh', 'e', 'h'], 'a', ch));
        continue;
      }

      if (ch === '\u0648') { // و
        var waw = canonicalWaw(chars, i, raw);
        pushLetter(makeToken([waw, 'oo', 'uu', 'u', 'w'], waw, ch));
        continue;
      }

      if (ch === '\u064A' || ch === '\u06CC') { // ي / ی
        var yaa = canonicalYaa(chars, i, raw);
        pushLetter(makeToken([yaa, 'ee', 'ii', 'i', 'y'], yaa, ch));
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
   * Expand the token alternatives into complete Latin spellings. This is what
   * makes long vowels, taa marbuta, hamza, and emphatic aliases behave
   * flexibly without needing every combination to be hand-written in data.js.
   */
  function generateTokenSolutions(tokens, limit) {
    var max = limit || 800;
    var out = [];

    function walk(index, current) {
      if (out.length >= max) return;
      if (index >= tokens.length) {
        out.push(current);
        return;
      }

      var variants = tokens[index].variants;
      for (var i = 0; i < variants.length; i += 1) {
        walk(index + 1, current + variants[i]);
        if (out.length >= max) return;
      }
    }

    walk(0, '');
    return unique(out);
  }

  /**
   * Expand a single hand-written solution into its common Arabizi variants.
   * Token-based expansion covers vocalized Arabic precisely; this layer keeps
   * the same flexibility when a dataset entry provides only one spelling.
   */
  function expandSolution(solution, limit) {
    var max = limit || 600;
    var out = [];
    var groups = [
      { text: 'ee', options: ['ee', 'i', 'ii'] },
      { text: 'ii', options: ['ii', 'i', 'ee'] },
      { text: 'oo', options: ['oo', 'u', 'uu', 'w'] },
      { text: 'uu', options: ['uu', 'u', 'oo', 'w'] },
      { text: 'aa', options: ['aa', 'a'] }
    ];
    var singles = {
      a: ['a', 'aa'],
      i: ['i', 'e', 'ee', 'ii'],
      u: ['u', 'o', 'oo', 'uu'],
      w: ['w', 'oo', 'u', 'uu'],
      y: ['y', 'ee', 'i', 'ii'],
      H: ['H', '7'],
      '7': ['7', 'H'],
      '2': ['2', 'a', '']
    };

    function addTaaEndings(value) {
      var endings = [];
      if (/eh$/.test(value)) {
        endings = ['eh', 'e', 'a', 'h'];
      } else if (/e$/.test(value)) {
        endings = ['e', 'eh', 'a', 'h'];
      } else if (/a$/.test(value)) {
        endings = ['a', 'eh', 'e', 'h'];
      } else if (/h$/.test(value)) {
        endings = ['h', 'a', 'eh', 'e'];
      }

      if (!endings.length) {
        out.push(value);
        return;
      }

      var stem = value.slice(0, -endings[0].length);
      endings.forEach(function (ending) {
        if (out.length < max) out.push(stem + ending);
      });
    }

    function walk(index, current) {
      if (out.length >= max) return;
      if (index >= solution.length) {
        addTaaEndings(current);
        return;
      }

      var rest = solution.slice(index);
      for (var g = 0; g < groups.length; g += 1) {
        if (rest.indexOf(groups[g].text) === 0) {
          groups[g].options.forEach(function (option) {
            walk(index + groups[g].text.length, current + option);
          });
          return;
        }
      }

      var ch = solution.charAt(index);
      var options = singles[ch] || [ch];
      options.forEach(function (option) {
        walk(index + 1, current + option);
      });
    }

    walk(0, '');
    return unique(out);
  }

  /**
   * Build everything the UI needs for one word:
   * - `arabic` keeps the original vocalized text for display,
   * - `tokens` is retained for the existing letter-level rendering helpers,
   * - `solutions` starts with the dataset's preferred answers in order,
   *   followed by every flexibly valid spelling the tokenizer can derive.
   */
  function buildWord(entry, settings) {
    var normalized = normalizeEntry(entry);
    var tokens = buildTokens(normalized.arabic, settings);
    var generated = generateTokenSolutions(tokens);
    var canonical = tokens.map(function (token) {
      return token.canonical;
    }).join('');
    var expanded = [];

    normalized.solutions.forEach(function (solution) {
      expanded = expanded.concat(expandSolution(solution));
    });

    var solutions = unique(normalized.solutions.concat(expanded, generated));

    if (!solutions.length && canonical) solutions = [canonical];

    return {
      arabic: normalized.arabic,
      arabic_plain: normalized.arabic_plain,
      tokens: tokens,
      solutions: solutions,
      translit: solutions,
      canonical: solutions[0] || canonical,
      generatedSolutions: generated,
      translation_en: normalized.translation_en,
      dialect: normalized.dialect,
      notes: normalized.notes
    };
  }

  function commonPrefixLength(a, b) {
    var length = Math.min(a.length, b.length);
    var i = 0;
    while (i < length && a.charAt(i) === b.charAt(i)) i += 1;
    return i;
  }

  /**
   * Match one typed string against the full solutions array. The typed string
   * is a valid prefix while it prefixes at least one accepted spelling.
   */
  function matchSolutions(solutions, input) {
    var list = Array.isArray(solutions) ? solutions.filter(Boolean) : [];
    var typed = input == null ? '' : String(input);
    var exact = null;
    var prefixMatches = [];
    var best = null;

    list.forEach(function (solution, index) {
      if (solution === typed) exact = exact || solution;

      if (solution.indexOf(typed) === 0) {
        prefixMatches.push(solution);
      }

      var matched = commonPrefixLength(solution, typed);
      var candidate = {
        solution: solution,
        index: index,
        matched: matched
      };

      if (!best ||
          candidate.matched > best.matched ||
          (candidate.matched === best.matched && candidate.index < best.index)) {
        best = candidate;
      }
    });

    var target = exact || prefixMatches[0] || (best && best.solution) || list[0] || '';
    var isPrefix = typed === '' || prefixMatches.length > 0;
    var matchedLength = isPrefix ? typed.length : commonPrefixLength(target, typed);

    return {
      input: typed,
      target: target,
      expected: target,
      solution: target,
      solutions: list,
      complete: !!exact,
      validPrefix: isPrefix,
      prefixMatches: prefixMatches,
      matched: matchedLength,
      leftover: isPrefix ? '' : typed.slice(matchedLength),
      remaining: isPrefix ? target.slice(typed.length) : target.slice(matchedLength)
    };
  }

  function isAccepted(solutions, input) {
    var typed = input == null ? '' : String(input);
    return (Array.isArray(solutions) ? solutions : []).some(function (solution) {
      return solution === typed;
    });
  }

  function preferredSolution(solutions) {
    return (Array.isArray(solutions) && solutions.length) ? solutions[0] : '';
  }

  /**
   * Parse typed input against a word. When a `solutions` array is supplied it
   * is authoritative; otherwise fall back to the token-level parser for
   * ad-hoc text (letters and custom drills).
   */
  function parseInput(tokens, input, solutions) {
    if (Array.isArray(solutions) && solutions.length) {
      return matchSolutions(solutions, input);
    }
    return parseTokenInput(tokens, input);
  }

  /**
   * Parse typed input against a word's tokens. Alternatives and partial aliases
   * are supported. The returned candidate describes the closest valid prefix.
   */
  function parseTokenInput(tokens, input) {
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

  /* ------------------------------------------------------------------------
     Arabic script mode
     Harakat are not part of the target. Letters are compared by base character
     (with shadda and tanween marks stripped), so the word stays connected as
     a normal Arabic word instead of breaking into isolated glyphs.
     ------------------------------------------------------------------------ */

  var SEGMENTER = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('ar', { granularity: 'grapheme' })
    : null;

  // Keyboard layouts write the same letter with different code points.
  // Compare them under one form so kaf/yaa/hamza variants all match.
  var LETTER_FOLD = {
    '\u0622': '\u0627', // آ
    '\u0623': '\u0627', // أ
    '\u0625': '\u0627', // إ
    '\u0671': '\u0627', // ٱ
    '\u0624': '\u0648', // ؤ
    '\u0626': '\u064A', // ئ
    '\u0649': '\u064A', // ى
    '\u0629': '\u0647', // ة
    '\u06CC': '\u064A', // ی
    '\u06A9': '\u0643'  // ک -> ك (both keyboards write kaf differently)
  };

  // Arabic letters that join only to the right (never to the following letter).
  var RIGHT_ONLY_JOINERS = {
    '\u0621': true, // ء (isolated)
    '\u0622': true, // آ
    '\u0623': true, // أ
    '\u0624': true, // ؤ
    '\u0625': true, // إ
    '\u0627': true, // ا
    '\u0629': true, // ة
    '\u062F': true, // د
    '\u0630': true, // ذ
    '\u0631': true, // ر
    '\u0632': true, // ز
    '\u0648': true, // و
    '\u0649': true, // ى
    '\u0671': true, // ٱ
    '\u0698': true  // ژ
  };

  function joinsLeft(letter) {
    return isArabic(letter) && !RIGHT_ONLY_JOINERS[letter];
  }

  function joinsRight(letter) {
    return isArabic(letter) && letter !== '\u0621';
  }

  function canJoinArabic(prevLetter, nextLetter) {
    return joinsLeft(prevLetter) && joinsRight(nextLetter);
  }

  function foldLetter(letter) {
    var folded = Object.prototype.hasOwnProperty.call(LETTER_FOLD, letter)
      ? LETTER_FOLD[letter]
      : letter;
    return folded.normalize('NFC');
  }

  function graphemes(text) {
    var value = String(text || '');
    if (!SEGMENTER) return Array.from(value);
    return Array.from(SEGMENTER.segment(value), function (part) {
      return part.segment;
    });
  }

  /**
   * Split one written Arabic word into the letters that must be typed:
   * harakat, shadda, and tatweel are dropped, and punctuation is ignored.
   * Each item holds the display letter, comparison key, and whether it joins
   * to the previous or next letter for connected cursive rendering.
   */
  function arabicLetterUnits(text) {
    var clusters = graphemes(text || '');
    var units = [];
    var previous = null;

    clusters.forEach(function (cluster) {
      var letters = Array.from(cluster).filter(function (ch) {
        return isArabic(ch);
      });
      if (!letters.length) {
        previous = { key: '', letters: '' };
        return;
      }

      letters.forEach(function (letter) {
        // In the tanween spelling (كِتَابًا) the final alif is silent.
        if (letter === '\u0627' && previous && previous.letters.indexOf('\u064B') !== -1) return;

        var unit = { letter: letter, key: foldLetter(letter) };
        units.push(unit);
      });

      previous = { key: letters[0], letters: cluster };
    });

    for (var i = 0; i < units.length; i += 1) {
      var prev = i > 0 ? units[i - 1].letter : '';
      var next = i < units.length - 1 ? units[i + 1].letter : '';
      units[i].joinPrev = prev ? canJoinArabic(prev, units[i].letter) : false;
      units[i].joinNext = next ? canJoinArabic(units[i].letter, next) : false;
    }

    return units;
  }

  function normalizeArabicKey(piece) {
    var letters = Array.from(String(piece || '')).filter(function (ch) {
      return isArabic(ch);
    });
    if (!letters.length) return '';
    return foldLetter(letters[0]);
  }

  function isArabicTypable(text) {
    return isArabic(text);
  }

  /** Harakat, tatweel and other combining marks: never typed in Arabic mode. */
  function isArabicMark(piece) {
    return !!piece && (DIACRITIC_RE.test(piece) || piece === TATWEEL);
  }

  /**
   * Parse typed Arabic against the target letters. The caret sits on the first
   * mismatching letter, and a valid prefix means every typed letter so far
   * matches the target.
   */
  function matchArabic(units, input) {
    var list = units || [];
    var typed = graphemes(input);
    var keys = typed.map(normalizeArabicKey);
    var matched = 0;

    while (matched < keys.length && matched < list.length && keys[matched] === list[matched].key) {
      matched += 1;
    }

    var complete = keys.length === list.length && matched === keys.length;

    return {
      mode: 'arabic',
      units: list,
      input: input == null ? '' : String(input),
      typed: typed,
      keys: keys,
      matched: matched,
      targetLength: list.length,
      complete: complete,
      validPrefix: matched === keys.length,
      extra: matched < keys.length,
      target: list.map(function (unit) { return unit.letter; }).join('')
    };
  }

  function splitWordsForMode(text, mode) {
    if (mode !== 'arabic') return splitWords(text);
    return String(text || '').trim().split(/\s+/).filter(function (word) {
      return word && hasArabic(word);
    });
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
    normalizeEntry: normalizeEntry,
    entryArabic: entryArabic,
    buildTokens: buildTokens,
    buildWord: buildWord,
    generateTokenSolutions: generateTokenSolutions,
    matchSolutions: matchSolutions,
    isAccepted: isAccepted,
    preferredSolution: preferredSolution,
    transliterate: transliterate,
    parseInput: parseInput,
    stripDiacritics: stripDiacritics,
    hasArabic: hasArabic,
    splitWords: splitWords,
    splitWordsForMode: splitWordsForMode,
    arabicLetterUnits: arabicLetterUnits,
    matchArabic: matchArabic,
    isArabicTypable: isArabicTypable,
    isArabicMark: isArabicMark
  };
})(window);
