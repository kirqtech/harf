# Harf — Arabic typing trainer

Harf is a small, dependency-free Arabic typing trainer inspired by Monkeytype. It has two practice scripts:

- **Latin transliteration** — read an Arabic word, phrase, or syllable and type its Arabizi / chat-Arabic spelling (`kataba`, `7abeebi`) in real time.
- **Arabic letters** — read the Arabic word and retype it on an Arabic keyboard (Arabic 101/102, Mac, or phone keyboard). Harakat and punctuation are displayed but never typed.

No backend, no build step, no account.

---

## Run it

The recommended way is to serve the folder with any static file server:

```bash
cd arabic_monkeytype
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

You can also open `index.html` directly in a modern browser. The app is entirely client-side; the only network request is for Google Fonts. If the fonts are unavailable, system Arabic and monospace fallbacks are used.

---

## Choosing a script

Use the **abc / عربي** switch in the control bar, or **Settings → Script**. The choice is saved in `localStorage` and applies to every mode, hint, and mistake review.

- **abc** — type the Latin transliteration. Case matters (see the mapping rules below).
- **عربي** — type the displayed Arabic word again. Matching is letter by letter:
  - Harakat, tanween, sukun, shadda and tatweel are not typed. A shadda turns the letter into two keystrokes: `كَلّ` → `ك ل ل`.
  - The silent alif of `ـًا` is not typed: `كِتَابًا` → `ك ت ا ب`.
  - Equivalent spellings are accepted, so your keyboard's version of a letter always works: `أ إ آ` = `ا`, `ؤ` = `و`, `ئ` = `ي`, `ة` = `ه`, `ى` = `ي`, and `ک` = `ك`.
  - Correct letters light up, the caret sits on the next letter, and extra letters turn red.
  - `?` reveals the remaining letters instead of a transliteration.


## What is included

- **Letters** — 20 randomized single letters, short syllables, and long-vowel drills.
- **Words** — 260+ common Levantine / MSA words (greetings, people and family, everyday nouns, essential adjectives and verbs) with multiple accepted Arabizi spellings each. In Arabic script mode the same vocabulary is retyped letter by letter.
- **Reading** — the same common vocabulary shown without harakat for unvocalized reading practice.
- **Phrases** — a random common Arabic expression or short sentence, including everyday Levantine greetings.
- **Custom** — paste any Arabic text and practice it word by word.
- **Two scripts** — Arabizi transliteration or Arabic keyboard input, switchable from the control bar or Settings.
- **Active recall** — the standard answer is hidden until you ask for it or miss three times.
- **Live stats** — WPM, accuracy, streak, elapsed time, and progress.
- **Results overlay** — WPM, accuracy, total time, best streak, correct words, and a mistake review that shows the Arabic word, what you typed, and the accepted solutions. Press `Enter` or `Space` to start a new round immediately.
- **Mobile friendly** — larger tap targets, a tap-friendly input area, on-screen hint and clear buttons, no input zoom, and scaled-down Arabic prompts so long words and preview queues stay inside the viewport.
- **Case-sensitive feedback** — every accepted letter is validated as you type; input is accepted while it prefixes at least one valid solution.
- **Cheat sheet drawer** — all transliteration mappings, emphatic pairs, vowels, and aliases, available from the `?` button or `F1`.
- **Mapping settings** — choose the preferred generated spelling for غ، خ، ق، ح. Common alternate spellings remain accepted. These apply to Latin mode only.
- **Local persistence** — active script, mapping preferences, and custom text are kept in `localStorage`.

---

## Controls

| Key | Action |
| --- | --- |
| Type | Enter the active transliteration |
| `?` | Show the word's standard transliteration (does not fail the word) |
| `Space` | Commit the current word and move on |
| `Backspace` | Fix the current word |
| `F1` | Toggle the cheat sheet |
| `Escape` | Start a fresh test |
| `Tab`, then `Enter` | Start a fresh test |
| `Enter` or `Space` in results | Start another round immediately |

Press `Shift+Tab` to move focus out of the typing capture if you need to reach the header controls with the keyboard.

A correct intermediate word still needs `Space` to advance. Space on an incomplete word marks it incorrect, shows the standard spelling briefly, and skips it. After three consecutive wrong keys on the same word, the standard solution appears automatically above the input.

---

## Transliteration rules in this build

These rules describe the Latin transliteration script (`abc`). In Arabic script mode only the letters are compared; see [Choosing a script](#choosing-a-script).

Mappings are case-sensitive.

| Arabic | Accepted input |
| --- | --- |
| ء أ إ ؤ ئ | `2`, plain `a`, or omitted where natural |
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

The hint shown when you press `?`, or after three misses, is the first (most common standard) spelling in the word's `solutions` list. Alternative spellings are accepted automatically. Lowercase `h` never matches ح, and case distinguishes s/S, d/D, t/T, z/Z.

---

## Project structure

```text
.
├── index.html          # Markup and all UI surfaces
├── css/
│   └── styles.css      # Dark theme, responsive layout, animations
├── js/
│   ├── translit.js     # Arabic tokenizer, aliases, Latin + Arabic-letter matchers
│   ├── data.js         # Words, phrases, and letter-drill generators
│   └── app.js          # Typing lifecycle, script switching, stats, settings, dialogs
├── assets/
│   └── favicon.svg
└── README.md
```

No package manager or transpiler is required. Scripts are loaded in dependency order at the end of `index.html`.

---

## Adding words or phrases

Edit the arrays in `js/data.js`. Word entries pair the Arabic with every accepted Latin answer. The first solution is the standard hint; the engine adds flexible dialect variants on top:

```js
var WORDS = [
  {
    arabic: 'حبيبي',
    solutions: ['7abeebi', '7abibi', 'Habeebi', 'Habibi']
  },
  {
    arabic: 'مَدِينَة',
    solutions: ['madineh', 'madiineh', 'madina', 'madiina']
  }
];

