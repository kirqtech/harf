/*!
 * Nateq - Dialect Manager
 * Centralizes registry fetching, active dialect state, dataset lazy-loading,
 * in-memory Map caching, and notifications when dialect changes.
 */
(function (global) {
  'use strict';

  var REGISTRY_URL = 'data/dialects.json';
  var STORAGE_DIALECT_KEY = 'nateq_selected_dialect';
  var LEGACY_DIALECT_KEY = 'harf_selected_dialect';

  // In-memory cache for raw file payloads: Map<filePath, Array<Object>>
  var fileCache = new Map();
  // In-memory cache for normalized items: Map<dialectId:category, Array<Object>>
  var datasetCache = new Map();
  // In-flight promises to prevent duplicate requests: Map<cacheKey, Promise>
  var pendingRequests = new Map();

  var dialects = [];
  var dialectsPromise = null;
  var currentDialectId = null;
  var listeners = [];

  function makeError(message, code) {
    var error = new Error(message);
    error.name = 'DialectError';
    error.code = code || 'DIALECT_ERROR';
    return error;
  }

  function fetchRegistry() {
    if (dialects.length > 0) {
      return Promise.resolve(dialects);
    }
    if (dialectsPromise) {
      return dialectsPromise;
    }

    if (global.location && global.location.protocol === 'file:') {
      return Promise.reject(makeError(
        'Dialect registry cannot be fetched when this page is opened directly from disk.',
        'DIALECT_FILE_PROTOCOL'
      ));
    }

    if (typeof global.fetch !== 'function') {
      return Promise.reject(makeError(
        'This browser does not support fetch().',
        'DIALECT_FETCH_UNSUPPORTED'
      ));
    }

    dialectsPromise = global.fetch(REGISTRY_URL).then(function (response) {
      if (!response.ok) {
        throw makeError('Could not load ' + REGISTRY_URL + ' (HTTP ' + response.status + ').', 'DIALECT_HTTP_ERROR');
      }
      return response.json().catch(function () {
        throw makeError('The dialect registry is not valid JSON.', 'DIALECT_INVALID_JSON');
      });
    }).then(function (list) {
      if (!Array.isArray(list)) {
        throw makeError('Registry must be an array of dialects.', 'DIALECT_INVALID_SHAPE');
      }
      dialects = list;
      return dialects;
    }).catch(function (error) {
      dialectsPromise = null;
      throw error;
    });

    return dialectsPromise;
  }

  function getSavedDialectId() {
    try {
      if (global.localStorage) {
        var saved = global.localStorage.getItem(STORAGE_DIALECT_KEY);
        if (saved) return saved;
        var legacy = global.localStorage.getItem(LEGACY_DIALECT_KEY);
        if (legacy) {
          global.localStorage.setItem(STORAGE_DIALECT_KEY, legacy);
          return legacy;
        }
      }
    } catch (e) {
      // LocalStorage access may fail in restricted sandboxes
    }
    return null;
  }

  function saveDialectId(id) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(STORAGE_DIALECT_KEY, id);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  function hasUserChosenDialect() {
    return !!getSavedDialectId();
  }

  function getDialectById(id) {
    for (var i = 0; i < dialects.length; i++) {
      if (dialects[i].id === id) return dialects[i];
    }
    return null;
  }

  function getDefaultDialect() {
    for (var i = 0; i < dialects.length; i++) {
      if (dialects[i].default) return dialects[i];
    }
    return dialects[0] || null;
  }

  function getActiveDialect() {
    if (currentDialectId) {
      var found = getDialectById(currentDialectId);
      if (found) return found;
    }
    var savedId = getSavedDialectId();
    if (savedId) {
      var saved = getDialectById(savedId);
      if (saved) {
        currentDialectId = saved.id;
        return saved;
      }
    }
    var def = getDefaultDialect();
    if (def) {
      currentDialectId = def.id;
      return def;
    }
    return null;
  }

  function loadFile(url) {
    if (fileCache.has(url)) {
      return Promise.resolve(fileCache.get(url));
    }

    return global.fetch(url).then(function (response) {
      if (!response.ok) {
        throw makeError('Could not load ' + url + ' (HTTP ' + response.status + ').', 'DIALECT_FILE_HTTP_ERROR');
      }
      return response.json().catch(function () {
        throw makeError('The file ' + url + ' is not valid JSON.', 'DIALECT_FILE_INVALID_JSON');
      });
    }).then(function (json) {
      if (!Array.isArray(json)) {
        throw makeError('File ' + url + ' does not contain a list of vocabulary items.', 'DIALECT_FILE_INVALID_SHAPE');
      }
      fileCache.set(url, json);
      return json;
    });
  }

  /**
   * Load datasets for a given dialect and category ('words', 'phrases', 'letters').
   * Cached in in-memory Map() for instant subsequent retrieval.
   */
  function loadCategoryData(dialectId, category) {
    var dialect = getDialectById(dialectId) || getActiveDialect();
    if (!dialect) {
      return Promise.reject(makeError('Dialect not found: ' + dialectId, 'DIALECT_NOT_FOUND'));
    }

    var cacheKey = dialect.id + ':' + category;
    if (datasetCache.has(cacheKey)) {
      return Promise.resolve(datasetCache.get(cacheKey));
    }

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    var normalizer = global.NateqDataLoader ? global.NateqDataLoader.normalizeItem : null;

    var req;
    if (category === 'letters') {
      req = loadFile('data/letters.json').then(function (raw) {
        var items = [];
        raw.forEach(function (item) {
          var norm = normalizer ? normalizer(item, 'letters') : item;
          if (norm) items.push(norm);
        });
        datasetCache.set(cacheKey, items);
        pendingRequests.delete(cacheKey);
        return items;
      }).catch(function (err) {
        pendingRequests.delete(cacheKey);
        throw err;
      });
    } else {
      var basePath = dialect.path.replace(/\/?$/, '/');
      var targetFile = category === 'phrases' ? 'phrases.json' : 'words.json';

      // Check if dialect explicitly provides this file
      var isFileProvided = !Array.isArray(dialect.files) || dialect.files.indexOf(targetFile) !== -1;

      var fileUrl = isFileProvided ? (basePath + targetFile) : 'data/phrases.json';

      req = loadFile(fileUrl).then(function (raw) {
        var items = [];
        raw.forEach(function (item) {
          var norm = normalizer ? normalizer(item, category) : item;
          if (norm) items.push(norm);
        });
        datasetCache.set(cacheKey, items);
        pendingRequests.delete(cacheKey);
        return items;
      }).catch(function (err) {
        pendingRequests.delete(cacheKey);
        throw err;
      });
    }

    pendingRequests.set(cacheKey, req);
    return req;
  }

  function getCachedCategoryData(dialectId, category) {
    var dialect = getDialectById(dialectId) || getActiveDialect();
    if (!dialect) return null;
    var cacheKey = dialect.id + ':' + category;
    return datasetCache.has(cacheKey) ? datasetCache.get(cacheKey) : null;
  }

  function invalidateCache(dialectId, category) {
    if (dialectId && category) {
      datasetCache.delete(dialectId + ':' + category);
      pendingRequests.delete(dialectId + ':' + category);
    } else if (dialectId) {
      datasetCache.forEach(function (_, key) {
        if (key.indexOf(dialectId + ':') === 0) {
          datasetCache.delete(key);
          pendingRequests.delete(key);
        }
      });
    } else {
      datasetCache.clear();
      fileCache.clear();
      pendingRequests.clear();
    }
  }

  function onDialectChange(callback) {
    if (typeof callback === 'function' && listeners.indexOf(callback) === -1) {
      listeners.push(callback);
    }
  }

  function offDialectChange(callback) {
    var index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  function notifyChange(newDialect) {
    listeners.forEach(function (fn) {
      try {
        fn(newDialect);
      } catch (e) {
        console.error('Dialect change listener error:', e);
      }
    });
  }

  function setDialect(id, options) {
    var dialect = getDialectById(id);
    if (!dialect) return false;

    var changed = (currentDialectId !== dialect.id);
    currentDialectId = dialect.id;

    if (!options || options.persist !== false) {
      saveDialectId(dialect.id);
    }

    if (changed || (options && options.forceNotify)) {
      notifyChange(dialect);
    }

    return true;
  }

  function init() {
    return fetchRegistry().then(function () {
      var active = getActiveDialect();
      return active;
    });
  }

  global.NateqDialectManager = {
    init: init,
    fetchRegistry: fetchRegistry,
    getDialects: function () {
      return dialects.slice();
    },
    getDialectById: getDialectById,
    getActiveDialect: getActiveDialect,
    setDialect: setDialect,
    hasUserChosenDialect: hasUserChosenDialect,
    loadCategoryData: loadCategoryData,
    getCachedCategoryData: getCachedCategoryData,
    invalidateCache: invalidateCache,
    onDialectChange: onDialectChange,
    offDialectChange: offDialectChange,
    getCache: function () {
      return datasetCache;
    }
  };
})(window);
