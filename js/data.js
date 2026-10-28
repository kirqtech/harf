/*!
 * Nateq - practice content helpers
 * Vocabulary lives in data/*.json and is supplied by NateqDataLoader. This file
 * only normalizes loaded items and provides the drilling/picking utilities.
 */
(function (global) {
  'use strict';

  var SHORT_MARKS = ['\u064E', '\u0650', '\u064F'];
  var LONG_FORMS = [
    { mark: '\u064E', letter: 'ا' },
    { mark: '\u064F', letter: 'و' },
    { mark: '\u0650', letter: 'ي' }
  ];

  var state = {
    words: [],
    phrases: [],
    letters: []
  };

  var WORD_MAP = Object.create(null);

  function stripArabicDiacritics(text) {
    if (!text) return '';
    return String(text).replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF\u0640]/g, '');
  }

  /**
   * Accept legacy flat strings as well as object entries. Every entry that
   * enters the app is normalized to the extended JSON shape, so downstream
   * code can always depend on `arabic`, `arabic_plain`, and `translit`.
   */
  function coerceEntry(entry) {
    if (typeof entry === 'string') {
      var plainString = entry.trim();
      if (!plainString) return null;
      return {
        arabic: plainString,
        arabic_plain: stripArabicDiacritics(plainString),
        translit: [],
        translation_en: '',
        dialect: '',
        category: '',
        notes: ''
      };
    }

    if (!entry || typeof entry !== 'object') return null;

    var arabic = String(entry.arabic || entry.arabic_plain || entry.word || '').trim();
    if (!arabic) return null;

    var rawTranslit = (Array.isArray(entry.translit) && entry.translit.length)
      ? entry.translit
      : (entry.solutions || entry.translit || []);
    if (!Array.isArray(rawTranslit)) rawTranslit = rawTranslit ? [rawTranslit] : [];

    var translit = [];
    rawTranslit.forEach(function (value) {
      var text = String(value == null ? '' : value).trim();
      if (text && translit.indexOf(text) === -1) translit.push(text);
    });

    return {
      arabic: arabic,
      arabic_plain: String(entry.arabic_plain || stripArabicDiacritics(arabic)).trim(),
      translit: translit,
      translation_en: entry.translation_en || entry.translation || '',
      dialect: entry.dialect || '',
      category: entry.category || '',
      notes: entry.notes || ''
    };
  }

  function coerceList(items) {
    if (!Array.isArray(items)) return [];
    return items.map(coerceEntry).filter(Boolean);
  }

  function rebuildWordIndex() {
    WORD_MAP = Object.create(null);

    state.words.forEach(function (entry) {
      if (WORD_MAP[entry.arabic] === undefined) WORD_MAP[entry.arabic] = entry;
      if (entry.arabic_plain && WORD_MAP[entry.arabic_plain] === undefined) {
        WORD_MAP[entry.arabic_plain] = entry;
      }
    });
  }

  function lookupWord(arabic) {
    if (!arabic) return null;
    var raw = String(arabic).trim();
    if (WORD_MAP[raw]) return WORD_MAP[raw];
    var stripped = stripArabicDiacritics(raw);
    return WORD_MAP[stripped] || null;
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function getLetterBases() {
    var seen = Object.create(null);
    var bases = [];

    state.letters.forEach(function (entry) {
      var letter = String(entry.arabic_plain || entry.arabic || '').charAt(0);
      if (!letter || seen[letter]) return;
      seen[letter] = true;
      bases.push(letter);
    });

    return bases;
  }

  function buildLetterPool() {
    var pool = [];

    getLetterBases().forEach(function (letter) {
      pool.push(letter);

      SHORT_MARKS.forEach(function (mark) {
        pool.push(letter + mark);
      });

      LONG_FORMS.forEach(function (form) {
        pool.push(letter + form.mark + form.letter);
      });
    });

    return pool;
  }

  function letterDrills(count) {
    var pool = shuffle(buildLetterPool());
    var selected = [];
    var seen = Object.create(null);

    for (var i = 0; i < pool.length && selected.length < count; i += 1) {
      if (!seen[pool[i]]) {
        seen[pool[i]] = true;
        selected.push(pool[i]);
      }
    }

    return selected;
  }

  function pickWords(count) {
    if (!state.words.length) return [];
    var copy = [];
    var batch = shuffle(state.words);

    while (copy.length < count) {
      copy = copy.concat(batch);
      batch = shuffle(state.words);
    }

    return copy.slice(0, count);
  }

  function pickPhrase(exclude) {
    if (!state.phrases.length) return null;
    var available = state.phrases.filter(function (phrase) {
      return phrase.arabic !== exclude && phrase.arabic_plain !== exclude;
    });
    var source = available.length ? available : state.phrases;
    return source[Math.floor(Math.random() * source.length)];
  }

  /**
   * Arabic-script letter drill: the same single letters, short-vowel
   * syllables and long-vowel drills, but written so the learner retypes the
   * letters on an Arabic keyboard. Harakat are shown as hints and are never
   * part of the typed target.
   */
  function arabicDrills(count) {
    var pool = shuffle(buildLetterPool());

    // Drop near-duplicates such as "ب بَ" and keep one form per base letter.
    var seen = Object.create(null);
    var selected = [];

    for (var i = 0; i < pool.length && selected.length < count; i += 1) {
      var base = pool[i].charAt(0);
      if (seen[base]) continue;
      seen[base] = true;
      selected.push(pool[i]);
    }

    var index = 0;
    while (selected.length < count && pool.length) {
      selected.push(pool[(index += 1) % pool.length]);
    }

    return selected;
  }

  global.NateqData = {
    // Dataset lifecycle: the app calls these after NateqDataLoader resolves.
    setWords: function (items) {
      state.words = coerceList(items);
      rebuildWordIndex();
    },
    setPhrases: function (items) {
      state.phrases = coerceList(items);
    },
    setLetters: function (items) {
      state.letters = coerceList(items);
    },
    getWords: function () {
      return state.words.slice();
    },
    getPhrases: function () {
      return state.phrases.slice();
    },
    getLetters: function () {
      return state.letters.slice();
    },

    // Drill and picking helpers.
    letterDrills: letterDrills,
    arabicDrills: arabicDrills,
    pickWords: pickWords,
    pickPhrase: pickPhrase,
    lookupWord: lookupWord,
    stripArabicDiacritics: stripArabicDiacritics,
    shuffle: shuffle
  };
})(window);
