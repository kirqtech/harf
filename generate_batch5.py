# Transportation, street navigation, urban life data generation
import json
import re

words_data = [
    # 1-20
    ("سَيَّارَة", "سيارة", ["sayyara", "sayara", "sayyara"], "car", "Levantine", "Words"),
    ("تَكْسِي", "تكسي", ["taxi", "taksi"], "taxi", "Levantine", "Words"),
    ("سَرْفِيس", "سرفيس", ["serfeez", "servis", "sarfees"], "shared service taxi", "Levantine", "Words"),
    ("بَاص", "باص", ["bas", "baas", "bus"], "bus", "Levantine", "Words"),
    ("فَان", "فان", ["van", "faan"], "minivan / commuter van", "Levantine", "Words"),
    ("طَرِيق", "طريق", ["tariq", "tareeq", "tari2", "taree2"], "road / way", "Levantine", "Words"),
    ("شَارِع", "شارع", ["share3", "shari3", "shaare3"], "street", "Levantine", "Words"),
    ("أَزْمِة", "ازمة", ["azmeh", "azme", "azma"], "traffic jam / congestion", "Levantine", "Words"),
    ("عَجْقَة", "عجقة", ["3aj2a", "3ajqa", "3ajgeh", "3ajkeh"], "crowd / traffic congestion", "Levantine", "Words"),
    ("دُغْرِي", "دغري", ["dughri", "doghri", "dugri"], "straight ahead", "Levantine", "Words"),
    ("يَمِين", "يمين", ["yameen", "yamin"], "right (direction)", "Levantine", "Words"),
    ("شْمَال", "شمال", ["shmal", "shmaal", "shemal"], "left / north", "Levantine", "Words"),
    ("يَسَار", "يسار", ["yasar", "yasaar"], "left (direction)", "Levantine", "Words"),
    ("مَفْرَق", "مفرق", ["mafraq", "mafra2", "mafrag"], "intersection / fork in road", "Levantine", "Words"),
    ("تَقَاطُع", "تقاطع", ["taqato3", "ta2ato3", "t2ato3"], "intersection / crossroads", "Levantine", "Words"),
    ("دُوَّار", "دوار", ["dowar", "dawwar", "duwwar"], "roundabout / traffic circle", "Levantine", "Words"),
    ("سَاحَة", "ساحة", ["saha", "sa7a", "saa7a"], "public square / plaza", "Levantine", "Words"),
    ("جِسِر", "جسر", ["jisr", "jeser", "jisir"], "bridge / overpass", "Levantine", "Words"),
    ("نَفَق", "نفق", ["nafaq", "nafa2"], "tunnel / underpass", "Levantine", "Words"),
    ("رَصِيف", "رصيف", ["raseef", "rasif", "ra9eef"], "sidewalk / pavement", "Levantine", "Words"),
    
    # 21-40
    ("مَوْقِف", "موقف", ["mawqef", "mawqaf", "mo2af", "maw2ef"], "bus stop / parking spot", "Levantine", "Words"),
    ("مَحَطَّة", "محطة", ["mahatta", "ma7atta", "ma7ata"], "station / gas station", "Levantine", "Words"),
    ("إِشَارَة", "اشارة", ["ishara", "ishareh", "2eshara"], "traffic light / signal", "Levantine", "Words"),
    ("عَمُود", "عمود", ["3amood", "3amud"], "pole / lamppost", "Levantine", "Words"),
    ("كَرَاج", "كراج", ["karaj", "karaje", "garage"], "garage / terminal / parking lot", "Levantine", "Words"),
    ("مَطَبّ", "مطب", ["matabb", "matab", "ma6ab"], "speed bump", "Levantine", "Words"),
    ("حُفْرَة", "حفرة", ["hufra", "7ofra", "7ufra"], "pothole / ditch", "Levantine", "Words"),
    ("عَجَل", "عجل", ["3ajal", "3ajaleh"], "wheel / tire", "Levantine", "Words"),
    ("دُولَاب", "دولاب", ["doolab", "dowlab", "dwalib"], "tire / wheel", "Levantine", "Words"),
    ("بَنْزِين", "بنزين", ["banzeen", "benzeen", "banzin"], "gasoline / petrol", "Levantine", "Words"),
    ("مَازُوت", "مازوت", ["mazoot", "mazut"], "diesel fuel", "Levantine", "Words"),
    ("سُولَار", "سولار", ["solar", "sular"], "diesel", "Levantine", "Words"),
    ("شُوفِير", "شوفير", ["shofeer", "shofeir", "chaufeur"], "driver", "Levantine", "Words"),
    ("سَوَّاق", "سواق", ["sawwaq", "sawwa2", "sawa2"], "driver", "Levantine", "Words"),
    ("رَاكِب", "راكب", ["rakib", "raakeb", "rekeb"], "passenger", "Levantine", "Words"),
    ("أُجْرَة", "اجرة", ["ujra", "ojra", "2ojra"], "fare / taxi fee", "Levantine", "Words"),
    ("عَدَّاد", "عداد", ["3addad", "3addaad"], "meter (taxi meter)", "Levantine", "Words"),
    ("فْرَاطَة", "فراطة", ["frata", "fraata", "fra6a"], "small change / coins", "Levantine", "Words"),
    ("صَرَّاف", "صراف", ["sarraf", "saraf", "9arraf"], "money exchanger / ATM", "Levantine", "Words"),
    ("بَنْك", "بنك", ["bank", "benk"], "bank", "Levantine", "Words"),

    # 41-60
    ("مَشْي", "مشي", ["mashi", "mashy"], "walking / on foot", "Levantine", "Words"),
    ("بِسِكْلِيت", "بسcleat", ["bisclete", "besiklet", "bisklet"], "bicycle", "Levantine", "Words"),
    ("مُوتُوسِيكْل", "موتوسيكل", ["motosikl", "motor"], "motorcycle / scooter", "Levantine", "Words"),
    ("مُوتُور", "موتور", ["motor", "motoor"], "engine / motorbike", "Levantine", "Words"),
    ("زَمُّور", "زمور", ["zammoor", "zammur", "zamoor"], "car horn", "Levantine", "Words"),
    ("كْلَاكْس", "كلاكس", ["klaks", "claxon"], "car horn", "Levantine", "Words"),
    ("شِبَّاك", "شباك", ["shibbak", "shebbak", "shebak"], "window", "Levantine", "Words"),
    ("بَاب", "باب", ["bab", "baab"], "door", "Levantine", "Words"),
    ("صُنْدُوق", "صندوق", ["sundooq", "sandoo2", "9andoo2"], "car trunk / boot", "Levantine", "Words"),
    ("طَبُّون", "طبون", ["tabboon", "taboun", "6abboon"], "car trunk / rear bonnet", "Levantine", "Words"),
    ("مُحَرِّك", "محرك", ["moharrik", "m7arrek"], "engine / motor", "Levantine", "Words"),
    ("بَرِيك", "بريك", ["brake", "brayk", "breek"], "car brake", "Levantine", "Words"),
    ("فْرَان", "فران", ["fren", "frain", "frein"], "brake", "Levantine", "Words"),
    ("دِرِكْسِيُون", "دركسيون", ["direksyon", "dreksyon", "drexion"], "steering wheel", "Levantine", "Words"),
    ("نَمْرَة", "نمرة", ["namra", "nemreh", "namreh"], "license plate / number", "Levantine", "Words"),
    ("رُخْصَة", "رخصة", ["rukhsa", "rokhsa", "rukhseh"], "driver's license / permit", "Levantine", "Words"),
    ("تَأْمِين", "تأمين", ["ta'meen", "ta2meen", "tameen"], "car insurance", "Levantine", "Words"),
    ("مُخَالَفَة", "مخالفة", ["mukhalafa", "m5alafeh", "mkhalfeh"], "traffic ticket / fine", "Levantine", "Words"),
    ("شُرْطِي", "شرطي", ["shorti", "shurti", "shor6i"], "policeman / traffic cop", "Levantine", "Words"),
    ("عَسْكَرِي", "عسكري", ["3askari", "3askary"], "soldier / officer", "Levantine", "Words"),

    # 61-80
    ("حَاجِز", "حاجز", ["hajez", "7ajez", "7aajiz"], "checkpoint / roadblock", "Levantine", "Words"),
    ("تَفْتِيش", "تفتيش", ["tafteesh", "taftish"], "inspection / search", "Levantine", "Words"),
    ("هُوِيِّة", "هوية", ["huwiyye", "hawiyyeh", "hawiyye", "huwiyya"], "ID card / identity", "Levantine", "Words"),
    ("جَوَاز", "جواز", ["jawaz", "jawaaz"], "passport", "Levantine", "Words"),
    ("تَصْرِيح", "تصريح", ["tasreeh", "tasree7", "ta9ree7"], "permit / travel pass", "Levantine", "Words"),
    ("مَدْخَل", "مدخل", ["madkhal", "mad5al"], "entrance / entry ramp", "Levantine", "Words"),
    ("مَخْرَج", "مخرج", ["makhraj", "ma5raj"], "exit / ramp off", "Levantine", "Words"),
    ("طَرِيق سَرِيع", "طريق سريع", ["tareeq saree3", "tari2 saree3"], "highway / expressway", "Levantine", "Words"),
    ("أُوتُوسْتْرَاد", "اوتوستراد", ["autostrad", "otostrad", "autostrade"], "highway / freeway", "Levantine", "Words"),
    ("تَحْوِيلِة", "تحويلة", ["tahweeleh", "ta7wileh", "ta7weela"], "detour / road diversion", "Levantine", "Words"),
    ("وَرْشِة", "ورشة", ["warsheh", "warshi", "warsha"], "construction site / roadwork", "Levantine", "Words"),
    ("تَصْلِيح", "تصليح", ["tasleeh", "ta9lee7", "taslih"], "repair / maintenance", "Levantine", "Words"),
    ("مِيكَانِيكِي", "ميكانيكي", ["mikaniki", "mikaniky"], "mechanic", "Levantine", "Words"),
    ("وِنْش", "ونش", ["winch", "wensh"], "tow truck / winch", "Levantine", "Words"),
    ("بَطَّارِيِّة", "بطارية", ["battariyye", "ba6ariyyeh", "battariyeh"], "car battery", "Levantine", "Words"),
    ("ضَوْ", "ضو", ["daw", "dow", "daww"], "headlight / light", "Levantine", "Words"),
    ("غَمَّاز", "غماز", ["ghammaz", "3'ammaz"], "turn signal / indicator blinker", "Levantine", "Words"),
    ("مْرَايِة", "مراية", ["mrayeh", "mraaye", "mraye"], "mirror / rearview mirror", "Levantine", "Words"),
    ("حِزَام", "حزام", ["hizam", "7ezam", "7ezaam"], "seatbelt", "Levantine", "Words"),
    ("مَقْعَد", "مقعد", ["maq3ad", "ma23ad"], "seat", "Levantine", "Words"),

    # 81-100
    ("كُرْسِي", "كرسي", ["kursi", "kerseh"], "chair / seat", "Levantine", "Words"),
    ("دَرَج", "درج", ["daraj", "darej"], "stairs / steps", "Levantine", "Words"),
    ("مِصْعَد", "مصعد", ["mas3ad", "mi93ad"], "elevator / lift", "Levantine", "Words"),
    ("أَسَانْسِير", "اسانسير", ["asanseer", "asansir"], "elevator", "Levantine", "Words"),
    ("زُقَاق", "زقاق", ["zoqaq", "z2a2", "zuqaq"], "narrow alley / alleyway", "Levantine", "Words"),
    ("دَخْلِة", "دخلة", ["dakhleh", "da5leh", "dakhle"], "side street / alley turn", "Levantine", "Words"),
    ("حَارَة", "حارة", ["hara", "7ara", "7aara"], "neighborhood / quarter / lane", "Levantine", "Words"),
    ("حَيّ", "حي", ["hayy", "7ayy"], "district / neighborhood", "Levantine", "Words"),
    ("مِنْطَقَة", "منطقة", ["mantaqa", "man6a2a", "manta2a"], "area / zone / region", "Levantine", "Words"),
    ("بَلَد", "بلد", ["balad", "balad"], "downtown / town / country", "Levantine", "Words"),
    ("وَسَط البَلَد", "وسط البلد", ["wasat al-balad", "wasa6 el-balad", "wast el balad"], "downtown / city center", "Levantine", "Words"),
    ("مَرْكَز", "مركز", ["markaz", "markez"], "center / hub", "Levantine", "Words"),
    ("مُجَمَّع", "مجمع", ["mujamma3", "mjammo3"], "bus terminal / complex", "Levantine", "Words"),
    ("مَحَطِّة قِطَار", "محطة قطار", ["mahattat qitar", "ma7a6et 2e6ar"], "train station", "Levantine", "Words"),
    ("تْرَام", "ترام", ["tram", "traam"], "tramway / streetcar", "Levantine", "Words"),
    ("قِطَار", "قطار", ["qitar", "2itar", "qetaar"], "train", "Levantine", "Words"),
    ("مَطَار", "مطار", ["matar", "ma6ar", "mataar"], "airport", "Levantine", "Words"),
    ("طَيَّارَة", "طيارة", ["tayyara", "6ayyara", "tayara"], "airplane / flight", "Levantine", "Words"),
    ("مِينَاء", "ميناء", ["mina", "meena", "mina2"], "port / harbor", "Levantine", "Words"),
    ("بَحْر", "بحر", ["bahr", "ba7er", "ba7r"], "sea / waterfront", "Levantine", "Words"),

    # 101-120
    ("كُورْنِيش", "كورنيش", ["corniche", "korneesh", "kurneesh"], "coastal promenade / corniche", "Levantine", "Words"),
    ("مَمْشَى", "ممشى", ["mamsha", "mamshaa"], "walkway / pedestrian path", "Levantine", "Words"),
    ("مَمَرّ مُشَاة", "ممر مشاة", ["mamar moshat", "mamar moshaat", "mamar mshat"], "pedestrian crossing / crosswalk", "Levantine", "Words"),
    ("مُشَاة", "مشاة", ["mushat", "mushaat", "mshat"], "pedestrians", "Levantine", "Words"),
    ("عَمُود إِنَارَة", "عمود انارة", ["3amood inara", "3amud inareh"], "street lamp pole", "Levantine", "Words"),
    ("سَلَّة زْبَالِة", "سلة زبالة", ["sallet zbaleh", "sallat zbaale"], "street trash bin", "Levantine", "Words"),
    ("حَاوْيِة", "حاوية", ["haawyeh", "7awye", "7awiyeh"], "dumpster / garbage container", "Levantine", "Words"),
    ("دُكَّان", "دكان", ["dokkan", "dekkan", "dekaneh"], "small grocery / corner shop", "Levantine", "Words"),
    ("سُوبَرْمَارْكِت", "سوبرماركت", ["supermarket", "sobermarket"], "supermarket", "Levantine", "Words"),
    ("مَخْبَز", "مخبز", ["makhbaz", "ma5baz"], "bakery", "Levantine", "Words"),
    ("صَيْدَلِيِّة", "صيدلية", ["saydaliyye", "saydaliyeh", "9aydaliyeh"], "pharmacy", "Levantine", "Words"),
    ("مُسْتَشْفَى", "مستشفى", ["mustashfa", "mistashta", "mshtashfa"], "hospital", "Levantine", "Words"),
    ("عِيَادِة", "عيادة", ["3iyadeh", "3iyada", "3yade"], "clinic", "Levantine", "Words"),
    ("مَخْفَر", "مخفر", ["makhfar", "ma5far"], "police station", "Levantine", "Words"),
    ("بَلَدِيِّة", "بلدية", ["baladiyye", "baladiyeh"], "municipality / city hall", "Levantine", "Words"),
    ("سُوق", "سوق", ["souq", "soo2", "sooq"], "bazaar / market", "Levantine", "Words"),
    ("بَسْطَة", "بسطة", ["basta", "ba9ta", "ba6sa"], "street vendor stall / pushcart", "Levantine", "Words"),
    ("بَيَّاع", "بياع", ["bayya3", "baya3"], "street vendor / salesman", "Levantine", "Words"),
    ("عَرَبَايِة", "عرباية", ["3arabayeh", "3arabiyeh", "3arabaye"], "cart / pushcart / trolley", "Levantine", "Words"),
    ("خَرِيطَة", "خريطة", ["khareeta", "5areeta", "khareetah"], "map", "Levantine", "Words"),

    # 121-135
    ("لَوْحَة", "لوحة", ["lawha", "law7a", "law7eh"], "street sign / billboard", "Levantine", "Words"),
    ("عِنْوَان", "عنوان", ["3onwan", "3enwan", "3anwan"], "address", "Levantine", "Words"),
    ("بِنَايِة", "بناية", ["binayeh", "binaaye", "binaye"], "apartment building", "Levantine", "Words"),
    ("طَابِق", "طابق", ["tabeq", "6abiq", "6abe2"], "floor / storey", "Levantine", "Words"),
    ("شَقَّة", "شقة", ["shaqqa", "sha22a", "she22a"], "apartment / flat", "Levantine", "Words"),
    ("عِمَارَة", "عمارة", ["3imara", "3mara", "3emaara"], "building", "Levantine", "Words"),
    ("حَارِس", "حارس", ["hares", "7ares", "7aaris"], "building concierge / security watchman", "Levantine", "Words"),
    ("نَاطُور", "ناطور", ["natoor", "naa6oor", "natur"], "building concierge / caretaker", "Levantine", "Words"),
    ("جَار", "جار", ["jar", "jaar"], "neighbor", "Levantine", "Words"),
    ("جِيرَان", "جيران", ["jeeran", "jiran"], "neighbors", "Levantine", "Words"),
    ("ضَاحْيِة", "ضاحية", ["dahyeh", "da7yeh", "da7ye"], "suburb / outskirts", "Levantine", "Words"),
    ("مُخَيَّم", "مخيم", ["mukhayyam", "m5ayyam"], "refugee camp / camp", "Levantine", "Words"),
    ("قَرْيِة", "قرية", ["qaryeh", "2aryeh", "2arya"], "village", "Levantine", "Words"),
    ("رِيف", "ريف", ["reef", "rif"], "countryside / rural area", "Levantine", "Words"),
    ("مَدِينِة", "مدينة", ["madeeneh", "madine", "mdeeneh"], "city", "Levantine", "Words")
]

