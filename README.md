# Nateq - Arabic typing trainer

Nateq (ناطق) is a dependency-free Arabic typing trainer inspired by Monkeytype. It supports two typing modes across multiple Arabic varieties (Levantine, Egyptian, and Quranic):

- **Latin transliteration**: read an Arabic word, phrase, or syllable and type its Arabizi spelling (`kataba`, `7abeebi`).
- **Arabic letters**: read the Arabic word and type it on an Arabic keyboard. Harakat and punctuation are displayed when relevant, but not typed.

No backend, no build step, no account.

## Run it

Serve the folder with any static file server:

```bash
cd nateq
python3 -m http.server 8000
# or: npx serve .
```

Then open <http://localhost:8000>. Vocabulary is loaded with `fetch()` from `data/`, so the app must be served over HTTP rather than opened from `file://`. If loading fails, Nateq shows a friendly banner with retry and category-switch controls. The app runs entirely in the browser and only loads Google Fonts (with system fallbacks if offline).

## Choosing a script

Use the **abc / عربي** toggle in the control bar, or **Settings -> Script**. Your choice is saved in `localStorage`.

- **abc**: type the Latin transliteration. Case matters (see the mapping rules below).
- **عربي**: type the Arabic word on an Arabic keyboard:
  - Harakat, tanween, sukun, shadda, and tatweel are not typed.
  - The silent alif of `ـًا` is skipped (`كِتَابًا` -> `كتاب`).
  - Common letter variants match automatically (`أ إ آ ٱ` = `ا`, `ؤ` = `و`, `ئ` = `ي`, `ة` = `ه`, `ى` = `ي`, `ک` = `ك`).
  - Letters stay connected in their proper cursive forms as you type.
  - `?` shows the remaining letters.

## Features

- **Dialect Switcher**: switch between **Levantine (Shami)**, **Egyptian (Masri)**, and **Quranic / Classical** anytime using the header pill or `Alt+D` (`Ctrl+K`).
- **Letters**: 20 random single letters, short syllables, and long-vowel drills.
- **Words**: authentic variety-specific vocabulary with multiple accepted Arabizi spellings.
- **Reading**: the same vocabulary pool shown without harakat.
- **Phrases**: short Arabic expressions, everyday greetings, and Quranic ayahs.
- **External data**: all vocabulary is loaded from JSON and cached in memory, so category and dialect switches are instant after the first load.
- **Custom**: paste your own Arabic text and practice word by word.
- **Two scripts**: switch between Arabizi transliteration and Arabic keyboard input.
- **Hints**: the answer stays hidden until you press `?` or miss three times on the same word.
- **Live stats**: WPM, accuracy, streak, time, and progress.
- **Results summary**: end-of-round stats and a mistake review. Press `Enter` or `Space` to start the next round.
- **Cheat sheet & settings**: view all character mappings (`?` button or `F1`) and pick your preferred default hints for غ، خ، ق، ح.

## Controls

| Key | Action |
| --- | --- |
| Type | Enter the current word |
| `?` | Show a hint |
| `Space` | Submit the current word |
| `Backspace` | Delete the last character |
| `Alt+D` / `Ctrl+K` | Open the dialect switcher |
| `F1` | Toggle the cheat sheet |
| `Escape` | Start a new test |
| `Tab`, then `Enter` | Start a new test |
| `Enter` or `Space` in results | Start another round |

Press `Shift+Tab` to move focus out of the typing input.

## Transliteration rules

These rules apply to the Latin transliteration script (`abc`). Mappings are case-sensitive.

| Arabic | Accepted input |
| --- | --- |
| ء أ إ ؤ ئ | `2`, `'`, `a`, or omitted |
| ع | `3` |
| غ | `gh`, `3'`, or `8` |
| خ | `kh`, `7'`, or `5` |
| ح | `7` or `H` |
| ق | `q`, `9`, `2`, or `'` |
| س / ص | `s` / `S` |
| د / ض | `d` / `D` |
| ت / ط | `t` / `T` |
| ذ / ظ | `dh` / `Z` or `DH` |
| ه / ح | `h` / `H` or `7` |
| ز / ظ | `z` / `Z` |
| ك / ق | `k` / `q` or `9` |
| ث / ش / ج | `th` / `sh` / `j` (`g` in Egyptian) |
| ا | `aa` or `a` |
| و | `oo`, `uu`, `u`, or `w` |
| ي | `ee`, `ii`, `i`, or `y` |
| ة | `a`, `eh`, `e`, or `h` |
| ى | `aa` or `a` |
| Short vowels | fatha `a`, kasra `i` / `e`, damma `u` / `o` |
| Tanween | `an`, `in`, `un` |
| Sukun | no character |
| Shadda | double the consonant |

## Project structure

```text
.
├── index.html              # Markup and dialogs
├── css/
│   └── styles.css          # Styles, loading skeleton, responsive layout
├── data/
│   ├── dialects.json       # Dialect registry
│   ├── letters.json        # Arabic letter drill base set
│   ├── levantine/          # Levantine (Shami) words.json & phrases.json
│   ├── egyptian/           # Egyptian (Masri) words.json & phrases.json
│   └── quranic/            # Quranic / Classical words.json & phrases.json
├── js/
│   ├── translit.js         # Tokenizer and input matchers (NateqTranslit)
│   ├── dialect-manager.js  # Dialect registry, persistence & caching (NateqDialectManager)
│   ├── data-loader.js      # Async fetch + dataset normalization (NateqDataLoader)
│   ├── data.js             # Normalization, drills, picking utilities (NateqData)
│   └── app.js              # UI state, typing loop, stats, settings
├── scripts/
│   └── seed_datasets.py    # Content pipeline and JSON integrity validator
├── assets/
│   └── favicon.svg
└── README.md
```

## Adding words or phrases

Edit the JSON files in `data/<variety>/` or update `scripts/seed_datasets.py`. Every item uses the uniform schema:

```json
{
  "arabic": "بِدِّي",
  "arabic_plain": "بدي",
  "translit": ["baddi", "beddi", "badi"],
  "translation_en": "I want / I need",
  "dialect": "Levantine",
  "category": "Words"
}
```

- `arabic` is the display form with full diacritics/harakat.
- `arabic_plain` is the strictly unvoweled script for typing match and lookup.
- `translit` lists accepted Arabizi spellings; the engine still expands common variants at runtime.
- `dialect` is `Levantine`, `Egyptian`, or `Quranic`.
- `category` is `Words`, `Phrases`, or `Letters`.

## Data loading

`js/dialect-manager.js` and `js/data-loader.js` own all network access:

- Fetches the dialect registry (`data/dialects.json`) and loads the active variety's `words.json` and `phrases.json` on demand.
- Caches parsed items in memory per dialect and category so switching dialects or modes never repeats a network request.
- Removes failed files from the cache so **retry** performs a real request.
- Rejects gracefully on `file://` restrictions and network errors; the UI then shows a banner with retry and category-switch controls.