var PHRASES = [
  'كَيْفَ حَالُكَ؟'
];
```

Use Arabic with harakat where possible. Each entry should list at least two hand-written solutions; the first is the hint and every other spelling is accepted. The engine also derives additional Latin targets from the Arabic (long-vowel aliases, taa marbuta endings, hamza forms, emphatic pairs), so vocalized source text produces more precise transliterations. Reading and Phrase modes automatically hide the harakat in the Arabic display while retaining the phonetic targets used for validation. Letters are generated from the consonant/vowel pools in the same file.

The word pool is grouped by category in `js/data.js`: greetings and social words, people and family, common nouns, adjectives, everyday verbs, and time expressions. Entries deliberately mix MSA and Levantine forms (for example `kbeer`, `mnee7`, `sa7eb`, and `sadee2`).

---

## Customizing mappings

The mapping engine lives in `js/translit.js`. Dataset `solutions` are authoritative and ordered (the first is the hint); the tokenizer expands each word into additional flexible spellings. Aliases are defined per letter in `buildTokens`; the preferred spelling for the four configurable letters is stored in `DEFAULT_SETTINGS` and can be changed at runtime from the Settings drawer.

The parser validates the typed string against the full solutions array, so aliases of different lengths (`gh` vs `3'`) work correctly with partial input and Backspace.

---

## Notes and limitations

- Transliteration is automatic. Custom unvocalized text can produce approximate vowels; adding harakat improves hints.
- Arabic punctuation is displayed but is not required in the typing target.
- Statistics count correct characters (5 characters = 1 word) over elapsed time. Backspace does not erase an accuracy penalty.
- In Arabic script mode a word is accepted only when every letter matches; a missing or extra letter is marked red and counted as a mistake. `Space` on an incomplete word shows the correct letters briefly and skips it.
- Arabic script mode expects an Arabic keyboard layout, so add Arabic in your OS keyboard settings if it is not enabled. Any standard layout (Arabic 101/102, Mac) works because letters are compared as characters, not by key position. Harakat keys (Shift + letter) are ignored.
- The app is a static site. Only browser `localStorage` is used; no text is sent anywhere.
- Designed for current Chromium-based browsers and Firefox. Native `<dialog>` support is required.

Fonts: [Readex Pro](https://fonts.google.com/specimen/Readex+Pro) with [Noto Sans Arabic](https://fonts.google.com/specimen/Noto+Sans+Arabic) fallback, [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk), and [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) via Google Fonts. The Arabic display uses a modern sans-serif face at a large size with open line-height and letter-spacing for beginner readability.
