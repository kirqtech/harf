/*!
 * Harf — application UI and typing loop
 * No build step, no backend, no dependencies.
 */
(function () {
  'use strict';

  var T = window.HarfTranslit;
  var D = window.HarfData;

  var STORAGE_SETTINGS = 'harf.settings.v1';
  var STORAGE_CUSTOM = 'harf.custom.v1';
  var MAX_CUSTOM_WORDS = 400;
  var TAB_CHORD_MS = 1200;

  var MODE_COPY = {
    letters: 'Decode the drill, then type its Latin sound. Press ? for one rescue hint.',
    words: 'Decode the Arabic word, then type its Latin transliteration. Space submits.',
    reading: 'Read the unvocalized word and type its phonetic spelling. ? reveals a key.',
    phrases: 'One phrase at a time. Decode each word, then press space. Punctuation is not typed.',
    custom: 'Your custom text. Type each transliteration; punctuation is not typed.'
  };

  var state = {
    mode: 'words',
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
    errorToken: -1,
    errorCount: 0,
    toastTimer: null,
    tabPressedAt: 0,
    lastPhrase: '',
    focused: false,
    sheetTab: 'legend'
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

  function isTypable(character) {
    return /^[A-Za-z0-9']$/.test(character);
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

  /* ------------------------------------------------------------------------
     Test construction
     ------------------------------------------------------------------------ */

  function makeWord(entry, mode) {
    var built = T.buildWord(entry, state.settings);
    if (!built.tokens.length) return null;

    return {
      entry: entry,
      raw: built.arabic,
      display: displayForMode(built.arabic, mode),
      tokens: built.tokens,
      solutions: built.solutions,
      canonical: built.canonical,
      input: '',
      committed: false,
      correct: null
    };
  }

  function makeTest(mode, rawWords, sourceText) {
    var words = rawWords.map(function (raw) {
      return makeWord(raw, mode);
    }).filter(Boolean);

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
      var drills = D.letterDrills(20);
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
      state.lastPhrase = phrase;
      return makeTest('phrases', T.splitWords(phrase), phrase);
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

    var parse = T.parseInput(word.tokens, word.input, word.solutions);
    var fragment = document.createDocumentFragment();
    var target = parse.target || word.canonical || '';
    var typedPart = parse.validPrefix ? word.input : target.slice(0, parse.matched);
    var errorPart = parse.validPrefix ? '' : parse.leftover;

    setText(els.promptArabic, word.display);
    setText(els.promptCounter, (test.index + 1) + ' / ' + test.words.length);
    setText(els.promptModeTag, MODE_TAGS[test.mode] || MODE_TAGS.words);

    appendLatinPart(fragment, typedPart, 'latin-typed');
    appendLatinPart(fragment, errorPart, 'latin-error');
    appendCaret(fragment);
    appendPlaceholders(fragment, Math.max(0, target.length - typedPart.length - errorPart.length));

    els.promptLatin.replaceChildren(fragment);
    updateInstruction(parse);
  }

  function updateInstruction(parse) {
    var test = state.test;
    if (!test) return;

    if (test.finishing) {
      setText(els.instructionLine, 'Finishing…');
      return;
    }

    if (test.status === 'finished') {
      setText(els.instructionLine, 'Nice work. Press Enter to go again.');
      return;
    }

    var base = MODE_COPY[test.mode] || MODE_COPY.words;
    if (parse && parse.leftover) {
      setText(els.instructionLine, 'Not quite — backspace to erase the red character, or space to submit and review.');
      return;
    }

    if (parse && parse.complete && test.index < test.words.length - 1) {
      setText(els.instructionLine, 'Word complete — press space for the next one.');
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

    setStat(els.statWpm, isReady ? '—' : String(wpm == null ? 0 : wpm));
    setStat(els.statAccuracy, accuracy == null ? '—' : accuracy + '%');
    setStat(els.statStreak, isReady ? '—' : String(test.streak));
    setStat(els.statTime, isReady ? '—' : formatLiveTime(elapsed));

    setText(els.statProgress, completed + ' / ' + total);
    els.progressFill.style.width = progress + '%';
    els.progressTrack.setAttribute('aria-valuenow', String(progress));
  }

  function setStat(element, value) {
    if (!element) return;
    element.textContent = value;
    element.classList.toggle('has-value', value !== '—');
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
    els.results.hidden = true;
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

    var test = newTestForMode(mode);
    if (!test) {
      showToast('That text did not contain any Arabic letters.');
      return;
    }

    state.mode = mode;
    if (mode !== 'custom') hideToast();
    startTest(test, { focus: opts.focus !== false });
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
    syncFocusUI();
    focusTyping();
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

    window.requestAnimationFrame(function () {
      els.results.scrollIntoView({
        block: 'nearest',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });
    });
  }

  function renderResultsReview(test) {
    if (!els.resultsReview || !els.resultsReviewList) return;

    var missed = test.words.filter(function (word) {
      return word.committed && word.correct === false;
    });

    if (!missed.length) {
      els.resultsReview.hidden = true;
      els.resultsReviewList.replaceChildren();
      return;
    }

    var fragment = document.createDocumentFragment();
    missed.forEach(function (word) {
      var item = document.createElement('li');

      var arabic = document.createElement('span');
      arabic.className = 'review-arabic';
      arabic.lang = 'ar';
      arabic.dir = 'rtl';
      arabic.textContent = word.display;

      var translit = document.createElement('code');
      translit.dir = 'ltr';
      translit.textContent = word.canonical;

      item.appendChild(arabic);
      item.appendChild(translit);
      fragment.appendChild(item);
    });

    els.resultsReviewList.replaceChildren(fragment);
    els.resultsReview.hidden = false;
  }

  /* ------------------------------------------------------------------------
     Typing
     ------------------------------------------------------------------------ */

  function hintTextFor(word) {
    if (!word) return '';
    var parse = T.parseInput(word.tokens, word.input, word.solutions);
    if (parse.complete) return '';
    return T.preferredSolution(word.solutions) || word.canonical;
  }

  function showHint(auto) {
    if (!els.promptHint) return;
    var hint = hintTextFor(currentWord());
    if (!hint) return;

    window.clearTimeout(state.hintTimer);
    window.clearTimeout(state.hintHideTimer);
    els.promptHint.hidden = false;
    els.promptHint.textContent = 'hint · ' + hint;
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
    if (!wrapRect.width || !caretRect.width) return;

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
    note.textContent = 'standard spelling';

    var code = document.createElement('code');
    code.dir = 'ltr';
    code.textContent = word.canonical;

    els.reviewLine.replaceChildren(arabic, note, code);
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
    var parse = T.parseInput(word.tokens, word.input, word.solutions);

    test.totalKeystrokes += 1;
    var autoHint = false;
    if (parse.validPrefix) {
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
      state.finishTimer = window.setTimeout(function () {
        finishTest({ autoLastWord: true });
      }, 340);
    } else if (parse.complete) {
      ensureActiveVisible();
    }
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

    word.input = word.input.slice(0, -1);
    state.errorToken = -1;
    state.errorCount = 0;
    hideHint();
    renderActiveWord();
    updateStats();
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

    var parse = T.parseInput(word.tokens, word.input, word.solutions);
    var correct = T.isAccepted(word.solutions, word.input) || parse.complete;

    word.committed = true;
    word.correct = correct;

    test.completed += 1;
    test.totalKeystrokes += 1;
    state.errorToken = -1;
    state.errorCount = 0;
    hideHint();

    if (correct) {
      test.correctWords += 1;
      test.correctKeystrokes += 1;
      test.streak += 1;
      test.maxStreak = Math.max(test.maxStreak, test.streak);
      hideReview();
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

  /* ------------------------------------------------------------------------
     Focus and keyboard capture
     ------------------------------------------------------------------------ */

  function focusTyping() {
    if (isDialogOpen()) return;
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
    var inputFocused = document.activeElement === els.typingInput;
    var dialogOpen = isDialogOpen();
    var finished = state.test && state.test.status === 'finished';

    state.focused = inputFocused;
    els.testStage.classList.toggle('is-paused', !inputFocused && !dialogOpen);
    if (els.focusBadge) {
      els.focusBadge.hidden = inputFocused || dialogOpen || finished || !state.test;
    }
  }

  function isInteractiveTarget(target) {
    if (!(target instanceof Element)) return false;
    return !!target.closest('button, a, select, textarea, input:not(#typingInput)');
  }

  function onKeyDown(event) {
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

  function updateSettingsForm() {
    els.settingGhayn.value = state.settings.gh;
    els.settingKha.value = state.settings.kh;
    els.settingQaf.value = state.settings.qaf;
    els.settingHaa.value = state.settings.haa;
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
    els.reviewLine = $('reviewLine');
    els.testStage = $('testStage');
    els.results = $('results');
    els.focusBadge = $('focusBadge');
    els.instructionLine = $('instructionLine');
    els.typingInput = $('typingInput');
    els.toast = $('toast');

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

    els.modeTabs = Array.from(document.querySelectorAll('.mode-tab'));
    els.countControl = $('countControl');
    els.countButtons = Array.from(document.querySelectorAll('.count-button'));

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
    els.resetSettingsButton = $('resetSettingsButton');
  }

  function bindEvents() {
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
      if (isDialogOpen() || event.isComposing) return;

      var value = els.typingInput.value;
      els.typingInput.value = '';
      if (!value) return;

      Array.from(value).forEach(function (character) {
        if (character === '\n' || character === '\r') return;
        if (character === '\u2019') character = "'";
        if (character === ' ') {
          handleSpace();
        } else if (character === '?') {
          handleHintRequest();
        } else if (isTypable(character)) {
          handleCharacter(character);
        }
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
  }

  function init() {
    cacheElements();
    loadPreferences();
    updateSettingsForm();
    bindEvents();

    state.mode = 'words';
    startNewTest({ mode: 'words', focus: false });

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
