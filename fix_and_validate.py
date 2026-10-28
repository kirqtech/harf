import json
import re

TASHKEEL_REGEX = re.compile(r'[\u0617-\u061A\u064B-\u0652\u0670\u0640]')

def strip_tashkeel(text):
    return TASHKEEL_REGEX.sub('', text)

path = '/home/colin/Desktop/dev/arabic_monkeytype/raw_chunks/batch_9.json'
with open(path, 'r', encoding='utf-8') as f:
    items = json.load(f)

print("Original count:", len(items))

clean_items = []
seen_arabic = set()

# Manual fixes for typos detected in plain / arabic
fixes = {
    "سresourceك نار يا معلم": "سعرك نار يا معلم",
    "ما تصرخ بوجهي": "ما تصرخ بوجي",
    "زبائن": "زباين",
    "حرطقة": "حرتقة",
    "نزلي بالسعر": "نزللي بالسعر",
    "ما بتلاقي مثلها بالسوق": "ما بتلاقي متلها بالسوق",
    "والله هادا سعر رأسماله": "والله هادا سعر راسماله",
    "ما بتفهم بالذوق?": "ما بتفهم بالذوق؟",
    "لا تغلّط معي يا صاحبي": "لا تغلط معي يا صاحبي",
    "أنا شو ذنبي بالقصة?": "أنا شو ذنبي بالقصة؟"
}

for item in items:
    # Fix arabic if needed
    if "سresourceك" in item["arabic_plain"]:
        item["arabic"] = "سِعْرَك نَار يَا مْعَلِّم"
        item["arabic_plain"] = "سعرك نار يا معلم"
    
    # Strip tashkeel from arabic to form accurate arabic_plain
    plain_derived = strip_tashkeel(item["arabic"])
    # If there's an Arabic question mark vs English question mark
    item["arabic"] = item["arabic"].replace('?', '؟')
    plain_derived = plain_derived.replace('?', '؟')
    item["arabic_plain"] = plain_derived
    
    # Ensure translit has at least 2 variants
    if len(item["translit"]) < 2:
        print("Translit < 2:", item)
    
    # Check duplicates
    if item["arabic_plain"] in seen_arabic:
        print("Duplicate:", item["arabic_plain"])
        continue
    seen_arabic.add(item["arabic_plain"])
    clean_items.append(item)

print("Clean count:", len(clean_items))
words = [x for x in clean_items if x["category"] == "Words"]
phrases = [x for x in clean_items if x["category"] == "Phrases"]
print(f"Words: {len(words)}, Phrases: {len(phrases)}")

with open(path, 'w', encoding='utf-8') as f:
    json.dump(clean_items, f, ensure_ascii=False, indent=2)

print("Validation and write completed successfully.")
