/*!
 * Harf — practice content
 * Each word pairs vocalized Arabic with one or more accepted Arabizi
 * spellings. The transliteration engine expands additional dialect variants
 * (long vowels, taa marbuta, hamza, and emphatic aliases) at runtime.
 */
(function (global) {
  'use strict';

  var WORDS = [
    { arabic: 'كِتَاب', solutions: ['kitaab', 'kitab', 'ketaab', 'ketab'] },
    { arabic: 'قَلَم', solutions: ['qalam', '9alam'] },
    { arabic: 'بَاب', solutions: ['baab', 'bab'] },
    { arabic: 'بَيْت', solutions: ['bayt', 'beit', 'bait', 'beet', 'baeet', 'baiit'] },
    { arabic: 'مَدْرَسَة', solutions: ['madrasa', 'madraseh', 'madrase', 'madrash'] },
    { arabic: 'جَامِعَة', solutions: ['jaami3a', 'jaami3eh', 'jaami3e', 'jaami3h', 'jaame3a', 'jaame3eh', 'jaame3e', 'jaame3h'] },
    { arabic: 'طَالِب', solutions: ['Taleb', 'Talib', 'Taaleb', 'Taalib'] },
    { arabic: 'طَالِبَة', solutions: ['Taaliba', 'Taalibeh', 'Taalibe', 'Taalibh', 'Taaleba', 'Taalebeh', 'Taalebe', 'Taalebh'] },
    { arabic: 'مُعَلِّم', solutions: ['mu3allim', 'mu3allem', 'mo3allim', 'mo3allem'] },
    { arabic: 'مُعَلِّمَة', solutions: ['mu3allima', 'mu3allimeh', 'mu3allime', 'mu3allimh', 'mu3allema', 'mu3allemeh', 'mu3alleme', 'mu3allemh'] },
    { arabic: 'صَدِيق', solutions: ['Sadeeq', 'Sadee9', 'sadee2', 'Sadee2', 'Sadiiq', 'Sadii9', 'Sadiq', 'Sadi9', 'Sadyq', 'Sady9'] },
    { arabic: 'عَائِلَة', solutions: ['3aa2ila', '3aa2ileh', '3aa2ile', '3aa2ilh', '3aa2ela', '3aa2eleh', '3aa2ele', '3aa2elh'] },
    { arabic: 'خُبْز', solutions: ['khubz', 'khobz', '7\'ubz', '7\'obz', '5ubz', '5obz'] },
    { arabic: 'حَلِيب', solutions: ['Haleeb', 'Haliib', 'Halib', 'Halyb', '7aleeb', '7aliib', '7alib', '7alyb'] },
    { arabic: 'قَهْوَة', solutions: ['qahwa', 'qahweh', 'qahwe', 'qahwh', 'qahooa', 'qahooeh', 'qahooe', 'qahooh'] },
    { arabic: 'شَاي', solutions: ['shaay', 'shaaee', 'shaaii', 'shaai', 'shay', 'shaee', 'shaii', 'shai'] },
    { arabic: 'سَمَك', solutions: ['samak', 'samek', 'smak'] },
    { arabic: 'لَحْم', solutions: ['laHm', 'la7m'] },
    { arabic: 'فَاكِهَة', solutions: ['faakiha', 'faakiheh', 'faakihe', 'faakihh', 'faakeha', 'faakeheh', 'faakehe', 'faakehh'] },
    { arabic: 'تُفَّاح', solutions: ['tuffaaH', 'tuffaa7', 'tuffaH', 'tuffa7', 'toffaaH', 'toffaa7', 'toffaH', 'toffa7'] },
    { arabic: 'مَوْز', solutions: ['mawz', 'maooz', 'mauuz', 'mauz'] },
    { arabic: 'عَصِير', solutions: ['3aSeer', '3aSiir', '3aSir', '3aSyr'] },
    { arabic: 'مَطْعَم', solutions: ['maT3am', 'mat3am', 'maT3em', 'mat3em'] },
    { arabic: 'مَكْتَب', solutions: ['maktab', 'makteb', 'mekteb'] },
    { arabic: 'مَسْجِد', solutions: ['masjid', 'masjed'] },
    { arabic: 'شَارِع', solutions: ['shaari3', 'shaare3', 'shari3', 'share3'] },
    { arabic: 'مَدِينَة', solutions: ['madineh', 'madiineh', 'madina', 'madiina'] },
    { arabic: 'قَرْيَة', solutions: ['qarya', 'qaryeh', 'qarye', 'qaryh', 'qareea', 'qareeeh', 'qareee', 'qareeh'] },
    { arabic: 'بِلَاد', solutions: ['bilaad', 'bilad', 'belaad', 'belad'] },
    { arabic: 'عَالَم', solutions: ['3aalam', '3alam'] },
    { arabic: 'شَمْس', solutions: ['shams', 'shems'] },
    { arabic: 'قَمَر', solutions: ['qamar', '9amar', 'gamar'] },
    { arabic: 'نَجْم', solutions: ['najm', 'najem', 'negm'] },
    { arabic: 'بَحْر', solutions: ['baHr', 'ba7r', 'bahr'] },
    { arabic: 'جَبَل', solutions: ['jabal', 'jabel', 'jbal'] },
    { arabic: 'نَهْر', solutions: ['nahr', 'nehr', 'nhar'] },
    { arabic: 'زَهْرَة', solutions: ['zahra', 'zahrah', 'zahraa'] },
    { arabic: 'شَجَرَة', solutions: ['shajara', 'shajareh', 'shajare', 'shajarh'] },
    { arabic: 'سَيَّارَة', solutions: ['sayyaara', 'sayyaareh', 'sayyaare', 'sayyaarh', 'sayyara', 'sayyareh', 'sayyare', 'sayyarh'] },
    { arabic: 'طَائِرَة', solutions: ['Taa2ira', 'Taa2ireh', 'Taa2ire', 'Taa2irh', 'Taa2era', 'Taa2ereh', 'Taa2ere', 'Taa2erh'] },
    { arabic: 'قِطَار', solutions: ['qiTaar', 'qiTar', 'qeTaar', 'qeTar', '9iTaar', '9iTar', '9eTaar', '9eTar'] },
    { arabic: 'حَافِلَة', solutions: ['Haafila', 'Haafileh', 'Haafile', 'Haafilh', 'Haafela', 'Haafeleh', 'Haafele', 'Haafelh'] },
    { arabic: 'دَرَّاجَة', solutions: ['darraaja', 'darraajeh', 'darraaje', 'darraajh', 'darraja', 'darrajeh', 'darraje', 'darrajh'] },
    { arabic: 'يَوْم', solutions: ['yawm', 'yaoom', 'yauum', 'yaum', 'eeawm', 'eeaoom', 'eeauum', 'eeaum'] },
    { arabic: 'لَيْل', solutions: ['layl', 'laeel', 'laiil', 'lail'] },
    { arabic: 'صَبَاح', solutions: ['SabaaH', 'Sabaa7', 'SabaH', 'Saba7'] },
    { arabic: 'أُسْبُوع', solutions: ['2usboo3', '2usbuu3', '2usbu3', '2usbw3', '2osboo3', '2osbuu3', '2osbu3', '2osbw3'] },
    { arabic: 'شَهْر', solutions: ['shahr', 'shahar', 'shher'] },
    { arabic: 'سَنَة', solutions: ['sana', 'saneh', 'sane', 'sanh'] },
    { arabic: 'وَقْت', solutions: ['waqt', 'wa9t', 'ooaqt', 'ooa9t', 'uuaqt', 'uua9t', 'uaqt', 'ua9t'] },
    { arabic: 'سَاعَة', solutions: ['saa3a', 'saa3eh', 'saa3e', 'saa3h', 'sa3a', 'sa3eh', 'sa3e', 'sa3h'] },
    { arabic: 'دَقِيقَة', solutions: ['daqeeqa', 'daqeeqeh', 'daqeeqe', 'daqeeqh', 'daqee9a', 'daqee9eh', 'daqee9e', 'daqee9h'] },
    { arabic: 'طَعَام', solutions: ['Ta3aam', 'Ta3am'] },
    { arabic: 'سُوق', solutions: ['sooq', 'soo9', 'suuq', 'suu9', 'suq', 'su9', 'swq', 'sw9'] },
    { arabic: 'مَال', solutions: ['maal', 'mal'] },
    { arabic: 'عَمَل', solutions: ['3amal', 'amal', '3amel'] },
    { arabic: 'لُغَة', solutions: ['lugha', 'lugheh', 'lughe', 'lughh', 'lu3\'a', 'lu3\'eh', 'lu3\'e', 'lu3\'h'] },
    { arabic: 'كَلِمَة', solutions: ['kalima', 'kalimeh', 'kalime', 'kalimh', 'kalema', 'kalemeh', 'kaleme', 'kalemh'] },
    { arabic: 'جُمْلَة', solutions: ['jumla', 'jumleh', 'jumle', 'jumlh', 'jomla', 'jomleh', 'jomle', 'jomlh'] },
    { arabic: 'سُؤَال', solutions: ['su2aal', 'su2al', 'suaaal', 'suaal', 'sual', 'so2aal', 'so2al', 'soaaal'] },
    { arabic: 'جَوَاب', solutions: ['jawaab', 'jawab', 'jaooaab', 'jaooab', 'jauuaab', 'jauuab', 'jauaab', 'jauab'] },
    { arabic: 'رَقْم', solutions: ['raqm', 'ra9m'] },
    { arabic: 'اِسْم', solutions: ['ism', 'esm'] },
    { arabic: 'صُورَة', solutions: ['Soora', 'Sooreh', 'Soore', 'Soorh', 'Suura', 'Suureh', 'Suure', 'Suurh'] },
    { arabic: 'هَاتِف', solutions: ['haatif', 'haatef', 'hatif', 'hatef'] },
    { arabic: 'حَاسُوب', solutions: ['Haasoob', 'Haasuub', 'Haasub', 'Haaswb', 'Hasoob', 'Hasuub', 'Hasub', 'Haswb'] },
    { arabic: 'كِتَابَة', solutions: ['kitaaba', 'kitaabeh', 'kitaabe', 'kitaabh', 'kitaba', 'kitabeh', 'kitabe', 'kitabh'] },
    { arabic: 'قِرَاءَة', solutions: ['qiraa2a', 'qiraa2eh', 'qiraa2e', 'qiraa2h', 'qiraaaa', 'qiraaaeh', 'qiraaae', 'qiraaah'] },
    { arabic: 'مُوسِيقَى', solutions: ['mooseeqaa', 'mooseeqa', 'moosee9aa', 'moosee9a', 'moosiiqaa', 'moosiiqa', 'moosii9aa', 'moosii9a'] },
    { arabic: 'رِيَاضَة', solutions: ['riyaaDa', 'riyaaDeh', 'riyaaDe', 'riyaaDh', 'riyaDa', 'riyaDeh', 'riyaDe', 'riyaDh'] },
    { arabic: 'كُرَة', solutions: ['kura', 'kureh', 'kure', 'kurh', 'kora', 'koreh', 'kore', 'korh'] },
    { arabic: 'لَاعِب', solutions: ['laa3ib', 'laa3eb', 'la3ib', 'la3eb'] },
    { arabic: 'فَرِيق', solutions: ['fareeq', 'faree9', 'fariiq', 'farii9', 'fariq', 'fari9', 'faryq', 'fary9'] },
    { arabic: 'مَلْعَب', solutions: ['mal3ab', 'mal3eb'] },
    { arabic: 'صَحِيح', solutions: ['SaHeeH', 'SaHee7', 'SaHiiH', 'SaHii7', 'SaHiH', 'SaHi7', 'SaHyH', 'SaHy7'] },
    { arabic: 'خَطَأ', solutions: ['khaTa2', 'khaTaa', 'khaTa', '7\'aTa2', '7\'aTaa', '7\'aTa', '5aTa2', '5aTaa'] },
    { arabic: 'جَدِيد', solutions: ['jadeed', 'jadiid', 'jadid', 'jadyd'] },
    { arabic: 'قَدِيم', solutions: ['qadeem', 'qadiim', 'qadim', 'qadym', '9adeem', '9adiim', '9adim', '9adym'] },
    { arabic: 'كَبِير', solutions: ['kabeer', 'kabiir', 'kabir', 'kabyr'] },
    { arabic: 'صَغِير', solutions: ['Sagheer', 'Saghiir', 'Saghir', 'Saghyr', 'Sa3\'eer', 'Sa3\'iir', 'Sa3\'ir', 'Sa3\'yr'] },
    { arabic: 'جَمِيل', solutions: ['jameel', 'jamiil', 'jamil', 'jamyl'] },
    { arabic: 'سَهْل', solutions: ['sahl', 'sahel', 'sahal'] },
    { arabic: 'صَعْب', solutions: ['Sa3b', 'sa3eb', 'Sa3eb', 'sa3b'] },
    { arabic: 'سَرِيع', solutions: ['saree3', 'sarii3', 'sari3', 'sary3'] },
    { arabic: 'بَطِيء', solutions: ['baTee2', 'baTeea', 'baTee', 'baTii2', 'baTiia', 'baTii', 'baTi2', 'baTia'] },
    { arabic: 'أَحْيَانًا', solutions: ['2aHyaanan', '2aHyanan', '2aHeeaanan', '2aHeeanan', '2aHiiaanan', '2aHiianan', '2aHiaanan', '2aHianan'] },
    { arabic: 'هُنَا', solutions: ['hunaa', 'huna', 'honaa', 'hona'] },
    { arabic: 'هُنَاكَ', solutions: ['hunaaka', 'hunaka', 'honaaka', 'honaka'] },
    { arabic: 'هُوَ', solutions: ['huwa', 'huooa', 'huuua', 'huua', 'howa', 'hoooa', 'houua', 'houa'] },
    { arabic: 'هِيَ', solutions: ['hiya', 'hieea', 'hiiia', 'hiia', 'heya', 'heeea', 'heiia', 'heia'] },
    { arabic: 'أَنْتَ', solutions: ['2anta', 'aanta', 'anta'] },
    { arabic: 'أَنْتِ', solutions: ['2anti', '2ante', 'aanti', 'aante', 'anti', 'ante'] },
    { arabic: 'أَنَا', solutions: ['2anaa', '2ana', 'aanaa', 'aana', 'anaa', 'ana'] },
    { arabic: 'نَحْنُ', solutions: ['naHnu', 'naHno', 'na7nu', 'na7no'] },
    { arabic: 'هُمْ', solutions: ['hum', 'hom'] },
    { arabic: 'هُنَّ', solutions: ['hunna', 'honna'] },
    { arabic: 'يَذْهَب', solutions: ['yadhhab', 'eeadhhab', 'iiadhhab', 'iadhhab'] },
    { arabic: 'تَذْهَب', solutions: ['tadhhab', 'tadhab', 'tazhab'] },
    { arabic: 'أَذْهَب', solutions: ['2adhhab', 'aadhhab', 'adhhab'] },
    { arabic: 'يَكْتُب', solutions: ['yaktub', 'yaktob', 'eeaktub', 'eeaktob', 'iiaktub', 'iiaktob', 'iaktub', 'iaktob'] },
    { arabic: 'يَقْرَأ', solutions: ['yaqra2', 'yaqraa', 'yaqra', 'ya9ra2', 'ya9raa', 'ya9ra', 'eeaqra2', 'eeaqraa'] },
    { arabic: 'يَأْكُل', solutions: ['ya2kul', 'ya2kol', 'yaakul', 'yaakol', 'yakul', 'yakol', 'eea2kul', 'eea2kol'] },
    { arabic: 'يَشْرَب', solutions: ['yashrab', 'eeashrab', 'iiashrab', 'iashrab'] },
    { arabic: 'يَنَام', solutions: ['yanaam', 'yanam', 'eeanaam', 'eeanam', 'iianaam', 'iianam', 'ianaam', 'ianam'] },
    { arabic: 'يَعْمَل', solutions: ['ya3mal', 'eea3mal', 'iia3mal', 'ia3mal'] },
    { arabic: 'يَلْعَب', solutions: ['yal3ab', 'eeal3ab', 'iial3ab', 'ial3ab'] },
    { arabic: 'يُحِبّ', solutions: ['yuHibb', 'yuHebb', 'yu7ibb', 'yu7ebb', 'yoHibb', 'yoHebb', 'yo7ibb', 'yo7ebb'] },
    { arabic: 'يَتَكَلَّم', solutions: ['yatakallam', 'eeatakallam', 'iiatakallam', 'iatakallam'] },
    { arabic: 'يَفْهَم', solutions: ['yafham', 'eeafham', 'iiafham', 'iafham'] },
    { arabic: 'يَتَعَلَّم', solutions: ['yata3allam', 'eeata3allam', 'iiata3allam', 'iata3allam'] },
    { arabic: 'أُحِبّ', solutions: ['2uHibb', '2uHebb', '2u7ibb', '2u7ebb', '2oHibb', '2oHebb', '2o7ibb', '2o7ebb'] },
    { arabic: 'أُرِيد', solutions: ['2ureed', '2uriid', '2urid', '2uryd', '2oreed', '2oriid', '2orid', '2oryd'] },
    { arabic: 'أَعْرِف', solutions: ['2a3rif', '2a3ref', 'aa3rif', 'aa3ref', 'a3rif', 'a3ref'] },
    { arabic: 'نَذْهَب', solutions: ['nadhhab', 'nadhab', 'nazhab'] },
    { arabic: 'كَتَبَ', solutions: ['kataba', 'katab', 'ktaba'] },
    { arabic: 'قَرَأَ', solutions: ['qara2a', 'qaraaa', 'qaraa', '9ara2a', '9araaa', '9araa'] },
    { arabic: 'أَكَلَ', solutions: ['2akala', 'aakala', 'akala', 'akal', 'akel'] },
    { arabic: 'شَرِبَ', solutions: ['shariba', 'shareba'] },
    { arabic: 'ذَهَبَ', solutions: ['dhahaba', 'dahaba', 'zahaba', 'dhahab'] },
    { arabic: 'رَجَعَ', solutions: ['raja3a', 'raje3a', 'raja3'] },
    { arabic: 'وَصَلَ', solutions: ['waSala', 'ooaSala', 'uuaSala', 'uaSala'] },
    { arabic: 'فَتَحَ', solutions: ['fataHa', 'fata7a'] },
    { arabic: 'سَأَلَ', solutions: ['sa2ala', 'saaala', 'saala'] },
    { arabic: 'دَرَسَ', solutions: ['darasa', 'dares', 'darsa'] },
    { arabic: 'عَرَفَ', solutions: ['3arafa', '3arefa', '3araf'] },
    { arabic: 'سَمِعَ', solutions: ['sami3a', 'same3a'] },
    { arabic: 'بَدَأَ', solutions: ['bada2a', 'badaaa', 'badaa'] },
    { arabic: 'طَبَخَ', solutions: ['Tabakha', 'Taba7\'a', 'Taba5a'] },
    { arabic: 'سَافَرَ', solutions: ['saafara', 'safara'] },
    { arabic: 'عَادَ', solutions: ['3aada', '3ada'] },
    { arabic: 'بَاعَ', solutions: ['baa3a', 'ba3a'] },
    { arabic: 'قَالَ', solutions: ['qaala', 'qala', '9aala', '9ala'] },
    { arabic: 'نَامَ', solutions: ['naama', 'nama'] },
    { arabic: 'قَامَ', solutions: ['qaama', 'qama', '9aama', '9ama'] },
    { arabic: 'كَثِير', solutions: ['katheer', 'kathiir', 'kathir', 'kathyr'] },
    { arabic: 'قَلِيل', solutions: ['qaleel', 'qaliil', 'qalil', 'qalyl', '9aleel', '9aliil', '9alil', '9alyl'] },
    { arabic: 'سَعِيد', solutions: ['sa3eed', 'sa3iid', 'sa3id', 'sa3yd'] },
    { arabic: 'حَزِين', solutions: ['Hazeen', 'Haziin', 'Hazin', 'Hazyn', '7azeen', '7aziin', '7azin', '7azyn'] },
    { arabic: 'غَاضِب', solutions: ['ghaaDib', 'ghaaDeb', 'ghaDib', 'ghaDeb', '3\'aaDib', '3\'aaDeb', '3\'aDib', '3\'aDeb'] },
    { arabic: 'مُمْتِع', solutions: ['mumti3', 'mumte3', 'momti3', 'momte3'] },
    { arabic: 'مُهِمّ', solutions: ['muhimm', 'muhemm', 'mohimm', 'mohemm'] },
    { arabic: 'بَسِيط', solutions: ['baseeT', 'basiiT', 'basiT', 'basyT'] },
    { arabic: 'قَوِيّ', solutions: ['qawiyy', 'qawiyee', 'qawiyii', 'qawiyi', 'qawieey', 'qawieeee', 'qawieeii', 'qawieei'] },
    { arabic: 'ضَعِيف', solutions: ['Da3eef', 'Da3iif', 'Da3if', 'Da3yf'] },
    { arabic: 'غَنِيّ', solutions: ['ghaniyy', 'ghaniyee', 'ghaniyii', 'ghaniyi', 'ghanieey', 'ghanieeee', 'ghanieeii', 'ghanieei'] },
    { arabic: 'ذَكِيّ', solutions: ['dhakiyy', 'dhakiyee', 'dhakiyii', 'dhakiyi', 'dhakieey', 'dhakieeee', 'dhakieeii', 'dhakieei'] },
    { arabic: 'مُسْتَشْفَى', solutions: ['mustashfaa', 'mustashfa', 'mostashfaa', 'mostashfa'] },
    { arabic: 'مَطَار', solutions: ['maTaar', 'maTar'] },
    { arabic: 'فُنْدُق', solutions: ['funduq', 'fundu9', 'fundoq', 'fundo9', 'fonduq', 'fondu9', 'fondoq', 'fondo9'] },
    { arabic: 'مِفْتَاح', solutions: ['miftaaH', 'miftaa7', 'miftaH', 'mifta7', 'meftaaH', 'meftaa7', 'meftaH', 'mefta7'] },
    { arabic: 'نَافِذَة', solutions: ['naafidha', 'naafidheh', 'naafidhe', 'naafidhh', 'naafedha', 'naafedheh', 'naafedhe', 'naafedhh'] },
    { arabic: 'كُرْسِيّ', solutions: ['kursiyy', 'kursiyee', 'kursiyii', 'kursiyi', 'kursieey', 'kursieeee', 'kursieeii', 'kursieei'] },
    { arabic: 'طَاوِلَة', solutions: ['Taawila', 'taweleh', 'tawele', 'tawleh', 'Taawileh', 'Taawile', 'Taawilh', 'Taawela', 'Taaweleh', 'Taawele', 'Taawelh'] },
    { arabic: 'سَرِير', solutions: ['sareer', 'sariir', 'sarir', 'saryr'] },
    { arabic: 'حَقِيبَة', solutions: ['Haqeeba', 'Haqeebeh', 'Haqeebe', 'Haqeebh', 'Haqiiba', 'Haqiibeh', 'Haqiibe', 'Haqiibh'] },
    { arabic: 'مِظَلَّة', solutions: ['miZalla', 'miZalleh', 'miZalle', 'miZallh', 'miDHalla', 'miDHalleh', 'miDHalle', 'miDHallh'] },
    { arabic: 'غُرْفَة', solutions: ['ghurfa', 'ghurfeh', 'ghurfe', 'ghurfh', 'ghorfa', 'ghorfeh', 'ghorfe', 'ghorfh'] },
    { arabic: 'مَطْبَخ', solutions: ['maTbakh', 'maTba7\'', 'maTba5'] },
    { arabic: 'حَمَّام', solutions: ['Hammaam', 'Hammam', '7ammaam', '7ammam'] },
    { arabic: 'شُرْفَة', solutions: ['shurfa', 'shurfeh', 'shurfe', 'shurfh', 'shorfa', 'shorfeh', 'shorfe', 'shorfh'] },
    { arabic: 'سُلَّم', solutions: ['sullam', 'sollam'] },
    { arabic: 'مِصْبَاح', solutions: ['miSbaaH', 'miSbaa7', 'miSbaH', 'miSba7', 'meSbaaH', 'meSbaa7', 'meSbaH', 'meSba7'] },
    { arabic: 'حبيبي', solutions: ['7abeebi', '7abibi', 'Habeebi', 'Habibi'] },

    /* ------------------------------------------------------------------
     * Greetings & social — everyday Levantine / MSA expressions.
     * The first solution is the hint; every alternate is accepted too.
     * ------------------------------------------------------------------ */
    { arabic: 'مَرْحَبًا', solutions: ['mar7aba', 'marhaba', 'marHaba', 'marhabaa', 'mar7abaa', 'marhaban'] },
    { arabic: 'أَهْلًا', solutions: ['ahlan', 'ahlaan', '2ahlan', '2ahlaan', 'ahla', '2ahla'] },
    { arabic: 'شُكْرًا', solutions: ['shukran', 'shukraan', 'shokran', 'shokraan', 'shukrun'] },
    { arabic: 'عَفْوًا', solutions: ['3afwan', '3afwaan', 'afwan', 'afwaan', '3afwun'] },
    { arabic: 'يَلَّا', solutions: ['yalla', 'yallah', 'yala', 'yalh', 'yallaa'] },
    { arabic: 'كِيفَك', solutions: ['keefak', 'kifak', 'kiifak', 'kefak', 'keefek'] },
    { arabic: 'كِيفِك', solutions: ['keefik', 'kifik', 'kiifik', 'kefik', 'keefek'] },
    { arabic: 'شُو', solutions: ['shu', 'shoo', 'shuu', 'shou'] },
    { arabic: 'لَيْش', solutions: ['laysh', 'leesh', 'lesh', 'liish', 'lees'] },
    { arabic: 'وِين', solutions: ['ween', 'wayn', 'wain', 'win', 'wen'] },
    { arabic: 'إِيمْتَى', solutions: ['eemta', 'imta', 'emta', 'eemtaa', 'iimta'] },
    { arabic: 'كِيف', solutions: ['keef', 'kif', 'kiif', 'kef'] },
    { arabic: 'مِين', solutions: ['meen', 'min', 'miin', 'men'] },
    { arabic: 'نَعَم', solutions: ['na3am', 'naam', 'na3m', 'nam'] },
    { arabic: 'لَا', solutions: ['la2', 'laa', 'la'] },
    { arabic: 'طَيِّب', solutions: ['Tayyeb', 'Tayyib', 'Tayeb', 'Tayib', 'tayyeb', 'tayyib'] },
    { arabic: 'مَاشِي', solutions: ['maashi', 'mashi', 'maashy', 'mashy', 'mashii'] },
    { arabic: 'مَبْرُوك', solutions: ['mabrook', 'mabrouk', 'mabruk', 'mabroook'] },
    { arabic: 'بِخَيْر', solutions: ['bkhair', 'bkheer', 'bikhair', 'bikheir', 'bkheir', 'bikheer'] },
    { arabic: 'حَبِيب', solutions: ['Habeeb', 'Habib', '7abeeb', '7abib'] },
    { arabic: 'حَبِيبَة', solutions: ['Habeebeh', 'Habibeh', '7abeebe', '7abibe', 'habibti', '7abibti'] },
    { arabic: 'صَاحِب', solutions: ['sa7eb', 'Sa7eb', 'saheb', 'Saheb', 'saa7ib', 'Saa7ib', 'saHib', 'SaHib'] },
    { arabic: 'إِنْسَان', solutions: ['insaan', 'insan', 'ensaan', 'ensan'] },

    /* ------------------------------------------------------------------
     * People & family
     * ------------------------------------------------------------------ */
    { arabic: 'أُمّ', solutions: ['umm', 'om', 'um', 'omm', '2umm'] },
    { arabic: 'أَب', solutions: ['ab', 'abb', 'aab', '2ab'] },
    { arabic: 'أَخُو', solutions: ['akhoo', 'akhu', 'akho', 'akhuu', '2akhoo'] },
    { arabic: 'أُخْت', solutions: ['okht', 'ukht', 'okt', 'ukt', '2okht'] },
    { arabic: 'وَلَد', solutions: ['walad', 'waled', 'walado', 'wlad'] },
    { arabic: 'بِنْت', solutions: ['bint', 'bent', 'bnt', 'binet'] },
    { arabic: 'مَرَة', solutions: ['mara', 'marah', 'maraa', 'mra'] },
    { arabic: 'زَلَمَة', solutions: ['zalameh', 'zalemeh', 'zalame', 'zalami'] },
    { arabic: 'جَار', solutions: ['jaar', 'jar', 'jarr'] },
    { arabic: 'ضَيْف', solutions: ['Dayf', 'Daif', 'Dayef', 'Deef'] },
    { arabic: 'نَاس', solutions: ['naas', 'nas', 'naass'] },
    { arabic: 'شَرِيك', solutions: ['shareek', 'shariik', 'sharik', 'sharyk'] },
    { arabic: 'أُسْتَاذ', solutions: ['ustaaz', 'ustaz', 'ostaz', 'ostadh'] },
    { arabic: 'مَامَا', solutions: ['mama', 'mamma', 'maama', 'mamaa'] },
    { arabic: 'بَابَا', solutions: ['baba', 'babba', 'baaba', 'babaa'] },

    /* ------------------------------------------------------------------
     * Common nouns — home, food, everyday objects
     * ------------------------------------------------------------------ */
    { arabic: 'شُبَّاك', solutions: ['shubbaak', 'shubbak', 'shobbaak', 'shobbak', 'shubaak', 'shobak'] },
    { arabic: 'أَكْل', solutions: ['akl', 'akel', 'akal'] },
    { arabic: 'مِي', solutions: ['mai', 'may', 'moy', 'moye', 'maii'] },
    { arabic: 'مَشْرُوب', solutions: ['mashroob', 'mashrub', 'mashroub', 'mashrob', 'mashruub'] },
    { arabic: 'شُغْل', solutions: ['shughl', 'shoghl', 'shughul', 'shoghol', 'shughol'] },
    { arabic: 'طَبَق', solutions: ['Taba2', 'Tabaq', 'Taba9', 'Taba', 'Tabak'] },
    { arabic: 'شَنْطَة', solutions: ['shanTa', 'shanta', 'shanTah', 'shantah', 'shanTeh'] },
    { arabic: 'جَزْمَة', solutions: ['jazma', 'jazmeh', 'jazme', 'jazzma', 'jazmah'] },
    { arabic: 'بَنْطَرُون', solutions: ['banTalon', 'bantalon', 'bantroun', 'banTroun', 'bantaloun'] },
    { arabic: 'قَمِيص', solutions: ['qameeS', 'qamiis', 'qamis', '9ameeS', '9amiis', '9amis'] },
    { arabic: 'مَصَارِي', solutions: ['maSaari', 'masari', 'maSaary', 'masary', 'maSari'] },
    { arabic: 'زَيْت', solutions: ['zayt', 'zeit', 'zayet', 'zait'] },
    { arabic: 'سُكَّر', solutions: ['sukkar', 'sokkar', 'sukar', 'soker'] },
    { arabic: 'مِلْح', solutions: ['milH', 'melH', 'mil7', 'mel7'] },
    { arabic: 'بَصَل', solutions: ['baSal', 'basal', 'baSel', 'basel'] },
    { arabic: 'بَنَدُورَة', solutions: ['banadoora', 'bandoora', 'banadoura', 'banadoreh'] },
    { arabic: 'بَطَاطَا', solutions: ['baTaTa', 'batata', 'baTaata', 'bataata'] },
    { arabic: 'دَجَاج', solutions: ['dajaaj', 'dajaj', 'djaaj'] },

    /* ------------------------------------------------------------------
     * Essential adjectives
     * ------------------------------------------------------------------ */
    { arabic: 'كْبِير', solutions: ['kbeer', 'kbiir', 'kabir', 'kabeer'] },
    { arabic: 'زْغِير', solutions: ['zgheer', 'zghiir', 'zghir', 'zagher', 'zgeer'] },
    { arabic: 'مْنِيح', solutions: ['mnee7', 'mneeH', 'mnii7', 'mniiH', 'mni7', 'mniH'] },
    { arabic: 'حِلْو', solutions: ['hilw', 'Helw', '7elw', '7ilw', 'hilu', '7ilu'] },
    { arabic: 'رَخِيص', solutions: ['rakheeS', 'rakhiis', 'rakhiS', 'rakhees', 'rakees'] },
    { arabic: 'غَالِي', solutions: ['ghaali', 'ghali', 'ghaaly', 'ghaly', "3'aali", "3'ali"] },
    { arabic: 'نَظِيف', solutions: ['naZeef', 'naZiif', 'nazif', 'naDHeef', 'naDHiif', 'nadHeef'] },
    { arabic: 'وَسِخ', solutions: ['wisi5', 'wese5', 'wesekh', 'wiskh', 'wisekh'] },
    { arabic: 'حَار', solutions: ['Haar', 'Harr', '7aar', '7arr'] },
    { arabic: 'بَارِد', solutions: ['baarid', 'barid', 'baared', 'bared', 'berid'] },
    { arabic: 'جَاهِز', solutions: ['jaahiz', 'jahiz', 'jahez', 'jahz'] },
    { arabic: 'مَشْغُول', solutions: ['mashghool', 'mashghul', 'mashghoul', 'mashghol'] },
    { arabic: 'تَعْبَان', solutions: ['ta3baan', 'ta3ban', 'ta3baen', 'ta3bane'] },
    { arabic: 'جَوْعَان', solutions: ['jaw3aan', 'jaw3an', 'joo3aan', 'joo3an'] },
    { arabic: 'عَطْشَان', solutions: ['3aTshaan', '3aTshan', '3atshaan', '3atshan'] },
    { arabic: 'زَعْلَان', solutions: ['za3laan', 'za3lan', 'za3leen', 'za3lane'] },
    { arabic: 'مَبْسُوط', solutions: ['mabSooT', 'mabsut', 'mabsoot', 'mabSout', 'mabsout'] },
    { arabic: 'قَرِيب', solutions: ['qareeb', 'qariib', 'qarib', '9areeb', '9ariib', '9arib'] },
    { arabic: 'بَعِيد', solutions: ['ba3eed', 'ba3iid', 'ba3id', 'b3eed', 'b3iid'] },
    { arabic: 'كْتِير', solutions: ['kteer', 'ktiir', 'kter', 'kateer'] },
    { arabic: 'شْوَيْ', solutions: ['shway', 'shwayy', 'shwai', 'shwaya', 'shwoy'] },
    { arabic: 'نَشِيط', solutions: ['nasheeT', 'nashiT', 'nasheet', 'nashit'] },

    /* ------------------------------------------------------------------
     * Everyday Levantine verbs
     * ------------------------------------------------------------------ */
    { arabic: 'رَاح', solutions: ['raa7', 'ra7', 'raaH', 'raH'] },
    { arabic: 'إِجَا', solutions: ['ija', 'eja', '2ija', '2eja', 'aja', 'ijaa'] },
    { arabic: 'شَاف', solutions: ['shaaf', 'shaf', 'shoof', 'shouf'] },
    { arabic: 'عِمِل', solutions: ['3imil', '3emel', '3mil', '3mel', '3amal'] },
    { arabic: 'حَكَى', solutions: ['Haka', '7aka', 'Hakaa', '7akaa', 'Hake'] },
    { arabic: 'فَهِم', solutions: ['fihim', 'fehem', 'fhim', 'fhem', 'fihem'] },
    { arabic: 'بَدُّو', solutions: ['baddo', 'bado', 'biddo', 'bido', 'baddoo'] },
    { arabic: 'بَدِّي', solutions: ['baddi', 'badi', 'biddi', 'bidi', 'baddii'] },
    { arabic: 'عِنْدُو', solutions: ['3indo', '3endu', '3ndo', '3ndu', '3indoo'] },
    { arabic: 'عِنْدِي', solutions: ['3indi', '3endi', '3ndi', '3nde', '3indii'] },
    { arabic: 'بِحِبّ', solutions: ['bHibb', 'b7ibb', 'baHibb', 'ba7ibb', 'bHebb', 'b7ebb'] },
    { arabic: 'اِشْتَرَى', solutions: ['ishtara', 'eshtara', '2ishtara', '2eshtara', 'shtara', 'ishtaraa'] },
    { arabic: 'دَفَع', solutions: ['dafa3', 'dafe3', 'dafa', 'daf3'] },
    { arabic: 'سَكَّر', solutions: ['sakkar', 'sakker', 'sakar'] },
    { arabic: 'نَظَّف', solutions: ['naZZaf', 'nazzaf', 'naDHaf', 'nadHaf', 'nazaf'] },
    { arabic: 'اِسْتَمَع', solutions: ['istama3', 'estama3', '2istama3', 'stama3', 'istame3'] },
    { arabic: 'جَاب', solutions: ['jaab', 'jab', 'jeb'] },

    /* ------------------------------------------------------------------
     * Time & daily rhythm
     * ------------------------------------------------------------------ */
    { arabic: 'بُكْرَة', solutions: ['bukra', 'bokra', 'bukrah', 'bokrah', 'bukraa'] },
    { arabic: 'مْبَارِح', solutions: ['mbaariH', 'mbare7', 'mbariH', 'mbar7', 'mbareH'] },
    { arabic: 'الْيَوْم', solutions: ['alyawm', 'elyawm', 'lyawm', 'lyom', 'alyom'] },
    { arabic: 'هَلَّق', solutions: ['halla2', 'halla', 'hallaq', 'halla9'] },
    { arabic: 'هَيْك', solutions: ['hayk', 'heik', 'haik', 'hayek'] }
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

  global.HarfData = {
    WORDS: WORDS.slice(),
    PHRASES: PHRASES.slice(),
    CONSONANTS: CONSONANTS.slice(),
    letterDrills: letterDrills,
    arabicDrills: arabicDrills,
    pickWords: pickWords,
    pickPhrase: pickPhrase,
    shuffle: shuffle
  };
})(window);
