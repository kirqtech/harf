# Harf - Arabic typing trainer

Harf is a dependency-free Arabic typing trainer inspired by Monkeytype. It supports two typing modes:

- **Latin transliteration**: read an Arabic word, phrase, or syllable and type its Arabizi spelling (`kataba`, `7abeebi`).
- **Arabic letters**: read the Arabic word and type it on an Arabic keyboard. Harakat and punctuation are displayed when relevant, but not typed.

No backend, no build step, no account.

## Run it

Serve the folder with any static file server:

```bash
cd arabic_monkeytype
python3 -m http.server 8000
```

Then open <http://localhost:8000>, or open `index.html` directly in a browser. The app runs entirely in the browser and only loads Google Fonts (with system fallbacks if offline).

## Choosing a script

Use the **abc / عربي** toggle in the control bar, or **Settings -> Script**. Your choice is saved in `localStorage`.

- **abc**: type the Latin transliteration. Case matters (see the mapping rules below).
- **عربي**: type the Arabic word on an Arabic keyboard:
  - Harakat, tanween, sukun, shadda, and tatweel are not typed.
  - The silent alif of `ـًا` is skipped (`كِتَابًا` -> `كتاب`).
  - Common letter variants match automatically (`أ إ آ` = `ا`, `ؤ` = `و`, `ئ` = `ي`, `ة` = `ه`, `ى` = `ي`, `ک` = `ك`).
  - Letters stay connected in their proper cursive forms as you type.
  - `?` shows the remaining letters.

## Features

- **Letters**: 20 random single letters, short syllables, and long-vowel drills.
- **Words**: 260+ common Levantine and MSA words with multiple accepted Arabizi spellings.
- **Reading**: common vocabulary shown without harakat.
- **Phrases**: short Arabic expressions and everyday greetings.
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
| `F1` | Toggle the cheat sheet |
| `Escape` | Start a new test |
| `Tab`, then `Enter` | Start a new test |
| `Enter` or `Space` in results | Start another round |

Press `Shift+Tab` to move focus out of the typing input.

## Transliteration rules

These rules apply to the Latin transliteration script (`abc`). Mappings are case-sensitive.

| Arabic | Accepted input |
| --- | --- |
| ء أ إ ؤ ئ | `2`, `a`, or omitted |
| ع | `3` |
| غ | `gh` or `3'` |
| خ | `kh`, `7'`, or `5` |
| ح | `7` or `H` |
| ق | `q` or `9` |
| س / ص | `s` / `S` |
| د / ض | `d` / `D` |
| ت / ط | `t` / `T` |
| ذ / ظ | `dh` / `Z` or `DH` |
| ه / ح | `h` / `H` or `7` |
| ز / ظ | `z` / `Z` |
| ك / ق | `k` / `q` or `9` |
| ث / ش / ج | `th` / `sh` / `j` |
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
├── index.html          # Markup and dialogs
├── css/
│   └── styles.css      # Styles and responsive layout
├── js/
│   ├── translit.js     # Tokenizer and input matchers
│   ├── data.js         # Words, phrases, and drill generators
│   └── app.js          # UI state, typing loop, stats, settings
├── assets/
│   └── favicon.svg
└── README.md
```

## Adding words or phrases

Edit `js/data.js`. Word entries support transliterations, English translations, dialect tags (`Levantine`, `MSA`, `Both`), and linguistic notes:

```js
var WORDS = [
  {
    arabic: 'بدي',
    translit: ['baddi', 'beddi'],
    translation_en: 'I want / I need',
    dialect: 'Levantine',
    notes: 'Spoken Levantine staple, equivalent to MSA أريد'
  },
  {
    arabic: 'حبيبي',
    translit: ['7abeebi', '7abibi', 'Habeebi', 'Habibi'],
    translation_en: 'my love / darling',
    dialect: 'Both',
    notes: 'Universal term of affection used among friends and family.'
  }
];

var PHRASES = [
  'كَيْفَ حَالُكَ؟'
];
```

Entries are backwards-compatible with plain strings (`'كتاب'`) and legacy `{ arabic, solutions }` objects.
