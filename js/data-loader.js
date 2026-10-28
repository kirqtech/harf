/*!
 * Harf - vocabulary data loader
 * Fetches JSON datasets, normalizes their shape, and caches them in memory so
 * switching practice categories never repeats a network request.
 */
(function (global) {
  'use strict';

  var DATA_DIR = 'data/';

  // A practice category can be backed by more than one file. Words and reading
  // share the same vocabulary pool, but keep independent cached category names
  // so future reading-only data can be added without touching app code.
  var CATEGORY_FILES = {
    letters: ['letters.json'],
    words: ['words_default.json', 'words_levantine.json'],
    phrases: ['phrases.json']
  };

  var CATEGORY_LABELS = {
    letters: 'Letters',
    words: 'Words',
    phrases: 'Phrases'
  };

  var categoryData = Object.create(null);
  var categoryPromises = Object.create(null);
  var filePromises = Object.create(null);

  function stripArabicDiacritics(text) {
    if (!text) return '';
    return String(text).replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF\u0640]/g, '');
  }

  function makeError(message, code) {
    var error = new Error(message);
    error.name = 'DataLoadError';
    error.code = code || 'DATA_LOAD_FAILED';
    return error;
  }

  function normalizeCategory(category) {
    if (category === 'reading') return 'words';
    if (Object.prototype.hasOwnProperty.call(CATEGORY_FILES, category)) return category;
    return null;
  }

  /** Map a UI practice mode to the dataset that powers it. */
  function categoryForMode(mode) {
    if (mode === 'letters') return 'letters';
    if (mode === 'words' || mode === 'reading') return 'words';
    if (mode === 'phrases') return 'phrases';
    return null;
  }

  function categoryLabel(category) {
    return CATEGORY_LABELS[category] || 'Vocabulary';
  }

  /**
   * Accept both the current object format and legacy flat strings. The app and
   * the typing engine can then rely on one predictable shape.
   */
  function normalizeItem(item, category) {
    if (typeof item === 'string') {
      item = { arabic: item };
    }
    if (!item || typeof item !== 'object') return null;

    var arabic = String(item.arabic || item.arabic_plain || item.word || '').trim();
    if (!arabic) return null;

    var arabicPlain = String(item.arabic_plain || stripArabicDiacritics(arabic)).trim();
    var translit = (Array.isArray(item.translit) && item.translit.length)
      ? item.translit
      : (item.solutions || item.translit || []);
    if (!Array.isArray(translit)) translit = translit ? [translit] : [];

    translit = translit.map(function (value) {
      return String(value == null ? '' : value).trim();
    }).filter(function (value, index, list) {
      return value.length > 0 && list.indexOf(value) === index;
    });

    return {
      arabic: arabic,
      arabic_plain: arabicPlain,
      translit: translit,
      translation_en: item.translation_en || item.translation || '',
      dialect: item.dialect || '',
      category: item.category || categoryLabel(category),
      notes: item.notes || ''
    };
  }

  function validatePayload(payload, file) {
    if (!Array.isArray(payload)) {
      throw makeError('The file ' + file + ' does not contain a list of vocabulary items.', 'DATA_INVALID_SHAPE');
    }
    return payload;
  }

  function loadFile(file) {
    if (filePromises[file]) return filePromises[file];

    if (global.location && global.location.protocol === 'file:') {
      return Promise.reject(makeError(
        'Vocabulary files cannot be fetched when this page is opened directly from disk.',
        'DATA_FILE_PROTOCOL'
      ));
    }

    if (typeof global.fetch !== 'function') {
      return Promise.reject(makeError(
        'This browser does not support loading vocabulary with fetch().',
        'DATA_FETCH_UNSUPPORTED'
      ));
    }

    var url = DATA_DIR + file;
    var request = global.fetch(url).then(function (response) {
      if (!response.ok) {
        throw makeError(
          'Could not load ' + url + ' (HTTP ' + response.status + ').',
          'DATA_HTTP_ERROR'
        );
      }
      return response.json().catch(function () {
        throw makeError('The file ' + url + ' is not valid JSON.', 'DATA_INVALID_JSON');
      });
    }).then(function (payload) {
      return validatePayload(payload, url);
    }).catch(function (error) {
      // Failed requests must not poison the cache; a retry needs a fresh fetch.
      delete filePromises[file];
      if (error && error.name === 'DataLoadError') throw error;
      throw makeError('Could not load ' + url + '. Check your connection and try again.', 'DATA_NETWORK_ERROR');
    });

    filePromises[file] = request;
    return request;
  }

  /**
   * Load every file for a category and merge the normalized items. Concurrent
   * calls share one in-flight promise, and successful results stay cached until
   * the page is reloaded or the category is explicitly invalidated.
   */
  function load(category) {
    var key = normalizeCategory(category);
    if (!key) return Promise.resolve([]);

    if (categoryData[key]) return Promise.resolve(categoryData[key]);
    if (categoryPromises[key]) return categoryPromises[key];

    var files = CATEGORY_FILES[key];
    var request = Promise.all(files.map(loadFile)).then(function (payloads) {
      var items = [];

      payloads.forEach(function (payload) {
        payload.forEach(function (item) {
          var normalized = normalizeItem(item, key);
          if (normalized) items.push(normalized);
        });
      });

      categoryData[key] = items;
      delete categoryPromises[key];
      return items;
    }).catch(function (error) {
      delete categoryPromises[key];
      throw error;
    });

    categoryPromises[key] = request;
    return request;
  }

  function getCached(category) {
    var key = normalizeCategory(category);
    return key && categoryData[key] ? categoryData[key] : null;
  }

  /** Drop every cached asset for a category so retry performs real requests. */
  function invalidate(category) {
    var key = normalizeCategory(category);
    if (!key) return;

    delete categoryData[key];
    delete categoryPromises[key];
    (CATEGORY_FILES[key] || []).forEach(function (file) {
      delete filePromises[file];
    });
  }

  function describeError(error, category) {
    var label = categoryLabel(normalizeCategory(category));
    var base = 'Harf could not load the ' + label.toLowerCase() + ' vocabulary.';

    if (global.location && global.location.protocol === 'file:') {
      return base + ' This page was opened from a file, where browsers block data loading. Start a local server (for example npx serve or python3 -m http.server) and open the site through it.';
    }

    if (error && error.message) {
      return base + ' ' + error.message;
    }

    return base + ' Check your connection and try again.';
  }

  global.HarfDataLoader = {
    categoryForMode: categoryForMode,
    categoryLabel: categoryLabel,
    load: load,
    getCached: getCached,
    invalidate: invalidate,
    describeError: describeError,
    normalizeItem: normalizeItem,
    filesFor: function (category) {
      var key = normalizeCategory(category);
      return key ? CATEGORY_FILES[key].slice() : [];
    }
  };
})(window);
