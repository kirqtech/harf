/*!
 * Nateq - application UI and typing loop
 * No build step, no backend, no dependencies.
 */
(function () {
  'use strict';

  var T = window.NateqTranslit;
  var D = window.NateqData;
  var Loader = window.NateqDataLoader;
  var Dialects = window.NateqDialectManager;

  var STORAGE_SETTINGS = 'nateq.settings.v1';
  var STORAGE_CUSTOM = 'nateq.custom.v1';
  var STORAGE_SCRIPT = 'nateq.script.v1';
  var LEGACY_STORAGE_KEYS = {
    'nateq.settings.v1': 'harf.settings.v1',
    'nateq.custom.v1': 'harf.custom.v1',
    'nateq.script.v1': 'harf.script.v1'
  };
  var MAX_CUSTOM_WORDS = 400;
  var TAB_CHORD_MS = 1200;

  // `latin` is the Arabizi transliteration drill; `arabic` retypes the
  // displayed Arabic letters on an Arabic keyboard (harakat are ignored).
  var SCRIPT_COPY = {
    latin: {
      testLabel: 'Arabic typing test',
      inputLabel: 'Your transliteration input',
      hintAria: 'Reveal the standard transliteration for this word',
      clearAria: 'Clear the current transliteration',
      typingAria: 'Type the Latin transliteration',
      subtitle: 'arabic · latin',
      letters: 'Type the Latin sound for this letter. Press ? for a hint.',
      words: 'Type the Latin transliteration. Press space to submit.',
      reading: 'Read the word and type its Latin spelling. Press ? for a hint.',
      phrases: 'Type each word and press space. Punctuation is skipped.',
      custom: 'Type each transliteration. Punctuation is skipped.',
      instruction: 'Read the Arabic and type the Latin transliteration. Press ? for a hint.',
      wrong: 'Wrong character. Press backspace to fix, or space to skip.',
      complete: 'Press space for the next word.',
      reviewLabel: 'standard spelling'
    },
    arabic: {
      testLabel: 'Arabic script typing test',
      inputLabel: 'Your Arabic input',
      hintAria: 'Reveal the remaining Arabic letters for this word',
      clearAria: 'Clear what you typed',
      typingAria: 'Type the Arabic word',
      subtitle: 'arabic · script',
      letters: 'Type the letter on an Arabic keyboard. Harakat are skipped.',
      words: 'Type the word in Arabic. Harakat are skipped. Press space to submit.',
      reading: 'Type the word in Arabic. Press ? for a hint.',
      phrases: 'Type each Arabic word and press space. Punctuation is skipped.',
      custom: 'Type each Arabic word. Punctuation is skipped.',
      instruction: 'Type the Arabic word. Harakat are skipped. Press ? for a hint.',
      wrong: 'Wrong letter. Press backspace to fix, or space to skip.',
      complete: 'Press space for the next word.',
      reviewLabel: 'correct letters'
    }
  };

  var state = {
    mode: 'words',
    script: 'latin',
    count: 20,
    settings: T.normalizeSettings(T.DEFAULT_SETTINGS),
    customText: '',
    test: null,
    ticker: null,
    finishTimer: null,
    errorTimer: null,
    hintTimer: null,
    hintHideTimer: null,
    reviewTimer: null,
    feedbackTimer: null,
    reviewTab: 'mistakes',
    reviewExplanationsExpanded: false,
    errorToken: -1,
    errorCount: 0,
    toastTimer: null,
    tabPressedAt: 0,
    lastPhrase: '',
    focused: false,
    sheetTab: 'legend',
    dataReady: false,
    dataCategory: '',
    eventsBound: false,
    requestToken: 0,
    failedMode: '',
    loading: false
  };

  var els = {};

  /* ------------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------------ */

  function $(id) {
    return document.getElementById(id);
  }

  function readStorage(key, fallback) {
    try {
      var value = window.localStorage.getItem(key);
      if (value == null && LEGACY_STORAGE_KEYS[key]) {
        value = window.localStorage.getItem(LEGACY_STORAGE_KEYS[key]);
        if (value != null) {
          window.localStorage.setItem(key, value);
        }
      }
      return value == null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Private mode or file:// restrictions should never break practice.
    }
  }

  function isDialogOpen() {
    return !!document.querySelector('dialog[open]');
  }

  function currentWord() {
    if (!state.test) return null;
    return state.test.words[state.test.index] || null;
  }

  function setText(element, text) {
    if (element) element.textContent = text;
  }

  function formatLiveTime(ms) {
    if (!ms || ms < 0) return '0s';
    var totalSeconds = Math.floor(ms / 1000);
    if (totalSeconds < 60) return totalSeconds + 's';
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return minutes + ':' + String(seconds).padStart(2, '0');
  }

  function formatResultTime(ms) {
    if (!ms || ms < 0) return '0s';
    var seconds = ms / 1000;
    if (seconds < 60) {
      return (seconds < 10 ? seconds.toFixed(1) : Math.round(seconds).toString()) + 's';
    }
    var minutes = Math.floor(seconds / 60);
    var remainder = Math.round(seconds % 60);
    return minutes + ':' + String(remainder).padStart(2, '0');
  }

  function computeAccuracy(test) {
    if (!test || !test.totalKeystrokes) return null;
    return Math.round((test.correctKeystrokes / test.totalKeystrokes) * 100);
  }

  function computeWpm(test) {
    if (!test || !test.startedAt) return null;
    var end = test.endedAt || performance.now();
    var minutes = Math.max((end - test.startedAt) / 60000, 1 / 60);
    return Math.min(999, Math.round((test.correctKeystrokes / 5) / minutes));
  }

  function isUthmanicStripped() {
    var activeDialect = (Dialects && typeof Dialects.getActiveDialect === 'function')
      ? Dialects.getActiveDialect()
      : null;
    return !!(activeDialect && activeDialect.stripUthmanicGlyphs);
  }

  function isTypable(character) {
    if (state.script === 'arabic') {
      return T.isArabicTypable(character, { stripUthmanicGlyphs: isUthmanicStripped() });
    }
    return /^[A-Za-z0-9'-]$/.test(character);
  }

  function copy() {
    return SCRIPT_COPY[state.script] || SCRIPT_COPY.latin;
  }

  function isArabicScript() {
    return state.script === 'arabic';
  }

  /**
   * Arabic script mode compares letters, not solutions; Latin mode keeps the
   * existing solution parser with its flexible spellings.
   */
  function parseWord(word) {
    if (!word) return null;
    if (isArabicScript()) {
      return T.matchArabic(word.units, word.input, { stripUthmanicGlyphs: isUthmanicStripped() });
    }
    return T.parseInput(word.tokens, word.input, word.solutions);
  }

  function hintTextFor(word) {
    if (!word) return '';
    if (isArabicScript()) {
      var parse = T.matchArabic(word.units, word.input, { stripUthmanicGlyphs: isUthmanicStripped() });
      if (parse.complete) return '';
      return word.units.slice(parse.typed.length).map(function (unit) {
        return unit.letter;
      }).join('');
    }
    var latin = T.parseInput(word.tokens, word.input, word.solutions);
    if (latin.complete) return '';
    return T.preferredSolution(word.solutions) || word.canonical;
  }

  function displayForMode(raw, mode) {
    if (mode === 'reading' || mode === 'phrases') {
      return T.stripDiacritics(raw);
    }
    return raw;
  }

  function showToast(message, duration) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () {
      els.toast.classList.remove('is-visible');
    }, duration || 2000);
  }

  function hideToast() {
    if (!els.toast) return;
    window.clearTimeout(state.toastTimer);
    els.toast.classList.remove('is-visible');
  }

  function showWordFeedback(word) {
    if (!els.wordFeedback || !els.wordFeedbackContent || !word) return;

    var translation = word.translation_en || '';
    var dialect = word.dialect || '';
    var notes = word.notes || '';

    if (!translation && !notes) {
      clearWordFeedback();
      return;
    }

    if (els.wordFeedbackDialect) {
      if (dialect) {
        els.wordFeedbackDialect.textContent = dialect;
        els.wordFeedbackDialect.className = 'word-feedback-dialect is-' + dialect.toLowerCase();
        els.wordFeedbackDialect.hidden = false;
      } else {
        els.wordFeedbackDialect.hidden = true;
        els.wordFeedbackDialect.textContent = '';
      }
    }

    if (els.wordFeedbackTranslation) {
      els.wordFeedbackTranslation.textContent = translation;
    }

    if (els.wordFeedbackNotes) {
      if (notes) {
        els.wordFeedbackNotes.textContent = notes;
        els.wordFeedbackNotes.title = notes;
        els.wordFeedbackNotes.hidden = false;
      } else {
        els.wordFeedbackNotes.hidden = true;
        els.wordFeedbackNotes.textContent = '';
      }
    }

    els.wordFeedback.classList.add('is-visible');
  }

  function clearWordFeedback() {
    if (!els.wordFeedback) return;
    els.wordFeedback.classList.remove('is-visible');
    window.clearTimeout(state.feedbackTimer);
    state.feedbackTimer = null;
  }

  /* ------------------------------------------------------------------------
     Data loading and recovery
     ------------------------------------------------------------------------ */

  function applyDataset(category, items) {
    if (!category) return;

    if (category === 'words') {
      D.setWords(items);
    } else if (category === 'letters') {
      D.setLetters(items);
    } else if (category === 'phrases') {
      D.setPhrases(items);
    }

    state.dataCategory = category;
  }

  function showLoadingState() {
    state.loading = true;
    if (els.loadingState) els.loadingState.hidden = false;
    if (els.prompt) els.prompt.hidden = true;
    if (els.queueWrap) els.queueWrap.hidden = true;
    if (els.reviewLine) els.reviewLine.hidden = true;
    if (els.focusBadge) els.focusBadge.hidden = true;
    if (els.typingInput) els.typingInput.disabled = true;
    if (els.testStage) els.testStage.classList.add('is-loading', 'is-paused');
  }

  function hideLoadingState() {
    state.loading = false;
    if (els.loadingState) els.loadingState.hidden = true;
    if (els.typingInput) els.typingInput.disabled = false;
    if (els.testStage) els.testStage.classList.remove('is-loading');
  }

  function showDataError(error, mode) {
    hideLoadingState();
    state.failedMode = mode;

    // Keep an existing round visible when a later category switch fails.
    if (state.test) {
      if (els.prompt) els.prompt.hidden = false;
      if (els.queueWrap) els.queueWrap.hidden = false;
    } else {
      if (els.prompt) els.prompt.hidden = true;
      if (els.queueWrap) els.queueWrap.hidden = true;
    }

    setText(els.dataErrorMessage, Loader.describeError(error, Loader.categoryForMode(mode)));
    if (els.dataErrorBanner) els.dataErrorBanner.hidden = false;
    if (els.dataCategorySelect) els.dataCategorySelect.value = mode;
    syncFocusUI();
  }

  function hideDataError() {
    if (els.dataErrorBanner) els.dataErrorBanner.hidden = true;
  }

  /**
   * Resolve the dataset needed by a mode before running the callback. Cached
   * categories return synchronously, which keeps category switching instant.
   */
  function withData(mode, onReady) {
    var category = Loader.categoryForMode(mode);
    var token = state.requestToken + 1;
    state.requestToken = token;

    if (!category) {
      onReady(token);
      return;
    }

    var cached = Loader.getCached(category);
    if (cached) {
      // A cached switch can overtake an in-flight request for another category.
      hideLoadingState();
      hideDataError();
      applyDataset(category, cached);
      onReady(token);
      return;
    }

    showLoadingState();
    hideDataError();

    Loader.load(category).then(function (items) {
      if (token !== state.requestToken) return;
      applyDataset(category, items);
      hideLoadingState();
      hideDataError();
      onReady(token);
    }).catch(function (error) {
      if (token !== state.requestToken) return;
      showDataError(error, mode);
    });
  }

  function bootWithMode(mode) {
    showLoadingState();
    hideDataError();

    withData(mode, function () {
      var firstBoot = !state.dataReady;
      state.dataReady = true;
      hideLoadingState();
      hideDataError();

      if (!state.eventsBound) {
        bindEvents();
        state.eventsBound = true;
      }

      state.mode = mode;
      startNewTest({ mode: mode, focus: false });

      if (firstBoot) focusOnFirstBoot();
    });
  }

  function retryDataLoad() {
    var mode = state.failedMode || state.mode || 'words';
    var category = Loader.categoryForMode(mode);
    if (category) Loader.invalidate(category);

    hideDataError();
    if (state.dataReady) {
      startNewTest({ mode: mode, focus: true });
    } else {
      bootWithMode(mode);
    }
  }

  function changeDataCategory() {
    if (!els.dataCategorySelect) return;

    var mode = els.dataCategorySelect.value || 'words';
    hideDataError();

    if (state.dataReady) {
      startNewTest({ mode: mode, focus: true });
    } else {
      bootWithMode(mode);
    }
  }

  function bindDataRecoveryEvents() {
    if (els.dataRetryButton) {
      els.dataRetryButton.addEventListener('click', retryDataLoad);
    }
    if (els.dataCategorySelect) {
      els.dataCategorySelect.addEventListener('change', changeDataCategory);
    }
  }

  function focusOnFirstBoot() {
    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (finePointer) {
      window.setTimeout(function () {
        if (document.activeElement === document.body || document.activeElement === document.documentElement) {
          focusTyping();
        }
      }, 30);
    } else {
      syncFocusUI();
    }
  }

  /* ------------------------------------------------------------------------
     Test construction
     ------------------------------------------------------------------------ */

  function makeWord(entry, mode) {
    var built = T.buildWord(entry, state.settings);
    if (!built.tokens.length) return null;

    var activeDialect = (Dialects && typeof Dialects.getActiveDialect === 'function')
      ? Dialects.getActiveDialect()
      : null;
    var stripUthmanic = !!(activeDialect && activeDialect.stripUthmanicGlyphs);

    return {
      entry: entry,
      raw: built.arabic,
      display: displayForMode(built.arabic, mode),
      // Matching uses the normalized Arabic form; display keeps vocalization.
      units: isArabicScript()
        ? T.arabicLetterUnits(built.arabic_plain || built.arabic, { stripUthmanicGlyphs: stripUthmanic })
        : [],
      tokens: built.tokens,
      solutions: built.solutions,
      translit: built.translit || built.solutions,
      canonical: built.canonical,
      translation_en: built.translation_en || (entry && entry.translation_en) || '',
      dialect: built.dialect || (entry && entry.dialect) || (activeDialect ? activeDialect.name : ''),
      notes: built.notes || (entry && entry.notes) || '',
      input: '',
      committed: false,
      correct: null
    };
  }

  function makeTest(mode, rawWords, sourceText) {
    var words = rawWords.map(function (raw) {
      return makeWord(raw, mode);
    }).filter(function (word) {
      // Arabic script mode still needs something typeable after harakat.
      return word && (!isArabicScript() || word.units.length > 0);
    });

    if (!words.length) return null;

    return {
      mode: mode,
      words: words,
      sourceText: sourceText || '',
      index: 0,
      completed: 0,
      correctWords: 0,
      incorrectWords: 0,
      totalKeystrokes: 0,
      correctKeystrokes: 0,
      streak: 0,
      maxStreak: 0,
      startedAt: null,
      endedAt: null,
      status: 'ready',
      finishing: false
    };
  }

  function newTestForMode(mode) {
    if (mode === 'letters') {
      var drills = isArabicScript() ? D.arabicDrills(20) : D.letterDrills(20);
      return makeTest('letters', drills, drills.join(' '));
    }

    if (mode === 'words' || mode === 'reading') {
      var picked = D.pickWords(state.count);
      return makeTest(mode, picked, picked.map(function (entry) {
        return T.entryArabic(entry);
      }).join(' '));
    }

    if (mode === 'phrases') {
      var phrase = D.pickPhrase(state.lastPhrase);
      if (!phrase) return null;
      var phraseArabic = phrase.arabic || phrase.arabic_plain || '';
      var phrasePlain = phrase.arabic_plain || '';
      state.lastPhrase = phraseArabic;
      var arWords = T.splitWords(phraseArabic);
      var plainWords = T.splitWords(phrasePlain);
      var phraseEntries = arWords.map(function (w, idx) {
        var found = D.lookupWord(w) || (plainWords[idx] ? D.lookupWord(plainWords[idx]) : null);
        if (found) return found;
        return {
          arabic: w,
          arabic_plain: plainWords.length === arWords.length ? plainWords[idx] : '',
          dialect: phrase.dialect || ''
        };
      });
      return makeTest('phrases', phraseEntries, phraseArabic);
    }

    if (mode === 'custom') {
      var customWords = T.splitWords(state.customText);
      return makeTest('custom', customWords, state.customText);
    }

    return null;
  }

  /* ------------------------------------------------------------------------
     Rendering
     ------------------------------------------------------------------------ */

  var MODE_TAGS = {
    letters: 'letters',
    words: 'vocalized',
    reading: 'reading',
    phrases: 'phrase',
    custom: 'custom'
  };

  function renderWords(test) {
    var start = test.index + 1;
    var upcoming = test.words.slice(start, start + 10);
    var remaining = test.words.length - (start + upcoming.length);
    var fragment = document.createDocumentFragment();

    upcoming.forEach(function (word) {
      var item = document.createElement('span');
      item.className = 'queue-item';

      var arabic = document.createElement('span');
      arabic.className = 'queue-ar';
      arabic.lang = 'ar';
      arabic.dir = 'rtl';
      arabic.textContent = word.display;

      item.appendChild(arabic);
      fragment.appendChild(item);
    });

    if (remaining > 0) {
      var more = document.createElement('span');
      more.className = 'queue-more';
      more.textContent = '+' + remaining;
      fragment.appendChild(more);
    }

    els.words.replaceChildren(fragment);
    els.queueWrap.hidden = upcoming.length === 0;
    renderActiveWord();
    updateStats();
    syncFocusUI();
  }

  function appendLatinPart(fragment, text, className) {
    if (!text) return;
    var span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    fragment.appendChild(span);
  }

  function appendPlaceholders(fragment, count) {
    if (count <= 0) return;
    var span = document.createElement('span');
    span.className = 'latin-placeholder';
    span.textContent = new Array(count + 1).join('_');
    fragment.appendChild(span);
  }

  function appendCaret(fragment) {
    var caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    fragment.appendChild(caret);
  }

  function renderActiveWord() {
    var test = state.test;
    var word = currentWord();
    if (!test || !word || test.status === 'finished') return;

    setText(els.promptArabic, word.display);
    setText(els.promptCounter, (test.index + 1) + ' / ' + test.words.length);
    setText(els.promptModeTag, MODE_TAGS[test.mode] || MODE_TAGS.words);

    if (isArabicScript()) {
      renderArabicInput(word);
    } else {
      renderLatinInput(word);
    }

    if (els.clearButton) els.clearButton.disabled = !word.input.length;
    updateInstruction(parseWord(word));
  }

  function renderLatinInput(word) {
    var parse = T.parseInput(word.tokens, word.input, word.solutions);
    var fragment = document.createDocumentFragment();
    var target = parse.target || word.canonical || '';
    var typedPart = parse.validPrefix ? word.input : target.slice(0, parse.matched);
    var errorPart = parse.validPrefix ? '' : parse.leftover;

    appendLatinPart(fragment, typedPart, 'latin-typed');
    appendLatinPart(fragment, errorPart, 'latin-error');
    appendCaret(fragment);
    appendPlaceholders(fragment, Math.max(0, target.length - typedPart.length - errorPart.length));

    els.promptLatin.replaceChildren(fragment);
  }

  /**
   * Arabic script mode: target letters are connected with Zero-Width Joiners
   * (\u200D) across span boundaries so cursive shaping stays intact. Typed
   * letters light up, wrong letters turn red, and extra letters appear at the end.
   */
  function renderArabicInput(word) {
    var parse = T.matchArabic(word.units, word.input, { stripUthmanicGlyphs: isUthmanicStripped() });
    var fragment = document.createDocumentFragment();
    var extra = parse.typed.slice(word.units.length);
    var isLong = word.units.length > 8;
    var ZWJ = '\u200D';

    word.units.forEach(function (unit, index) {
      if (index === parse.matched) appendCaret(fragment);

      var span = document.createElement('span');
      var stateClass = 'arabic-letter';
      if (index < parse.matched) {
        stateClass = 'arabic-letter is-typed';
      } else if (index < parse.typed.length) {
        stateClass = 'arabic-letter is-wrong';
      }
      span.className = stateClass;
      span.lang = 'ar';
      span.textContent = (unit.joinPrev ? ZWJ : '') + unit.letter + (unit.joinNext ? ZWJ : '');
      fragment.appendChild(span);
    });

    if (parse.matched >= word.units.length) appendCaret(fragment);

    extra.forEach(function (piece) {
      var span = document.createElement('span');
      span.className = 'arabic-letter is-extra';
      span.lang = 'ar';
      span.textContent = piece;
      fragment.appendChild(span);
    });

    els.promptLatin.replaceChildren(fragment);
    els.promptLatin.classList.toggle('is-long', isLong);
  }

  function updateInstruction(parse) {
    var test = state.test;
    var c = copy();
    if (!test) return;

    if (test.finishing) {
      setText(els.instructionLine, 'Finishing...');
      return;
    }

    if (test.status === 'finished') {
      setText(els.instructionLine, 'Nice work. Press Enter to go again.');
      return;
    }

    var base = c[test.mode] || c.words;
    if (parse && (parse.leftover || parse.extra)) {
      setText(els.instructionLine, c.wrong);
      return;
    }

    if (parse && parse.complete && test.index < test.words.length - 1) {
      setText(els.instructionLine, c.complete);
      return;
    }

    setText(els.instructionLine, base);
  }

  function updateStats() {
    var test = state.test;
    if (!test) return;

    var isReady = test.status === 'ready';
    var isFinished = test.status === 'finished';
    var end = test.endedAt || performance.now();
    var elapsed = test.startedAt ? end - test.startedAt : 0;
    var wpm = computeWpm(test);
    var accuracy = computeAccuracy(test);
    var total = test.words.length;
    var completed = Math.min(test.completed, total);
    var progress = total ? Math.round((completed / total) * 100) : 0;

    if (isFinished) progress = 100;

    setStat(els.statWpm, isReady ? '-' : String(wpm == null ? 0 : wpm));
    setStat(els.statAccuracy, accuracy == null ? '-' : accuracy + '%');
    setStat(els.statStreak, isReady ? '-' : String(test.streak));
    setStat(els.statTime, isReady ? '-' : formatLiveTime(elapsed));

    setText(els.statProgress, completed + ' / ' + total);
    els.progressFill.style.width = progress + '%';
    els.progressTrack.setAttribute('aria-valuenow', String(progress));
  }

  function setStat(element, value) {
    if (!element) return;
    element.textContent = value;
    element.classList.toggle('has-value', value !== '-');
  }

  function ensureActiveVisible() {
    if (!els.prompt) return;

    window.requestAnimationFrame(function () {
      var rect = els.prompt.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.bottom > viewportHeight - 32 || rect.top < 72) {
        els.prompt.scrollIntoView({
          block: 'nearest',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
      }
    });
  }

  /* ------------------------------------------------------------------------
     Test lifecycle
     ------------------------------------------------------------------------ */

  function startTest(test, options) {
    var opts = options || {};

    clearTimers();
    clearHint();
    hideReview();
    state.test = test;
    state.tabPressedAt = 0;
    state.focused = false;
    state.errorToken = -1;
    state.errorCount = 0;

    els.typingInput.value = '';
    closeResultsDialog();
    els.prompt.hidden = false;
    els.words.hidden = false;
    els.testStage.classList.remove('is-paused');

    setModeUI(test.mode);
    updateCountUI();
    renderWords(test);

    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    if (opts.focus !== false) {
      focusTyping();
    } else {
      syncFocusUI();
    }
  }

  function startNewTest(options) {
    var opts = options || {};
    var mode = opts.mode || state.mode;

    if (mode === 'custom' && !T.splitWords(state.customText).length) {
      openCustomDialog();
      return;
    }

    withData(mode, function () {
      var test = newTestForMode(mode);
      if (!test) {
        showToast('That text did not contain any Arabic letters.');
        return;
      }

      state.mode = mode;
      if (mode !== 'custom') hideToast();
      startTest(test, { focus: opts.focus !== false });
    });
  }

  function repeatTest() {
    var test = state.test;
    if (!test) {
      startNewTest();
      return;
    }

    var rawWords = test.words.map(function (word) { return word.entry; });
    var repeated = makeTest(test.mode, rawWords, test.sourceText);
    if (!repeated) {
      startNewTest({ mode: test.mode });
      return;
    }

    hideToast();
    startTest(repeated, { focus: true });
  }

  function beginClock(test) {
    if (test.status !== 'ready') return;
    test.status = 'running';
    test.startedAt = performance.now();
    startTicker();
    updateStats();
  }

  function startTicker() {
    window.clearInterval(state.ticker);
    state.ticker = window.setInterval(function () {
      if (state.test && state.test.status === 'running') updateStats();
    }, 200);
  }

  function clearTimers() {
    window.clearInterval(state.ticker);
    state.ticker = null;
    window.clearTimeout(state.finishTimer);
    state.finishTimer = null;
    window.clearTimeout(state.errorTimer);
    state.errorTimer = null;
    window.clearTimeout(state.hintTimer);
    state.hintTimer = null;
    window.clearTimeout(state.hintHideTimer);
    state.hintHideTimer = null;
    window.clearTimeout(state.reviewTimer);
    state.reviewTimer = null;
    clearWordFeedback();
  }

  function finishTest(options) {
    var opts = options || {};
    var test = state.test;
    if (!test || test.status === 'finished') return;

    window.clearInterval(state.ticker);
    state.ticker = null;
    window.clearTimeout(state.finishTimer);
    state.finishTimer = null;
    window.clearTimeout(state.errorTimer);
    state.errorTimer = null;

    if (opts.autoLastWord && test.index < test.words.length) {
      var lastWord = test.words[test.index];
      if (!lastWord.committed) {
        lastWord.committed = true;
        lastWord.correct = true;
        test.completed += 1;
        test.correctWords += 1;
        test.streak += 1;
        test.maxStreak = Math.max(test.maxStreak, test.streak);
      }
    }

    test.finishing = false;
    test.status = 'finished';
    test.endedAt = performance.now();
    if (!test.startedAt) test.startedAt = test.endedAt;

    clearHint();
    hideReview();
    updateStats();
    updateInstruction(null);
    showResults(test);

    els.prompt.hidden = true;
    els.queueWrap.hidden = true;
    els.words.hidden = true;
    els.results.hidden = false;
    showResultsDialog();
    syncFocusUI();
  }

  function showResults(test) {
    var duration = test.endedAt - test.startedAt;
    var accuracy = computeAccuracy(test);
    var wpm = computeWpm(test);

    setText(els.resultWpm, String(wpm == null ? 0 : wpm));
    setText(els.resultAccuracy, (accuracy == null ? 0 : accuracy) + '%');
    setText(els.resultStreak, String(test.maxStreak));
    setText(els.resultTime, formatResultTime(duration));
    setText(els.resultWords, test.correctWords + ' / ' + test.words.length);

    renderResultsReview(test);
  }

  function showResultsDialog() {
    if (!els.resultsDialog) return;

    if (!els.resultsDialog.open) {
      els.resultsDialog.showModal();
    }

    if (els.resultsDialog.scrollTop) els.resultsDialog.scrollTop = 0;
    if (els.results) els.results.scrollTop = 0;

    window.requestAnimationFrame(function () {
      if (els.nextTestButton) els.nextTestButton.focus();
    });
  }

  function closeResultsDialog() {
    if (els.resultsDialog && els.resultsDialog.open) {
      els.resultsDialog.close();
    }
  }

  function reviewSolutions(word, limit) {
    var seen = Object.create(null);
    var out = [];

    (word.solutions || []).forEach(function (solution) {
      if (!solution || seen[solution]) return;
      seen[solution] = true;
      out.push(solution);
    });

    return out.slice(0, limit || 4);
  }

  function updateReviewTabsUI() {
    if (els.reviewTabMistakes) {
      els.reviewTabMistakes.classList.toggle('is-active', state.reviewTab === 'mistakes');
      els.reviewTabMistakes.setAttribute('aria-selected', String(state.reviewTab === 'mistakes'));
    }
    if (els.reviewTabAll) {
      els.reviewTabAll.classList.toggle('is-active', state.reviewTab === 'all');
      els.reviewTabAll.setAttribute('aria-selected', String(state.reviewTab === 'all'));
    }
  }

  function setReviewTab(tab) {
    state.reviewTab = tab;
    updateReviewTabsUI();
    if (state.test) {
      renderResultsList(state.test);
    }
  }

  function toggleAllExplanations() {
    state.reviewExplanationsExpanded = !state.reviewExplanationsExpanded;
    updateToggleExplanationsButtonUI();
    if (state.test) {
      renderResultsList(state.test);
    }
  }

  function updateToggleExplanationsButtonUI() {
    if (els.reviewToggleNotesButton) {
      els.reviewToggleNotesButton.classList.toggle('is-active', state.reviewExplanationsExpanded);
      els.reviewToggleNotesButton.setAttribute('aria-pressed', String(state.reviewExplanationsExpanded));
    }
    if (els.reviewToggleNotesLabel) {
      els.reviewToggleNotesLabel.textContent = state.reviewExplanationsExpanded
        ? 'Hide explanations'
        : 'Explanations';
    }
  }

  function renderResultsList(test) {
    if (!els.resultsReviewList) return;

    var missed = test.words.filter(function (word) {
      return word.committed && word.correct === false;
    });

    var committedWords = test.words.filter(function (word) {
      return word.committed;
    });
    var all = committedWords.length ? committedWords : test.words;

    var listToShow = state.reviewTab === 'mistakes' ? missed : all;

    if (!listToShow.length) {
      var empty = document.createElement('li');
      empty.className = 'review-empty-state';
      empty.textContent = state.reviewTab === 'mistakes'
        ? 'No mistakes this round! Clean typing.'
        : 'No words completed.';
      els.resultsReviewList.replaceChildren(empty);
      return;
    }

    var fragment = document.createDocumentFragment();

    listToShow.forEach(function (word) {
      var item = document.createElement('li');
      var isMistake = word.committed && word.correct === false;
      item.className = 'review-item' + (isMistake ? ' is-missed' : ' is-correct');

      // Top row: Arabic spelling with harakat + Arabizi transliteration / input
      var rowMain = document.createElement('div');
      rowMain.className = 'review-row-main';

      var flow = document.createElement('div');
      flow.className = 'review-flow';

      var arabic = document.createElement('span');
      arabic.className = 'review-arabic';
      arabic.lang = 'ar';
      arabic.dir = 'rtl';
      // Render Arabic spelling with harakat (word.raw retains vocalization)
      arabic.textContent = word.raw || word.display;
      flow.appendChild(arabic);

      if (isMistake) {
        var arrow = document.createElement('span');
        arrow.className = 'review-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';

        var typed = document.createElement('code');
        typed.className = 'review-typed';
        typed.dir = isArabicScript() ? 'rtl' : 'ltr';
        if (isArabicScript()) typed.lang = 'ar';
        typed.textContent = word.input || '-';

        flow.append(arrow, typed);
      }

      var arrowTarget = document.createElement('span');
      arrowTarget.className = 'review-arrow';
      arrowTarget.setAttribute('aria-hidden', 'true');
      arrowTarget.textContent = isMistake ? '→' : ':';
      flow.appendChild(arrowTarget);

      // Target Arabizi transliteration
      if (isArabicScript()) {
        var answer = document.createElement('code');
        answer.className = 'review-arabic-answer';
        answer.lang = 'ar';
        answer.dir = 'rtl';
        answer.textContent = word.units.map(function (unit) {
          return unit.letter;
        }).join('');
        flow.appendChild(answer);
      } else {
        var targetCode = document.createElement('code');
        targetCode.className = 'review-target-translit';
        targetCode.dir = 'ltr';
        targetCode.textContent = word.canonical || (word.solutions && word.solutions[0]) || '';
        flow.appendChild(targetCode);
      }

      rowMain.appendChild(flow);

      // Meta line: Dialect tag + English meaning + Explanation toggle
      var metaLine = document.createElement('div');
      metaLine.className = 'review-meta-line';

      var meaningWrap = document.createElement('div');
      meaningWrap.className = 'review-meaning-wrap';

      // English meaning and dialect tag (e.g. "[Levantine] I want")
      if (word.dialect) {
        var dialectTag = document.createElement('span');
        dialectTag.className = 'review-dialect-tag is-' + word.dialect.toLowerCase();
        dialectTag.textContent = '[' + word.dialect + ']';
        meaningWrap.appendChild(dialectTag);
      }

      if (word.translation_en) {
        var meaning = document.createElement('span');
        meaning.className = 'review-meaning-text';
        meaning.textContent = word.translation_en;
        meaningWrap.appendChild(meaning);
      }

      metaLine.appendChild(meaningWrap);

      // Option to toggle/view word explanation
      var drawer = null;
      if (word.notes) {
        var noteBtn = document.createElement('button');
        noteBtn.type = 'button';
        noteBtn.className = 'review-note-toggle-btn';
        noteBtn.innerHTML = '<span aria-hidden="true">ℹ</span> explanation';
        noteBtn.setAttribute('aria-expanded', String(state.reviewExplanationsExpanded));

        drawer = document.createElement('div');
        drawer.className = 'review-note-drawer';
        drawer.textContent = word.notes;
        drawer.hidden = !state.reviewExplanationsExpanded;
        if (state.reviewExplanationsExpanded) {
          noteBtn.classList.add('is-open');
        }

        noteBtn.addEventListener('click', function () {
          var isExpanded = noteBtn.getAttribute('aria-expanded') === 'true';
          var nextState = !isExpanded;
          noteBtn.setAttribute('aria-expanded', String(nextState));
          noteBtn.classList.toggle('is-open', nextState);
          drawer.hidden = !nextState;
        });

        metaLine.appendChild(noteBtn);
      }

      item.appendChild(rowMain);
      item.appendChild(metaLine);
      if (drawer) {
        item.appendChild(drawer);
      }

      fragment.appendChild(item);
    });

    els.resultsReviewList.replaceChildren(fragment);
  }

  function renderResultsReview(test) {
    if (!els.resultsReview || !els.resultsReviewList) return;

    var missed = test.words.filter(function (word) {
      return word.committed && word.correct === false;
    });

    var committed = test.words.filter(function (word) {
      return word.committed;
    });

    if (els.reviewMistakesCount) {
      els.reviewMistakesCount.textContent = String(missed.length);
    }
    if (els.reviewAllCount) {
      els.reviewAllCount.textContent = String(committed.length || test.words.length);
    }

    if (missed.length > 0) {
      state.reviewTab = 'mistakes';
    } else {
      state.reviewTab = 'all';
    }

    updateReviewTabsUI();
    updateToggleExplanationsButtonUI();
    renderResultsList(test);
    els.resultsReview.hidden = false;
  }

  /* ------------------------------------------------------------------------
     Typing
     ------------------------------------------------------------------------ */

  function showHint(auto) {
    if (!els.promptHint) return;
    var hint = hintTextFor(currentWord());
    if (!hint) return;

    window.clearTimeout(state.hintTimer);
    window.clearTimeout(state.hintHideTimer);
    els.promptHint.hidden = false;
    els.promptHint.textContent = isArabicScript() ? hint : 'hint · ' + hint;
    els.promptHint.lang = isArabicScript() ? 'ar' : 'en';
    els.promptHint.dir = isArabicScript() ? 'rtl' : 'ltr';
    els.promptHint.classList.toggle('is-arabic', isArabicScript());
    els.promptHint.classList.toggle('is-auto', !!auto);

    positionHint();

    // Force a reflow so repeated hints animate in again.
    void els.promptHint.offsetWidth;
    els.promptHint.classList.add('is-visible');

    if (!auto) {
      state.hintTimer = window.setTimeout(hideHint, 1500);
    }
  }

  function positionHint() {
    if (!els.promptHint || !els.promptInputWrap || !els.promptLatin) return;

    var caret = els.promptLatin.querySelector('.caret');
    if (!caret) return;

    var wrapRect = els.promptInputWrap.getBoundingClientRect();
    var caretRect = caret.getBoundingClientRect();
    if (!wrapRect.width || !caretRect.height) return;

    var center = caretRect.left - wrapRect.left + caretRect.width / 2;
    var padding = Math.min(56, wrapRect.width / 2);
    var left = Math.max(padding, Math.min(wrapRect.width - padding, center));
    els.promptHint.style.left = left + 'px';
  }

  function hideHint() {
    if (!els.promptHint) return;
    window.clearTimeout(state.hintTimer);
    state.hintTimer = null;
    window.clearTimeout(state.hintHideTimer);
    els.promptHint.classList.remove('is-visible', 'is-auto');
    state.hintHideTimer = window.setTimeout(function () {
      if (els.promptHint) els.promptHint.hidden = true;
    }, 160);
  }

  function clearHint() {
    window.clearTimeout(state.hintTimer);
    window.clearTimeout(state.hintHideTimer);
    state.hintTimer = null;
    state.hintHideTimer = null;
    if (els.promptHint) {
      els.promptHint.classList.remove('is-visible', 'is-auto');
      els.promptHint.hidden = true;
    }
  }

  function handleHintRequest() {
    var test = state.test;
    if (!test || test.status === 'finished' || test.finishing) return;
    state.tabPressedAt = 0;
    showHint(false);
  }

  function showReview(word) {
    if (!els.reviewLine || !word) return;

    var arabic = document.createElement('span');
    arabic.className = 'review-arabic';
    arabic.lang = 'ar';
    arabic.dir = 'rtl';
    arabic.textContent = word.display;

    var note = document.createElement('span');
    note.textContent = copy().reviewLabel;

    var answer = document.createElement('code');
    if (isArabicScript()) {
      answer.lang = 'ar';
      answer.dir = 'rtl';
      answer.className = 'review-arabic-answer';
      answer.textContent = word.units.map(function (unit) {
        return unit.letter;
      }).join('');
    } else {
      answer.dir = 'ltr';
      answer.textContent = word.canonical;
    }

    var elements = [arabic, note, answer];

    if (word.translation_en) {
      var meaning = document.createElement('span');
      meaning.className = 'review-meaning-text';
      var tag = word.dialect ? '[' + word.dialect + '] ' : '';
      meaning.textContent = '· ' + tag + word.translation_en;
      elements.push(meaning);
    }

    els.reviewLine.replaceChildren.apply(els.reviewLine, elements);
    els.reviewLine.hidden = false;
    window.clearTimeout(state.reviewTimer);
    state.reviewTimer = window.setTimeout(hideReview, 3200);
  }

  function hideReview() {
    window.clearTimeout(state.reviewTimer);
    state.reviewTimer = null;
    if (els.reviewLine) {
      els.reviewLine.hidden = true;
      els.reviewLine.replaceChildren();
    }
  }

  function handleCharacter(character) {
    var test = state.test;
    if (!test || test.status === 'finished' || test.finishing) return;

    var word = currentWord();
    if (!word) return;

    state.tabPressedAt = 0;
    if (test.status === 'ready') beginClock(test);

    word.input += character;
    var parse = parseWord(word);

    test.totalKeystrokes += 1;
    var autoHint = false;
    var valid = parse.validPrefix;
    if (valid) {
      test.correctKeystrokes += 1;
      test.streak += 1;
      test.maxStreak = Math.max(test.maxStreak, test.streak);
      state.errorToken = -1;
      state.errorCount = 0;
      hideHint();
    } else {
      test.streak = 0;
      var failToken = test.index;
      if (state.errorToken === failToken) {
        state.errorCount += 1;
      } else {
        state.errorToken = failToken;
        state.errorCount = 1;
      }
      flashActiveError();
      if (state.errorCount >= 3) autoHint = true;
    }

    renderActiveWord();
    updateStats();

    if (autoHint) showHint(true);

    if (parse.complete && test.index === test.words.length - 1) {
      test.finishing = true;
      updateInstruction(parse);
      showWordFeedback(word);
      state.finishTimer = window.setTimeout(function () {
        finishTest({ autoLastWord: true });
      }, 340);
    } else if (parse.complete) {
      showWordFeedback(word);
      ensureActiveVisible();
    }
  }

  function clearCurrentInput() {
    var test = state.test;
    if (!test || test.status === 'finished' || test.finishing) return;

    var word = currentWord();
    if (!word) return;

    if (!word.input.length) {
      flashActiveError();
      return;
    }

    word.input = '';
    state.errorToken = -1;
    state.errorCount = 0;
    hideHint();
    renderActiveWord();
    updateStats();
  }

  function handleBackspace() {
    var test = state.test;
    if (!test || test.status === 'finished' || test.finishing) return;

    state.tabPressedAt = 0;
    var word = currentWord();
    if (!word) return;

    if (!word.input.length) {
      flashActiveError();
      return;
    }

    trimInput(word);
    state.errorToken = -1;
    state.errorCount = 0;
    hideHint();
    renderActiveWord();
    updateStats();
  }

  /** Remove one typed character; in Arabic mode remove a whole letter piece. */
  function trimInput(word) {
    if (isArabicScript()) {
      var pieces = Array.from(word.input);
      pieces.pop();
      word.input = pieces.join('');
    } else {
      word.input = word.input.slice(0, -1);
    }
  }

  function handleSpace() {
    var test = state.test;
    if (!test || test.status === 'finished' || test.finishing) return;

    state.tabPressedAt = 0;
    var word = currentWord();
    if (!word) return;

    if (!word.input.length) {
      flashActiveError();
      return;
    }

    var parse = parseWord(word);
    var correct = isArabicScript()
      ? !!parse.complete
      : (T.isAccepted(word.solutions, word.input) || parse.complete);
    word.committed = true;
    word.correct = correct;

    test.completed += 1;
    test.totalKeystrokes += 1;
    state.errorToken = -1;
    state.errorCount = 0;
    hideHint();
    showWordFeedback(word);

    if (correct) {
      test.correctWords += 1;
      test.correctKeystrokes += 1;
      test.streak += 1;
      test.maxStreak = Math.max(test.maxStreak, test.streak);
      hideReview();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(10);
        } catch (e) {}
      }
    } else {
      test.incorrectWords += 1;
      test.streak = 0;
      flashActiveError();
      showReview(word);
    }

    updateStats();

    if (test.index >= test.words.length - 1) {
      finishTest();
      return;
    }

    test.index += 1;
    renderWords(test);
    updateInstruction(null);
    ensureActiveVisible();
    focusTyping();
  }

  function flashActiveError() {
    if (!els.promptLatin) return;

    els.promptLatin.classList.remove('is-error');
    // Force a new animation frame so rapid mistakes re-trigger the nudge.
    void els.promptLatin.offsetWidth;
    els.promptLatin.classList.add('is-error');
    window.clearTimeout(state.errorTimer);
    state.errorTimer = window.setTimeout(function () {
      if (els.promptLatin) els.promptLatin.classList.remove('is-error');
    }, 190);

    // Subtle tactile error feedback on mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch (e) {}
    }
  }

  function handleTab() {
    state.tabPressedAt = Date.now();
    showToast('Press Enter to restart with a new test.', 1800);
  }

  function handleEnter() {
    var test = state.test;
    var chordUsed = state.tabPressedAt && (Date.now() - state.tabPressedAt) <= TAB_CHORD_MS;
    state.tabPressedAt = 0;

    if (test && test.status === 'finished') {
      hideToast();
      startNewTest({ mode: state.mode });
      return;
    }

    if (chordUsed) {
      hideToast();
      startNewTest({ mode: state.mode });
    }
  }

  function handleEscape() {
    state.tabPressedAt = 0;
    hideToast();
    startNewTest({ mode: state.mode });
  }

  function onResultsKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
    if (!state.test || state.test.status !== 'finished') return;

    event.preventDefault();
    event.stopPropagation();
    hideToast();
    startNewTest({ mode: state.mode });
  }

  /* ------------------------------------------------------------------------
     Focus and keyboard capture
     ------------------------------------------------------------------------ */

  function focusTyping() {
    if (!state.dataReady || state.loading || isDialogOpen()) return;
    try {
      els.typingInput.focus({ preventScroll: true });
    } catch (error) {
      els.typingInput.focus();
    }
    els.typingInput.value = '';
    syncFocusUI();
  }

  function syncFocusUI() {
    if (!els.testStage) return;
    var ready = state.dataReady && !state.loading;
    var inputFocused = ready && document.activeElement === els.typingInput;
    var dialogOpen = isDialogOpen();
    var finished = state.test && state.test.status === 'finished';

    state.focused = inputFocused;
    els.testStage.classList.toggle('is-paused', !ready || (!inputFocused && !dialogOpen));
    if (els.focusBadge) {
      els.focusBadge.hidden = !ready || inputFocused || dialogOpen || finished || !state.test;
    }

    var isMobile = window.matchMedia && window.matchMedia('(max-width: 860px)').matches;
    if (isMobile) {
      if (ready && inputFocused && !dialogOpen && !finished) {
        document.body.classList.add('keyboard-open');
      } else {
        document.body.classList.remove('keyboard-open');
      }
    }
  }

  function isInteractiveTarget(target) {
    if (!(target instanceof Element)) return false;
    return !!target.closest('button, a, select, textarea, input:not(#typingInput)');
  }

  function onKeyDown(event) {
    // Dialect Picker shortcut: Alt+D or Ctrl+K / Cmd+K
    if ((event.altKey && (event.key === 'd' || event.key === 'D' || event.code === 'KeyD')) ||
        ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K' || event.code === 'KeyK'))) {
      event.preventDefault();
      if (els.dialectModal && els.dialectModal.open) {
        closeDialectModal();
      } else {
        openDialectModal();
      }
      return;
    }

    if (event.key === 'F1') {
      event.preventDefault();
      if (els.sheetDialog.open) {
        closeSheet();
      } else if (!isDialogOpen()) {
        openSheet('legend');
      }
      return;
    }

    if (isDialogOpen()) return;
    if (!state.dataReady || state.loading) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta') return;
    if (isInteractiveTarget(event.target)) return;

    if (event.key === 'Tab') {
      if (event.shiftKey) return;
      event.preventDefault();
      handleTab();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handleEscape();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleEnter();
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      focusTyping();
      handleBackspace();
      return;
    }

    if (event.key === ' ') {
      event.preventDefault();
      focusTyping();
      handleSpace();
      return;
    }

    if (event.key === '?') {
      event.preventDefault();
      focusTyping();
      handleHintRequest();
      return;
    }

    // Arabic layouts (Arabic 101/102, Mac) emit base letters with the
    // "Dead"/"Process" key value while composing a harakat. The vowel is not
    // typed, but the letter that carries it was already handled.
    if (isArabicScript() && isDeadKey(event.key)) {
      event.preventDefault();
      focusTyping();
      return;
    }

    if (event.key.length === 1) {
      var character = event.key === '\u2019' ? "'" : event.key;
      event.preventDefault();
      focusTyping();

      if (isTypable(character)) {
        handleCharacter(character);
      } else {
        flashActiveError();
      }
    }
  }

  function isDeadKey(key) {
    return key === 'Dead' || key === 'Process' ||
      key === '\u02D9' || key === '\u02C7' || key === '\u02CB';
  }

  /* ------------------------------------------------------------------------
     UI state
     ------------------------------------------------------------------------ */

  function setModeUI(mode) {
    els.modeTabs.forEach(function (tab) {
      var active = tab.dataset.mode === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
  }

  /** Re-label every piece of static UI that depends on the active script. */
  function applyScriptCopy() {
    var c = copy();
    document.documentElement.dataset.script = state.script;

    if (els.countControl) {
      els.countControl.setAttribute('aria-label', state.script === 'arabic' ? 'Number of letters' : 'Number of words');
    }
    if (els.testStage) els.testStage.setAttribute('aria-label', c.testLabel);
    if (els.promptLatin) {
      els.promptLatin.setAttribute('aria-label', c.inputLabel);
      els.promptLatin.dir = state.script === 'arabic' ? 'rtl' : 'ltr';
      els.promptLatin.lang = state.script === 'arabic' ? 'ar' : 'en';
    }
    if (els.hintButton) els.hintButton.setAttribute('aria-label', c.hintAria);
    if (els.clearButton) els.clearButton.setAttribute('aria-label', c.clearAria);
    if (els.typingInput) {
      els.typingInput.setAttribute('aria-label', c.typingAria);
      els.typingInput.lang = state.script === 'arabic' ? 'ar' : 'en';
      els.typingInput.dir = state.script === 'arabic' ? 'rtl' : 'ltr';
    }
    if (els.brandSubtitle) els.brandSubtitle.textContent = c.subtitle;
    if (els.promptHelp) els.promptHelp.textContent = c.instruction;
    if (els.instructionLine) els.instructionLine.textContent = c.instruction;

    if (els.scriptTabs) {
      els.scriptTabs.forEach(function (button) {
        var active = button.dataset.script === state.script;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    if (els.settingsHintPanel) els.settingsHintPanel.hidden = state.script === 'arabic';
  }

  function setScript(script, options) {
    var next = script === 'arabic' ? 'arabic' : 'latin';
    if (next === state.script) return;

    state.script = next;
    writeStorage(STORAGE_SCRIPT, next);
    applyScriptCopy();
    updateCountUI();
    if (state.test) renderActiveWord();

    if (options && options.restart === false) return;
    // The word list, hints and accepted answers all differ per script.
    startNewTest({ mode: state.mode, focus: true });
  }

  function updateCountUI() {
    var visible = state.mode === 'words' || state.mode === 'reading';
    els.countControl.hidden = !visible;

    els.countButtons.forEach(function (button) {
      var active = Number(button.dataset.count) === state.count;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function setSheetTab(tab) {
    state.sheetTab = tab;

    els.sheetTabs.forEach(function (button) {
      var active = button.dataset.sheetTab === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });

    els.legendPanel.hidden = tab !== 'legend';
    els.settingsPanel.hidden = tab !== 'settings';
  }

  function openSheet(tab) {
    if (isDialogOpen()) return;
    setSheetTab(tab === 'settings' ? 'settings' : 'legend');
    els.sheetDialog.showModal();
    syncFocusUI();
  }

  function closeSheet() {
    if (els.sheetDialog.open) els.sheetDialog.close();
  }

  function openCustomDialog() {
    if (isDialogOpen()) return;
    els.customText.value = state.customText;
    els.customError.hidden = true;
    els.customError.textContent = '';
    els.customDialog.showModal();
    syncFocusUI();
    window.setTimeout(function () {
      els.customText.focus();
    }, 0);
  }

  function closeCustomDialog() {
    if (els.customDialog.open) els.customDialog.close();
  }

  /* ------------------------------------------------------------------------
     Dialect UI and Modal Management
     ------------------------------------------------------------------------ */

  var dialectState = {
    searchQuery: '',
    selectedIndex: 0,
    filteredDialects: []
  };

  function updateDialectPill() {
    if (!els.dialectPillName || !Dialects) return;
    var active = Dialects.getActiveDialect();
    if (active) {
      els.dialectPillName.textContent = active.name;
    }
  }

  function renderDialectList() {
    if (!els.dialectList || !Dialects) return;
    var all = Dialects.getDialects();
    var query = dialectState.searchQuery.trim().toLowerCase();

    dialectState.filteredDialects = all.filter(function (d) {
      if (!query) return true;
      return (d.name && d.name.toLowerCase().indexOf(query) !== -1) ||
             (d.id && d.id.toLowerCase().indexOf(query) !== -1) ||
             (d.description && d.description.toLowerCase().indexOf(query) !== -1);
    });

    if (dialectState.selectedIndex >= dialectState.filteredDialects.length) {
      dialectState.selectedIndex = Math.max(0, dialectState.filteredDialects.length - 1);
    }

    var active = Dialects.getActiveDialect();
    var fragment = document.createDocumentFragment();

    if (dialectState.filteredDialects.length === 0) {
      var emptyEl = document.createElement('div');
      emptyEl.className = 'dialect-item-empty';
      emptyEl.textContent = 'No matching dialects found.';
      fragment.appendChild(emptyEl);
    } else {
      dialectState.filteredDialects.forEach(function (dialect, index) {
        var isCurrent = active && active.id === dialect.id;
        var isSelected = index === dialectState.selectedIndex;

        var item = document.createElement('div');
        item.className = 'dialect-item' + (isSelected ? ' is-selected' : '') + (isCurrent ? ' is-active' : '');
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(isSelected));
        item.dataset.dialectId = dialect.id;
        item.dataset.index = String(index);

        var top = document.createElement('div');
        top.className = 'dialect-item-top';

        var title = document.createElement('span');
        title.className = 'dialect-item-name';
        title.textContent = dialect.name;
        top.appendChild(title);

        if (isCurrent) {
          var badge = document.createElement('span');
          badge.className = 'dialect-active-badge';
          badge.textContent = 'Active';
          top.appendChild(badge);
        }

        var desc = document.createElement('div');
        desc.className = 'dialect-item-desc';
        desc.textContent = dialect.description || '';

        item.appendChild(top);
        item.appendChild(desc);

        item.addEventListener('click', function () {
          selectDialectAndStart(dialect.id);
        });

        item.addEventListener('mouseenter', function () {
          dialectState.selectedIndex = index;
          updateDialectListSelection();
        });

        fragment.appendChild(item);
      });
    }

    els.dialectList.replaceChildren(fragment);
    scrollSelectedDialectIntoView();
  }

  function updateDialectListSelection() {
    if (!els.dialectList) return;
    var items = els.dialectList.querySelectorAll('.dialect-item');
    items.forEach(function (item, idx) {
      var isSelected = idx === dialectState.selectedIndex;
      item.classList.toggle('is-selected', isSelected);
      item.setAttribute('aria-selected', String(isSelected));
    });
    scrollSelectedDialectIntoView();
  }

  function scrollSelectedDialectIntoView() {
    if (!els.dialectList) return;
    var selected = els.dialectList.querySelector('.dialect-item.is-selected');
    if (selected && typeof selected.scrollIntoView === 'function') {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  function openDialectModal() {
    if (!els.dialectModal || !Dialects) return;
    if (isDialogOpen() && !els.dialectModal.open) return;

    dialectState.searchQuery = '';
    var active = Dialects.getActiveDialect();
    var all = Dialects.getDialects();
    var activeIdx = all.findIndex(function (d) { return active && d.id === active.id; });
    dialectState.selectedIndex = activeIdx >= 0 ? activeIdx : 0;

    if (els.dialectSearchInput) {
      els.dialectSearchInput.value = '';
    }

    renderDialectList();

    if (!els.dialectModal.open) {
      els.dialectModal.showModal();
    }
    syncFocusUI();

    window.setTimeout(function () {
      if (els.dialectSearchInput) {
        els.dialectSearchInput.focus();
      }
    }, 10);
  }

  function closeDialectModal() {
    if (els.dialectModal && els.dialectModal.open) {
      els.dialectModal.close();
      syncFocusUI();
      if (state.test) focusTyping();
    }
  }

  function selectDialectAndStart(id) {
    if (!Dialects) return;
    closeDialectModal();
    var changed = Dialects.setDialect(id);
    updateDialectPill();
    if (changed) {
      // Re-render and load test session with the new dialect
      withData(state.mode, function () {
        startNewTest({ mode: state.mode, focus: true });
        showToast('Switched to ' + (Dialects.getActiveDialect() ? Dialects.getActiveDialect().name : id));
      });
    }
  }

  function onDialectSearchKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (dialectState.filteredDialects.length > 0) {
        dialectState.selectedIndex = (dialectState.selectedIndex + 1) % dialectState.filteredDialects.length;
        updateDialectListSelection();
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (dialectState.filteredDialects.length > 0) {
        dialectState.selectedIndex = (dialectState.selectedIndex - 1 + dialectState.filteredDialects.length) % dialectState.filteredDialects.length;
        updateDialectListSelection();
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (dialectState.filteredDialects.length > 0 && dialectState.selectedIndex >= 0) {
        var chosen = dialectState.filteredDialects[dialectState.selectedIndex];
        if (chosen) {
          selectDialectAndStart(chosen.id);
        }
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialectModal();
      return;
    }
  }

  /* ------------------------------------------------------------------------
     First-Visit Onboarding Modal
     ------------------------------------------------------------------------ */

  function checkFirstVisitOnboarding() {
    if (!Dialects || !els.onboardingModal) return;
    if (Dialects.hasUserChosenDialect()) {
      return;
    }

    // Display first-visit onboarding modal
    renderOnboardingModal();
    els.onboardingModal.showModal();
    syncFocusUI();
  }

  function renderOnboardingModal() {
    if (!els.onboardingDialects || !Dialects) return;
    var all = Dialects.getDialects();
    var active = Dialects.getActiveDialect();
    var fragment = document.createDocumentFragment();

    all.forEach(function (dialect) {
      var isDefault = active ? (active.id === dialect.id) : !!dialect.default;

      var label = document.createElement('label');
      label.className = 'onboarding-dialect-option' + (isDefault ? ' is-selected' : '');

      var radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'onboardingDialect';
      radio.value = dialect.id;
      radio.checked = isDefault;

      var content = document.createElement('div');
      content.className = 'onboarding-dialect-content';

      var top = document.createElement('div');
      top.className = 'onboarding-dialect-top';

      var name = document.createElement('span');
      name.className = 'onboarding-dialect-name';
      name.textContent = dialect.name;
      top.appendChild(name);

      if (dialect.default) {
        var badge = document.createElement('span');
        badge.className = 'dialect-default-badge';
        badge.textContent = 'Recommended';
        top.appendChild(badge);
      }

      var desc = document.createElement('p');
      desc.className = 'onboarding-dialect-desc';
      desc.textContent = dialect.description || '';

      content.appendChild(top);
      content.appendChild(desc);

      label.appendChild(radio);
      label.appendChild(content);

      label.addEventListener('click', function () {
        var allOptions = els.onboardingDialects.querySelectorAll('.onboarding-dialect-option');
        allOptions.forEach(function (opt) { opt.classList.remove('is-selected'); });
        label.classList.add('is-selected');
        radio.checked = true;
      });

      fragment.appendChild(label);
    });

    els.onboardingDialects.replaceChildren(fragment);
  }

  function completeOnboarding() {
    if (!els.onboardingModal || !Dialects) return;
    var selectedRadio = els.onboardingModal.querySelector('input[name="onboardingDialect"]:checked');
    var dialectId = selectedRadio ? selectedRadio.value : (Dialects.getActiveDialect() ? Dialects.getActiveDialect().id : 'levantine');

    Dialects.setDialect(dialectId);
    updateDialectPill();
    els.onboardingModal.close();
    syncFocusUI();

    // Start session with chosen dialect
    withData(state.mode, function () {
      startNewTest({ mode: state.mode, focus: true });
    });
  }

  function updateSettingsForm() {
    els.settingGhayn.value = state.settings.gh;
    els.settingKha.value = state.settings.kh;
    els.settingQaf.value = state.settings.qaf;
    els.settingHaa.value = state.settings.haa;
    if (els.settingScript) els.settingScript.value = state.script;
  }

  function saveSettings() {
    writeStorage(STORAGE_SETTINGS, JSON.stringify(state.settings));
  }

  function onSettingsChanged() {
    state.settings = T.normalizeSettings({
      gh: els.settingGhayn.value,
      kh: els.settingKha.value,
      qaf: els.settingQaf.value,
      haa: els.settingHaa.value
    });
    updateSettingsForm();
    saveSettings();
    showToast('Mapping saved. It will apply to your next test.', 2200);
  }

  /* ------------------------------------------------------------------------
     Events and boot
     ------------------------------------------------------------------------ */

  function cacheElements() {
    els.words = $('words');
    els.queueWrap = $('queueWrap');
    els.prompt = $('prompt');
    els.promptArabic = $('promptArabic');
    els.promptLatin = $('promptLatin');
    els.promptInputWrap = document.querySelector('.prompt-input-wrap');
    els.promptHint = $('promptHint');
    els.promptCounter = $('promptCounter');
    els.promptModeTag = $('promptModeTag');
    els.hintButton = $('hintButton');
    els.clearButton = $('clearButton');
    els.reviewLine = $('reviewLine');
    els.testStage = $('testStage');
    els.results = $('results');
    els.resultsDialog = $('resultsDialog');
    els.focusBadge = $('focusBadge');
    els.instructionLine = $('instructionLine');
    els.typingInput = $('typingInput');
    els.toast = $('toast');

    els.loadingState = $('loadingState');
    els.dataErrorBanner = $('dataErrorBanner');
    els.dataErrorMessage = $('dataErrorMessage');
    els.dataRetryButton = $('dataRetryButton');
    els.dataCategorySelect = $('dataCategorySelect');

    els.statWpm = $('statWpm');
    els.statAccuracy = $('statAccuracy');
    els.statStreak = $('statStreak');
    els.statTime = $('statTime');
    els.statProgress = $('statProgress');
    els.progressFill = $('progressFill');
    els.progressTrack = $('progressTrack');

    els.resultWpm = $('resultWpm');
    els.resultAccuracy = $('resultAccuracy');
    els.resultStreak = $('resultStreak');
    els.resultTime = $('resultTime');
    els.resultWords = $('resultWords');
    els.resultsReview = $('resultsReview');
    els.resultsReviewList = $('resultsReviewList');

    els.wordFeedback = $('wordFeedback');
    els.wordFeedbackContent = $('wordFeedbackContent');
    els.wordFeedbackDialect = $('wordFeedbackDialect');
    els.wordFeedbackTranslation = $('wordFeedbackTranslation');
    els.wordFeedbackNotes = $('wordFeedbackNotes');

    els.reviewTabMistakes = $('reviewTabMistakes');
    els.reviewTabAll = $('reviewTabAll');
    els.reviewMistakesCount = $('reviewMistakesCount');
    els.reviewAllCount = $('reviewAllCount');
    els.reviewToggleNotesButton = $('reviewToggleNotesButton');
    els.reviewToggleNotesLabel = $('reviewToggleNotesLabel');

    els.modeTabs = Array.from(document.querySelectorAll('.mode-tab'));
    els.countControl = $('countControl');
    els.countButtons = Array.from(document.querySelectorAll('.count-button'));

    els.scriptControl = $('scriptControl');
    els.scriptTabs = Array.from(document.querySelectorAll('.script-tab'));
    els.brandSubtitle = document.querySelector('.brand-subtitle');
    els.promptHelp = document.querySelector('.prompt-help');
    els.settingsHintPanel = $('settingsHintPanel');

    els.legendButton = $('legendButton');
    els.settingsButton = $('settingsButton');
    els.restartButton = $('restartButton');
    els.openLegendButton = $('openLegendButton');
    els.nextTestButton = $('nextTestButton');
    els.repeatButton = $('repeatButton');

    els.customModeButton = $('customModeButton');
    els.customDialog = $('customDialog');
    els.customForm = $('customForm');
    els.customText = $('customText');
    els.customError = $('customError');
    els.closeCustomButton = $('closeCustomButton');
    els.cancelCustomButton = $('cancelCustomButton');

    els.sheetDialog = $('sheetDialog');
    els.sheetTabs = Array.from(document.querySelectorAll('.sheet-tab'));
    els.legendPanel = $('legendPanel');
    els.settingsPanel = $('settingsPanel');
    els.closeSheetButton = $('closeSheetButton');

    els.settingGhayn = $('settingGhayn');
    els.settingKha = $('settingKha');
    els.settingQaf = $('settingQaf');
    els.settingHaa = $('settingHaa');
    els.settingScript = $('settingScript');
    els.resetSettingsButton = $('resetSettingsButton');

    // Dialect Picker and Onboarding UI
    els.dialectPill = $('dialectPill');
    els.dialectPillName = $('dialectPillName');
    els.dialectModal = $('dialectModal');
    els.closeDialectModalButton = $('closeDialectModalButton');
    els.dialectSearchInput = $('dialectSearchInput');
    els.dialectList = $('dialectList');
    els.onboardingModal = $('onboardingModal');
    els.onboardingDialects = $('onboardingDialects');
    els.onboardingSubmitButton = $('onboardingSubmitButton');
  }

  function bindEvents() {
    if (state.eventsBound) return;

    els.modeTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var mode = tab.dataset.mode;
        if (mode === 'custom') {
          openCustomDialog();
          return;
        }
        startNewTest({ mode: mode, focus: true });
      });
    });

    els.countButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        state.count = Number(button.dataset.count);
        updateCountUI();
        startNewTest({ mode: state.mode, focus: true });
      });
    });

    els.scriptTabs.forEach(function (button) {
      button.addEventListener('click', function () {
        if (button.dataset.script === state.script) {
          focusTyping();
          return;
        }
        setScript(button.dataset.script, { restart: true });
      });
    });

    els.restartButton.addEventListener('click', function () {
      hideToast();
      startNewTest({ mode: state.mode, focus: true });
    });

    els.nextTestButton.addEventListener('click', function () {
      hideToast();
      startNewTest({ mode: state.mode, focus: true });
    });

    els.repeatButton.addEventListener('click', function () {
      repeatTest();
    });

    els.legendButton.addEventListener('click', function () {
      openSheet('legend');
    });

    els.hintButton.addEventListener('click', function () {
      handleHintRequest();
      focusTyping();
    });

    els.clearButton.addEventListener('click', function () {
      clearCurrentInput();
      focusTyping();
    });

    els.resultsDialog.addEventListener('keydown', onResultsKeyDown);
    els.resultsDialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      if (!state.test || state.test.status !== 'finished') return;
      hideToast();
      startNewTest({ mode: state.mode });
    });

    if (els.reviewTabMistakes) {
      els.reviewTabMistakes.addEventListener('click', function () {
        setReviewTab('mistakes');
      });
    }

    if (els.reviewTabAll) {
      els.reviewTabAll.addEventListener('click', function () {
        setReviewTab('all');
      });
    }

    if (els.reviewToggleNotesButton) {
      els.reviewToggleNotesButton.addEventListener('click', function () {
        toggleAllExplanations();
      });
    }

    els.settingsButton.addEventListener('click', function () {
      openSheet('settings');
    });

    els.openLegendButton.addEventListener('click', function () {
      openSheet('legend');
    });

    els.closeSheetButton.addEventListener('click', closeSheet);

    els.sheetTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        setSheetTab(tab.dataset.sheetTab);
      });
    });

    els.sheetDialog.addEventListener('click', function (event) {
      if (event.target === els.sheetDialog) closeSheet();
    });

    els.sheetDialog.addEventListener('close', function () {
      syncFocusUI();
      if (state.test) focusTyping();
    });

    els.closeCustomButton.addEventListener('click', closeCustomDialog);
    els.cancelCustomButton.addEventListener('click', closeCustomDialog);

    els.customDialog.addEventListener('click', function (event) {
      if (event.target === els.customDialog) closeCustomDialog();
    });

    els.customDialog.addEventListener('close', function () {
      syncFocusUI();
      if (state.test) focusTyping();
    });

    els.customForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var value = els.customText.value.trim();
      var words = T.splitWords(value);

      if (!words.length) {
        els.customError.textContent = 'Paste some Arabic text to get started.';
        els.customError.hidden = false;
        els.customText.focus();
        return;
      }

      if (words.length > MAX_CUSTOM_WORDS) {
        els.customError.textContent = 'Please keep the custom list under ' + MAX_CUSTOM_WORDS + ' words.';
        els.customError.hidden = false;
        els.customText.focus();
        return;
      }

      els.customError.hidden = true;
      state.customText = value;
      writeStorage(STORAGE_CUSTOM, value);
      closeCustomDialog();
      state.mode = 'custom';
      startNewTest({ mode: 'custom', focus: true });
    });

    [els.settingGhayn, els.settingKha, els.settingQaf, els.settingHaa].forEach(function (select) {
      select.addEventListener('change', onSettingsChanged);
    });

    if (els.settingScript) {
      els.settingScript.addEventListener('change', function () {
        var next = els.settingScript.value;
        if (next === state.script) return;
        closeSheet();
        setScript(next, { restart: true });
      });
    }

    els.resetSettingsButton.addEventListener('click', function () {
      state.settings = T.normalizeSettings(T.DEFAULT_SETTINGS);
      updateSettingsForm();
      saveSettings();
      showToast('Defaults restored. They will apply to your next test.', 2200);
    });

    els.typingInput.addEventListener('focus', syncFocusUI);
    els.typingInput.addEventListener('blur', function () {
      window.setTimeout(syncFocusUI, 0);
    });

    els.typingInput.addEventListener('input', function (event) {
      if (isDialogOpen()) return;

      var value = els.typingInput.value;
      els.typingInput.value = '';

      // While composing an Arabic vowel the input holds a partial sequence.
      // Waiting for compositionend keeps the base letter from being counted
      // before the harakat arrive.
      if (event.isComposing) return;
      if (!value) return;

      Array.from(value).forEach(function (character) {
        if (character === '\n' || character === '\r') return;
        if (character === ' ' || character === '\u00A0') {
          handleSpace();
          return;
        }

        if (isArabicScript()) {
          // Harakat and tatweel are never part of the target.
          var uthOpt = { stripUthmanicGlyphs: isUthmanicStripped() };
          if (T.isArabicMark(character, uthOpt)) return;
          if (!T.isArabicTypable(character, uthOpt)) return;
          handleCharacter(character);
          return;
        }

        if (character === '\u2019') character = "'";
        if (character === '?') {
          handleHintRequest();
        } else if (isTypable(character)) {
          handleCharacter(character);
        }
      });
    });

    els.typingInput.addEventListener('compositionend', function () {
      var value = els.typingInput.value;
      els.typingInput.value = '';
      if (!value) return;
      Array.from(value).forEach(function (character) {
        if (T.isArabicTypable(character)) handleCharacter(character);
      });
    });

    els.testStage.addEventListener('click', function (event) {
      if (isInteractiveTarget(event.target)) return;
      focusTyping();
    });

    document.addEventListener('keydown', onKeyDown);

    window.addEventListener('blur', syncFocusUI);
    window.addEventListener('focus', syncFocusUI);
    window.addEventListener('resize', function () {
      if (els.promptHint && !els.promptHint.hidden) positionHint();
    });

    // Mobile Dynamic Viewport & Virtual Keyboard Handler
    function initMobileViewport() {
      if (typeof window === 'undefined') return;

      function updateViewport() {
        var isMobile = window.matchMedia && window.matchMedia('(max-width: 860px)').matches;
        if (!isMobile) {
          document.documentElement.style.removeProperty('--vvh');
          document.documentElement.style.removeProperty('--keyboard-inset');
          document.body.classList.remove('keyboard-open');
          return;
        }

        if (window.visualViewport) {
          var vv = window.visualViewport;
          var height = vv.height;
          var fullHeight = window.innerHeight;
          var keyboardInset = Math.max(0, fullHeight - height - vv.offsetTop);

          document.documentElement.style.setProperty('--vvh', height + 'px');
          document.documentElement.style.setProperty('--keyboard-inset', keyboardInset + 'px');

          var isTyping = (document.activeElement === els.typingInput) || (state.focused && !isDialogOpen());
          if (keyboardInset > 120 || (isTyping && keyboardInset > 60)) {
            document.body.classList.add('keyboard-open');
          } else if (!isTyping) {
            document.body.classList.remove('keyboard-open');
          }
        }
      }

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateViewport);
        window.visualViewport.addEventListener('scroll', updateViewport);
      }
      window.addEventListener('resize', updateViewport);
      window.addEventListener('orientationchange', function () {
        setTimeout(updateViewport, 150);
      });

      updateViewport();
    }

    initMobileViewport();

    // Dialect Picker and Modal Events
    if (els.dialectPill) {
      els.dialectPill.addEventListener('click', function () {
        openDialectModal();
      });
    }

    if (els.closeDialectModalButton) {
      els.closeDialectModalButton.addEventListener('click', function () {
        closeDialectModal();
      });
    }

    if (els.dialectModal) {
      els.dialectModal.addEventListener('click', function (event) {
        if (event.target === els.dialectModal) {
          closeDialectModal();
        }
      });
      els.dialectModal.addEventListener('close', function () {
        syncFocusUI();
        if (state.test) focusTyping();
      });
    }

    if (els.dialectSearchInput) {
      els.dialectSearchInput.addEventListener('input', function () {
        dialectState.searchQuery = els.dialectSearchInput.value;
        dialectState.selectedIndex = 0;
        renderDialectList();
      });
      els.dialectSearchInput.addEventListener('keydown', onDialectSearchKeyDown);
    }

    if (els.onboardingSubmitButton) {
      els.onboardingSubmitButton.addEventListener('click', function () {
        completeOnboarding();
      });
    }

    if (els.onboardingModal) {
      els.onboardingModal.addEventListener('cancel', function (event) {
        // Prevent dismissal via Esc on onboarding unless a dialect is chosen
        event.preventDefault();
        completeOnboarding();
      });
    }
  }

  function loadPreferences() {
    var storedSettings = readStorage(STORAGE_SETTINGS, '');
    if (storedSettings) {
      try {
        state.settings = T.normalizeSettings(JSON.parse(storedSettings));
      } catch (error) {
        state.settings = T.normalizeSettings(T.DEFAULT_SETTINGS);
      }
    }

    state.customText = readStorage(STORAGE_CUSTOM, '');

    var storedScript = readStorage(STORAGE_SCRIPT, '');
    state.script = storedScript === 'arabic' ? 'arabic' : 'latin';
  }

  function init() {
    cacheElements();
    loadPreferences();
    updateSettingsForm();
    applyScriptCopy();

    // Recovery controls are available before the app is booted; every typing
    // listener is registered by bindEvents only after the first dataset loads.
    bindDataRecoveryEvents();

    state.mode = 'words';

    if (Dialects && typeof Dialects.init === 'function') {
      Dialects.init().then(function (active) {
        updateDialectPill();
        // Subscribe to dialect changes
        Dialects.onDialectChange(function (dialect) {
          updateDialectPill();
        });
        bootWithMode('words');
        checkFirstVisitOnboarding();
      }).catch(function (err) {
        console.warn('Dialect initialization fallback:', err);
        bootWithMode('words');
      });
    } else {
      bootWithMode('words');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
