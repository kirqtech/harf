#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Nateq Content Generation, Expansion & Validation Pipeline (scripts/seed_datasets.py).
Populates and validates:
  - data/levantine/words.json & data/levantine/phrases.json (600+ target)
  - data/egyptian/words.json  & data/egyptian/phrases.json  (600+ target)
  - data/quranic/words.json   & data/quranic/phrases.json   (400+ target)
Also cleans data/letters.json and data/phrases.json so every JSON file in data/
has valid syntax, zero empty fields, and zero duplicate arabic_plain entries.
"""

import json
import os
import re
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from scripts.egyptian_data import EGYPTIAN_WORDS, EGYPTIAN_PHRASES
from scripts.quranic_data import QURANIC_WORDS, QURANIC_PHRASES

# Regex stripping all Arabic harakat, Uthmanic pause marks, dagger alifs,
# rounded sukoons, superscript/subscript marks, and tatweel.
STRIP_ALL_DIACRITICS_RE = re.compile(
    r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\u08E3-\u08FF\u0640]"
)
HAS_DIACRITICS_RE = re.compile(r"[\u064B-\u0652\u0670]")


def normalize_arabic_plain(text: str) -> str:
    """
    Strip all Uthmanic pause marks, dagger alifs, rounded sukoons, tatweels,
    and diacritics, and normalize Uthmanic wasla alif (ٱ -> ا) so arabic_plain
    matches a standard native Arabic keyboard layout effortlessly.
    """
    cleaned = STRIP_ALL_DIACRITICS_RE.sub("", text)
    cleaned = cleaned.replace("\u0671", "\u0627")  # ٱ -> ا
    cleaned = cleaned.replace("?", "؟")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def clean_translit_list(translit_list, is_egyptian=False, has_jeem=False):
    """Deduplicate and clean transliteration list while preserving order."""
    out = []
    seen = set()
    for item in translit_list:
        t = str(item).strip()
        if not t:
            continue
        if is_egyptian and has_jeem and "j" in t.lower():
            t = t.replace("j", "g").replace("J", "G")
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


def build_uniform_entry(arabic, arabic_plain, translit, translation_en, dialect, category):
    """Create a uniform schema dictionary with zero empty fields."""
    arabic = str(arabic).replace("?", "؟").strip()
    plain = normalize_arabic_plain(arabic_plain if arabic_plain else arabic)
    has_jeem = "ج" in plain or "ج" in arabic
    t_list = clean_translit_list(
        translit, is_egyptian=(dialect == "Egyptian"), has_jeem=has_jeem
    )
    return {
        "arabic": arabic,
        "arabic_plain": plain,
        "translit": t_list,
        "translation_en": str(translation_en).strip(),
        "dialect": dialect,
        "category": category,
    }


def seed_levantine():
    """Ensure Levantine datasets have all required vocabulary and adhere strictly to schema."""
    words_path = os.path.join(ROOT_DIR, "data", "levantine", "words.json")
    phrases_path = os.path.join(ROOT_DIR, "data", "levantine", "phrases.json")

    with open(words_path, "r", encoding="utf-8") as f:
        raw_words = json.load(f)
    with open(phrases_path, "r", encoding="utf-8") as f:
        raw_phrases = json.load(f)

    # Priority Levantine words to ensure exact required tokens are present
    priority_words = [
        ("هَلَّق", "هلق", ["halla2", "halla'", "hala2", "hallaq"], "now / right now"),
        ("شُو", "شو", ["shu", "chou", "shoo", "shou", "shuu"], "what"),
        ("بِدِّي", "بدي", ["baddi", "beddi", "badi", "biddi"], "I want / I need"),
        ("كِيفَك", "كيفك", ["kifak", "kifik", "keefak", "keefik", "kefak"], "how are you (m/f)"),
        ("مَا بَعْرِف", "ما بعرف", ["maba3ref", "ma ba3ref", "maba3rif", "ma ba'ref"], "I don't know"),
        ("عَم بَعْمِل", "عم بعمل", ["3am ba3mel", "3am ba3mil", "am ba3mel"], "I am doing / making"),
    ]

    priority_phrases = [
        ("يَعْطِيك العَافْيِة", "يعطيك العافية", ["ya3tik l3afye", "ya3teek el 3afye", "ya3tik el 3afieh", "ya'tik l3afye"], "may God give you strength / well done"),
        ("شُو عَم تَعْمِل هَلَّق؟", "شو عم تعمل هلق؟", ["shu 3am ta3mel halla2", "chou 3am ta3mel halla2", "sho 3am ta3mil halla'"], "what are you doing right now?"),
        ("عَم بَعْمِل قَهْوِة، بِدَّك فِنْجَان؟", "عم بعمل قهوة، بدك فنجان؟", ["3am ba3mel 2ahwe baddak fenjan", "3am ba3mil 'ahwe baddak finjan"], "I am making coffee, do you want a cup?"),
        ("وَاللهِ مَا بَعْرِف شُو بِدِّي أَعْمِل", "والله ما بعرف شو بدي أعمل", ["wallah maba3ref shu baddi 2a3mel", "wallah ma ba3ref chou baddi a3mel"], "honestly I don't know what I want to do"),
        ("كِيفَك اليُوم؟ شُو أَخْبَارَك؟", "كيفك اليوم؟ شو أخبارك؟", ["kifak el yom shu akhbarak", "keefak el youm chou a5barak"], "how are you today? what's your news?"),
    ]

    words_out = []
    seen_words = set()

    for ar, pl, tr, en in priority_words:
        entry = build_uniform_entry(ar, pl, tr, en, "Levantine", "Words")
        seen_words.add(entry["arabic_plain"])
        words_out.append(entry)

    for item in raw_words:
        entry = build_uniform_entry(
            item["arabic"],
            item.get("arabic_plain", ""),
            item["translit"],
            item["translation_en"],
            "Levantine",
            "Words",
        )
        # Add 8 variant where gh is present in translit
        extra_tr = list(entry["translit"])
        for t in list(entry["translit"]):
            if "gh" in t:
                v8 = t.replace("gh", "8")
                if v8 not in extra_tr:
                    extra_tr.append(v8)
        entry["translit"] = extra_tr
        if entry["arabic_plain"] not in seen_words:
            seen_words.add(entry["arabic_plain"])
            words_out.append(entry)

    phrases_out = []
    seen_phrases = set()

    for ar, pl, tr, en in priority_phrases:
        entry = build_uniform_entry(ar, pl, tr, en, "Levantine", "Phrases")
        seen_phrases.add(entry["arabic_plain"])
        phrases_out.append(entry)

    for item in raw_phrases:
        entry = build_uniform_entry(
            item["arabic"],
            item.get("arabic_plain", ""),
            item["translit"],
            item["translation_en"],
            "Levantine",
            "Phrases",
        )
        if entry["arabic_plain"] not in seen_phrases:
            seen_phrases.add(entry["arabic_plain"])
            phrases_out.append(entry)

    with open(words_path, "w", encoding="utf-8") as f:
        json.dump(words_out, f, ensure_ascii=False, indent=2)
    with open(phrases_path, "w", encoding="utf-8") as f:
        json.dump(phrases_out, f, ensure_ascii=False, indent=2)

    return len(words_out), len(phrases_out)


def seed_egyptian():
    """Populate data/egyptian/words.json and data/egyptian/phrases.json."""
    words_path = os.path.join(ROOT_DIR, "data", "egyptian", "words.json")
    phrases_path = os.path.join(ROOT_DIR, "data", "egyptian", "phrases.json")

    words_out = []
    seen_words = set()
    for ar, pl, tr, en in EGYPTIAN_WORDS:
        entry = build_uniform_entry(ar, pl, tr, en, "Egyptian", "Words")
        if entry["arabic_plain"] not in seen_words:
            seen_words.add(entry["arabic_plain"])
            words_out.append(entry)

    phrases_out = []
    seen_phrases = set()
    for ar, pl, tr, en in EGYPTIAN_PHRASES:
        entry = build_uniform_entry(ar, pl, tr, en, "Egyptian", "Phrases")
        if entry["arabic_plain"] not in seen_phrases:
            seen_phrases.add(entry["arabic_plain"])
            phrases_out.append(entry)

    with open(words_path, "w", encoding="utf-8") as f:
        json.dump(words_out, f, ensure_ascii=False, indent=2)
    with open(phrases_path, "w", encoding="utf-8") as f:
        json.dump(phrases_out, f, ensure_ascii=False, indent=2)

    return len(words_out), len(phrases_out)


def seed_quranic():
    """Populate data/quranic/words.json and data/quranic/phrases.json."""
    words_path = os.path.join(ROOT_DIR, "data", "quranic", "words.json")
    phrases_path = os.path.join(ROOT_DIR, "data", "quranic", "phrases.json")

    words_out = []
    seen_words = set()
    for ar, pl, tr, en in QURANIC_WORDS:
        entry = build_uniform_entry(ar, pl, tr, en, "Quranic", "Words")
        if entry["arabic_plain"] not in seen_words:
            seen_words.add(entry["arabic_plain"])
            words_out.append(entry)

    phrases_out = []
    seen_phrases = set()
    for ar, pl, tr, en in QURANIC_PHRASES:
        entry = build_uniform_entry(ar, pl, tr, en, "Quranic", "Phrases")
        if entry["arabic_plain"] not in seen_phrases:
            seen_phrases.add(entry["arabic_plain"])
            phrases_out.append(entry)

    with open(words_path, "w", encoding="utf-8") as f:
        json.dump(words_out, f, ensure_ascii=False, indent=2)
    with open(phrases_path, "w", encoding="utf-8") as f:
        json.dump(phrases_out, f, ensure_ascii=False, indent=2)

    return len(words_out), len(phrases_out)


def clean_shared_files():
    """Ensure data/letters.json and data/phrases.json have zero empty fields or duplicates."""
    for rel_path in ["data/letters.json", "data/phrases.json"]:
        full_path = os.path.join(ROOT_DIR, rel_path)
        if not os.path.exists(full_path):
            continue
        with open(full_path, "r", encoding="utf-8") as f:
            items = json.load(f)
        cleaned = []
        seen = set()
        for item in items:
            plain = normalize_arabic_plain(item.get("arabic_plain") or item["arabic"])
            if plain in seen:
                continue
            seen.add(plain)
            new_item = {
                "arabic": item["arabic"].strip(),
                "arabic_plain": plain,
                "translit": [str(x).strip() for x in item["translit"] if str(x).strip()],
                "translation_en": item["translation_en"].strip(),
                "dialect": item.get("dialect", "Levantine").strip() or "Levantine",
                "category": item.get("category", "Words").strip() or "Words",
            }
            if item.get("notes") and str(item["notes"]).strip():
                new_item["notes"] = str(item["notes"]).strip()
            cleaned.append(new_item)
        with open(full_path, "w", encoding="utf-8") as f:
            json.dump(cleaned, f, ensure_ascii=False, indent=2)


def validate_all_json():
    """Run strict integrity checks across all JSON files in data/."""
    data_dir = os.path.join(ROOT_DIR, "data")
    errors = []

    for root, _, files in os.walk(data_dir):
        for fname in sorted(files):
            if not fname.endswith(".json"):
                continue
            fpath = os.path.join(root, fname)
            rel = os.path.relpath(fpath, ROOT_DIR)
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as exc:
                errors.append(f"{rel}: Invalid JSON syntax: {exc}")
                continue

            if not isinstance(data, list) or len(data) == 0:
                errors.append(f"{rel}: Root JSON must be a non-empty list")
                continue

            if fname == "dialects.json":
                continue

            seen_plain = set()
            for idx, entry in enumerate(data):
                for key, val in entry.items():
                    if val is None:
                        errors.append(f"{rel}[{idx}]: Field '{key}' is None")
                    elif isinstance(val, str) and not val.strip():
                        errors.append(f"{rel}[{idx}]: Field '{key}' is empty string")
                    elif isinstance(val, list) and len(val) == 0:
                        errors.append(f"{rel}[{idx}]: Field '{key}' is empty list")

                for req_key in ["arabic", "arabic_plain", "translit", "translation_en", "dialect", "category"]:
                    if req_key not in entry:
                        errors.append(f"{rel}[{idx}]: Missing required key '{req_key}'")

                plain = entry.get("arabic_plain", "")
                if plain in seen_plain:
                    errors.append(f"{rel}[{idx}]: Duplicate arabic_plain '{plain}'")
                seen_plain.add(plain)

                if STRIP_ALL_DIACRITICS_RE.search(plain) or "\u0671" in plain:
                    errors.append(f"{rel}[{idx}]: arabic_plain contains unstripped diacritics/Uthmanic marks: '{plain}'")

                if fname != "letters.json" and not HAS_DIACRITICS_RE.search(entry.get("arabic", "")):
                    errors.append(f"{rel}[{idx}]: arabic is missing tashkeel/diacritics: '{entry.get('arabic')}'")

    if errors:
        print("INTEGRITY CHECK FAILED:")
        for e in errors[:25]:
            print("  -", e)
        sys.exit(1)

    print("ALL JSON INTEGRITY CHECKS PASSED (Valid JSON, 0 empty fields, 0 duplicates, 100% vocalized)!")


def main():
    lev_w, lev_p = seed_levantine()
    egy_w, egy_p = seed_egyptian()
    qur_w, qur_p = seed_quranic()
    clean_shared_files()

    print(f"Levantine : {lev_w} words + {lev_p} phrases = {lev_w + lev_p} total (target: 600+)")
    print(f"Egyptian  : {egy_w} words + {egy_p} phrases = {egy_w + egy_p} total (target: 600+)")
    print(f"Quranic   : {qur_w} words + {qur_p} phrases = {qur_w + qur_p} total (target: 400+)")

    validate_all_json()


if __name__ == "__main__":
    main()