phrases_data = [
    # 1-25 (Taxi / Servis interactions)
    ("عَ جَنْب لَوْ سَمَحْت", "ع جنب لو سمحت", ["3a janb law sama7t", "3a jamb law samaht"], "pull over to the side, please", "Levantine", "Phrases"),
    ("عَلَى اليَمِين هُون", "على اليمين هون", ["3al yameen hon", "3ala el yameen hoon"], "on the right here", "Levantine", "Phrases"),
    ("نَزِّلْنِي هُون إِذَا بْتِرِيد", "نزلني هون اذا بتريد", ["nazzilni hon iza btreed", "nazelni hoon eza btrid"], "drop me off here if you please", "Levantine", "Phrases"),
    ("خَلِّيكْ دُغْرِي", "خليك دغري", ["khalleek dughri", "5allik doghri"], "keep going straight ahead", "Levantine", "Phrases"),
    ("لِفّ عَالشْمَال", "لف عالشمال", ["leff 3ash-shmal", "lef 3al shmal"], "turn left", "Levantine", "Phrases"),
    ("خُود اليَمِين هَلَّأ", "خود اليمين هلأ", ["khod el yameen halla2", "5ood el yamin hala"], "take the right turn now", "Levantine", "Phrases"),
    ("عِنْد الإِشَارَة قَبِل لَوْ سَمَحْت", "عند الاشارة قبل لو سمحت", ["3end el-ishara 2abel law sama7t", "3ind el ishareh abel"], "just before the traffic light, please", "Levantine", "Phrases"),
    ("بَعِد الدُّوَّار عَاليمين", "بعد الدوار عاليمين", ["ba3d ed-dowwar 3al yameen", "ba3ed el dowar 3al yamin"], "after the roundabout on the right", "Levantine", "Phrases"),
    ("قَدَّيْش الأُجْرَة؟", "قديش الاجرة؟", ["addeysh el ojra?", "adeesh el ujra?", "adash el ejra?"], "how much is the fare?", "Levantine", "Phrases"),
    ("شَغِّل العَدَّاد لَوْ سَمَحْت", "شغل العداد لو سمحت", ["shaghil el 3addad law sama7t", "sha3'el el 3addad law samaht"], "turn on the meter, please", "Levantine", "Phrases"),
    ("مَا فِي فْرَاطَة مَعَاي", "ما في فراطة معاي", ["ma fi frata ma3ay", "mafee fra6a ma3i"], "I don't have small change with me", "Levantine", "Phrases"),
    ("مَعَك فْكَاكَة مِيِّة؟", "معك فكاكة مية؟", ["ma3ak fkakeh miyyeh?", "ma3ak fkaka miyye?"], "do you have change for a hundred?", "Levantine", "Phrases"),
    ("خَلِّي البَاقِي إِلَك", "خلي الباقي إلك", ["khalli el baqi elak", "5alli el ba2i elak", "khalli el ba2e elak"], "keep the change", "Levantine", "Phrases"),
    ("فَاضِي يَا مْعَلِّم؟", "فاضي يا معلم", ["fadi ya m3allem?", "faadi ya m3allim?"], "are you free / available, boss?", "Levantine", "Phrases"),
    ("فِي مَحَلّ وَاحِد؟", "في محل واحد؟", ["fi ma7al wa7ad?", "fee ma7all wahed?"], "is there one empty seat? (servis)", "Levantine", "Phrases"),
    ("رَايِح عَالحَمْرَا؟", "رايح عالحمرا؟", ["rayeh 3al hamra?", "rayi7 3al 7amra?"], "are you heading to Hamra?", "Levantine", "Phrases"),
    ("بْتِمْرُق مِنْ جَنْب الدُّوَّار؟", "بتمرق من جنب الدوار", ["bto2mor 3an", "btomroq min janb ed-dowwar?", "btemro2 men jamb el dowwar?"], "do you pass by the roundabout?", "Levantine", "Phrases"),
    ("قَدَّيْش بْتَاخُد عَالشُّمَيْسَانِي؟", "قديش بتاخد ع الشميساني؟", ["addeysh btakhood 3ash-shmeisani?", "adeesh bta5od 3al shmaisani?"], "how much do you charge to Shmeisani?", "Levantine", "Phrases"),
    ("طَرِيق البَاب الشَّرْقِي", "طريق الباب الشرقي", ["tareeq bab sharqi", "tari2 el bab el shar2i"], "the route to Bab Sharqi", "Levantine", "Phrases"),
    ("وَصِّلْنِي عَلَى هَالعِنْوَان", "وصلني على هالعنوان", ["wassilni 3ala hal 3enwan", "wa9elni 3ala hal 3anwan"], "take me to this address", "Levantine", "Phrases"),
    ("فِيك تْسَرِّع شْوَيّ؟", "فيك تسرع شوي؟", ["feek tsarri3 shwayy?", "fik tsare3 shway?"], "could you speed up a little bit?", "Levantine", "Phrases"),
    ("عَ مَهْلَك الطَّرِيق مْلَيَّن حُفَر", "ع مهلك الطريق ملين حفر", ["3a mahlak et-tareeq mlayan hufar", "3a mehlak et tari2 melyan 7ofar"], "take it easy, the road is full of potholes", "Levantine", "Phrases"),
    ("شُوف لِي طَرِيق تَانِي", "شوف لي طريق تاني", ["shoof li tareeq tani", "shufli tari2 taani"], "find me an alternative route", "Levantine", "Phrases"),
    ("فِي أَزْمِة سِير خَانْقَة", "في ازمة سير خانقة", ["fi azmet seer khanqa", "fee azmeh seer 5an2a"], "there is a suffocating traffic jam", "Levantine", "Phrases"),
    ("الشَّارِع مَسْدُود بْسَبَب وَرْشِة", "الشارع مسدود بسبب ورشة", ["esh-share3 masdood b-sabab warsheh", "el shari3 masdud b-sabab warsha"], "the street is blocked due to roadworks", "Levantine", "Phrases"),

    # 26-50 (Giving / Asking Directions)
    ("وَيْن أَقْرَب مَحَطِّة بَنْزِين؟", "وين اقرب محطة بنزين؟", ["wayn aqrab mahattat banzeen?", "wein a2rab ma7a6et benzin?"], "where is the nearest petrol station?", "Levantine", "Phrases"),
    ("كِيف بْوَصِّل لِلمَسْجِد؟", "كيف بوصل للمسجد؟", ["keef bwasil lil masjid?", "kif bwa9el lal masjed?"], "how do I get to the mosque?", "Levantine", "Phrases"),
    ("أَقْرَب صَيْدَلِيِّة لَهُون", "أقرب صيدلية لهون", ["aqrab saydaliyye la hon", "a2rab saydaliyeh la hoon"], "the closest pharmacy to here", "Levantine", "Phrases"),
    ("بَعِيدِة مِنْ هُون شِي؟", "بعيدة من هون شي؟", ["ba3eedeh min hon shi?", "b3eede men hoon shi?"], "is it far from here at all?", "Levantine", "Phrases"),
    ("مَسَافِة عَشِر دَقَايِق مَشْي", "مسافة عشر دقايق مشي", ["masafet 3ashr daqayeq mashy", "masafit 3asher da2aye2 mashi"], "a ten-minute walking distance", "Levantine", "Phrases"),
    ("خُود أَوَّل دَخْلِة عَالْيَمِين", "خود اول دخلة ع اليمين", ["khod awwal dakhleh 3al yameen", "5ood awwal da5le 3al yamin"], "take the first right-hand alley", "Levantine", "Phrases"),
    ("تَانِي مَفْرَق عَالشْمَال", "تاني مفرق عالشمال", ["tani mafraq 3ash-shmal", "taani mafra2 3al shmaal"], "the second intersection on the left", "Levantine", "Phrases"),
    ("بْتِلْقَاهَا قْبَال البَنْك", "بتلقاها قبال البنك", ["btelqaha 2bal el bank", "btil2aha 2baal el benk"], "you will find it facing the bank", "Levantine", "Phrases"),
    ("وَرَا مَرْكَز الشُّرْطَة", "ورا مركز الشرطة", ["wara markaz esh-shorta", "wara markez el shur6a"], "behind the police station", "Levantine", "Phrases"),
    ("بِجَانِب جَامِع الحَمِيدِيِّة", "بجانب جامع الحميدية", ["bi-janeb jame3 el hamidiyye", "bjaneb jame3 el 7amidieh"], "next to the Hamidiyeh Mosque", "Levantine", "Phrases"),
    ("عَالزَّاوْيِة مُقَابِل الصَّيْدَلِيِّة", "عالزاوية مقابل الصيدلية", ["3az-zawyeh mqabel es-saydaliyye", "3al zawye m2abel el saydaliyeh"], "on the corner across from the pharmacy", "Levantine", "Phrases"),
    ("اضْلَل دُغْرِي لَحَتَّى تُوصَل الدُّوَّار", "اضلل دغري لحتى توصل الدوار", ["dall doghri la hatta towsal ed-dowwar", "dallak deghri la tawo9al"], "keep straight until you reach the roundabout", "Levantine", "Phrases"),
    ("لِفّ وَارْجَع مَع الدُّوَّار", "لف وارجع مع الدوار", ["leff w rja3 ma3 ed-dowwar", "lef w irja3 ma3 el dawwar"], "make a U-turn at the roundabout", "Levantine", "Phrases"),
    ("اعْمَل يُوتِيرْن هُون", "اعمل يوتيرن هون", ["i3mel u-turn hon", "e3mel uturn hoon"], "make a U-turn here", "Levantine", "Phrases"),
    ("مَمْنُوع الوُقُوف هُون", "ممنوع الوقوف هون", ["mamnoo3 el wuqoof hon", "mamnu3 el w2oof hoon"], "parking is prohibited here", "Levantine", "Phrases"),
    ("فِي بَارْكِينْغ قَرِيب؟", "في باركينغ قريب؟", ["fi parking qareeb?", "fee parking 2areeb?"], "is there nearby parking?", "Levantine", "Phrases"),
    ("صُفّ السَّيَّارَة هُنَاك", "صف السيارة هناك", ["soff es-sayyara honak", "sof el sayara hnak"], "park the car over there", "Levantine", "Phrases"),
    ("مَا فِي مَحَلّ لِتِصُفّ", "ما في محل لتصف", ["ma fi mahal la tsoff", "mafee ma7al la tsof"], "there is no place to park", "Levantine", "Phrases"),
    ("أَكَلْت مُخَالَفَة وُقُوف", "اكلت مخالفة وقوف", ["akalt mukhalafet wuqoof", "akalet m5alafeh w2oof"], "I got a parking ticket", "Levantine", "Phrases"),
    ("حَطَّيْت سَيَّارْتِي بِالكَرَاج", "حطيت سيارتي بالكراج", ["hattayt sayyarti bel karaj", "7a6ayt sayarti bel garage"], "I put my car in the garage", "Levantine", "Phrases"),
    ("سَكَّرُوا الشَّارِع بِسَبَب حَادِث", "سكروا الشارع بسبب حادث", ["sakkaru esh-share3 b-sabab hadeth", "sakkaroo el shari3 bsbab 7ades"], "they closed the street due to an accident", "Levantine", "Phrases"),
    ("صَار فِي حَادِث سِير كْبِير", "صار في حادث سير كبير", ["sar fi hadeth seer kbeer", "saar fee 7ades seer kbir"], "a big traffic accident occurred", "Levantine", "Phrases"),
    ("إِجَت سَيَّارَة الإِسْعَاف", "اجت سيارة الاسعاف", ["ijat sayyaret el is3af", "ejat sayyarat el es3af"], "the ambulance arrived", "Levantine", "Phrases"),
    ("اتَّصِل بِالإِسْعَاف بِسُرْعَة", "اتصل بالاسعاف بسرعة", ["ittasil bel is3af bi-sor3a", "etesel bel es3af bsor3a"], "call an ambulance quickly", "Levantine", "Phrases"),
    ("انْدَعَس بِالشَّارِع", "اندعس بالشارع", ["enda3as besh-share3", "enda3as bel shari3"], "he got run over in the street", "Levantine", "Phrases"),

    # 51-75 (Urban Navigation & Transit commute)
    ("قَاطِع الشَّارِع مِنْ مَمَرّ المُشَاة", "قاطع الشارع من ممر المشاة", ["qaate3 esh-share3 men mamar el moshat", "2a6e3 el shari3 min mamar el mshaat"], "crossing the street from the pedestrian crosswalk", "Levantine", "Phrases"),
    ("انْتَبِه وَانْتَ عَمْ تِقْطَع", "انتبه وانت عم تقطع", ["entebih w enta 3am teqta3", "entebeh w inta 3am te26a3"], "pay attention while crossing", "Levantine", "Phrases"),
    ("انْتَبِه مِن السَّيَّارَات السَّرِيعَة", "انتبه من السيارات السريعة", ["entebih men es-sayyarat es-saree3a", "entebeh min el sayarat el sari3a"], "watch out for speeding cars", "Levantine", "Phrases"),
    ("الطَّرِيق فَاضِي هَلَّأ", "الطريق فاضي هلأ", ["et-tareeq fadi halla2", "el tari2 faadi hala"], "the road is empty right now", "Levantine", "Phrases"),
    ("سَاعَة الذِّرْوَة كْتِير صَعْبِة", "ساعة الذروة كتير صعبة", ["sa3et ez-zirwa kteer sa3beh", "sa3et el zerweh ktir sa3ba"], "rush hour is very tough", "Levantine", "Phrases"),
    ("عَلَّقْنَا بِالعَجْقَة سَاعْتَيْن", "علقنا بالعجقة ساعتين", ["3alliqna bel 3ajqa sa3tein", "3alla2na bel 3aj2a se3ten"], "we got stuck in traffic for two hours", "Levantine", "Phrases"),
    ("مَا عَمْ يِتْحَرَّك السِّير أَبَدًا", "ما عم يتحرك السير ابدا", ["ma 3am yitharrak es-seer abadan", "ma 3am yet7arrak el seer abadan"], "traffic isn't moving at all", "Levantine", "Phrases"),
    ("تْأَخَّرْت عَلَى شُغْلِي بِسَبَب الزَّحْمَة", "تأخرت على شغلي بسبب الزحمة", ["t'akhart 3ala shoghli b-sabab ez-zahmeh", "t2a55art 3ala sho3'li bsbab el za7me"], "I was late to work because of the traffic", "Levantine", "Phrases"),
    ("فِيك تْنَزِّلْنِي عِنْد أَوَّل جِسِر؟", "فيك تنزلني عند اول جسر؟", ["feek tnazzilni 3end awwal jisr?", "fik tnazzilni 3end awwal jeser?"], "could you drop me off at the first bridge?", "Levantine", "Phrases"),
    ("انْزِلْت بِالمَحَطَّة الغَلَط", "نزلت بالمحطة الغلط", ["nzelt bel mahatta el ghalat", "nzelt bel ma7a6a el 3'ala6"], "I got off at the wrong station", "Levantine", "Phrases"),
    ("أَيّ بَاص بْرُوح عَ الجَامْعَة؟", "اي باص بروح ع الجامعة؟", ["ayy bas birooh 3al jam3a?", "ay baas broo7 3al jam3a?"], "which bus goes to the university?", "Levantine", "Phrases"),
    ("هَادَا البَاص رَايِح عَ صُوَيْلِح؟", "هادا الباص رايح ع صويلح؟", ["hada el bas rayeh 3a swayleh?", "hada el baas rayi7 3a sweileh?"], "is this bus going to Sweileh?", "Levantine", "Phrases"),
    ("بَاص السَّرِيع بْوَفِّر وَقْت", "باص السريع بوفر وقت", ["bas es-saree3 biwaffir waqt", "baas el saree3 bwafer wa2et"], "the Rapid Transit Bus saves time", "Levantine", "Phrases"),
    ("تَذْكَرَة البَاص دِينَار وَاحِد", "تذكرة الباص دينار واحد", ["tazkaret el bas dinar wahed", "tazkaret el baas deenar wa7ad"], "the bus ticket is one dinar", "Levantine", "Phrases"),
    ("قِطَار المِتْرُو أَسْرَع شِي", "قطار المترو اسرع شي", ["qitar el metro asra3 shi", "2e6ar el metro asra3 shi"], "the metro train is the fastest", "Levantine", "Phrases"),
    ("بَدِّي شِرْطَة سَفَر", "بدي شرطة سفر", ["baddi shartat safar", "beddi ticket safar"], "I need a travel ticket / transit pass", "Levantine", "Phrases"),
    ("عَبِّيلِي بَنْزِين بِعِشْرِين أَلْف", "عبيلي بنزين بعشرين الف", ["3abbili banzeen b-3eshreen alf", "3abbeli benzeen b 3ishrin alef"], "fill up twenty thousand worth of petrol", "Levantine", "Phrases"),
    ("فَلِّل التَّانْك لَوْ سَمَحْت", "فلل التانك لو سمحت", ["fallel et-tank law sama7t", "fallel el tank law samaht"], "fill up the tank, please", "Levantine", "Phrases"),
    ("شَيِّك عَلَى زَيْت المَاتُور", "شيك على زيت الماتور", ["shayyik 3ala zayt el mator", "shayyek 3ala zeet el motor"], "check the engine oil", "Levantine", "Phrases"),
    ("نَفِّخ الدَّوَالِيب شْوَيّ", "نفخ الدواليب شوي", ["naffikh ed-dawalib shwayy", "nafekh el dawaleeb shway"], "inflate the tires a bit", "Levantine", "Phrases"),
    ("عِنْدِي دُولَاب مْبَنْشِر", "عندي دولاب مبنشر", ["3andi doolab mbansher", "3indi dowlab mbanshar"], "I have a punctured tire", "Levantine", "Phrases"),
    ("بَدِّي أُغَيِّر السْتِبْنِة", "بدي اغير الاستبنة", ["baddi ghayyir es-stebneh", "beddi 3'ayyer el estebneh"], "I need to change the spare tire", "Levantine", "Phrases"),
    ("فَضْيَت بَطَّارِيِّة السَّيَّارَة", "فضيت بطارية السيارة", ["fidyet battariyet es-sayyara", "fedyet ba6ariyat el sayara"], "the car battery died", "Levantine", "Phrases"),
    ("مَعَك كَبْلَات لِنْدَوْزِنْهَا؟", "معك كبلات لندوزنها؟", ["ma3ak kablat la ndawzenha?", "ma3ak kblat la ndawzenha?"], "do you have jumper cables to jumpstart it?", "Levantine", "Phrases"),
    ("طَلَبْت وِنْش لَيِسْحَبْهَا", "طلبت ونش ليسحبها", ["talabt winch la yis-habha", "6labet wensh la yes7abha"], "I called a tow truck to pull it", "Levantine", "Phrases"),

    # 76-100 (Street checkpoints, security, navigation landmarks)
    ("وَقَّفْنَا عَلَى الحَاجِز", "وقفنا على الحاجز", ["waqqafna 3al hajez", "wa22afna 3al 7ajez"], "we stopped at the checkpoint", "Levantine", "Phrases"),
    ("طَلَبُوا مِنَّا الهُوِيَّات", "طلبوا منا الهويات", ["talabu minna el huwiyyat", "6alaboo menna el hawiyyat"], "they asked us for our identity cards", "Levantine", "Phrases"),
    ("فَتَّشُوا صُنْدُوق السَّيَّارَة", "فتشوا صندوق السيارة", ["fattashu sundooq es-sayyara", "fattaShoo 9andoo2 el sayara"], "they searched the car trunk", "Levantine", "Phrases"),
    ("مَعِي تَصْرِيح مْرُور", "معي تصريح مرور", ["ma3i tasreeh mroor", "ma3ee ta9ree7 mroor"], "I have a transit/passage permit", "Levantine", "Phrases"),
    ("الأَمْن وَاقِف عَالطَّرِيق", "الامن واقف عالطريق", ["el amn waqef 3at-tareeq", "el amen wa2ef 3al tari2"], "security is standing on the road", "Levantine", "Phrases"),
    ("ضَيَّعْت الطَّرِيق بْوَسَط المَدِينِة", "ضيعت الطريق بوسط المدينة", ["dayya3t et-tareeq b-wasat el madeeneh", "dayya3et el tari2 bwast el mdeeneh"], "I lost my way in the city center", "Levantine", "Phrases"),
    ("كُنْت عَمْ بَمْشِي بْحَارَات القُدْس القَدِيمِة", "كنت عم بمشي بحارات القدس القديمة", ["kunt 3am bamshi b-harat el quds el qadeemeh", "kunt 3am bamshi b 7arat el 2uds"], "I was walking through the alleys of the Old City of Jerusalem", "Levantine", "Phrases"),
    ("سَاحَة المَرْجِة بِدِمَشْق مَلْيَانِة نَاس", "ساحة المرجة بدمشق مليانة ناس", ["sahat el marjeh bi dimashq malyaneh nas", "sa7et el marjeh b dmesh2 malyani nas"], "Marjeh Square in Damascus is full of people", "Levantine", "Phrases"),
    ("التَّكْسِي وَقَّف عِنْد دُوَّار المَنَارَة", "التكسي وقف عند دوار المنارة", ["et-taxi waqqaf 3end dowwar el manara", "el taxi wa22af 3ind dowwar al manara"], "the taxi stopped at the Manara roundabout in Ramallah", "Levantine", "Phrases"),
    ("عَجْقَة كْتِير عَلَى دُوَّار الدَّاخِلِيِّة", "عجقة كتير على دوار الداخلية", ["3ajqa kteer 3ala dowwar ed-dakhiliyye", "3aj2a ktir 3ala dowar el da5liyeh"], "a lot of traffic on the Interior roundabout in Amman", "Levantine", "Phrases"),
    ("نَزِّلْنِي عِنْد سَاسِين بِالأَشْرَفِيِّة", "نزلني عند ساسين بالاشرفية", ["nazzilni 3end saseen bel ashrafiyye", "nazelni 3ind sassine bel achrafieh"], "drop me off at Sassine in Achrafieh, Beirut", "Levantine", "Phrases"),
    ("طَرِيق المَطَار سَالِك هَلَّأ", "طريق المطار سالك هلأ", ["tareeq el matar salek halla2", "tari2 el ma6ar salik hala"], "the airport road is clear right now", "Levantine", "Phrases"),
    ("فِي إِغْلَاق عَلَى المَدْخَل الشَّمَالِي", "في اغلاق على المدخل الشمالي", ["fi ighlaq 3al madkhal esh-shamali", "fee e3'la2 3al mad5al el shamali"], "there is a closure on the northern entrance", "Levantine", "Phrases"),
    ("فِيك تْشَغِّل المُكَيِّف لَوْ سَمَحْت؟", "فيك تشغل المكيف لو سمحت؟", ["feek tshaghil el mukayyef law sama7t?", "fik tsha3'el el mkayyef?"], "could you turn on the air conditioner, please?", "Levantine", "Phrases"),
    ("الشُّبَّاك مَفْتُوح عَمْ يِفُوت هَوَا بَارِد", "الشباك مفتوح عم يفوت هوا بارد", ["esh-shibbak maftooh 3am yfoot hawa bared", "el shebbak maftoo7 3am yfoot hawa bared"], "the window is open and cold air is blowing in", "Levantine", "Phrases"),
    ("سَكِّر الشُّبَّاك كِرْمَال الغَبَرَة", "سكر الشباك كرمال الغبرة", ["sakker esh-shibbak kermal el ghabara", "sakker el shebbak kermal el 3'abra"], "close the window because of the dust", "Levantine", "Phrases"),
    ("ارْبُط حِزَام الأَمَان كِرْمَال الشُّرْطَة", "اربط حزام الامان كرمال الشرطة", ["orbot hizam el aman kermal esh-shorta", "orbo6 7ezam el aman kermal el shor6a"], "fasten your seatbelt because of the police", "Levantine", "Phrases"),
    ("مَا عَمْ بْلَاقِي مَوْقِف سَيَّارَة", "ما عم بلاقي موقف سيارة", ["ma 3am bla2i mawqef sayyara", "ma 3am blaa2i mo2af sayara"], "I can't find a car parking spot", "Levantine", "Phrases"),
    ("فُوت بِهَالدَّخْلِة الضَّيِّقَة", "فوت بهالدخلة الضيقة", ["foot b-had-dakhleh ed-dayyeqa", "fut b hal da5leh el dayy2a"], "go into this narrow alley", "Levantine", "Phrases"),
    ("الشَّارِع اتِّجَاه وَاحِد بَسّ", "الشارع اتجاه واحد بس", ["esh-share3 ittejah wahed bas", "el shari3 ettejah wa7ad bas"], "the street is one-way only", "Levantine", "Phrases"),
    ("مَمْنُوع تْدُور مِنْ هُون", "ممنوع تدور من هون", ["mamnoo3 tdoor min hon", "mamnu3 tdoor men hoon"], "turning from here is forbidden", "Levantine", "Phrases"),
    ("لَازِم نِمْشِي عَلَى الرَّصِيف", "لازم نمشي على الرصيف", ["lazem nemshi 3al raseef", "lazim namshi 3al ra9eef"], "we must walk on the sidewalk", "Levantine", "Phrases"),
    ("الرَّصِيف مَلْيَان بَسْطَات", "الرصيف مليان بسطات", ["er-raseef malyan bastat", "el ra9eef melyan ba9tat"], "the sidewalk is crowded with street stalls", "Levantine", "Phrases"),
    ("البَيَّاعِين عَمْ بْنَادُوا عَالْبِضَاعَة", "البياعين عم بنادوا ع البضاعة", ["el bayya3een 3am bnadu 3al bida3a", "el baya3in 3am bnadoo 3al bda3a"], "street vendors are shouting to advertise their goods", "Levantine", "Phrases"),
    ("كَمِّل مَشْي لَآخِر الشَّارِع", "كمل مشي لاخر الشارع", ["kammel mashy la akher esh-share3", "kamel mashi la a5er el shari3"], "keep walking until the end of the street", "Levantine", "Phrases"),

    # 101-135 (Urban living, public transport etiquette, local urban interactions)
    ("سَأَلْت شَبّ عَالطَّرِيق وَدَلَّنِي", "سألت شب عالطريق ودلني", ["sa2alt shabb 3at-tareeq w dallni", "sa2alet shab 3al tari2 w dallani"], "I asked a guy on the street and he directed me", "Levantine", "Phrases"),
    ("دَلَّنِي غَلَط وَضِعْت زْيَادِة", "دلني غلط وضعت زيادة", ["dallni ghalat w di3et zyadeh", "dallani 3'alat w de3et zyade"], "he misdirected me and I got even more lost", "Levantine", "Phrases"),
    ("افْتَح الخَرِيطَة عَالْمُوبَايِل", "افتح الخريطة عالموبايل", ["eftah el khareeta 3al mobile", "efta7 el 5areeta 3al phon"], "open the map on your mobile phone", "Levantine", "Phrases"),
    ("اللُّوكَيْشِن مُش دَقِيق هُون", "اللوكيشن مش دقيق هون", ["el location mosh daqeeq hon", "el lokayshin mesh da2ee2 hoon"], "the GPS location is not accurate here", "Levantine", "Phrases"),
    ("ابْعَتْلِي مَوْقِعَك عَالوَاتْسَاب", "ابعتلي موقعك عالواتساب", ["eb3atli mawqe3ak 3al whatsapp", "eb3atli maw2e3ak 3al whats"], "send me your location on WhatsApp", "Levantine", "Phrases"),
    ("أَنَا وَاقِف قْدَام المَخْبَز", "انا واقف قدام المخبز", ["ana waqef 2eddamm el makhbaz", "ana wa2ef eddam el ma5baz"], "I am standing in front of the bakery", "Levantine", "Phrases"),
    ("تَعَا لَاقِينِي عِنْد الدُّوَّار", "تعا لاقيني عند الدوار", ["ta3a laqeeni 3end ed-dowwar", "ta3aa la2eeni 3ind el dowar"], "come meet me at the roundabout", "Levantine", "Phrases"),
    ("خَلِّينَا نِلْتَقِي بْوَسَط البَلَد", "خلينا نلتقي بوسط البلد", ["khallina nelteqi b-wasat el balad", "5allina nelta2i bwast el balad"], "let's meet in downtown", "Levantine", "Phrases"),
    ("الدِّنْيَا عَجْقَة كْتِير اللَّيْلِة", "الدنيا عجقة كتير الليلة", ["ed-dinya 3ajqa kteer el layleh", "el deneh 3aj2a ktir el leyleh"], "the streets are packed tonight", "Levantine", "Phrases"),
    ("الصَّوْت كْتِير عَالِي مِن الزَّمَامِير", "الصوت كتير عالي من الزمامير", ["es-sawt kteer 3ali men ez-zamameer", "el sawt ktir 3ali men el zamamir"], "the sound from car horns is very loud", "Levantine", "Phrases"),
    ("بَطِّل تْزَمِّر يَا رَجُل!", "بطل تزمر يا رجل", ["battel tzammer ya rajol!", "ba66el tzammer ya zalameh!"], "stop honking your horn, man!", "Levantine", "Phrases"),
    ("إِشَارَة المْرُور حَمْرَا", "اشارة المرور حمرا", ["isharet el mroor hamra", "2esharet el mroor 7amra"], "the traffic light is red", "Levantine", "Phrases"),
    ("فَتَحَت الإِشَارَة خَضْرَا", "فتحت الاشارة خضرا", ["fatahat el ishara khadra", "fata7et el eshara 5adra"], "the light turned green", "Levantine", "Phrases"),
    ("اسْتَنَّى عَلَى بَيْن مَا تْصِير خَضْرَا", "استنى على بين ما تصير خضرا", ["estanna 3ala bayn ma tseer khadra", "stanna la tseer 5adra"], "wait until it turns green", "Levantine", "Phrases"),
    ("قَاطِع الإِشَارَة الحَمْرَا", "قاطع الاشارة الحمرا", ["qaate3 el ishara el hamra", "2a6e3 el eshareh el 7amra"], "running the red light", "Levantine", "Phrases"),
    ("كَتَبْلِي الشُّرْطِي ضَبْط", "كتبلي الشرطي ضبط", ["katabli esh-shorti dabt", "katabli el shor6i dab6"], "the policeman wrote me a citation", "Levantine", "Phrases"),
    ("سَحَبُوا مِنُّه الرُّخْصَة", "سحبوا منه الرخصة", ["sahabu mennoh er-rokhsa", "sa7aboo menno el ro5sa"], "they confiscated his driver's license", "Levantine", "Phrases"),
    ("السَّيَّارَة تْعَطَّلَت بْنُصّ الطَّرِيق", "السيارة تعطلت بنص الطريق", ["es-sayyara t3attalat b-noss et-tareeq", "el sayara t3a66alet bnos el tari2"], "the car broke down in the middle of the road", "Levantine", "Phrases"),
    ("دَفَعْنَا السَّيَّارَة عَالجَنْب", "دفعنا السيارة عالجنب", ["dafa3na es-sayyara 3al janb", "dafa3na el sayara 3al jamb"], "we pushed the car to the side", "Levantine", "Phrases"),
    ("مَا عَمْ تْدُور السَّيَّارَة مَعِي", "ما عم تدور السيارة معي", ["ma 3am tdoor es-sayyara ma3i", "ma 3am tdoor el sayara ma3ee"], "the car won't start for me", "Levantine", "Phrases"),
    ("شُوف المِيكَانِيكِي إِذَا بْيِقْدَر يِجِي", "شوف الميكانيكي اذا بيقدر يجي", ["shoof el mikaniki iza byeqdar yiji", "shoof el mekaniki eza byi2dar yiji"], "see if the mechanic can come over", "Levantine", "Phrases"),
    ("بَدَّلْت قِطَع غِيَار جْدِيدِة", "بدلت قطع غيار جديدة", ["baddalt qeta3 gheeyar jdeedeh", "baddalet 2e6a3 3'yar jdideh"], "I replaced with new spare parts", "Levantine", "Phrases"),
    ("البِنَايِة إِلْهَا مَدْخَلَيْن", "البناية الها مدخلين", ["el binayeh elha madkhalayn", "el bineyeh elha mad5alen"], "the building has two entrances", "Levantine", "Phrases"),
    ("اطْلَع بِالأَسَانْسِير لَلطَّابِق التَّالِت", "اطلع بالاسانسير للطابق التالت", ["etla3 bel asanseer lat-tabeq et-talet", "e6la3 bel asansir lal 6abe2 el talet"], "take the elevator up to the third floor", "Levantine", "Phrases"),
    ("الأَسَانْسِير مْعَطَّل خَلِّينَا نِطْلَع عَالْدَّرَج", "الاسانسير معطل خلينا نطلع عالدرج", ["el asanseer m3attal khallina netla3 3ad-daraj", "el asansir m3a66al 5allina ne6la3 3al daraj"], "the elevator is broken down, let's take the stairs", "Levantine", "Phrases"),
    ("اسْأَل النَّاطُور عَن المَفَاتِيح", "اسأل الناطور عن المفاتيح", ["es2al en-natoor 3an el mafateeh", "es2al el natoor 3an el mafati7"], "ask the building caretaker about the keys", "Levantine", "Phrases"),
    ("الحَارِس قَاعِد عَالْبَاب", "الحارس قاعد ع الباب", ["el hares qa3ed 3al bab", "el 7ares 2a3ed 3al baab"], "the watchman is sitting by the door", "Levantine", "Phrases"),
    ("الجِيرَان كْتِير طَيِّبِين وَمُحْتَرَمِين", "الجيران كتير طيبين ومحترمين", ["el jeeran kteer tayybeen w mohtarameen", "el jiran ktir 6ayybin w mo7taramin"], "the neighbors are very kind and respectable", "Levantine", "Phrases"),
    ("فِي إِزْعَاج كْبِير بِالشَّارِع", "في ازعاج كبير بالشارع", ["fi ez3aj kbeer besh-share3", "fee ez3aj kbir bel shari3"], "there is great disturbance/noise in the street", "Levantine", "Phrases"),
    ("السُّوق مَسَكِّر يَوْم الجُمْعَة", "السوق مسكر يوم الجمعة", ["es-souq msakkar yawm el jem3a", "el soo2 msakker yom el jom3a"], "the market is closed on Friday", "Levantine", "Phrases"),
    ("فِيك تْوَصِّلْنِي بِطَرِيقَك؟", "فيك توصلني بطريقك؟", ["feek twassilni b-tareeqak?", "fik twa9elni b taree2ak?"], "can you give me a ride on your way?", "Levantine", "Phrases"),
    ("ارْكَب مَعِي بْطَرِيقِي", "اركب معي بطريقي", ["erkab ma3i b-tareeqi", "erkab ma3i b tari2i"], "hop in with me, it's on my way", "Levantine", "Phrases"),
    ("حَسَابَك وَاصِل يَا خَيِّي", "حسابك واصل يا خيي", ["hisabak wasel ya khayyi", "7sabak wa9el ya 5ayye"], "it's already taken care of / on the house, brother", "Levantine", "Phrases"),
    ("يِخْلِف عَلَيْك كَثَّر خَيْرَك", "يخلف عليك كثر خيرك", ["yikhlef 3alayk kaththar khayrak", "ye5lef 3alek katter 5erak"], "may God repay you, thank you very much", "Levantine", "Phrases"),
    ("تُوصَل بِالسَّلَامِة انْ شَاء الله", "توصل بالسلامة ان شاء الله", ["towsil bel salameh en sha2 allah", "tow9al belsalameh inshallah"], "may you arrive safely, God willing", "Levantine", "Phrases")
]

