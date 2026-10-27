/*!
 * Harf - practice content
 * Each word pairs vocalized Arabic with one or more accepted Arabizi
 * spellings. The transliteration engine expands additional dialect variants
 * (long vowels, taa marbuta, hamza, and emphatic aliases) at runtime.
 */
(function (global) {
  'use strict';

  var WORDS = [
    {
      arabic: 'كِتَاب',
      translit: ["kitaab", "kitab", "ketaab", "ketab"],
      solutions: ["kitaab", "kitab", "ketaab", "ketab"],
      translation_en: 'book',
      dialect: 'Both',
      notes: 'Standard Arabic word for book, used universally in MSA and dialects.'
    },
    {
      arabic: 'قَلَم',
      translit: ["qalam", "9alam"],
      solutions: ["qalam", "9alam"],
      translation_en: 'pen / pencil',
      dialect: 'Both',
      notes: 'Writing instrument; from ancient Greek kalamos.'
    },
    {
      arabic: 'بَاب',
      translit: ["baab", "bab"],
      solutions: ["baab", "bab"],
      translation_en: 'door',
      dialect: 'Both',
      notes: 'Everyday word for door, entrance, or gate.'
    },
    {
      arabic: 'بَيْت',
      translit: ["bayt", "beit", "bait", "beet", "baeet", "baiit"],
      solutions: ["bayt", "beit", "bait", "beet", "baeet", "baiit"],
      translation_en: 'house / home',
      dialect: 'Both',
      notes: 'Pronounced bayt in MSA, often beit/beet in Levantine speech.'
    },
    {
      arabic: 'مَدْرَسَة',
      translit: ["madrasa", "madraseh", "madrase", "madrash"],
      solutions: ["madrasa", "madraseh", "madrase", "madrash"],
      translation_en: 'school',
      dialect: 'Both',
      notes: 'School or academy; pronounced madrase/madraseh in spoken Levantine.'
    },
    {
      arabic: 'جَامِعَة',
      translit: ["jaami3a", "jaami3eh", "jaami3e", "jaami3h", "jaame3a", "jaame3eh", "jaame3e", "jaame3h"],
      solutions: ["jaami3a", "jaami3eh", "jaami3e", "jaami3h", "jaame3a", "jaame3eh", "jaame3e", "jaame3h"],
      translation_en: 'university',
      dialect: 'Both',
      notes: 'University or college; pronounced jaam3a in spoken Levantine.'
    },
    {
      arabic: 'طَالِب',
      translit: ["Taleb", "Talib", "Taaleb", "Taalib"],
      solutions: ["Taleb", "Talib", "Taaleb", "Taalib"],
      translation_en: 'student (male)',
      dialect: 'Both',
      notes: 'Male student; seeker of knowledge.'
    },
    {
      arabic: 'طَالِبَة',
      translit: ["Taaliba", "Taalibeh", "Taalibe", "Taalibh", "Taaleba", "Taalebeh", "Taalebe", "Taalebh"],
      solutions: ["Taaliba", "Taalibeh", "Taalibe", "Taalibh", "Taaleba", "Taalebeh", "Taalebe", "Taalebh"],
      translation_en: 'student (female)',
      dialect: 'Both',
      notes: 'Female student; pronounced Taalibe/Taalibeh in Levantine.'
    },
    {
      arabic: 'مُعَلِّم',
      translit: ["mu3allim", "mu3allem", "mo3allim", "mo3allem"],
      solutions: ["mu3allim", "mu3allem", "mo3allim", "mo3allem"],
      translation_en: 'teacher (male)',
      dialect: 'Both',
      notes: 'Teacher/instructor; colloquially also used as a respectful title ("boss" / "maestro").'
    },
    {
      arabic: 'مُعَلِّمَة',
      translit: ["mu3allima", "mu3allimeh", "mu3allime", "mu3allimh", "mu3allema", "mu3allemeh", "mu3alleme", "mu3allemh"],
      solutions: ["mu3allima", "mu3allimeh", "mu3allime", "mu3allimh", "mu3allema", "mu3allemeh", "mu3alleme", "mu3allemh"],
      translation_en: 'teacher (female)',
      dialect: 'Both',
      notes: 'Female teacher; pronounced m3allme/m3allmeh in spoken Levantine.'
    },
    {
      arabic: 'صَدِيق',
      translit: ["Sadeeq", "Sadee9", "sadee2", "Sadee2", "Sadiiq", "Sadii9", "Sadiq", "Sadi9", "Sadyq", "Sady9"],
      solutions: ["Sadeeq", "Sadee9", "sadee2", "Sadee2", "Sadiiq", "Sadii9", "Sadiq", "Sadi9", "Sadyq", "Sady9"],
      translation_en: 'friend (male)',
      dialect: 'Both',
      notes: 'Friend in MSA; in spoken Levantine often replaced by صاحب (SaHeb) or رفيق (rafeeq).'
    },
    {
      arabic: 'عَائِلَة',
      translit: ["3aa2ila", "3aa2ileh", "3aa2ile", "3aa2ilh", "3aa2ela", "3aa2eleh", "3aa2ele", "3aa2elh"],
      solutions: ["3aa2ila", "3aa2ileh", "3aa2ile", "3aa2ilh", "3aa2ela", "3aa2eleh", "3aa2ele", "3aa2elh"],
      translation_en: 'family',
      dialect: 'Both',
      notes: 'Family in MSA; spoken Levantine often uses عيلة (3eyleh).'
    },
    {
      arabic: 'خُبْز',
      translit: ["khubz", "khobz", "7'ubz", "7'obz", "5ubz", "5obz"],
      solutions: ["khubz", "khobz", "7'ubz", "7'obz", "5ubz", "5obz"],
      translation_en: 'bread',
      dialect: 'Both',
      notes: 'Everyday pita or flatbread staple; pronounced khobz in Levantine.'
    },
    {
      arabic: 'حَلِيب',
      translit: ["Haleeb", "Haliib", "Halib", "Halyb", "7aleeb", "7aliib", "7alib", "7alyb"],
      solutions: ["Haleeb", "Haliib", "Halib", "Halyb", "7aleeb", "7aliib", "7alib", "7alyb"],
      translation_en: 'milk',
      dialect: 'Both',
      notes: 'Fresh milk; widely used across MSA and spoken dialects.'
    },
    {
      arabic: 'قَهْوَة',
      translit: ["qahwa", "qahweh", "qahwe", "qahwh", "qahooa", "qahooeh", "qahooe", "qahooh"],
      solutions: ["qahwa", "qahweh", "qahwe", "qahwh", "qahooa", "qahooeh", "qahooe", "qahooh"],
      translation_en: 'coffee',
      dialect: 'Both',
      notes: 'Coffee; pronounced 2ahwe in urban Levantine (Beirut, Damascus, Jerusalem).'
    },
    {
      arabic: 'شَاي',
      translit: ["shaay", "shaaee", "shaaii", "shaai", "shay", "shaee", "shaii", "shai"],
      solutions: ["shaay", "shaaee", "shaaii", "shaai", "shay", "shaee", "shaii", "shai"],
      translation_en: 'tea',
      dialect: 'Both',
      notes: 'Black tea, quintessential hot drink of Levantine hospitality.'
    },
    {
      arabic: 'سَمَك',
      translit: ["samak", "samek", "smak"],
      solutions: ["samak", "samek", "smak"],
      translation_en: 'fish',
      dialect: 'Both',
      notes: 'Fish (singular or collective); pronounced smak in rapid Levantine.'
    },
    {
      arabic: 'لَحْم',
      translit: ["laHm", "la7m"],
      solutions: ["laHm", "la7m"],
      translation_en: 'meat',
      dialect: 'Both',
      notes: 'Meat, typically lamb, beef, or mutton in Middle Eastern cooking.'
    },
    {
      arabic: 'فَاكِهَة',
      translit: ["faakiha", "faakiheh", "faakihe", "faakihh", "faakeha", "faakeheh", "faakehe", "faakehh"],
      solutions: ["faakiha", "faakiheh", "faakihe", "faakihh", "faakeha", "faakeheh", "faakehe", "faakehh"],
      translation_en: 'fruit',
      dialect: 'Both',
      notes: 'Fruit in MSA; spoken Levantine commonly uses فواكه (fawakeh).'
    },
    {
      arabic: 'تُفَّاح',
      translit: ["tuffaaH", "tuffaa7", "tuffaH", "tuffa7", "toffaaH", "toffaa7", "toffaH", "toffa7"],
      solutions: ["tuffaaH", "tuffaa7", "tuffaH", "tuffa7", "toffaaH", "toffaa7", "toffaH", "toffa7"],
      translation_en: 'apples',
      dialect: 'Both',
      notes: 'Apples (collective noun).'
    },
    {
      arabic: 'مَوْز',
      translit: ["mawz", "maooz", "mauuz", "mauz"],
      solutions: ["mawz", "maooz", "mauuz", "mauz"],
      translation_en: 'bananas',
      dialect: 'Both',
      notes: 'Bananas (collective noun); root of English "banana" via Arabic trade.'
    },
    {
      arabic: 'عَصِير',
      translit: ["3aSeer", "3aSiir", "3aSir", "3aSyr"],
      solutions: ["3aSeer", "3aSiir", "3aSir", "3aSyr"],
      translation_en: 'juice',
      dialect: 'Both',
      notes: 'Fruit juice; pronounced 3aSeer in both MSA and dialects.'
    },
    {
      arabic: 'مَطْعَم',
      translit: ["maT3am", "mat3am", "maT3em", "mat3em"],
      solutions: ["maT3am", "mat3am", "maT3em", "mat3em"],
      translation_en: 'restaurant',
      dialect: 'Both',
      notes: 'Restaurant, eatery, or dining establishment.'
    },
    {
      arabic: 'مَكْتَب',
      translit: ["maktab", "makteb", "mekteb"],
      solutions: ["maktab", "makteb", "mekteb"],
      translation_en: 'office / desk',
      dialect: 'Both',
      notes: 'Office or writing desk, from root k-t-b (writing).'
    },
    {
      arabic: 'مَسْجِد',
      translit: ["masjid", "masjed"],
      solutions: ["masjid", "masjed"],
      translation_en: 'mosque',
      dialect: 'Both',
      notes: 'Mosque or prayer hall; also colloquially called جامع (jaami3).'
    },
    {
      arabic: 'شَارِع',
      translit: ["shaari3", "shaare3", "shari3", "share3"],
      solutions: ["shaari3", "shaare3", "shari3", "share3"],
      translation_en: 'street',
      dialect: 'Both',
      notes: 'Street, avenue, or boulevard; pronounced shaare3 in Levantine.'
    },
    {
      arabic: 'مَدِينَة',
      translit: ["madineh", "madiineh", "madina", "madiina"],
      solutions: ["madineh", "madiineh", "madina", "madiina"],
      translation_en: 'city',
      dialect: 'Both',
      notes: 'City or town; pronounced madine/madineh in spoken Levantine.'
    },
    {
      arabic: 'قَرْيَة',
      translit: ["qarya", "qaryeh", "qarye", "qaryh", "qareea", "qareeeh", "qareee", "qareeh"],
      solutions: ["qarya", "qaryeh", "qarye", "qaryh", "qareea", "qareeeh", "qareee", "qareeh"],
      translation_en: 'village',
      dialect: 'Both',
      notes: 'Village or rural township; urban Levantine pronounces q as a glottal stop (2arye).'
    },
    {
      arabic: 'بِلَاد',
      translit: ["bilaad", "bilad", "belaad", "belad"],
      solutions: ["bilaad", "bilad", "belaad", "belad"],
      translation_en: 'country / lands',
      dialect: 'Both',
      notes: 'Country, homeland, or lands; plural of بلد (balad).'
    },
    {
      arabic: 'عَالَم',
      translit: ["3aalam", "3alam"],
      solutions: ["3aalam", "3alam"],
      translation_en: 'world',
      dialect: 'Both',
      notes: 'The world; in spoken Levantine also colloquially means "people / a crowd".'
    },
    {
      arabic: 'شَمْس',
      translit: ["shams", "shems"],
      solutions: ["shams", "shems"],
      translation_en: 'sun',
      dialect: 'Both',
      notes: 'The sun; feminine noun in Arabic without a feminine ending.'
    },
    {
      arabic: 'قَمَر',
      translit: ["qamar", "9amar", "gamar"],
      solutions: ["qamar", "9amar", "gamar"],
      translation_en: 'moon',
      dialect: 'Both',
      notes: 'The moon; often used affectionately in Levantine to describe someone radiant.'
    },
    {
      arabic: 'نَجْم',
      translit: ["najm", "najem", "negm"],
      solutions: ["najm", "najem", "negm"],
      translation_en: 'star',
      dialect: 'Both',
      notes: 'Star in the night sky.'
    },
    {
      arabic: 'بَحْر',
      translit: ["baHr", "ba7r", "bahr"],
      solutions: ["baHr", "ba7r", "bahr"],
      translation_en: 'sea',
      dialect: 'Both',
      notes: 'Sea or ocean; prominent feature along the Mediterranean Levantine coast.'
    },
    {
      arabic: 'جَبَل',
      translit: ["jabal", "jabel", "jbal"],
      solutions: ["jabal", "jabel", "jbal"],
      translation_en: 'mountain',
      dialect: 'Both',
      notes: 'Mountain; landmarks the Mount Lebanon and Anti-Lebanon ranges.'
    },
    {
      arabic: 'نَهْر',
      translit: ["nahr", "nehr", "nhar"],
      solutions: ["nahr", "nehr", "nhar"],
      translation_en: 'river',
      dialect: 'Both',
      notes: 'River or stream; pronounced nhar or naher in Levantine.'
    },
    {
      arabic: 'زَهْرَة',
      translit: ["zahra", "zahrah", "zahraa"],
      solutions: ["zahra", "zahrah", "zahraa"],
      translation_en: 'flower',
      dialect: 'Both',
      notes: 'Flower or blossom.'
    },
    {
      arabic: 'شَجَرَة',
      translit: ["shajara", "shajareh", "shajare", "shajarh"],
      solutions: ["shajara", "shajareh", "shajare", "shajarh"],
      translation_en: 'tree',
      dialect: 'Both',
      notes: 'Tree; pronounced shajare/shajareh in spoken Levantine.'
    },
    {
      arabic: 'سَيَّارَة',
      translit: ["sayyaara", "sayyaareh", "sayyaare", "sayyaarh", "sayyara", "sayyareh", "sayyare", "sayyarh"],
      solutions: ["sayyaara", "sayyaareh", "sayyaare", "sayyaarh", "sayyara", "sayyareh", "sayyare", "sayyarh"],
      translation_en: 'car',
      dialect: 'Both',
      notes: 'Automobile / car; pronounced sayyara/sayyareh.'
    },
    {
      arabic: 'طَائِرَة',
      translit: ["Taa2ira", "Taa2ireh", "Taa2ire", "Taa2irh", "Taa2era", "Taa2ereh", "Taa2ere", "Taa2erh"],
      solutions: ["Taa2ira", "Taa2ireh", "Taa2ire", "Taa2irh", "Taa2era", "Taa2ereh", "Taa2ere", "Taa2erh"],
      translation_en: 'airplane',
      dialect: 'Both',
      notes: 'Airplane; spoken Levantine often says طيارة (Tayyaara).'
    },
    {
      arabic: 'قِطَار',
      translit: ["qiTaar", "qiTar", "qeTaar", "qeTar", "9iTaar", "9iTar", "9eTaar", "9eTar"],
      solutions: ["qiTaar", "qiTar", "qeTaar", "qeTar", "9iTaar", "9iTar", "9eTaar", "9eTar"],
      translation_en: 'train',
      dialect: 'Both',
      notes: 'Train; in spoken Levantine also referred to as ترين (treen) or قطار.'
    },
    {
      arabic: 'حَافِلَة',
      translit: ["Haafila", "Haafileh", "Haafile", "Haafilh", "Haafela", "Haafeleh", "Haafele", "Haafelh"],
      solutions: ["Haafila", "Haafileh", "Haafile", "Haafilh", "Haafela", "Haafeleh", "Haafele", "Haafelh"],
      translation_en: 'bus',
      dialect: 'MSA',
      notes: 'Formal MSA for bus; spoken Levantine universally uses باص (baaS) or سرفيس (servees).'
    },
    {
      arabic: 'دَرَّاجَة',
      translit: ["darraaja", "darraajeh", "darraaje", "darraajh", "darraja", "darrajeh", "darraje", "darrajh"],
      solutions: ["darraaja", "darraajeh", "darraaje", "darraajh", "darraja", "darrajeh", "darraje", "darrajh"],
      translation_en: 'bicycle',
      dialect: 'Both',
      notes: 'Bicycle in MSA; spoken Levantine frequently uses بسكليت (bisklet).'
    },
    {
      arabic: 'يَوْم',
      translit: ["yawm", "yaoom", "yauum", "yaum", "eeawm", "eeaoom", "eeauum", "eeaum"],
      solutions: ["yawm", "yaoom", "yauum", "yaum", "eeawm", "eeaoom", "eeauum", "eeaum"],
      translation_en: 'day',
      dialect: 'Both',
      notes: 'Day (24-hour period); pronounced yawm/yom.'
    },
    {
      arabic: 'لَيْل',
      translit: ["layl", "laeel", "laiil", "lail"],
      solutions: ["layl", "laeel", "laiil", "lail"],
      translation_en: 'night',
      dialect: 'Both',
      notes: 'Night / nighttime.'
    },
    {
      arabic: 'صَبَاح',
      translit: ["SabaaH", "Sabaa7", "SabaH", "Saba7"],
      solutions: ["SabaaH", "Sabaa7", "SabaH", "Saba7"],
      translation_en: 'morning',
      dialect: 'Both',
      notes: 'Morning; used in the greeting صباح الخير (SabaaH el-kheir).'
    },
    {
      arabic: 'أُسْبُوع',
      translit: ["2usboo3", "2usbuu3", "2usbu3", "2usbw3", "2osboo3", "2osbuu3", "2osbu3", "2osbw3"],
      solutions: ["2usboo3", "2usbuu3", "2usbu3", "2usbw3", "2osboo3", "2osbuu3", "2osbu3", "2osbw3"],
      translation_en: 'week',
      dialect: 'Both',
      notes: 'Week (seven-day cycle); from root s-b-3 (seven).'
    },
    {
      arabic: 'شَهْر',
      translit: ["shahr", "shahar", "shher"],
      solutions: ["shahr", "shahar", "shher"],
      translation_en: 'month',
      dialect: 'Both',
      notes: 'Calendar month.'
    },
    {
      arabic: 'سَنَة',
      translit: ["sana", "saneh", "sane", "sanh"],
      solutions: ["sana", "saneh", "sane", "sanh"],
      translation_en: 'year',
      dialect: 'Both',
      notes: 'Year; pronounced sane/saneh in spoken Levantine.'
    },
    {
      arabic: 'وَقْت',
      translit: ["waqt", "wa9t", "ooaqt", "ooa9t", "uuaqt", "uua9t", "uaqt", "ua9t"],
      solutions: ["waqt", "wa9t", "ooaqt", "ooa9t", "uuaqt", "uua9t", "uaqt", "ua9t"],
      translation_en: 'time',
      dialect: 'Both',
      notes: 'Time or duration; pronounced wa2t in urban Levantine.'
    },
    {
      arabic: 'سَاعَة',
      translit: ["saa3a", "saa3eh", "saa3e", "saa3h", "sa3a", "sa3eh", "sa3e", "sa3h"],
      solutions: ["saa3a", "saa3eh", "saa3e", "saa3h", "sa3a", "sa3eh", "sa3e", "sa3h"],
      translation_en: 'hour / clock',
      dialect: 'Both',
      notes: 'Hour, clock, or wristwatch; pronounced saa3a/saa3eh.'
    },
    {
      arabic: 'دَقِيقَة',
      translit: ["daqeeqa", "daqeeqeh", "daqeeqe", "daqeeqh", "daqee9a", "daqee9eh", "daqee9e", "daqee9h"],
      solutions: ["daqeeqa", "daqeeqeh", "daqeeqe", "daqeeqh", "daqee9a", "daqee9eh", "daqee9e", "daqee9h"],
      translation_en: 'minute',
      dialect: 'Both',
      notes: 'Minute (unit of time); pronounced da2ee2a/da2ee2eh in urban Levantine.'
    },
    {
      arabic: 'طَعَام',
      translit: ["Ta3aam", "Ta3am"],
      solutions: ["Ta3aam", "Ta3am"],
      translation_en: 'food',
      dialect: 'MSA',
      notes: 'Formal MSA for food; spoken Levantine almost exclusively prefers أكل (akl).'
    },
    {
      arabic: 'سُوق',
      translit: ["sooq", "soo9", "suuq", "suu9", "suq", "su9", "swq", "sw9"],
      solutions: ["sooq", "soo9", "suuq", "suu9", "suq", "su9", "swq", "sw9"],
      translation_en: 'market',
      dialect: 'Both',
      notes: 'Traditional marketplace, bazaar, or souk; urban Levantine soo2.'
    },
    {
      arabic: 'مَال',
      translit: ["maal", "mal"],
      solutions: ["maal", "mal"],
      translation_en: 'money / wealth',
      dialect: 'MSA',
      notes: 'Wealth or capital in MSA; Levantine spoken overwhelmingly uses مصاري (maSaari).'
    },
    {
      arabic: 'عَمَل',
      translit: ["3amal", "amal", "3amel"],
      solutions: ["3amal", "amal", "3amel"],
      translation_en: 'work',
      dialect: 'Both',
      notes: 'Work, labor, or deeds; spoken Levantine often uses شغل (shughl).'
    },
    {
      arabic: 'لُغَة',
      translit: ["lugha", "lugheh", "lughe", "lughh", "lu3'a", "lu3'eh", "lu3'e", "lu3'h"],
      solutions: ["lugha", "lugheh", "lughe", "lughh", "lu3'a", "lu3'eh", "lu3'e", "lu3'h"],
      translation_en: 'language',
      dialect: 'Both',
      notes: 'Language or tongue; pronounced lugha/lugheh.'
    },
    {
      arabic: 'كَلِمَة',
      translit: ["kalima", "kalimeh", "kalime", "kalimh", "kalema", "kalemeh", "kaleme", "kalemh"],
      solutions: ["kalima", "kalimeh", "kalime", "kalimh", "kalema", "kalemeh", "kaleme", "kalemh"],
      translation_en: 'word',
      dialect: 'Both',
      notes: 'Word or saying; pronounced kilme/kilmeh in spoken Levantine.'
    },
    {
      arabic: 'جُمْلَة',
      translit: ["jumla", "jumleh", "jumle", "jumlh", "jomla", "jomleh", "jomle", "jomlh"],
      solutions: ["jumla", "jumleh", "jumle", "jumlh", "jomla", "jomleh", "jomle", "jomlh"],
      translation_en: 'sentence',
      dialect: 'Both',
      notes: 'Sentence or phrase; pronounced jimle in spoken Levantine.'
    },
    {
      arabic: 'سُؤَال',
      translit: ["su2aal", "su2al", "suaaal", "suaal", "sual", "so2aal", "so2al", "soaaal"],
      solutions: ["su2aal", "su2al", "suaaal", "suaal", "sual", "so2aal", "so2al", "soaaal"],
      translation_en: 'question',
      dialect: 'Both',
      notes: 'Question or inquiry; from root s-2-l (to ask).'
    },
    {
      arabic: 'جَوَاب',
      translit: ["jawaab", "jawab", "jaooaab", "jaooab", "jauuaab", "jauuab", "jauaab", "jauab"],
      solutions: ["jawaab", "jawab", "jaooaab", "jaooab", "jauuaab", "jauuab", "jauaab", "jauab"],
      translation_en: 'answer',
      dialect: 'Both',
      notes: 'Answer or reply; root j-w-b.'
    },
    {
      arabic: 'رَقْم',
      translit: ["raqm", "ra9m"],
      solutions: ["raqm", "ra9m"],
      translation_en: 'number',
      dialect: 'Both',
      notes: 'Number or digit; pronounced ra2em/ra2m in urban Levantine.'
    },
    {
      arabic: 'اِسْم',
      translit: ["ism", "esm"],
      solutions: ["ism", "esm"],
      translation_en: 'name',
      dialect: 'Both',
      notes: 'Name or noun; pronounced ism or esm.'
    },
    {
      arabic: 'صُورَة',
      translit: ["Soora", "Sooreh", "Soore", "Soorh", "Suura", "Suureh", "Suure", "Suurh"],
      solutions: ["Soora", "Sooreh", "Soore", "Soorh", "Suura", "Suureh", "Suure", "Suurh"],
      translation_en: 'picture / photo',
      dialect: 'Both',
      notes: 'Picture, photograph, or depiction.'
    },
    {
      arabic: 'هَاتِف',
      translit: ["haatif", "haatef", "hatif", "hatef"],
      solutions: ["haatif", "haatef", "hatif", "hatef"],
      translation_en: 'phone',
      dialect: 'MSA',
      notes: 'Telephone in MSA; spoken dialects universally use تلفون (tilifone).'
    },
    {
      arabic: 'حَاسُوب',
      translit: ["Haasoob", "Haasuub", "Haasub", "Haaswb", "Hasoob", "Hasuub", "Hasub", "Haswb"],
      solutions: ["Haasoob", "Haasuub", "Haasub", "Haaswb", "Hasoob", "Hasuub", "Hasub", "Haswb"],
      translation_en: 'computer',
      dialect: 'MSA',
      notes: 'Modern standard Arabic term for computer; spoken dialects use كمبيوتر.'
    },
    {
      arabic: 'كِتَابَة',
      translit: ["kitaaba", "kitaabeh", "kitaabe", "kitaabh", "kitaba", "kitabeh", "kitabe", "kitabh"],
      solutions: ["kitaaba", "kitaabeh", "kitaabe", "kitaabh", "kitaba", "kitabeh", "kitabe", "kitabh"],
      translation_en: 'writing',
      dialect: 'Both',
      notes: 'Writing or script; verbal noun of kataba.'
    },
    {
      arabic: 'قِرَاءَة',
      translit: ["qiraa2a", "qiraa2eh", "qiraa2e", "qiraa2h", "qiraaaa", "qiraaaeh", "qiraaae", "qiraaah"],
      solutions: ["qiraa2a", "qiraa2eh", "qiraa2e", "qiraa2h", "qiraaaa", "qiraaaeh", "qiraaae", "qiraaah"],
      translation_en: 'reading',
      dialect: 'Both',
      notes: 'Reading or recitation; verbal noun of qara2a.'
    },
    {
      arabic: 'مُوسِيقَى',
      translit: ["mooseeqaa", "mooseeqa", "moosee9aa", "moosee9a", "moosiiqaa", "moosiiqa", "moosii9aa", "moosii9a"],
      solutions: ["mooseeqaa", "mooseeqa", "moosee9aa", "moosee9a", "moosiiqaa", "moosiiqa", "moosii9aa", "moosii9a"],
      translation_en: 'music',
      dialect: 'Both',
      notes: 'Music, loanword from Greek mousike.'
    },
    {
      arabic: 'رِيَاضَة',
      translit: ["riyaaDa", "riyaaDeh", "riyaaDe", "riyaaDh", "riyaDa", "riyaDeh", "riyaDe", "riyaDh"],
      solutions: ["riyaaDa", "riyaaDeh", "riyaaDe", "riyaaDh", "riyaDa", "riyaDeh", "riyaDe", "riyaDh"],
      translation_en: 'sports / exercise',
      dialect: 'Both',
      notes: 'Athletics, sports, or physical exercise.'
    },
    {
      arabic: 'كُرَة',
      translit: ["kura", "kureh", "kure", "kurh", "kora", "koreh", "kore", "korh"],
      solutions: ["kura", "kureh", "kure", "kurh", "kora", "koreh", "kore", "korh"],
      translation_en: 'ball',
      dialect: 'Both',
      notes: 'Ball or sphere; spoken Levantine often says كورة (koora) or طابة (Taabeh).'
    },
    {
      arabic: 'لَاعِب',
      translit: ["laa3ib", "laa3eb", "la3ib", "la3eb"],
      solutions: ["laa3ib", "laa3eb", "la3ib", "la3eb"],
      translation_en: 'player',
      dialect: 'Both',
      notes: 'Player or athlete.'
    },
    {
      arabic: 'فَرِيق',
      translit: ["fareeq", "faree9", "fariiq", "farii9", "fariq", "fari9", "faryq", "fary9"],
      solutions: ["fareeq", "faree9", "fariiq", "farii9", "fariq", "fari9", "faryq", "fary9"],
      translation_en: 'team',
      dialect: 'Both',
      notes: 'Team, squad, or league side.'
    },
    {
      arabic: 'مَلْعَب',
      translit: ["mal3ab", "mal3eb"],
      solutions: ["mal3ab", "mal3eb"],
      translation_en: 'stadium / pitch',
      dialect: 'Both',
      notes: 'Playing pitch, stadium, or sports arena.'
    },
    {
      arabic: 'صَحِيح',
      translit: ["SaHeeH", "SaHee7", "SaHiiH", "SaHii7", "SaHiH", "SaHi7", "SaHyH", "SaHy7"],
      solutions: ["SaHeeH", "SaHee7", "SaHiiH", "SaHii7", "SaHiH", "SaHi7", "SaHyH", "SaHy7"],
      translation_en: 'correct / true',
      dialect: 'Both',
      notes: 'Correct, valid, or authentic; colloquial contraction Sa7.'
    },
    {
      arabic: 'خَطَأ',
      translit: ["khaTa2", "khaTaa", "khaTa", "7'aTa2", "7'aTaa", "7'aTa", "5aTa2", "5aTaa"],
      solutions: ["khaTa2", "khaTaa", "khaTa", "7'aTa2", "7'aTaa", "7'aTa", "5aTa2", "5aTaa"],
      translation_en: 'mistake / wrong',
      dialect: 'Both',
      notes: 'Error or mistake in MSA; Levantine often says غلط (ghalaT).'
    },
    {
      arabic: 'جَدِيد',
      translit: ["jadeed", "jadiid", "jadid", "jadyd"],
      solutions: ["jadeed", "jadiid", "jadid", "jadyd"],
      translation_en: 'new',
      dialect: 'Both',
      notes: 'New or novel; pronounced jdeed in spoken Levantine.'
    },
    {
      arabic: 'قَدِيم',
      translit: ["qadeem", "qadiim", "qadim", "qadym", "9adeem", "9adiim", "9adim", "9adym"],
      solutions: ["qadeem", "qadiim", "qadim", "qadym", "9adeem", "9adiim", "9adim", "9adym"],
      translation_en: 'old',
      dialect: 'Both',
      notes: 'Old (for objects, places, or antiquity); pronounced 2adeem in urban Levantine.'
    },
    {
      arabic: 'كَبِير',
      translit: ["kabeer", "kabiir", "kabir", "kabyr"],
      solutions: ["kabeer", "kabiir", "kabir", "kabyr"],
      translation_en: 'big / older',
      dialect: 'Both',
      notes: 'Big or old in age; spoken Levantine drops short vowel -> كْبير (kbeer).'
    },
    {
      arabic: 'صَغِير',
      translit: ["Sagheer", "Saghiir", "Saghir", "Saghyr", "Sa3'eer", "Sa3'iir", "Sa3'ir", "Sa3'yr"],
      solutions: ["Sagheer", "Saghiir", "Saghir", "Saghyr", "Sa3'eer", "Sa3'iir", "Sa3'ir", "Sa3'yr"],
      translation_en: 'small / younger',
      dialect: 'Both',
      notes: 'Small or young; spoken Levantine drops short vowel -> زْغير (zgheer).'
    },
    {
      arabic: 'جَمِيل',
      translit: ["jameel", "jamiil", "jamil", "jamyl"],
      solutions: ["jameel", "jamiil", "jamil", "jamyl"],
      translation_en: 'beautiful / handsome',
      dialect: 'Both',
      notes: 'Attractive or beautiful; spoken Levantine frequently uses حلو (Helw).'
    },
    {
      arabic: 'سَهْل',
      translit: ["sahl", "sahel", "sahal"],
      solutions: ["sahl", "sahel", "sahal"],
      translation_en: 'easy',
      dialect: 'Both',
      notes: 'Easy, simple, or effortless.'
    },
    {
      arabic: 'صَعْب',
      translit: ["Sa3b", "sa3eb", "Sa3eb", "sa3b"],
      solutions: ["Sa3b", "sa3eb", "Sa3eb", "sa3b"],
      translation_en: 'difficult / hard',
      dialect: 'Both',
      notes: 'Challenging, tough, or hard.'
    },
    {
      arabic: 'سَرِيع',
      translit: ["saree3", "sarii3", "sari3", "sary3"],
      solutions: ["saree3", "sarii3", "sari3", "sary3"],
      translation_en: 'fast / quick',
      dialect: 'Both',
      notes: 'Rapid, speedy, or swift.'
    },
    {
      arabic: 'بَطِيء',
      translit: ["baTee2", "baTeea", "baTee", "baTii2", "baTiia", "baTii", "baTi2", "baTia"],
      solutions: ["baTee2", "baTeea", "baTee", "baTii2", "baTiia", "baTii", "baTi2", "baTia"],
      translation_en: 'slow',
      dialect: 'Both',
      notes: 'Slow or sluggish.'
    },
    {
      arabic: 'أَحْيَانًا',
      translit: ["2aHyaanan", "2aHyanan", "2aHeeaanan", "2aHeeanan", "2aHiiaanan", "2aHiianan", "2aHiaanan", "2aHianan"],
      solutions: ["2aHyaanan", "2aHyanan", "2aHeeaanan", "2aHeeanan", "2aHiiaanan", "2aHiianan", "2aHiaanan", "2aHianan"],
      translation_en: 'sometimes',
      dialect: 'MSA',
      notes: 'Sometimes in MSA; spoken Levantine uses مرات (marraat) or أوقات (aw2aat).'
    },
    {
      arabic: 'هُنَا',
      translit: ["hunaa", "huna", "honaa", "hona"],
      solutions: ["hunaa", "huna", "honaa", "hona"],
      translation_en: 'here',
      dialect: 'MSA',
      notes: 'Here in MSA; spoken Levantine universally uses هون (hown).'
    },
    {
      arabic: 'هُنَاكَ',
      translit: ["hunaaka", "hunaka", "honaaka", "honaka"],
      solutions: ["hunaaka", "hunaka", "honaaka", "honaka"],
      translation_en: 'there',
      dialect: 'MSA',
      notes: 'There in MSA; spoken Levantine uses هناك (hinaak) or هنيك (huneek).'
    },
    {
      arabic: 'هُوَ',
      translit: ["huwa", "huooa", "huuua", "huua", "howa", "hoooa", "houua", "houa"],
      solutions: ["huwa", "huooa", "huuua", "huua", "howa", "hoooa", "houua", "houa"],
      translation_en: 'he',
      dialect: 'Both',
      notes: 'Third-person masculine pronoun ("he").'
    },
    {
      arabic: 'هِيَ',
      translit: ["hiya", "hieea", "hiiia", "hiia", "heya", "heeea", "heiia", "heia"],
      solutions: ["hiya", "hieea", "hiiia", "hiia", "heya", "heeea", "heiia", "heia"],
      translation_en: 'she',
      dialect: 'Both',
      notes: 'Third-person feminine pronoun ("she").'
    },
    {
      arabic: 'أَنْتَ',
      translit: ["2anta", "aanta", "anta"],
      solutions: ["2anta", "aanta", "anta"],
      translation_en: 'you (male)',
      dialect: 'Both',
      notes: 'Second-person masculine pronoun ("you"); spoken Levantine أنت (inta).'
    },
    {
      arabic: 'أَنْتِ',
      translit: ["2anti", "2ante", "aanti", "aante", "anti", "ante"],
      solutions: ["2anti", "2ante", "aanti", "aante", "anti", "ante"],
      translation_en: 'you (female)',
      dialect: 'Both',
      notes: 'Second-person feminine pronoun ("you"); spoken Levantine أنتي (inti).'
    },
    {
      arabic: 'أَنَا',
      translit: ["2anaa", "2ana", "aanaa", "aana", "anaa", "ana"],
      solutions: ["2anaa", "2ana", "aanaa", "aana", "anaa", "ana"],
      translation_en: 'I',
      dialect: 'Both',
      notes: 'First-person singular pronoun ("I / me").'
    },
    {
      arabic: 'نَحْنُ',
      translit: ["naHnu", "naHno", "na7nu", "na7no"],
      solutions: ["naHnu", "naHno", "na7nu", "na7no"],
      translation_en: 'we',
      dialect: 'MSA',
      notes: 'We in MSA; spoken Levantine uses احنا (iHna) or نحنا (niHna).'
    },
    {
      arabic: 'هُمْ',
      translit: ["hum", "hom"],
      solutions: ["hum", "hom"],
      translation_en: 'they (masculine)',
      dialect: 'Both',
      notes: 'Third-person plural pronoun ("they"); spoken Levantine هني (hinne).'
    },
    {
      arabic: 'هُنَّ',
      translit: ["hunna", "honna"],
      solutions: ["hunna", "honna"],
      translation_en: 'they (feminine)',
      dialect: 'MSA',
      notes: 'Feminine plural pronoun in MSA; dialects merge masculine and feminine plural.'
    },
    {
      arabic: 'يَذْهَب',
      translit: ["yadhhab", "eeadhhab", "iiadhhab", "iadhhab"],
      solutions: ["yadhhab", "eeadhhab", "iiadhhab", "iadhhab"],
      translation_en: 'he goes',
      dialect: 'MSA',
      notes: 'Present tense in MSA; spoken Levantine uses بيروح (birooH).'
    },
    {
      arabic: 'تَذْهَب',
      translit: ["tadhhab", "tadhab", "tazhab"],
      solutions: ["tadhhab", "tadhab", "tazhab"],
      translation_en: 'she goes / you go',
      dialect: 'MSA',
      notes: 'Present tense in MSA; spoken Levantine uses بتروح (bitrooh).'
    },
    {
      arabic: 'أَذْهَب',
      translit: ["2adhhab", "aadhhab", "adhhab"],
      solutions: ["2adhhab", "aadhhab", "adhhab"],
      translation_en: 'I go',
      dialect: 'MSA',
      notes: 'Present tense in MSA; spoken Levantine uses بروح (barooH).'
    },
    {
      arabic: 'يَكْتُب',
      translit: ["yaktub", "yaktob", "eeaktub", "eeaktob", "iiaktub", "iiaktob", "iaktub", "iaktob"],
      solutions: ["yaktub", "yaktob", "eeaktub", "eeaktob", "iiaktub", "iiaktob", "iaktub", "iaktob"],
      translation_en: 'he writes',
      dialect: 'Both',
      notes: 'Present tense verb; spoken Levantine بيكتب (byiktub).'
    },
    {
      arabic: 'يَقْرَأ',
      translit: ["yaqra2", "yaqraa", "yaqra", "ya9ra2", "ya9raa", "ya9ra", "eeaqra2", "eeaqraa"],
      solutions: ["yaqra2", "yaqraa", "yaqra", "ya9ra2", "ya9raa", "ya9ra", "eeaqra2", "eeaqraa"],
      translation_en: 'he reads',
      dialect: 'Both',
      notes: 'Present tense verb; urban Levantine بيقرأ (byi2ra).'
    },
    {
      arabic: 'يَأْكُل',
      translit: ["ya2kul", "ya2kol", "yaakul", "yaakol", "yakul", "yakol", "eea2kul", "eea2kol"],
      solutions: ["ya2kul", "ya2kol", "yaakul", "yaakol", "yakul", "yakol", "eea2kul", "eea2kol"],
      translation_en: 'he eats',
      dialect: 'Both',
      notes: 'Present tense verb; spoken Levantine بياكل (byaakul).'
    },
    {
      arabic: 'يَشْرَب',
      translit: ["yashrab", "eeashrab", "iiashrab", "iashrab"],
      solutions: ["yashrab", "eeashrab", "iiashrab", "iashrab"],
      translation_en: 'he drinks',
      dialect: 'Both',
      notes: 'Present tense verb; spoken Levantine بيشرب (byishrab).'
    },
    {
      arabic: 'يَنَام',
      translit: ["yanaam", "yanam", "eeanaam", "eeanam", "iianaam", "iianam", "ianaam", "ianam"],
      solutions: ["yanaam", "yanam", "eeanaam", "eeanam", "iianaam", "iianam", "ianaam", "ianam"],
      translation_en: 'he sleeps',
      dialect: 'Both',
      notes: 'Present tense verb; spoken Levantine بينام (bynaam).'
    },
    {
      arabic: 'يَعْمَل',
      translit: ["ya3mal", "eea3mal", "iia3mal", "ia3mal"],
      solutions: ["ya3mal", "eea3mal", "iia3mal", "ia3mal"],
      translation_en: 'he works / does',
      dialect: 'Both',
      notes: 'Present tense verb; spoken Levantine بيشتغل (byshtighil) or بيعمل (byi3mel).'
    },
    {
      arabic: 'يَلْعَب',
      translit: ["yal3ab", "eeal3ab", "iial3ab", "ial3ab"],
      solutions: ["yal3ab", "eeal3ab", "iial3ab", "ial3ab"],
      translation_en: 'he plays',
      dialect: 'Both',
      notes: 'Present tense verb; spoken Levantine بيلعب (byil3ab).'
    },
    {
      arabic: 'يُحِبّ',
      translit: ["yuHibb", "yuHebb", "yu7ibb", "yu7ebb", "yoHibb", "yoHebb", "yo7ibb", "yo7ebb"],
      solutions: ["yuHibb", "yuHebb", "yu7ibb", "yu7ebb", "yoHibb", "yoHebb", "yo7ibb", "yo7ebb"],
      translation_en: 'he loves / likes',
      dialect: 'Both',
      notes: 'Present tense verb; spoken Levantine بيحب (biHibb).'
    },
    {
      arabic: 'يَتَكَلَّم',
      translit: ["yatakallam", "eeatakallam", "iiatakallam", "iatakallam"],
      solutions: ["yatakallam", "eeatakallam", "iiatakallam", "iatakallam"],
      translation_en: 'he speaks',
      dialect: 'MSA',
      notes: 'Present tense in MSA; spoken Levantine prefers بيحكي (biHki).'
    },
    {
      arabic: 'يَفْهَم',
      translit: ["yafham", "eeafham", "iiafham", "iafham"],
      solutions: ["yafham", "eeafham", "iiafham", "iafham"],
      translation_en: 'he understands',
      dialect: 'Both',
      notes: 'Present tense verb; spoken Levantine بيفهم (byifham).'
    },
    {
      arabic: 'يَتَعَلَّم',
      translit: ["yata3allam", "eeata3allam", "iiata3allam", "iata3allam"],
      solutions: ["yata3allam", "eeata3allam", "iiata3allam", "iata3allam"],
      translation_en: 'he learns',
      dialect: 'Both',
      notes: 'Present tense verb; spoken Levantine بيتعلم (byit3allam).'
    },
    {
      arabic: 'أُحِبّ',
      translit: ["2uHibb", "2uHebb", "2u7ibb", "2u7ebb", "2oHibb", "2oHebb", "2o7ibb", "2o7ebb"],
      solutions: ["2uHibb", "2uHebb", "2u7ibb", "2u7ebb", "2oHibb", "2oHebb", "2o7ibb", "2o7ebb"],
      translation_en: 'I love / I like',
      dialect: 'Both',
      notes: 'Present tense first-person; spoken Levantine بحب (baHibb).'
    },
    {
      arabic: 'أُرِيد',
      translit: ["2ureed", "2uriid", "2urid", "2uryd", "2oreed", "2oriid", "2orid", "2oryd"],
      solutions: ["2ureed", "2uriid", "2urid", "2uryd", "2oreed", "2oriid", "2orid", "2oryd"],
      translation_en: 'I want',
      dialect: 'MSA',
      notes: 'Formal MSA for I want; equivalent to spoken Levantine بدي (baddi).'
    },
    {
      arabic: 'أَعْرِف',
      translit: ["2a3rif", "2a3ref", "aa3rif", "aa3ref", "a3rif", "a3ref"],
      solutions: ["2a3rif", "2a3ref", "aa3rif", "aa3ref", "a3rif", "a3ref"],
      translation_en: 'I know',
      dialect: 'Both',
      notes: 'Present tense first-person; spoken Levantine بعرف (ba3rif).'
    },
    {
      arabic: 'نَذْهَب',
      translit: ["nadhhab", "nadhab", "nazhab"],
      solutions: ["nadhhab", "nadhab", "nazhab"],
      translation_en: 'we go',
      dialect: 'MSA',
      notes: 'MSA first-person plural; spoken Levantine منروح (mnrooH).'
    },
    {
      arabic: 'كَتَبَ',
      translit: ["kataba", "katab", "ktaba"],
      solutions: ["kataba", "katab", "ktaba"],
      translation_en: 'wrote',
      dialect: 'Both',
      notes: 'Past tense verb ("he wrote"); root k-t-b.'
    },
    {
      arabic: 'قَرَأَ',
      translit: ["qara2a", "qaraaa", "qaraa", "9ara2a", "9araaa", "9araa"],
      solutions: ["qara2a", "qaraaa", "qaraa", "9ara2a", "9araaa", "9araa"],
      translation_en: 'read',
      dialect: 'Both',
      notes: 'Past tense verb ("he read"); pronounced 2ara in urban Levantine.'
    },
    {
      arabic: 'أَكَلَ',
      translit: ["2akala", "aakala", "akala", "akal", "akel"],
      solutions: ["2akala", "aakala", "akala", "akal", "akel"],
      translation_en: 'ate',
      dialect: 'Both',
      notes: 'Past tense verb ("he ate"); pronounced akal in spoken Levantine.'
    },
    {
      arabic: 'شَرِبَ',
      translit: ["shariba", "shareba"],
      solutions: ["shariba", "shareba"],
      translation_en: 'drank',
      dialect: 'Both',
      notes: 'Past tense verb ("he drank"); pronounced shreb/shirib in Levantine.'
    },
    {
      arabic: 'ذَهَبَ',
      translit: ["dhahaba", "dahaba", "zahaba", "dhahab"],
      solutions: ["dhahaba", "dahaba", "zahaba", "dhahab"],
      translation_en: 'went',
      dialect: 'MSA',
      notes: 'Past tense verb in MSA; spoken Levantine universally uses راح (raaH).'
    },
    {
      arabic: 'رَجَعَ',
      translit: ["raja3a", "raje3a", "raja3"],
      solutions: ["raja3a", "raje3a", "raja3"],
      translation_en: 'returned',
      dialect: 'Both',
      notes: 'Past tense verb ("he came back / returned").'
    },
    {
      arabic: 'وَصَلَ',
      translit: ["waSala", "ooaSala", "uuaSala", "uaSala"],
      solutions: ["waSala", "ooaSala", "uuaSala", "uaSala"],
      translation_en: 'arrived',
      dialect: 'Both',
      notes: 'Past tense verb ("he arrived / reached"); pronounced wiSil in Levantine.'
    },
    {
      arabic: 'فَتَحَ',
      translit: ["fataHa", "fata7a"],
      solutions: ["fataHa", "fata7a"],
      translation_en: 'opened',
      dialect: 'Both',
      notes: 'Past tense verb ("he opened"); root f-t-H.'
    },
    {
      arabic: 'سَأَلَ',
      translit: ["sa2ala", "saaala", "saala"],
      solutions: ["sa2ala", "saaala", "saala"],
      translation_en: 'asked',
      dialect: 'Both',
      notes: 'Past tense verb ("he asked / questioned"); pronounced sa2al.'
    },
    {
      arabic: 'دَرَسَ',
      translit: ["darasa", "dares", "darsa"],
      solutions: ["darasa", "dares", "darsa"],
      translation_en: 'studied',
      dialect: 'Both',
      notes: 'Past tense verb ("he studied / learned"); pronounced daras in Levantine.'
    },
    {
      arabic: 'عَرَفَ',
      translit: ["3arafa", "3arefa", "3araf"],
      solutions: ["3arafa", "3arefa", "3araf"],
      translation_en: 'knew',
      dialect: 'Both',
      notes: 'Past tense verb ("he knew / recognized"); pronounced 3irif in Levantine.'
    },
    {
      arabic: 'سَمِعَ',
      translit: ["sami3a", "same3a"],
      solutions: ["sami3a", "same3a"],
      translation_en: 'heard / listened',
      dialect: 'Both',
      notes: 'Past tense verb ("he heard"); pronounced simi3 in Levantine.'
    },
    {
      arabic: 'بَدَأَ',
      translit: ["bada2a", "badaaa", "badaa"],
      solutions: ["bada2a", "badaaa", "badaa"],
      translation_en: 'started / began',
      dialect: 'Both',
      notes: 'Past tense in MSA; spoken Levantine also frequently uses بلّش (ballash).'
    },
    {
      arabic: 'طَبَخَ',
      translit: ["Tabakha", "Taba7'a", "Taba5a"],
      solutions: ["Tabakha", "Taba7'a", "Taba5a"],
      translation_en: 'cooked',
      dialect: 'Both',
      notes: 'Past tense verb ("he cooked"); pronounced Tabakh in Levantine.'
    },
    {
      arabic: 'سَافَرَ',
      translit: ["saafara", "safara"],
      solutions: ["saafara", "safara"],
      translation_en: 'traveled',
      dialect: 'Both',
      notes: 'Past tense verb ("he traveled / journeyed").'
    },
    {
      arabic: 'عَادَ',
      translit: ["3aada", "3ada"],
      solutions: ["3aada", "3ada"],
      translation_en: 'returned',
      dialect: 'Both',
      notes: 'Past tense verb ("he returned / went back"); synonym of رجع.'
    },
    {
      arabic: 'بَاعَ',
      translit: ["baa3a", "ba3a"],
      solutions: ["baa3a", "ba3a"],
      translation_en: 'sold',
      dialect: 'Both',
      notes: 'Past tense verb ("he sold"); root b-y-3.'
    },
    {
      arabic: 'قَالَ',
      translit: ["qaala", "qala", "9aala", "9ala"],
      solutions: ["qaala", "qala", "9aala", "9ala"],
      translation_en: 'said',
      dialect: 'Both',
      notes: 'Past tense verb ("he said"); pronounced 2aal in urban Levantine.'
    },
    {
      arabic: 'نَامَ',
      translit: ["naama", "nama"],
      solutions: ["naama", "nama"],
      translation_en: 'slept',
      dialect: 'Both',
      notes: 'Past tense verb ("he went to sleep / slept").'
    },
    {
      arabic: 'قَامَ',
      translit: ["qaama", "qama", "9aama", "9ama"],
      solutions: ["qaama", "qama", "9aama", "9ama"],
      translation_en: 'stood / got up',
      dialect: 'Both',
      notes: 'Past tense verb ("he stood up / woke up"); pronounced 2aam in urban Levantine.'
    },
    {
      arabic: 'كَثِير',
      translit: ["katheer", "kathiir", "kathir", "kathyr"],
      solutions: ["katheer", "kathiir", "kathir", "kathyr"],
      translation_en: 'much / many / a lot',
      dialect: 'Both',
      notes: 'In spoken Levantine pronounced كتير (kteer) and used as "very".'
    },
    {
      arabic: 'قَلِيل',
      translit: ["qaleel", "qaliil", "qalil", "qalyl", "9aleel", "9aliil", "9alil", "9alyl"],
      solutions: ["qaleel", "qaliil", "qalil", "qalyl", "9aleel", "9aliil", "9alil", "9alyl"],
      translation_en: 'little / few',
      dialect: 'Both',
      notes: 'A small amount; spoken Levantine often uses شوي (shway).'
    },
    {
      arabic: 'سَعِيد',
      translit: ["sa3eed", "sa3iid", "sa3id", "sa3yd"],
      solutions: ["sa3eed", "sa3iid", "sa3id", "sa3yd"],
      translation_en: 'happy',
      dialect: 'MSA',
      notes: 'Happy in MSA; spoken Levantine almost universally uses مبسوط (mabsooT).'
    },
    {
      arabic: 'حَزِين',
      translit: ["Hazeen", "Haziin", "Hazin", "Hazyn", "7azeen", "7aziin", "7azin", "7azyn"],
      solutions: ["Hazeen", "Haziin", "Hazin", "Hazyn", "7azeen", "7aziin", "7azin", "7azyn"],
      translation_en: 'sad',
      dialect: 'Both',
      notes: 'Sad or grieving; spoken Levantine often uses زعلان (za3laan).'
    },
    {
      arabic: 'غَاضِب',
      translit: ["ghaaDib", "ghaaDeb", "ghaDib", "ghaDeb", "3'aaDib", "3'aaDeb", "3'aDib", "3'aDeb"],
      solutions: ["ghaaDib", "ghaaDeb", "ghaDib", "ghaDeb", "3'aaDib", "3'aaDeb", "3'aDib", "3'aDeb"],
      translation_en: 'angry',
      dialect: 'MSA',
      notes: 'Angry in MSA; spoken Levantine uses معصب (m3aSSab).'
    },
    {
      arabic: 'مُمْتِع',
      translit: ["mumti3", "mumte3", "momti3", "momte3"],
      solutions: ["mumti3", "mumte3", "momti3", "momte3"],
      translation_en: 'enjoyable / fun',
      dialect: 'Both',
      notes: 'Enjoyable, pleasant, or entertaining.'
    },
    {
      arabic: 'مُهِمّ',
      translit: ["muhimm", "muhemm", "mohimm", "mohemm"],
      solutions: ["muhimm", "muhemm", "mohimm", "mohemm"],
      translation_en: 'important',
      dialect: 'Both',
      notes: 'Important, crucial, or significant; root h-m-m.'
    },
    {
      arabic: 'بَسِيط',
      translit: ["baseeT", "basiiT", "basiT", "basyT"],
      solutions: ["baseeT", "basiiT", "basiT", "basyT"],
      translation_en: 'simple',
      dialect: 'Both',
      notes: 'Simple or plain; in colloquial idiom "بسيطة" means "no problem / take it easy".'
    },
    {
      arabic: 'قَوِيّ',
      translit: ["qawiyy", "qawiyee", "qawiyii", "qawiyi", "qawieey", "qawieeee", "qawieeii", "qawieei"],
      solutions: ["qawiyy", "qawiyee", "qawiyii", "qawiyi", "qawieey", "qawieeee", "qawieeii", "qawieei"],
      translation_en: 'strong',
      dialect: 'Both',
      notes: 'Strong, powerful, or intense; pronounced 2awi in urban Levantine.'
    },
    {
      arabic: 'ضَعِيف',
      translit: ["Da3eef", "Da3iif", "Da3if", "Da3yf"],
      solutions: ["Da3eef", "Da3iif", "Da3if", "Da3yf"],
      translation_en: 'weak',
      dialect: 'Both',
      notes: 'Weak or frail; in colloquial speech also means thin/slender.'
    },
    {
      arabic: 'غَنِيّ',
      translit: ["ghaniyy", "ghaniyee", "ghaniyii", "ghaniyi", "ghanieey", "ghanieeee", "ghanieeii", "ghanieei"],
      solutions: ["ghaniyy", "ghaniyee", "ghaniyii", "ghaniyi", "ghanieey", "ghanieeee", "ghanieeii", "ghanieei"],
      translation_en: 'rich / wealthy',
      dialect: 'Both',
      notes: 'Wealthy or well-off.'
    },
    {
      arabic: 'ذَكِيّ',
      translit: ["dhakiyy", "dhakiyee", "dhakiyii", "dhakiyi", "dhakieey", "dhakieeee", "dhakieeii", "dhakieei"],
      solutions: ["dhakiyy", "dhakiyee", "dhakiyii", "dhakiyi", "dhakieey", "dhakieeee", "dhakieeii", "dhakieei"],
      translation_en: 'smart / clever',
      dialect: 'Both',
      notes: 'Clever, intelligent, or witty.'
    },
    {
      arabic: 'مُسْتَشْفَى',
      translit: ["mustashfaa", "mustashfa", "mostashfaa", "mostashfa"],
      solutions: ["mustashfaa", "mustashfa", "mostashfaa", "mostashfa"],
      translation_en: 'hospital',
      dialect: 'Both',
      notes: 'Hospital; in spoken Levantine also called مشفى (mashfa).'
    },
    {
      arabic: 'مَطَار',
      translit: ["maTaar", "maTar"],
      solutions: ["maTaar", "maTar"],
      translation_en: 'airport',
      dialect: 'Both',
      notes: 'Airfield or international airport.'
    },
    {
      arabic: 'فُنْدُق',
      translit: ["funduq", "fundu9", "fundoq", "fundo9", "fonduq", "fondu9", "fondoq", "fondo9"],
      solutions: ["funduq", "fundu9", "fundoq", "fundo9", "fonduq", "fondu9", "fondoq", "fondo9"],
      translation_en: 'hotel',
      dialect: 'Both',
      notes: 'Hotel; in spoken Levantine also very commonly called أوتيل (oteil).'
    },
    {
      arabic: 'مِفْتَاح',
      translit: ["miftaaH", "miftaa7", "miftaH", "mifta7", "meftaaH", "meftaa7", "meftaH", "mefta7"],
      solutions: ["miftaaH", "miftaa7", "miftaH", "mifta7", "meftaaH", "meftaa7", "meftaH", "mefta7"],
      translation_en: 'key',
      dialect: 'Both',
      notes: 'Key (for a door, lock, or switch); root f-t-H.'
    },
    {
      arabic: 'نَافِذَة',
      translit: ["naafidha", "naafidheh", "naafidhe", "naafidhh", "naafedha", "naafedheh", "naafedhe", "naafedhh"],
      solutions: ["naafidha", "naafidheh", "naafidhe", "naafidhh", "naafedha", "naafedheh", "naafedhe", "naafedhh"],
      translation_en: 'window',
      dialect: 'MSA',
      notes: 'Window in MSA; spoken Levantine prefers شباك (shubbaak).'
    },
    {
      arabic: 'كُرْسِيّ',
      translit: ["kursiyy", "kursiyee", "kursiyii", "kursiyi", "kursieey", "kursieeee", "kursieeii", "kursieei"],
      solutions: ["kursiyy", "kursiyee", "kursiyii", "kursiyi", "kursieey", "kursieeee", "kursieeii", "kursieei"],
      translation_en: 'chair',
      dialect: 'Both',
      notes: 'Chair, seat, or stool.'
    },
    {
      arabic: 'طَاوِلَة',
      translit: ["Taawila", "taweleh", "tawele", "tawleh", "Taawileh", "Taawile", "Taawilh", "Taawela", "Taaweleh", "Taawele", "Taawelh"],
      solutions: ["Taawila", "taweleh", "tawele", "tawleh", "Taawileh", "Taawile", "Taawilh", "Taawela", "Taaweleh", "Taawele", "Taawelh"],
      translation_en: 'table',
      dialect: 'Both',
      notes: 'Table; Italian loanword (tavola) universal across spoken Levantine and modern MSA.'
    },
    {
      arabic: 'سَرِير',
      translit: ["sareer", "sariir", "sarir", "saryr"],
      solutions: ["sareer", "sariir", "sarir", "saryr"],
      translation_en: 'bed',
      dialect: 'Both',
      notes: 'Bed in MSA; spoken Levantine very often uses تخت (takht).'
    },
    {
      arabic: 'حَقِيبَة',
      translit: ["Haqeeba", "Haqeebeh", "Haqeebe", "Haqeebh", "Haqiiba", "Haqiibeh", "Haqiibe", "Haqiibh"],
      solutions: ["Haqeeba", "Haqeebeh", "Haqeebe", "Haqeebh", "Haqiiba", "Haqiibeh", "Haqiibe", "Haqiibh"],
      translation_en: 'bag / suitcase',
      dialect: 'MSA',
      notes: 'Bag or suitcase in MSA; spoken Levantine uses شنطة (shanTa).'
    },
    {
      arabic: 'مِظَلَّة',
      translit: ["miZalla", "miZalleh", "miZalle", "miZallh", "miDHalla", "miDHalleh", "miDHalle", "miDHallh"],
      solutions: ["miZalla", "miZalleh", "miZalle", "miZallh", "miDHalla", "miDHalleh", "miDHalle", "miDHallh"],
      translation_en: 'umbrella',
      dialect: 'MSA',
      notes: 'Umbrella in MSA; spoken Levantine uses شمسية (shamsiyyeh).'
    },
    {
      arabic: 'غُرْفَة',
      translit: ["ghurfa", "ghurfeh", "ghurfe", "ghurfh", "ghorfa", "ghorfeh", "ghorfe", "ghorfh"],
      solutions: ["ghurfa", "ghurfeh", "ghurfe", "ghurfh", "ghorfa", "ghorfeh", "ghorfe", "ghorfh"],
      translation_en: 'room',
      dialect: 'Both',
      notes: 'Room; spoken Levantine pronounced ghurfe or أودة (2ooDa).'
    },
    {
      arabic: 'مَطْبَخ',
      translit: ["maTbakh", "maTba7'", "maTba5"],
      solutions: ["maTbakh", "maTba7'", "maTba5"],
      translation_en: 'kitchen',
      dialect: 'Both',
      notes: 'Kitchen or culinary workspace; root T-b-kh.'
    },
    {
      arabic: 'حَمَّام',
      translit: ["Hammaam", "Hammam", "7ammaam", "7ammam"],
      solutions: ["Hammaam", "Hammam", "7ammaam", "7ammam"],
      translation_en: 'bathroom',
      dialect: 'Both',
      notes: 'Bathroom, restroom, or traditional bathhouse.'
    },
    {
      arabic: 'شُرْفَة',
      translit: ["shurfa", "shurfeh", "shurfe", "shurfh", "shorfa", "shorfeh", "shorfe", "shorfh"],
      solutions: ["shurfa", "shurfeh", "shurfe", "shurfh", "shorfa", "shorfeh", "shorfe", "shorfh"],
      translation_en: 'balcony',
      dialect: 'MSA',
      notes: 'Balcony in MSA; spoken Levantine commonly uses بلكون (balkon).'
    },
    {
      arabic: 'سُلَّم',
      translit: ["sullam", "sollam"],
      solutions: ["sullam", "sollam"],
      translation_en: 'stairs / ladder',
      dialect: 'Both',
      notes: 'Ladder or staircase; in Levantine stairs are usually درج (daraj).'
    },
    {
      arabic: 'مِصْبَاح',
      translit: ["miSbaaH", "miSbaa7", "miSbaH", "miSba7", "meSbaaH", "meSbaa7", "meSbaH", "meSba7"],
      solutions: ["miSbaaH", "miSbaa7", "miSbaH", "miSba7", "meSbaaH", "meSbaa7", "meSbaH", "meSba7"],
      translation_en: 'lamp / light',
      dialect: 'MSA',
      notes: 'Lamp in MSA; spoken Levantine uses ضو (Daww) or لمبة (lamba).'
    },
    {
      arabic: 'حبيبي',
      translit: ["7abeebi", "7abibi", "Habeebi", "Habibi"],
      solutions: ["7abeebi", "7abibi", "Habeebi", "Habibi"],
      translation_en: 'my love / darling',
      dialect: 'Both',
      notes: 'Universal term of affection and closeness used among friends and family.'
    },
    {
      arabic: 'مَرْحَبًا',
      translit: ["mar7aba", "marhaba", "marHaba", "marhabaa", "mar7abaa", "marhaban"],
      solutions: ["mar7aba", "marhaba", "marHaba", "marhabaa", "mar7abaa", "marhaban"],
      translation_en: 'hello',
      dialect: 'Both',
      notes: 'Classic friendly greeting, pronounced marHaba in spoken Levantine.'
    },
    {
      arabic: 'أَهْلًا',
      translit: ["ahlan", "ahlaan", "2ahlan", "2ahlaan", "ahla", "2ahla"],
      solutions: ["ahlan", "ahlaan", "2ahlan", "2ahlaan", "ahla", "2ahla"],
      translation_en: 'welcome / hi',
      dialect: 'Both',
      notes: 'Short for أهلاً وسهلاً (welcome to our family/home).'
    },
    {
      arabic: 'شُكْرًا',
      translit: ["shukran", "shukraan", "shokran", "shokraan", "shukrun"],
      solutions: ["shukran", "shukraan", "shokran", "shokraan", "shukrun"],
      translation_en: 'thank you',
      dialect: 'Both',
      notes: 'Standard expression of gratitude.'
    },
    {
      arabic: 'عَفْوًا',
      translit: ["3afwan", "3afwaan", "afwan", "afwaan", "3afwun"],
      solutions: ["3afwan", "3afwaan", "afwan", "afwaan", "3afwun"],
      translation_en: 'you are welcome / excuse me',
      dialect: 'Both',
      notes: 'Standard polite response to شكراً, or excuse me.'
    },
    {
      arabic: 'يَلَّا',
      translit: ["yalla", "yallah", "yala", "yalh", "yallaa"],
      solutions: ["yalla", "yallah", "yala", "yalh", "yallaa"],
      translation_en: 'come on / let us go',
      dialect: 'Both',
      notes: 'Everyday Arabic imperative to get moving or hurry up.'
    },
    {
      arabic: 'كِيفَك',
      translit: ["keefak", "kifak", "kiifak", "kefak", "keefek"],
      solutions: ["keefak", "kifak", "kiifak", "kefak", "keefek"],
      translation_en: 'how are you (to male)',
      dialect: 'Levantine',
      notes: 'Quintessential Levantine daily greeting for a male (MSA كيف حالك).'
    },
    {
      arabic: 'كِيفِك',
      translit: ["keefik", "kifik", "kiifik", "kefik", "keefek"],
      solutions: ["keefik", "kifik", "kiifik", "kefik", "keefek"],
      translation_en: 'how are you (to female)',
      dialect: 'Levantine',
      notes: 'Quintessential Levantine daily greeting for a female (MSA كيف حالكِ).'
    },
    {
      arabic: 'شُو',
      translit: ["shu", "shoo", "shuu", "shou"],
      solutions: ["shu", "shoo", "shuu", "shou"],
      translation_en: 'what',
      dialect: 'Levantine',
      notes: 'Universal Levantine question word, equivalent to MSA ماذا or ما.'
    },
    {
      arabic: 'لَيْش',
      translit: ["laysh", "leesh", "lesh", "liish", "lees"],
      solutions: ["laysh", "leesh", "lesh", "liish", "lees"],
      translation_en: 'why',
      dialect: 'Levantine',
      notes: 'Universal Levantine question word for why, equivalent to MSA لماذا.'
    },
    {
      arabic: 'وِين',
      translit: ["ween", "wayn", "wain", "win", "wen"],
      solutions: ["ween", "wayn", "wain", "win", "wen"],
      translation_en: 'where',
      dialect: 'Levantine',
      notes: 'Universal Levantine question word for where, equivalent to MSA أين.'
    },
    {
      arabic: 'إِيمْتَى',
      translit: ["eemta", "imta", "emta", "eemtaa", "iimta"],
      solutions: ["eemta", "imta", "emta", "eemtaa", "iimta"],
      translation_en: 'when',
      dialect: 'Levantine',
      notes: 'Universal Levantine question word for when, equivalent to MSA متى.'
    },
    {
      arabic: 'كِيف',
      translit: ["keef", "kif", "kiif", "kef"],
      solutions: ["keef", "kif", "kiif", "kef"],
      translation_en: 'how',
      dialect: 'Levantine',
      notes: 'Levantine question word for how, equivalent to MSA كيف.'
    },
    {
      arabic: 'مِين',
      translit: ["meen", "min", "miin", "men"],
      solutions: ["meen", "min", "miin", "men"],
      translation_en: 'who',
      dialect: 'Levantine',
      notes: 'Universal Levantine question word for who, equivalent to MSA مَن.'
    },
    {
      arabic: 'نَعَم',
      translit: ["na3am", "naam", "na3m", "nam"],
      solutions: ["na3am", "naam", "na3m", "nam"],
      translation_en: 'yes',
      dialect: 'Both',
      notes: 'Polite/formal yes; Levantine also frequently uses إي (ee) or أيوة (aywa).'
    },
    {
      arabic: 'لَا',
      translit: ["la2", "laa", "la"],
      solutions: ["la2", "laa", "la"],
      translation_en: 'no',
      dialect: 'Both',
      notes: 'Standard negative particle; spoken Levantine often adds a glottal stop (la2).'
    },
    {
      arabic: 'طَيِّب',
      translit: ["Tayyeb", "Tayyib", "Tayeb", "Tayib", "tayyeb", "tayyib"],
      solutions: ["Tayyeb", "Tayyib", "Tayeb", "Tayib", "tayyeb", "tayyib"],
      translation_en: 'okay / good / delicious',
      dialect: 'Both',
      notes: 'Conversational staple meaning "okay / all right", or delicious for food.'
    },
    {
      arabic: 'مَاشِي',
      translit: ["maashi", "mashi", "maashy", "mashy", "mashii"],
      solutions: ["maashi", "mashi", "maashy", "mashy", "mashii"],
      translation_en: 'okay / agreed',
      dialect: 'Levantine',
      notes: 'Colloquial agreement marker, literally "walking / in motion".'
    },
    {
      arabic: 'مَبْرُوك',
      translit: ["mabrook", "mabrouk", "mabruk", "mabroook"],
      solutions: ["mabrook", "mabrouk", "mabruk", "mabroook"],
      translation_en: 'congratulations',
      dialect: 'Both',
      notes: 'Used to celebrate achievements, weddings, graduations, and purchases.'
    },
    {
      arabic: 'بِخَيْر',
      translit: ["bkhair", "bkheer", "bikhair", "bikheir", "bkheir", "bikheer"],
      solutions: ["bkhair", "bkheer", "bikhair", "bikheir", "bkheir", "bikheer"],
      translation_en: 'fine / doing well',
      dialect: 'Both',
      notes: 'Literally "in goodness"; common answer to كيفك.'
    },
    {
      arabic: 'حَبِيب',
      translit: ["Habeeb", "Habib", "7abeeb", "7abib"],
      solutions: ["Habeeb", "Habib", "7abeeb", "7abib"],
      translation_en: 'beloved / lover',
      dialect: 'Both',
      notes: 'Dear one, sweetheart, or friend.'
    },
    {
      arabic: 'حَبِيبَة',
      translit: ["Habeebeh", "Habibeh", "7abeebe", "7abibe", "habibti", "7abibti"],
      solutions: ["Habeebeh", "Habibeh", "7abeebe", "7abibe", "habibti", "7abibti"],
      translation_en: 'sweetheart (female)',
      dialect: 'Both',
      notes: 'Female beloved, darling, or sweetheart.'
    },
    {
      arabic: 'صَاحِب',
      translit: ["sa7eb", "Sa7eb", "saheb", "Saheb", "saa7ib", "Saa7ib", "saHib", "SaHib"],
      solutions: ["sa7eb", "Sa7eb", "saheb", "Saheb", "saa7ib", "Saa7ib", "saHib", "SaHib"],
      translation_en: 'friend / companion',
      dialect: 'Both',
      notes: 'Friend, boyfriend, or owner; very common in spoken Levantine.'
    },
    {
      arabic: 'إِنْسَان',
      translit: ["insaan", "insan", "ensaan", "ensan"],
      solutions: ["insaan", "insan", "ensaan", "ensan"],
      translation_en: 'human / person',
      dialect: 'Both',
      notes: 'Human being or individual.'
    },
    {
      arabic: 'أُمّ',
      translit: ["umm", "om", "um", "omm", "2umm"],
      solutions: ["umm", "om", "um", "omm", "2umm"],
      translation_en: 'mother',
      dialect: 'Both',
      notes: 'Mother; spoken Levantine often says إم (imm) or ماما (mama).'
    },
    {
      arabic: 'أَب',
      translit: ["ab", "abb", "aab", "2ab"],
      solutions: ["ab", "abb", "aab", "2ab"],
      translation_en: 'father',
      dialect: 'Both',
      notes: 'Father; spoken Levantine often says بي (bayyi) or بابا (baba).'
    },
    {
      arabic: 'أَخُو',
      translit: ["akhoo", "akhu", "akho", "akhuu", "2akhoo"],
      solutions: ["akhoo", "akhu", "akho", "akhuu", "2akhoo"],
      translation_en: 'brother (of)',
      dialect: 'Both',
      notes: 'Brother; spoken Levantine often says خي (khayyi) for my brother.'
    },
    {
      arabic: 'أُخْت',
      translit: ["okht", "ukht", "okt", "ukt", "2okht"],
      solutions: ["okht", "ukht", "okt", "ukt", "2okht"],
      translation_en: 'sister',
      dialect: 'Both',
      notes: 'Sister; spoken Levantine often says أختي (ukhti).'
    },
    {
      arabic: 'وَلَد',
      translit: ["walad", "waled", "walado", "wlad"],
      solutions: ["walad", "waled", "walado", "wlad"],
      translation_en: 'boy / child',
      dialect: 'Both',
      notes: 'Young boy, son, or child; plural ولاد (wlaad).'
    },
    {
      arabic: 'بِنْت',
      translit: ["bint", "bent", "bnt", "binet"],
      solutions: ["bint", "bent", "bnt", "binet"],
      translation_en: 'girl / daughter',
      dialect: 'Both',
      notes: 'Young girl or daughter; plural بنات (banaat).'
    },
    {
      arabic: 'مَرَة',
      translit: ["mara", "marah", "maraa", "mra"],
      solutions: ["mara", "marah", "maraa", "mra"],
      translation_en: 'woman / wife',
      dialect: 'Levantine',
      notes: 'Spoken Levantine term for woman or wife, from classical امرأة (imra2a).'
    },
    {
      arabic: 'زَلَمَة',
      translit: ["zalameh", "zalemeh", "zalame", "zalami"],
      solutions: ["zalameh", "zalemeh", "zalame", "zalami"],
      translation_en: 'man / guy',
      dialect: 'Levantine',
      notes: 'Signature Levantine colloquial term for a man, equivalent to MSA رجل.'
    },
    {
      arabic: 'جَار',
      translit: ["jaar", "jar", "jarr"],
      solutions: ["jaar", "jar", "jarr"],
      translation_en: 'neighbor',
      dialect: 'Both',
      notes: 'Neighbor; cultural pillar of Levantine community life.'
    },
    {
      arabic: 'ضَيْف',
      translit: ["Dayf", "Daif", "Dayef", "Deef"],
      solutions: ["Dayf", "Daif", "Dayef", "Deef"],
      translation_en: 'guest',
      dialect: 'Both',
      notes: 'Guest or visitor; core to Middle Eastern hospitality traditions.'
    },
    {
      arabic: 'نَاس',
      translit: ["naas", "nas", "naass"],
      solutions: ["naas", "nas", "naass"],
      translation_en: 'people',
      dialect: 'Both',
      notes: 'People, folk, or crowd.'
    },
    {
      arabic: 'شَرِيك',
      translit: ["shareek", "shariik", "sharik", "sharyk"],
      solutions: ["shareek", "shariik", "sharik", "sharyk"],
      translation_en: 'partner / buddy',
      dialect: 'Both',
      notes: 'Partner in business or colloquial friendly address ("buddy").'
    },
    {
      arabic: 'أُسْتَاذ',
      translit: ["ustaaz", "ustaz", "ostaz", "ostadh"],
      solutions: ["ustaaz", "ustaz", "ostaz", "ostadh"],
      translation_en: 'professor / teacher',
      dialect: 'Both',
      notes: 'Teacher, lecturer, or polite formal honorific ("Mister").'
    },
    {
      arabic: 'مَامَا',
      translit: ["mama", "mamma", "maama", "mamaa"],
      solutions: ["mama", "mamma", "maama", "mamaa"],
      translation_en: 'mom',
      dialect: 'Both',
      notes: 'Affectionate word for mother across dialects.'
    },
    {
      arabic: 'بَابَا',
      translit: ["baba", "babba", "baaba", "babaa"],
      solutions: ["baba", "babba", "baaba", "babaa"],
      translation_en: 'dad',
      dialect: 'Both',
      notes: 'Affectionate word for father across dialects.'
    },
    {
      arabic: 'شُبَّاك',
      translit: ["shubbaak", "shubbak", "shobbaak", "shobbak", "shubaak", "shobak"],
      solutions: ["shubbaak", "shubbak", "shobbaak", "shobbak", "shubaak", "shobak"],
      translation_en: 'window',
      dialect: 'Both',
      notes: 'Everyday term for window in Levantine and Egyptian dialects.'
    },
    {
      arabic: 'أَكْل',
      translit: ["akl", "akel", "akal"],
      solutions: ["akl", "akel", "akal"],
      translation_en: 'food / eating',
      dialect: 'Both',
      notes: 'Food, dishes, or the act of dining.'
    },
    {
      arabic: 'مِي',
      translit: ["mai", "may", "moy", "moye", "maii"],
      solutions: ["mai", "may", "moy", "moye", "maii"],
      translation_en: 'water',
      dialect: 'Levantine',
      notes: 'Spoken Levantine form of MSA مَاء (maa2).'
    },
    {
      arabic: 'مَشْرُوب',
      translit: ["mashroob", "mashrub", "mashroub", "mashrob", "mashruub"],
      solutions: ["mashroob", "mashrub", "mashroub", "mashrob", "mashruub"],
      translation_en: 'drink / beverage',
      dialect: 'Both',
      notes: 'Any beverage or drink.'
    },
    {
      arabic: 'شُغْل',
      translit: ["shughl", "shoghl", "shughul", "shoghol", "shughol"],
      solutions: ["shughl", "shoghl", "shughul", "shoghol", "shughol"],
      translation_en: 'work / task',
      dialect: 'Both',
      notes: 'Daily labor, employment, or task; "شو شغلك؟" = what is your job?'
    },
    {
      arabic: 'طَبَق',
      translit: ["Taba2", "Tabaq", "Taba9", "Taba", "Tabak"],
      solutions: ["Taba2", "Tabaq", "Taba9", "Taba", "Tabak"],
      translation_en: 'plate / dish',
      dialect: 'Both',
      notes: 'Dish or course; also صحن (SaHn) in Levantine.'
    },
    {
      arabic: 'شَنْطَة',
      translit: ["shanTa", "shanta", "shanTah", "shantah", "shanTeh"],
      solutions: ["shanTa", "shanta", "shanTah", "shantah", "shanTeh"],
      translation_en: 'bag / purse',
      dialect: 'Both',
      notes: 'Everyday backpack, purse, or suitcase across Levantine dialects.'
    },
    {
      arabic: 'جَزْمَة',
      translit: ["jazma", "jazmeh", "jazme", "jazzma", "jazmah"],
      solutions: ["jazma", "jazmeh", "jazme", "jazzma", "jazmah"],
      translation_en: 'shoes / boots',
      dialect: 'Both',
      notes: 'Footwear / boots in spoken dialects; MSA حذاء (Hidhaa2).'
    },
    {
      arabic: 'بَنْطَرُون',
      translit: ["banTalon", "bantalon", "bantroun", "banTroun", "bantaloun"],
      solutions: ["banTalon", "bantalon", "bantroun", "banTroun", "bantaloun"],
      translation_en: 'pants / trousers',
      dialect: 'Both',
      notes: 'Trousers; French loanword (pantalon) naturalized in Arabic.'
    },
    {
      arabic: 'قَمِيص',
      translit: ["qameeS", "qamiis", "qamis", "9ameeS", "9amiis", "9amis"],
      solutions: ["qameeS", "qamiis", "qamis", "9ameeS", "9amiis", "9amis"],
      translation_en: 'shirt',
      dialect: 'Both',
      notes: 'Buttoned shirt; root q-m-S.'
    },
    {
      arabic: 'مَصَارِي',
      translit: ["maSaari", "masari", "maSaary", "masary", "maSari"],
      solutions: ["maSaari", "masari", "maSaary", "masary", "maSari"],
      translation_en: 'money',
      dialect: 'Levantine',
      notes: 'Quintessential Levantine word for money/cash (from Ottoman Egyptian piastres).'
    },
    {
      arabic: 'زَيْت',
      translit: ["zayt", "zeit", "zayet", "zait"],
      solutions: ["zayt", "zeit", "zayet", "zait"],
      translation_en: 'oil',
      dialect: 'Both',
      notes: 'Cooking oil; زيت زيتون is Palestinian/Lebanese cold-pressed olive oil.'
    },
    {
      arabic: 'سُكَّر',
      translit: ["sukkar", "sokkar", "sukar", "soker"],
      solutions: ["sukkar", "sokkar", "sukar", "soker"],
      translation_en: 'sugar',
      dialect: 'Both',
      notes: 'Sugar; root of English "sugar" via Arabic sukkar.'
    },
    {
      arabic: 'مِلْح',
      translit: ["milH", "melH", "mil7", "mel7"],
      solutions: ["milH", "melH", "mil7", "mel7"],
      translation_en: 'salt',
      dialect: 'Both',
      notes: 'Table salt or seasoning.'
    },
    {
      arabic: 'بَصَل',
      translit: ["baSal", "basal", "baSel", "basel"],
      solutions: ["baSal", "basal", "baSel", "basel"],
      translation_en: 'onions',
      dialect: 'Both',
      notes: 'Onions (collective noun).'
    },
    {
      arabic: 'بَنَدُورَة',
      translit: ["banadoora", "bandoora", "banadoura", "banadoreh"],
      solutions: ["banadoora", "bandoora", "banadoura", "banadoreh"],
      translation_en: 'tomatoes',
      dialect: 'Levantine',
      notes: 'Tomatoes in Levantine Arabic (from Italian pomodoro); MSA uses طماطم.'
    },
    {
      arabic: 'بَطَاطَا',
      translit: ["baTaTa", "batata", "baTaata", "bataata"],
      solutions: ["baTaTa", "batata", "baTaata", "bataata"],
      translation_en: 'potatoes',
      dialect: 'Both',
      notes: 'Potatoes or french fries.'
    },
    {
      arabic: 'دَجَاج',
      translit: ["dajaaj", "dajaj", "djaaj"],
      solutions: ["dajaaj", "dajaj", "djaaj"],
      translation_en: 'chicken',
      dialect: 'Both',
      notes: 'Chicken; pronounced جاج (jaaj) in spoken Levantine.'
    },
    {
      arabic: 'كْبِير',
      translit: ["kbeer", "kbiir", "kabir", "kabeer"],
      solutions: ["kbeer", "kbiir", "kabir", "kabeer"],
      translation_en: 'big / large',
      dialect: 'Levantine',
      notes: 'Levantine pronunciation with initial consonant cluster of MSA كَبِير.'
    },
    {
      arabic: 'زْغِير',
      translit: ["zgheer", "zghiir", "zghir", "zagher", "zgeer"],
      solutions: ["zgheer", "zghiir", "zghir", "zagher", "zgeer"],
      translation_en: 'small / little',
      dialect: 'Levantine',
      notes: 'Levantine pronunciation with initial consonant cluster of MSA صَغِير.'
    },
    {
      arabic: 'مْنِيح',
      translit: ["mnee7", "mneeH", "mnii7", "mniiH", "mni7", "mniH"],
      solutions: ["mnee7", "mneeH", "mnii7", "mniiH", "mni7", "mniH"],
      translation_en: 'good / well',
      dialect: 'Levantine',
      notes: 'Quintessential Levantine adjective for good or doing well, equivalent to MSA جَيِّد.'
    },
    {
      arabic: 'حِلْو',
      translit: ["hilw", "Helw", "7elw", "7ilw", "hilu", "7ilu"],
      solutions: ["hilw", "Helw", "7elw", "7ilw", "hilu", "7ilu"],
      translation_en: 'sweet / beautiful',
      dialect: 'Both',
      notes: 'Sweet (food) or beautiful/handsome/nice (person or situation).'
    },
    {
      arabic: 'رَخِيص',
      translit: ["rakheeS", "rakhiis", "rakhiS", "rakhees", "rakees"],
      solutions: ["rakheeS", "rakhiis", "rakhiS", "rakhees", "rakees"],
      translation_en: 'cheap / affordable',
      dialect: 'Both',
      notes: 'Low in price or affordable.'
    },
    {
      arabic: 'غَالِي',
      translit: ["ghaali", "ghali", "ghaaly", "ghaly", "3'aali", "3'ali"],
      solutions: ["ghaali", "ghali", "ghaaly", "ghaly", "3'aali", "3'ali"],
      translation_en: 'expensive / precious',
      dialect: 'Both',
      notes: 'High in price, or dear / beloved to one heart.'
    },
    {
      arabic: 'نَظِيف',
      translit: ["naZeef", "naZiif", "nazif", "naDHeef", "naDHiif", "nadHeef"],
      solutions: ["naZeef", "naZiif", "nazif", "naDHeef", "naDHiif", "nadHeef"],
      translation_en: 'clean / tidy',
      dialect: 'Both',
      notes: 'Clean or spotless; pronounced nDeef in Levantine.'
    },
    {
      arabic: 'وَسِخ',
      translit: ["wisi5", "wese5", "wesekh", "wiskh", "wisekh"],
      solutions: ["wisi5", "wese5", "wesekh", "wiskh", "wisekh"],
      translation_en: 'dirty',
      dialect: 'Both',
      notes: 'Dirty or soiled; pronounced wisikh/wisi5 in Levantine.'
    },
    {
      arabic: 'حَار',
      translit: ["Haar", "Harr", "7aar", "7arr"],
      solutions: ["Haar", "Harr", "7aar", "7arr"],
      translation_en: 'hot / spicy',
      dialect: 'Both',
      notes: 'Hot weather, boiling temperature, or spicy food.'
    },
    {
      arabic: 'بَارِد',
      translit: ["baarid", "barid", "baared", "bared", "berid"],
      solutions: ["baarid", "barid", "baared", "bared", "berid"],
      translation_en: 'cold',
      dialect: 'Both',
      notes: 'Cold weather, chilly room, or iced drink.'
    },
    {
      arabic: 'جَاهِز',
      translit: ["jaahiz", "jahiz", "jahez", "jahz"],
      solutions: ["jaahiz", "jahiz", "jahez", "jahz"],
      translation_en: 'ready / prepared',
      dialect: 'Both',
      notes: 'Ready, set, or prepared for action.'
    },
    {
      arabic: 'مَشْغُول',
      translit: ["mashghool", "mashghul", "mashghoul", "mashghol"],
      solutions: ["mashghool", "mashghul", "mashghoul", "mashghol"],
      translation_en: 'busy / occupied',
      dialect: 'Both',
      notes: 'Busy, engaged, or tied up with work.'
    },
    {
      arabic: 'تَعْبَان',
      translit: ["ta3baan", "ta3ban", "ta3baen", "ta3bane"],
      solutions: ["ta3baan", "ta3ban", "ta3baen", "ta3bane"],
      translation_en: 'tired / exhausted',
      dialect: 'Both',
      notes: 'Weary, fatigued, or feeling under the weather.'
    },
    {
      arabic: 'جَوْعَان',
      translit: ["jaw3aan", "jaw3an", "joo3aan", "joo3an"],
      solutions: ["jaw3aan", "jaw3an", "joo3aan", "joo3an"],
      translation_en: 'hungry',
      dialect: 'Both',
      notes: 'Hungry / famished; root j-w-3.'
    },
    {
      arabic: 'عَطْشَان',
      translit: ["3aTshaan", "3aTshan", "3atshaan", "3atshan"],
      solutions: ["3aTshaan", "3aTshan", "3atshaan", "3atshan"],
      translation_en: 'thirsty',
      dialect: 'Both',
      notes: 'Thirsty; root 3-T-sh.'
    },
    {
      arabic: 'زَعْلَان',
      translit: ["za3laan", "za3lan", "za3leen", "za3lane"],
      solutions: ["za3laan", "za3lan", "za3leen", "za3lane"],
      translation_en: 'upset / annoyed',
      dialect: 'Levantine',
      notes: 'Everyday Levantine for upset, sad, or hurt, equivalent to MSA حزين / غاضب.'
    },
    {
      arabic: 'مَبْسُوط',
      translit: ["mabSooT", "mabsut", "mabsoot", "mabSout", "mabsout"],
      solutions: ["mabSooT", "mabsut", "mabsoot", "mabSout", "mabsout"],
      translation_en: 'happy / pleased',
      dialect: 'Levantine',
      notes: 'Quintessential Levantine expression for happy or content, equivalent to MSA سعيد.'
    },
    {
      arabic: 'قَرِيب',
      translit: ["qareeb", "qariib", "qarib", "9areeb", "9ariib", "9arib"],
      solutions: ["qareeb", "qariib", "qarib", "9areeb", "9ariib", "9arib"],
      translation_en: 'close / near',
      dialect: 'Both',
      notes: 'Close in distance or a relative; pronounced 2areeb in urban Levantine.'
    },
    {
      arabic: 'بَعِيد',
      translit: ["ba3eed", "ba3iid", "ba3id", "b3eed", "b3iid"],
      solutions: ["ba3eed", "ba3iid", "ba3id", "b3eed", "b3iid"],
      translation_en: 'far / distant',
      dialect: 'Both',
      notes: 'Far away or remote.'
    },
    {
      arabic: 'كْتِير',
      translit: ["kteer", "ktiir", "kter", "kateer"],
      solutions: ["kteer", "ktiir", "kter", "kateer"],
      translation_en: 'very / a lot',
      dialect: 'Levantine',
      notes: 'Everyday Levantine intensifier and quantity word, equivalent to MSA كثير.'
    },
    {
      arabic: 'شْوَيْ',
      translit: ["shway", "shwayy", "shwai", "shwaya", "shwoy"],
      solutions: ["shway", "shwayy", "shwai", "shwaya", "shwoy"],
      translation_en: 'a little / a bit',
      dialect: 'Levantine',
      notes: 'Spoken Levantine diminutive for a small amount or "just a moment".'
    },
    {
      arabic: 'نَشِيط',
      translit: ["nasheeT", "nashiT", "nasheet", "nashit"],
      solutions: ["nasheeT", "nashiT", "nasheet", "nashit"],
      translation_en: 'active / energetic',
      dialect: 'Both',
      notes: 'Lively, energetic, or vigorous.'
    },
    {
      arabic: 'رَاح',
      translit: ["raa7", "ra7", "raaH", "raH"],
      solutions: ["raa7", "ra7", "raaH", "raH"],
      translation_en: 'went / to go',
      dialect: 'Both',
      notes: 'Past verb ("he went"); in Levantine also forms the future prefix (رح / رح روح).'
    },
    {
      arabic: 'إِجَا',
      translit: ["ija", "eja", "2ija", "2eja", "aja", "ijaa"],
      solutions: ["ija", "eja", "2ija", "2eja", "aja", "ijaa"],
      translation_en: 'came / arrived',
      dialect: 'Levantine',
      notes: 'Levantine past tense verb for he came, equivalent to MSA جَاءَ.'
    },
    {
      arabic: 'شَاف',
      translit: ["shaaf", "shaf", "shoof", "shouf"],
      solutions: ["shaaf", "shaf", "shoof", "shouf"],
      translation_en: 'saw / looked',
      dialect: 'Levantine',
      notes: 'Universal spoken Levantine verb for he saw, equivalent to MSA رَأَى.'
    },
    {
      arabic: 'عِمِل',
      translit: ["3imil", "3emel", "3mil", "3mel", "3amal"],
      solutions: ["3imil", "3emel", "3mil", "3mel", "3amal"],
      translation_en: 'did / made',
      dialect: 'Levantine',
      notes: 'Spoken Levantine past tense verb for he did or made (MSA عَمِلَ).'
    },
    {
      arabic: 'حَكَى',
      translit: ["Haka", "7aka", "Hakaa", "7akaa", "Hake"],
      solutions: ["Haka", "7aka", "Hakaa", "7akaa", "Hake"],
      translation_en: 'spoke / told',
      dialect: 'Levantine',
      notes: 'Common Levantine verb for speaking or chatting, equivalent to MSA تَكَلَّمَ.'
    },
    {
      arabic: 'فَهِم',
      translit: ["fihim", "fehem", "fhim", "fhem", "fihem"],
      solutions: ["fihim", "fehem", "fhim", "fhem", "fihem"],
      translation_en: 'understood',
      dialect: 'Both',
      notes: 'Past tense verb ("he understood"); pronounced fihim in Levantine.'
    },
    {
      arabic: 'بَدُّو',
      translit: ["baddo", "bado", "biddo", "bido", "baddoo"],
      solutions: ["baddo", "bado", "biddo", "bido", "baddoo"],
      translation_en: 'he wants',
      dialect: 'Levantine',
      notes: 'Levantine expression for he wants / he needs (b-d-d stem).'
    },
    {
      arabic: 'بدي',
      translit: ['baddi', 'beddi', 'badi', 'biddi', 'bidi'],
      solutions: ['baddi', 'beddi', 'badi', 'biddi', 'bidi'],
      translation_en: 'I want / I need',
      dialect: 'Levantine',
      notes: 'Spoken Levantine staple, equivalent to MSA أريد'
    },
    {
      arabic: 'بَدِّي',
      translit: ["baddi", "badi", "biddi", "bidi", "baddii", "beddi"],
      solutions: ["baddi", "badi", "biddi", "bidi", "baddii", "beddi"],
      translation_en: 'I want / I need',
      dialect: 'Levantine',
      notes: 'Spoken Levantine staple, equivalent to MSA أريد.'
    },
    {
      arabic: 'عِنْدُو',
      translit: ["3indo", "3endu", "3ndo", "3ndu", "3indoo"],
      solutions: ["3indo", "3endu", "3ndo", "3ndu", "3indoo"],
      translation_en: 'he has',
      dialect: 'Levantine',
      notes: 'Levantine spoken expression of possession ("he has / with him").'
    },
    {
      arabic: 'عِنْدِي',
      translit: ["3indi", "3endi", "3ndi", "3nde", "3indii"],
      solutions: ["3indi", "3endi", "3ndi", "3nde", "3indii"],
      translation_en: 'I have',
      dialect: 'Both',
      notes: 'Expression of possession ("I have / with me").'
    },
    {
      arabic: 'بِحِبّ',
      translit: ["bHibb", "b7ibb", "baHibb", "ba7ibb", "bHebb", "b7ebb"],
      solutions: ["bHibb", "b7ibb", "baHibb", "ba7ibb", "bHebb", "b7ebb"],
      translation_en: 'I love / like',
      dialect: 'Levantine',
      notes: 'Spoken Levantine present tense with the b-prefix (بـ), equivalent to MSA أُحِبّ.'
    },
    {
      arabic: 'اِشْتَرَى',
      translit: ["ishtara", "eshtara", "2ishtara", "2eshtara", "shtara", "ishtaraa"],
      solutions: ["ishtara", "eshtara", "2ishtara", "2eshtara", "shtara", "ishtaraa"],
      translation_en: 'bought',
      dialect: 'Both',
      notes: 'Past tense verb ("he bought / purchased").'
    },
    {
      arabic: 'دَفَع',
      translit: ["dafa3", "dafe3", "dafa", "daf3"],
      solutions: ["dafa3", "dafe3", "dafa", "daf3"],
      translation_en: 'paid',
      dialect: 'Both',
      notes: 'Past tense verb ("he paid money / settled a bill").'
    },
    {
      arabic: 'سَكَّر',
      translit: ["sakkar", "sakker", "sakar"],
      solutions: ["sakkar", "sakker", "sakar"],
      translation_en: 'closed / shut',
      dialect: 'Levantine',
      notes: 'Everyday spoken Levantine verb for closing a door or window (MSA أغلق).'
    },
    {
      arabic: 'نَظَّف',
      translit: ["naZZaf", "nazzaf", "naDHaf", "nadHaf", "nazaf"],
      solutions: ["naZZaf", "nazzaf", "naDHaf", "nadHaf", "nazaf"],
      translation_en: 'cleaned',
      dialect: 'Both',
      notes: 'Past tense verb ("he cleaned / tidied up").'
    },
    {
      arabic: 'اِسْتَمَع',
      translit: ["istama3", "estama3", "2istama3", "stama3", "istame3"],
      solutions: ["istama3", "estama3", "2istama3", "stama3", "istame3"],
      translation_en: 'listened',
      dialect: 'Both',
      notes: 'Past tense verb ("he listened / tuned in").'
    },
    {
      arabic: 'جَاب',
      translit: ["jaab", "jab", "jeb"],
      solutions: ["jaab", "jab", "jeb"],
      translation_en: 'brought / fetched',
      dialect: 'Levantine',
      notes: 'Universal spoken Levantine verb for he brought or fetched, equivalent to MSA أَحْضَرَ.'
    },
    {
      arabic: 'بُكْرَة',
      translit: ["bukra", "bokra", "bukrah", "bokrah", "bukraa"],
      solutions: ["bukra", "bokra", "bukrah", "bokrah", "bukraa"],
      translation_en: 'tomorrow',
      dialect: 'Levantine',
      notes: 'Everyday Levantine for tomorrow, equivalent to MSA غَدًا.'
    },
    {
      arabic: 'مْبَارِح',
      translit: ["mbaariH", "mbare7", "mbariH", "mbar7", "mbareH"],
      solutions: ["mbaariH", "mbare7", "mbariH", "mbar7", "mbareH"],
      translation_en: 'yesterday',
      dialect: 'Levantine',
      notes: 'Spoken Levantine for yesterday, equivalent to MSA أَمْس.'
    },
    {
      arabic: 'الْيَوْم',
      translit: ["alyawm", "elyawm", "lyawm", "lyom", "alyom"],
      solutions: ["alyawm", "elyawm", "lyawm", "lyom", "alyom"],
      translation_en: 'today',
      dialect: 'Both',
      notes: 'Today / the current day.'
    },
    {
      arabic: 'هَلَّق',
      translit: ["halla2", "halla", "hallaq", "halla9"],
      solutions: ["halla2", "halla", "hallaq", "halla9"],
      translation_en: 'now / right now',
      dialect: 'Levantine',
      notes: 'Signature Levantine (Lebanese/Syrian) word for right now, equivalent to MSA الآن.'
    },
    {
      arabic: 'هَيْك',
      translit: ["hayk", "heik", "haik", "hayek"],
      solutions: ["hayk", "heik", "haik", "hayek"],
      translation_en: 'like this / this way',
      dialect: 'Levantine',
      notes: 'Signature Levantine adverb meaning "like this", "so", or "just because".'
    }
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
    'أَنَا أُحِبُّ هَذَا الْكِتَاب.',
    'صَبَاح الْخَيْر.',
    'صَبَاح النُّور.',
    'مَسَاء الْخَيْر.',
    'كِيفَك؟',
    'شُو أَخْبَارَك؟',
    'الْحَمْدُ لِلَّه.',
    'إِنْ شَاءَ اللَّه.',
    'يَلَّا بِنَا.',
    'شُكْرًا كْتِير.',
    'مَا فِي مُشْكِلَة.',
    'شُو اسْمَك؟',
    'وَيْن الْمَطْعَم؟',
    'أَنَا جَوْعَان.',
    'بِدِّي مَاء.'
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

  var WORD_MAP = Object.create(null);

  function stripArabicDiacritics(text) {
    if (!text) return '';
    return String(text).replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
  }

  function indexWords() {
    for (var i = 0; i < WORDS.length; i += 1) {
      var w = WORDS[i];
      if (!w || !w.arabic) continue;
      if (!WORD_MAP[w.arabic]) {
        WORD_MAP[w.arabic] = w;
      }
      var stripped = stripArabicDiacritics(w.arabic);
      if (!WORD_MAP[stripped]) {
        WORD_MAP[stripped] = w;
      }
    }
  }

  indexWords();

  function lookupWord(arabic) {
    if (!arabic) return null;
    var raw = String(arabic).trim();
    if (WORD_MAP[raw]) return WORD_MAP[raw];
    var stripped = stripArabicDiacritics(raw);
    return WORD_MAP[stripped] || null;
  }

  global.HarfData = {
    WORDS: WORDS.slice(),
    PHRASES: PHRASES.slice(),
    CONSONANTS: CONSONANTS.slice(),
    letterDrills: letterDrills,
    arabicDrills: arabicDrills,
    pickWords: pickWords,
    pickPhrase: pickPhrase,
    lookupWord: lookupWord,
    shuffle: shuffle
  };
})(window);
