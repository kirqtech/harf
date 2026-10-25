/*!
 * Harf — practice content
 * Arabic is stored with harakat so the transliteration engine can make
 * phonetic hints even when the UI shows an unvocalized reading mode.
 */
(function (global) {
  'use strict';

  var WORDS = [
    'كِتَاب', 'قَلَم', 'بَاب', 'بَيْت', 'مَدْرَسَة', 'جَامِعَة',
    'طَالِب', 'طَالِبَة', 'مُعَلِّم', 'مُعَلِّمَة', 'صَدِيق', 'عَائِلَة',
    'خُبْز', 'حَلِيب', 'قَهْوَة', 'شَاي', 'سَمَك', 'لَحْم',
    'فَاكِهَة', 'تُفَّاح', 'مَوْز', 'عَصِير', 'مَطْعَم', 'مَكْتَب',
    'مَسْجِد', 'شَارِع', 'مَدِينَة', 'قَرْيَة', 'بِلَاد', 'عَالَم',
    'شَمْس', 'قَمَر', 'نَجْم', 'بَحْر', 'جَبَل', 'نَهْر',
    'زَهْرَة', 'شَجَرَة', 'سَيَّارَة', 'طَائِرَة', 'قِطَار', 'حَافِلَة',
    'دَرَّاجَة', 'يَوْم', 'لَيْل', 'صَبَاح', 'أُسْبُوع', 'شَهْر',
    'سَنَة', 'وَقْت', 'سَاعَة', 'دَقِيقَة', 'طَعَام', 'سُوق',
    'مَال', 'عَمَل', 'لُغَة', 'كَلِمَة', 'جُمْلَة', 'سُؤَال',
    'جَوَاب', 'رَقْم', 'اِسْم', 'صُورَة', 'هَاتِف', 'حَاسُوب',
    'كِتَابَة', 'قِرَاءَة', 'مُوسِيقَى', 'رِيَاضَة', 'كُرَة', 'لَاعِب',
    'فَرِيق', 'مَلْعَب', 'صَحِيح', 'خَطَأ', 'جَدِيد', 'قَدِيم',
    'كَبِير', 'صَغِير', 'جَمِيل', 'سَهْل', 'صَعْب', 'سَرِيع',
    'بَطِيء', 'أَحْيَانًا', 'هُنَا', 'هُنَاكَ', 'هُوَ', 'هِيَ',
    'أَنْتَ', 'أَنْتِ', 'أَنَا', 'نَحْنُ', 'هُمْ', 'هُنَّ',
    'يَذْهَب', 'تَذْهَب', 'أَذْهَب', 'يَكْتُب', 'يَقْرَأ', 'يَأْكُل',
    'يَشْرَب', 'يَنَام', 'يَعْمَل', 'يَلْعَب', 'يُحِبّ', 'يَتَكَلَّم',
    'يَفْهَم', 'يَتَعَلَّم', 'أُحِبّ', 'أُرِيد', 'أَعْرِف', 'نَذْهَب',
    'كَتَبَ', 'قَرَأَ', 'أَكَلَ', 'شَرِبَ', 'ذَهَبَ', 'رَجَعَ',
    'وَصَلَ', 'فَتَحَ', 'سَأَلَ', 'دَرَسَ', 'عَرَفَ', 'سَمِعَ',
    'بَدَأَ', 'طَبَخَ', 'سَافَرَ', 'عَادَ', 'بَاعَ', 'قَالَ',
    'نَامَ', 'قَامَ', 'كَثِير', 'قَلِيل', 'سَعِيد', 'حَزِين',
    'غَاضِب', 'مُمْتِع', 'مُهِمّ', 'بَسِيط', 'قَوِيّ', 'ضَعِيف',
    'غَنِيّ', 'ذَكِيّ', 'مُسْتَشْفَى', 'مَطَار', 'فُنْدُق', 'مِفْتَاح',
    'نَافِذَة', 'كُرْسِيّ', 'طَاوِلَة', 'سَرِير', 'حَقِيبَة', 'مِظَلَّة',
    'غُرْفَة', 'مَطْبَخ', 'حَمَّام', 'شُرْفَة', 'سُلَّم', 'مِصْبَاح'
  ];

  var PHRASES = [
    'كَيْفَ حَالُكَ؟',
    'أَنَا بِخَيْر.',
    'شُكْرًا جَزِيلًا.',
    'مِنْ فَضْلِكَ.',
    'لَا أَعْرِف.',
    'مَاذَا تَفْعَل؟',
    'عَفْوًا.',
    'لَا بَأْسَ.',
    'مَعَ السَّلَامَة.',
    'أَيْنَ الْحَمَّام؟',
    'كَمْ السَّاعَة؟',
    'هَلْ أَنْتَ جَاهِز؟',
    'مَا هَذَا؟',
    'أُحِبُّ الْقِرَاءَة.',
    'يَوْمٌ سَعِيد.',
    'عِيدٌ مُبَارَك.',
    'رَمَضَان كَرِيم.',
    'أَنَا أَتَعَلَّمُ الْعَرَبِيَّة.',
    'مَا مَعْنَى هَذَا؟',
    'أَيْنَ الْمَطْعَم؟',
    'كَمْ عُمْرُكَ؟',
    'مِنْ أَيْنَ أَنْتَ؟',
    'أَنَا مِنْ أَمْرِيكَا.',
    'مَرْحَبًا بِكَ.',
    'أَهْلًا وَسَهْلًا.',
    'لَيْلَة سَعِيدَة.',
    'مَاذَا تَعْمَل؟',
    'هَذَا يَوْم جَمِيل.',
    'أَتَكَلَّمُ الْعَرَبِيَّة قَلِيلًا.',
    'صَبَاح الْخَيْر.',
    'طَابَ يَوْمُكَ.',
    'مَا اِسْمُكَ؟',
    'هَلْ تَتَكَلَّمُ الْعَرَبِيَّة؟',
    'أَيْنَ الْمَطَار؟',
    'الْمَطْعَم قَرِيب مِنْ هُنَا.',
    'تُصْبِح عَلَى خَيْر.',
    'شُكْرًا لَك.',
    'مَنْ أَنْتَ؟',
    'أَنَا طَالِب.',
    'مَعَذِرَةً، لَمْ أَفْهَم.',
    'هَلْ تَتَحَدَّثُ الْإِنْجِلِيزِيَّة؟',
    'أَيْنَ الْمِرْحَاض؟',
    'الْقَلْبُ مُطْمَئِنّ.',
    'أَنَا أُحِبُّ هَذَا الْكِتَاب.'
  ];

  var CONSONANTS = [
    'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز',
    'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق',
    'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ء'
  ];

  var SHORT_MARKS = ['\u064E', '\u0650', '\u064F'];
  var LONG_FORMS = [
    { mark: '\u064E', letter: 'ا' },
    { mark: '\u064F', letter: 'و' },
    { mark: '\u0650', letter: 'ي' }
  ];

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

  function pick(list, count) {
    return shuffle(list).slice(0, count);
  }

  function buildLetterPool() {
    var pool = [];

    CONSONANTS.forEach(function (letter) {
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
    if (!WORDS.length) return [];
    var copy = [];
    var batch = shuffle(WORDS);

    while (copy.length < count) {
      copy = copy.concat(batch);
      batch = shuffle(WORDS);
    }

    return copy.slice(0, count);
  }

  function pickPhrase(exclude) {
    if (!PHRASES.length) return '';
    var available = PHRASES.filter(function (phrase) {
      return phrase !== exclude;
    });
    var source = available.length ? available : PHRASES;
    return source[Math.floor(Math.random() * source.length)];
  }

  global.HarfData = {
    WORDS: WORDS.slice(),
    PHRASES: PHRASES.slice(),
    CONSONANTS: CONSONANTS.slice(),
    letterDrills: letterDrills,
    pickWords: pickWords,
    pickPhrase: pickPhrase,
    shuffle: shuffle
  };
})(window);