all_entries = []

for item in words_data:
    all_entries.append({
        "arabic": item[0],
        "arabic_plain": item[1],
        "translit": item[2],
        "translation_en": item[3],
        "dialect": item[4],
        "category": item[5]
    })

for item in phrases_data:
    all_entries.append({
        "arabic": item[0],
        "arabic_plain": item[1],
        "translit": item[2],
        "translation_en": item[3],
        "dialect": item[4],
        "category": item[5]
    })

print(f"Total entries: {len(all_entries)}")
words_count = sum(1 for e in all_entries if e["category"] == "Words")
phrases_count = sum(1 for e in all_entries if e["category"] == "Phrases")
print(f"Words: {words_count}, Phrases: {phrases_count}")

# Check uniqueness of arabic_plain
plain_set = set()
duplicates = []
for e in all_entries:
    p = e["arabic_plain"]
    if p in plain_set:
        duplicates.append(p)
    plain_set.add(p)

if duplicates:
    print(f"Duplicates found ({len(duplicates)}): {duplicates}")
else:
    print("All entries are unique in arabic_plain!")

output_path = "/home/colin/Desktop/dev/arabic_monkeytype/raw_chunks/batch_5.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(all_entries, f, ensure_ascii=False, indent=2)

print(f"Successfully written to {output_path}")
