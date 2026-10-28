#!/usr/bin/env python3
"""
Nateq (ناطق) — Brand Asset & Media Kit Generator
=================================================

A standalone, dependency-light rendering pipeline for the Nateq brand assets.

It uses installed headless Chromium (Chrome's `--headless=new` mode) to render
bespoke HTML/CSS compositions at 2x device scale, then downsamples them to the
exact production dimensions with Pillow. Google Fonts (IBM Plex Sans Arabic +
Inter) are pulled directly, embedded as base64 WOFF2, and cached only inside a
temporary directory that is deleted at the end.

Outputs (written only inside `assets/`):
    favicon.svg
    favicon-32x32.png
    apple-touch-icon.png
    logo_horizontal.svg
    logo_horizontal.png          (transparent)
    logo_horizontal_solid.png    (pitch-black)
    logo_square.png              (800×800 profile / app-store card)
    og_banner_1200x630.png
    banner_wide_1500x500.png
    banner_story_1080x1920.png
    readme_banner.svg
    readme_banner.png            (1280×420 README header)

Usage:
    python3 scripts/generate_assets.py
    python3 scripts/generate_assets.py --chrome /usr/bin/google-chrome
"""

from __future__ import annotations

import argparse
import base64
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image

# ---------------------------------------------------------------------------
# Paths / constants
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
TMP_ROOT = Path(tempfile.mkdtemp(prefix="nateq-assets-"))
FONT_DIR = TMP_ROOT / "fonts"

FONT_URL = (
    "https://fonts.googleapis.com/css2"
    "?family=IBM+Plex+Sans+Arabic:wght@600;700"
    "&family=Inter:wght@400;500;600"
    "&display=swap"
)

UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

EMERALD = "#10B981"
CRIMSON = "#F43F5E"

FONT_FACE_RE = re.compile(r"@font-face\s*\{[^}]*\}", re.S)
URL_RE = re.compile(r"url\((https://fonts\.gstatic\.com/[^)]+)\)")
FAMILY_RE = re.compile(r"font-family:\s*'([^']+)'")
WEIGHT_RE = re.compile(r"font-weight:\s*(\d+)")
RANGE_RE = re.compile(r"unicode-range:\s*([^;]+);")


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------


def log(message: str) -> None:
    print(f"  {message}")


def fetch_bytes(url: str, timeout: int = 30) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def fetch_text(url: str, timeout: int = 30) -> str:
    return fetch_bytes(url, timeout=timeout).decode("utf-8")


def find_chrome(explicit: str | None = None) -> str:
    candidates = []
    if explicit:
        candidates.append(explicit)
    if os.environ.get("CHROME_BIN"):
        candidates.append(os.environ["CHROME_BIN"])
    candidates += [
        "google-chrome",
        "google-chrome-stable",
        "chromium",
        "chromium-browser",
        "chrome",
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ]
    for candidate in candidates:
        resolved = shutil.which(candidate)
        if resolved:
            return resolved
    raise RuntimeError(
        "Headless Chromium was not found. Install Chrome/Chromium or pass "
        "--chrome /path/to/chrome."
    )


# ---------------------------------------------------------------------------
# Google Fonts
# ---------------------------------------------------------------------------


def load_fonts() -> list[dict[str, str]]:
    """Download Google Fonts CSS + only the Latin/Arabic WOFF2 subsets we use."""
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    css = fetch_text(FONT_URL)
    blocks = FONT_FACE_RE.findall(css)
    if not blocks:
        raise RuntimeError("Google Fonts returned no @font-face blocks.")

    kept: list[dict[str, str]] = []
    for index, block in enumerate(blocks):
        family_match = FAMILY_RE.search(block)
        weight_match = WEIGHT_RE.search(block)
        range_match = RANGE_RE.search(block)
        url_match = URL_RE.search(block)
        if not (family_match and weight_match and range_match and url_match):
            continue

        family = family_match.group(1)
        weight = weight_match.group(1)
        unicode_range = range_match.group(1).strip()
        is_arabic = "U+0600-06FF" in unicode_range
        is_latin = "U+0000-00FF" in unicode_range

        keep = False
        if family == "IBM Plex Sans Arabic" and (is_arabic or is_latin):
            keep = True
        elif family == "Inter" and is_latin:
            keep = True
        if not keep:
            continue

        font_url = url_match.group(1)
        font_bytes = fetch_bytes(font_url)
        data_uri = (
            "data:font/woff2;base64,"
            + base64.b64encode(font_bytes).decode("ascii")
        )
        embedded = URL_RE.sub(lambda _m: f"url({data_uri})", block, count=1)
        embedded = embedded.replace("font-display: swap", "font-display: block")
        kept.append(
            {
                "family": family,
                "weight": weight,
                "range": unicode_range,
                "block": embedded,
                "url": font_url,
                "bytes": str(len(font_bytes)),
                "index": str(index),
            }
        )

    # Sanity check: we need both Arabic and Latin coverage.
    if not any(item["family"] == "IBM Plex Sans Arabic" for item in kept):
        raise RuntimeError("IBM Plex Sans Arabic could not be downloaded.")
    if not any(item["family"] == "Inter" for item in kept):
        raise RuntimeError("Inter could not be downloaded.")
    log(f"Google Fonts: embedded {len(kept)} WOFF2 subsets")
    return kept


def font_css(fonts: list[dict[str, str]]) -> str:
    return "\n".join(item["block"] for item in fonts)


def svg_font_css(
    fonts: list[dict[str, str]], inter_weights: tuple[str, ...] = ("400", "600")
) -> str:
    """Minimal font set for standalone SVG lockups (kept small by weight)."""
    selected = []
    for item in fonts:
        family = item["family"]
        weight = item["weight"]
        unicode_range = item["range"]
        is_arabic = "U+0600-06FF" in unicode_range
        is_latin = "U+0000-00FF" in unicode_range
        if family == "IBM Plex Sans Arabic" and weight == "700" and (is_arabic or is_latin):
            selected.append(item)
        elif family == "Inter" and weight in inter_weights and is_latin:
            selected.append(item)
    return "\n".join(item["block"] for item in selected)


# ---------------------------------------------------------------------------
# Brand primitives
# ---------------------------------------------------------------------------


def icon_inner(uid: str) -> str:
    """The precision dark-glass Nateq glyph (ن) as reusable SVG markup."""
    return f"""
<defs>
  <linearGradient id="{uid}-bg" x1="10" y1="2" x2="56" y2="64" gradientUnits="userSpaceOnUse">
    <stop stop-color="#0C1310"/>
    <stop offset="0.52" stop-color="#040706"/>
    <stop offset="1" stop-color="#000000"/>
  </linearGradient>
  <radialGradient id="{uid}-glow" cx="0" cy="0" r="1" gradientTransform="translate(32 1) rotate(90) scale(46)">
    <stop stop-color="{EMERALD}" stop-opacity="0.34"/>
    <stop offset="0.50" stop-color="{EMERALD}" stop-opacity="0.07"/>
    <stop offset="1" stop-color="{EMERALD}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="{uid}-stroke" x1="19" y1="22" x2="44" y2="46" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FFFFFF"/>
    <stop offset="0.55" stop-color="#D9FFF1"/>
    <stop offset="1" stop-color="{EMERALD}"/>
  </linearGradient>
  <linearGradient id="{uid}-spec" x1="18" y1="2.2" x2="46" y2="2.2" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FFFFFF" stop-opacity="0"/>
    <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.32"/>
    <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>
  <filter id="{uid}-dotglow" x="-200%" y="-200%" width="400%" height="400%">
    <feGaussianBlur stdDeviation="2.2"/>
  </filter>
</defs>
<rect x="0.5" y="0.5" width="63" height="63" rx="17.5" fill="url(#{uid}-bg)"/>
<rect x="0.5" y="0.5" width="63" height="63" rx="17.5" fill="url(#{uid}-glow)"/>
<rect x="0.5" y="0.5" width="63" height="63" rx="17.5" fill="none" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="1"/>
<rect x="4" y="4" width="56" height="56" rx="14" fill="none" stroke="#FFFFFF" stroke-opacity="0.045" stroke-width="0.8"/>
<path d="M18 2.2H46" stroke="url(#{uid}-spec)" stroke-width="0.9" stroke-linecap="round"/>
<path d="M18.5 23.5V31.4C18.5 39.8 24.2 44.5 32 44.5C39.8 44.5 45.5 39.8 45.5 31.4V23.5"
      fill="none" stroke="url(#{uid}-stroke)" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="32" cy="14.3" r="5" fill="{EMERALD}" opacity="0.22" filter="url(#{uid}-dotglow)"/>
<circle cx="32" cy="14.3" r="3.2" fill="{EMERALD}"/>
<circle cx="30.9" cy="13.2" r="0.85" fill="#E7FFF6" fill-opacity="0.9"/>
"""


def icon_svg(uid: str, css_class: str = "mark", style: str = "") -> str:
    style_attr = f' style="{style}"' if style else ""
    return (
        f'<svg class="{css_class}"{style_attr} viewBox="0 0 64 64" '
        f'xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">'
        f"{icon_inner(uid)}</svg>"
    )


def favicon_svg() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-labelledby="nateq-title nateq-desc">
  <title id="nateq-title">Nateq — ناطق</title>
  <desc id="nateq-desc">Dark glass Arabic letter noon with a floating emerald dot.</desc>
  {icon_inner("nk")}
</svg>
"""


# ---------------------------------------------------------------------------
# Shared CSS / pages
# ---------------------------------------------------------------------------

COMMON_CSS = f"""
:root {{
  --bg: #000000;
  --emerald: {EMERALD};
  --crimson: {CRIMSON};
  --text: #F4F7F5;
  --muted: #8A9490;
  --line: rgba(255, 255, 255, 0.10);
  --panel: rgba(8, 12, 10, 0.72);
}}
*, *::before, *::after {{ box-sizing: border-box; }}
html, body {{ margin: 0; padding: 0; overflow: hidden; }}
body {{
  color: var(--text);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 400;
  letter-spacing: -0.02em;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
}}
.arabic {{
  font-family: 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  direction: rtl;
  letter-spacing: 0;
}}
.mark {{ display: block; }}
.bg, .grid, .vignette, .watermark, .top-edge, .grain {{ position: absolute; pointer-events: none; }}
.bg {{
  inset: 0;
  background:
    radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 70%),
    radial-gradient(900px 600px at 88% 108%, rgba(244, 63, 94, 0.045), transparent 70%),
    #000000;
}}
.grid {{
  inset: -1px;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.042) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.042) 1px, transparent 1px);
  background-size: 72px 72px;
  opacity: 0.44;
  -webkit-mask-image: radial-gradient(ellipse at 50% 24%, #000 0%, transparent 72%);
  mask-image: radial-gradient(ellipse at 50% 24%, #000 0%, transparent 72%);
}}
.vignette {{
  inset: 0;
  background: radial-gradient(ellipse at 50% 42%, transparent 38%, rgba(0, 0, 0, 0.72) 100%);
}}
.top-edge {{
  top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.65), rgba(255, 255, 255, 0.22), transparent);
}}
.brand {{ display: flex; align-items: center; gap: 15px; }}
.brand .mark {{ width: 52px; height: 52px; flex: 0 0 auto; filter: drop-shadow(0 0 22px rgba(16, 185, 129, 0.24)); }}
.brand-copy {{ display: flex; flex-direction: column; align-items: flex-start; min-width: 0; }}
.brand-word {{
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 700;
  font-size: 37px;
  line-height: 1.12;
  color: #F7FAF9;
  text-align: left;
}}
.brand-sub {{
  margin-top: 5px;
  color: #828D88;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.19em;
  text-transform: uppercase;
}}
.pill {{
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 9px 15px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.025);
  color: #C9D3CF;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
}}
.pill .dot, .live-dot {{
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--emerald);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.85);
}}
.pill .sep {{ width: 1px; height: 12px; background: rgba(255, 255, 255, 0.12); }}
.pill .mono {{ color: #6F7A75; letter-spacing: 0.12em; }}
.eyebrow {{
  display: flex; align-items: center; gap: 11px;
  color: var(--emerald);
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.22em; text-transform: uppercase;
}}
.eyebrow .line {{ width: 34px; height: 1px; background: linear-gradient(90deg, var(--emerald), transparent); }}
.eyebrow .ar {{ font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 14px; letter-spacing: 0; color: #B9F8DF; direction: rtl; }}
.footer {{
  display: flex; align-items: center; justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding-top: 15px;
  color: #6F7A75;
  font-size: 9px; font-weight: 600;
  letter-spacing: 0.18em; text-transform: uppercase;
}}
.footer b {{ color: #B9F8DF; font-weight: 600; }}
.footer .ar {{ font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 13px; letter-spacing: 0; direction: rtl; color: #E7FFF6; }}
"""


def html_page(
    width: int,
    height: int,
    body: str,
    page_css: str,
    fonts_css: str,
    *,
    transparent: bool = False,
    background: str = "#000000",
) -> str:
    bg_value = "transparent" if transparent else background
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nateq brand asset</title>
<style>
{fonts_css}
{COMMON_CSS}
html, body {{ width: {width}px; height: {height}px; background: {bg_value}; }}
{page_css}
</style>
</head>
<body>
{body}
</body>
</html>
"""


# ---------------------------------------------------------------------------
# App mockup
# ---------------------------------------------------------------------------

KEY_ROWS = [
    ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
    ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"],
    ["ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ", "ذ"],
]
KEY_HITS = {"ن", "ا", "ط", "ق", "ل", "ع"}
KEY_MISS = {"ض"}


def keyboard_html() -> str:
    rows = []
    for row in KEY_ROWS:
        keys = []
        for key in row:
            cls = "key"
            if key in KEY_HITS:
                cls += " hit"
            if key in KEY_MISS:
                cls += " miss"
            keys.append(f'<span class="{cls}">{key}</span>')
        rows.append(f'<div class="keyrow">{"".join(keys)}</div>')
    return f'<div class="keyboard">{"".join(rows)}</div>'


def app_card(uid: str, variant: str) -> str:
    return f"""
<div class="app-card {variant}">
  <div class="app-top">
    <div class="win-dots"><span></span><span></span><span></span></div>
    <div class="app-title">practice <span>/</span> session 04</div>
    <div class="live"><span class="live-dot"></span>LIVE</div>
  </div>
  <div class="prompt">
    <div class="prompt-label">ARABIC DRIFT <span>01 / 06</span></div>
    <div class="sentence arabic" dir="rtl">
      <span class="done">اللغة العربية</span>
      <span class="current">لغة الضاد</span><span class="caret"></span>
      <span class="future">والبيان، تكتبها بحروف متصلة.</span>
    </div>
    <div class="prompt-meta"><span>12 words</span><span>0 errors</span><span class="em">98.4% accuracy</span></div>
  </div>
  <div class="stats">
    <div class="stat"><span>WPM</span><b>68</b><i class="up">+12%</i></div>
    <div class="stat"><span>ACCURACY</span><b>98.4<small>%</small></b><i>steady</i></div>
    <div class="stat"><span>TIME</span><b>01:24</b><i>elapsed</i></div>
    <div class="stat"><span>STREAK</span><b>14</b><i>days</i></div>
  </div>
  {keyboard_html()}
  <div class="progress"><span>PROGRESS</span><div class="bar"><i style="width:64%"></i></div><span>64%</span></div>
</div>
"""


APP_CARD_CSS = f"""
.app-card {{
  position: relative;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(16, 185, 129, 0.08), transparent 62%),
    linear-gradient(158deg, rgba(20, 29, 25, 0.94), rgba(5, 9, 7, 0.96) 55%, rgba(0, 0, 0, 0.985));
  box-shadow:
    0 46px 100px rgba(0, 0, 0, 0.72),
    0 0 0 1px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.09);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 20px 22px 18px;
}}
.app-card::before {{
  content: "";
  position: absolute;
  top: 0; left: 8%; right: 8%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.75), rgba(255, 255, 255, 0.25), transparent);
}}
.app-top {{
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}}
.win-dots {{ display: flex; gap: 6px; }}
.win-dots span {{ width: 7px; height: 7px; border-radius: 50%; background: rgba(255, 255, 255, 0.12); }}
.win-dots span:first-child {{ background: rgba(244, 63, 94, 0.5); }}
.win-dots span:nth-child(2) {{ background: rgba(16, 185, 129, 0.55); }}
.app-title {{ color: #7E8984; font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }}
.app-title span {{ color: #3F4844; margin: 0 4px; }}
.live {{ display: flex; align-items: center; gap: 6px; color: #6EE7B7; font-size: 8px; font-weight: 600; letter-spacing: 0.16em; }}
.live-dot {{ width: 5px; height: 5px; }}
.prompt {{
  margin-top: 14px;
  padding: 13px 16px 12px;
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 15px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.028), rgba(255, 255, 255, 0.004));
  flex: 1;
  min-height: 0;
  display: flex; flex-direction: column;
}}
.prompt::after {{
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.055);
}}
.prompt-label {{
  display: flex; justify-content: space-between; align-items: center;
  color: #6F7A75;
  font-size: 8px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
}}
.prompt-label span {{ color: #3F4844; }}
.sentence {{
  margin-top: 10px;
  color: #5D6863;
  font-weight: 600;
  font-size: 27px;
  line-height: 1.78;
  text-align: right;
  text-wrap: balance;
}}
.sentence .done {{ color: #ECFDF5; }}
.sentence .current {{ color: var(--emerald); }}
.sentence .future {{ color: #6D7873; }}
.sentence .caret {{
  display: inline-block;
  width: 2px; height: 0.95em;
  margin: 0 1px 0 3px;
  vertical-align: -0.1em;
  border-radius: 2px;
  background: var(--emerald);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.9);
}}
.prompt-meta {{
  margin-top: auto;
  display: flex; gap: 16px;
  color: #5F6A65;
  font-size: 8px; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase;
}}
.prompt-meta .em {{ color: #6EE7B7; }}
.stats {{
  display: grid; grid-template-columns: repeat(4, 1fr);
  margin-top: 12px;
  padding: 11px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}}
.stat {{ padding: 0 12px; border-left: 1px solid rgba(255, 255, 255, 0.065); display: flex; flex-direction: column; gap: 2px; }}
.stat:first-child {{ padding-left: 0; border-left: 0; }}
.stat > span {{ color: #6F7A75; font-size: 7px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; }}
.stat b {{ color: #F4F7F5; font-size: 25px; line-height: 1.05; font-weight: 600; letter-spacing: -0.045em; }}
.stat b small {{ font-size: 12px; color: #9BA6A1; letter-spacing: -0.01em; margin-left: 1px; }}
.stat i {{ font-style: normal; font-size: 7px; font-weight: 600; letter-spacing: 0.08em; color: #59645F; }}
.stat i.up {{ color: #6EE7B7; }}
.keyboard {{ margin-top: 12px; display: flex; flex-direction: column; gap: 4px; align-items: center; }}
.keyrow {{ display: flex; gap: 4px; justify-content: center; }}
.key {{
  width: 28px; height: 22px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.024);
  color: #7D8883;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-size: 10px;
  line-height: 1;
}}
.key.hit {{
  color: #C7F9E4;
  border-color: rgba(16, 185, 129, 0.42);
  background: rgba(16, 185, 129, 0.14);
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.16);
}}
.key.miss {{
  color: #FDA4AF;
  border-color: rgba(244, 63, 94, 0.34);
  background: rgba(244, 63, 94, 0.10);
}}
.progress {{
  margin-top: 12px;
  display: flex; align-items: center; gap: 10px;
  color: #5F6A65;
  font-size: 7px; font-weight: 600; letter-spacing: 0.17em;
}}
.progress .bar {{ flex: 1; height: 4px; border-radius: 4px; background: rgba(255, 255, 255, 0.06); overflow: hidden; }}
.progress .bar i {{
  display: block; height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #059669, #6EE7B7);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.55);
}}
"""


# ---------------------------------------------------------------------------
# Social card / banner compositions
# ---------------------------------------------------------------------------


def og_page(fonts_css: str) -> str:
    body = f"""
<div class="page">
  <div class="bg"></div><div class="grid"></div><div class="vignette"></div><div class="top-edge"></div>
  <div class="watermark arabic">ن</div>
  <header>
    <div class="brand">
      {icon_svg("og-brand")}
      <div class="brand-copy">
        <div class="brand-word arabic">ناطق</div>
        <div class="brand-sub">NATEQ / ARABIC TYPING TRAINER</div>
      </div>
    </div>
    <div class="pill"><span class="dot"></span> Arabic typing trainer <span class="sep"></span> <span class="mono">01</span></div>
  </header>
  <main>
    <section class="copy">
      <div class="eyebrow"><span class="line"></span> Arabic typing, reimagined</div>
      <h1>Type Arabic.<span class="accent">Master the rhythm.</span></h1>
      <p class="sub">A focused training space for the Arabic script — real-time feedback, keystroke analytics, and drills built around your own rhythm.</p>
      <div class="chips">
        <span class="chip"><i></i>Live feedback</span>
        <span class="chip"><i></i>Keystroke analytics</span>
        <span class="chip"><i></i>Curated drills</span>
      </div>
    </section>
    <section class="visual">
      <div class="halo"></div>
      {app_card("og", "og")}
    </section>
  </main>
  <footer class="footer">
    <span><b class="ar">ناطق</b> &nbsp;·&nbsp; ARABIC TYPING TRAINER</span>
    <span>TYPE / RHYTHM / FLOW</span>
  </footer>
</div>
"""
    css = f"""
.page {{ position: relative; width: 1200px; height: 630px; padding: 42px 64px 30px; display: flex; flex-direction: column; }}
.page header, .page main, .page footer {{ position: relative; z-index: 2; }}
header {{ display: flex; align-items: center; justify-content: space-between; gap: 28px; }}
main {{ flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 580px; gap: 44px; align-items: center; padding: 10px 0 4px; }}
.copy {{ padding-bottom: 2px; }}
h1 {{
  margin: 20px 0 0;
  font-size: 58px;
  line-height: 1.03;
  letter-spacing: -0.048em;
  font-weight: 600;
  color: #F4F7F5;
}}
h1 .accent {{
  display: block;
  background: linear-gradient(100deg, #F7FAF9 0%, #B9F8DF 42%, {EMERALD} 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}}
.sub {{ margin: 20px 0 0; max-width: 438px; color: #939E99; font-size: 16.5px; line-height: 1.62; letter-spacing: -0.012em; }}
.chips {{ margin-top: 25px; display: flex; flex-wrap: wrap; gap: 9px; }}
.chip {{
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 11px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.023);
  color: #B9C4BF;
  font-size: 10px; font-weight: 500;
  letter-spacing: 0.005em;
}}
.chip i {{ width: 5px; height: 5px; border-radius: 50%; background: var(--emerald); box-shadow: 0 0 8px rgba(16, 185, 129, 0.7); }}
.visual {{ position: relative; display: flex; align-items: center; justify-content: flex-end; }}
.halo {{
  position: absolute; width: 560px; height: 560px; right: -40px; top: 50%; transform: translateY(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.17), rgba(16, 185, 129, 0.035) 42%, transparent 68%);
  filter: blur(16px);
}}
.app-card.og {{ width: 580px; height: 424px; }}
.watermark {{
  top: -84px; right: -100px;
  font-size: 600px;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 1px rgba(16, 185, 129, 0.06);
  z-index: 1;
}}
footer.footer {{ z-index: 2; }}
{APP_CARD_CSS}
"""
    return html_page(1200, 630, body, css, fonts_css)


def wide_page(fonts_css: str) -> str:
    body = f"""
<div class="page">
  <div class="bg"></div><div class="grid"></div><div class="vignette"></div><div class="top-edge"></div>
  <div class="watermark arabic">ن</div>
  <div class="meta-top">
    <span>NATEQ / BRAND SYSTEM</span>
    <span class="em">ARABIC TYPING TRAINER</span>
  </div>
  <main>
    <aside class="metric left">
      <div class="metric-label">WORDS / MIN</div>
      <div class="metric-big">68</div>
      <div class="metric-sub"><span class="up">+12%</span> this week</div>
      <svg class="spark" viewBox="0 0 220 46" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="46" gradientUnits="userSpaceOnUse">
            <stop stop-color="{EMERALD}" stop-opacity="0.26"/>
            <stop offset="1" stop-color="{EMERALD}" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="sparkline" x1="0" y1="0" x2="220" y2="0" gradientUnits="userSpaceOnUse">
            <stop stop-color="#34D399" stop-opacity="0.25"/>
            <stop offset="0.6" stop-color="#6EE7B7"/>
            <stop offset="1" stop-color="{EMERALD}"/>
          </linearGradient>
        </defs>
        <path d="M2 38C22 36 27 26 43 29C59 32 66 19 82 22C98 25 105 12 122 16C139 20 149 8 164 13C179 18 192 4 218 7V46H2V38Z" fill="url(#sparkfill)"/>
        <path d="M2 38C22 36 27 26 43 29C59 32 66 19 82 22C98 25 105 12 122 16C139 20 149 8 164 13C179 18 192 4 218 7" stroke="url(#sparkline)" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </aside>

    <section class="center">
      <div class="icon-wrap">{icon_svg("wide")}</div>
      <div class="word arabic">ناطق</div>
      <div class="sub">nateq / arabic typing trainer</div>
      <div class="tagline arabic">اكتب العربية بإيقاعك</div>
    </section>

    <aside class="metric right">
      <div class="metric-label">ACCURACY</div>
      <div class="metric-big">98.4<span>%</span></div>
      <div class="metric-sub">steady / precise</div>
      <div class="mini-keys">
        <span></span><span class="hit"></span><span></span><span class="hit"></span><span></span><span class="miss"></span>
        <span class="hit"></span><span></span><span class="hit"></span><span></span><span></span><span class="hit"></span>
      </div>
    </aside>
  </main>
  <footer class="footer">
    <span><b class="ar">ناطق</b> &nbsp;·&nbsp; TYPE ARABIC. MASTER THE RHYTHM.</span>
    <span>FEEDBACK / ANALYTICS / DRILLS</span>
  </footer>
</div>
"""
    css = f"""
.page {{ position: relative; width: 1500px; height: 500px; padding: 28px 60px 24px; display: flex; flex-direction: column; }}
.meta-top {{
  position: relative; z-index: 2;
  display: flex; justify-content: space-between;
  color: #5F6A65;
  font-size: 8px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
}}
.meta-top .em {{ color: #8BE8C3; }}
main {{ position: relative; z-index: 2; flex: 1; display: grid; grid-template-columns: 250px 1fr 250px; gap: 54px; align-items: center; }}
.metric {{
  height: 184px;
  padding: 18px 18px 13px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 17px;
  background: linear-gradient(160deg, rgba(16, 24, 20, 0.72), rgba(3, 5, 4, 0.86));
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.055);
  overflow: hidden;
}}
.metric-label {{ color: #6F7A75; font-size: 8px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; }}
.metric-big {{ margin-top: 6px; color: #F4F7F5; font-size: 46px; line-height: 1; font-weight: 600; letter-spacing: -0.055em; }}
.metric-big span {{ color: #8A9490; font-size: 22px; letter-spacing: -0.02em; }}
.metric-sub {{ margin-top: 4px; color: #6F7A75; font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }}
.metric-sub .up {{ color: #6EE7B7; }}
.spark {{ display: block; width: 100%; height: 46px; margin-top: 6px; }}
.center {{ text-align: center; display: flex; flex-direction: column; align-items: center; }}
.icon-wrap {{ filter: drop-shadow(0 0 34px rgba(16, 185, 129, 0.28)); }}
.icon-wrap .mark {{ width: 82px; height: 82px; }}
.word {{
  margin-top: 9px;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 700;
  font-size: 148px;
  line-height: 1.04;
  letter-spacing: -0.02em;
  color: #F7FAF9;
  text-shadow: 0 0 80px rgba(16, 185, 129, 0.13);
}}
.sub {{
  margin-top: 20px;
  color: #8A9490;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
}}
.tagline {{
  margin-top: 10px;
  color: #B9F8DF;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-size: 22px;
  direction: rtl;
}}
.mini-keys {{
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
}}
.mini-keys span {{
  height: 15px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.025);
}}
.mini-keys .hit {{ background: rgba(16, 185, 129, 0.17); border-color: rgba(16, 185, 129, 0.42); box-shadow: 0 0 10px rgba(16, 185, 129, 0.16); }}
.mini-keys .miss {{ background: rgba(244, 63, 94, 0.12); border-color: rgba(244, 63, 94, 0.34); }}
.watermark {{
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  font-size: 760px;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 1px rgba(16, 185, 129, 0.05);
}}
footer.footer {{ padding-top: 12px; }}
"""
    return html_page(1500, 500, body, css, fonts_css)


def story_page(fonts_css: str) -> str:
    body = f"""
<div class="page">
  <div class="bg"></div><div class="grid"></div><div class="vignette"></div><div class="top-edge"></div>
  <div class="hud-left"></div><div class="hud-right"></div>
  <header>
    <div class="brand">
      {icon_svg("story-brand")}
      <div class="brand-copy">
        <div class="brand-word arabic">ناطق</div>
        <div class="brand-sub">NATEQ / ARABIC TYPING TRAINER</div>
      </div>
    </div>
    <div class="pill"><span class="dot"></span> Mobile <span class="sep"></span> <span class="mono">9:16</span></div>
  </header>

  <section class="hero">
    <div class="eyebrow"><span class="line"></span> Write with rhythm</div>
    <div class="word arabic">ناطق</div>
    <div class="tagline arabic">اكتب العربية بإيقاعك</div>
    <div class="sub">nateq / arabic typing trainer</div>
  </section>

  <div class="stage-wrap">
    <div class="stage-halo"></div>
    {app_card("story", "story")}
  </div>

  <section class="metrics">
    <div class="metric"><span>AVG. SPEED</span><b>68<small>wpm</small></b><i>+12% this week</i></div>
    <div class="metric"><span>ACCURACY</span><b>98.4<small>%</small></b><i>steady / precise</i></div>
    <div class="metric"><span>STREAK</span><b>14<small>days</small></b><i>keep the rhythm</i></div>
  </section>

  <section class="features">
    <span><i></i>Real-time feedback</span>
    <span><i></i>Keystroke analytics</span>
    <span><i></i>Curated drills</span>
  </section>

  <section class="signoff">
    <div class="rule"></div>
    <div class="ar">الكتابة إيقاع.</div>
    <div class="en">A focused space for the Arabic script.</div>
  </section>

  <footer class="footer">
    <span><b class="ar">ناطق</b> &nbsp;·&nbsp; ARABIC TYPING TRAINER</span>
    <span>01 / 04 &nbsp;·&nbsp; TYPE / RHYTHM / FLOW</span>
  </footer>
</div>
"""
    css = f"""
.page {{ position: relative; width: 1080px; height: 1920px; padding: 70px 80px 58px; display: flex; flex-direction: column; }}
.page header, .page .hero, .page .stage-wrap, .page .metrics, .page .features, .page .signoff, .page footer {{ position: relative; z-index: 2; }}
header {{ display: flex; align-items: center; justify-content: space-between; }}
header .mark {{ width: 62px; height: 62px; }}
header .brand-word {{ font-size: 44px; }}
header .brand-sub {{ font-size: 10px; }}
.hud-left, .hud-right {{ position: absolute; top: 50%; width: 1px; height: 460px; background: linear-gradient(transparent, rgba(16, 185, 129, 0.22), transparent); z-index: 1; }}
.hud-left {{ left: 34px; }}
.hud-right {{ right: 34px; }}
.hero {{ margin-top: 88px; text-align: center; display: flex; flex-direction: column; align-items: center; }}
.hero .eyebrow {{ justify-content: center; }}
.word {{
  margin-top: 26px;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 700;
  font-size: 236px;
  line-height: 0.88;
  letter-spacing: -0.025em;
  color: #F7FAF9;
  text-shadow: 0 0 120px rgba(16, 185, 129, 0.17);
}}
.tagline {{ margin-top: 22px; color: #B9F8DF; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 40px; direction: rtl; }}
.sub {{ margin-top: 12px; color: #7E8984; font-size: 15px; font-weight: 500; letter-spacing: 0.09em; }}
.stage-wrap {{ position: relative; margin: 66px auto 0; width: 920px; }}
.stage-halo {{
  position: absolute; inset: -120px -150px;
  background: radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.15), transparent 65%);
  filter: blur(24px);
}}
.app-card.story {{
  width: 920px;
  height: 610px;
  padding: 26px 28px 22px;
  border-radius: 34px;
}}
.app-card.story .app-title {{ font-size: 10px; }}
.app-card.story .live {{ font-size: 9px; }}
.app-card.story .prompt {{ padding: 20px 22px 16px; border-radius: 19px; }}
.app-card.story .prompt-label {{ font-size: 9px; }}
.app-card.story .sentence {{ font-size: 42px; line-height: 1.72; margin-top: 14px; }}
.app-card.story .prompt-meta {{ font-size: 9px; gap: 22px; }}
.app-card.story .stats {{ padding: 17px 0; margin-top: 16px; }}
.app-card.story .stat {{ padding: 0 18px; }}
.app-card.story .stat > span {{ font-size: 8px; }}
.app-card.story .stat b {{ font-size: 40px; }}
.app-card.story .stat b small {{ font-size: 15px; }}
.app-card.story .stat i {{ font-size: 8px; }}
.app-card.story .keyboard {{ margin-top: 17px; gap: 6px; }}
.app-card.story .keyrow {{ gap: 6px; }}
.app-card.story .key {{ width: 48px; height: 36px; font-size: 16px; border-radius: 7px; }}
.app-card.story .progress {{ margin-top: 16px; font-size: 8px; }}
.app-card.story .progress .bar {{ height: 5px; }}
.metrics {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 58px; }}
.metric {{
  padding: 22px 22px 18px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(16, 24, 20, 0.68), rgba(3, 5, 4, 0.82));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}}
.metric > span {{ color: #6F7A75; font-size: 9px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; }}
.metric b {{ display: block; margin-top: 7px; color: #F4F7F5; font-size: 48px; line-height: 1; font-weight: 600; letter-spacing: -0.055em; }}
.metric b small {{ margin-left: 5px; color: #8A9490; font-size: 16px; font-weight: 500; letter-spacing: 0; }}
.metric i {{ display: block; margin-top: 8px; color: #5F6A65; font-style: normal; font-size: 9px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }}
.features {{ display: flex; justify-content: center; gap: 12px; margin-top: 38px; }}
.features span {{
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 15px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.022);
  color: #AEB9B4;
  font-size: 10px;
  font-weight: 500;
}}
.features i {{ width: 5px; height: 5px; border-radius: 50%; background: var(--emerald); box-shadow: 0 0 8px rgba(16, 185, 129, 0.7); }}
.signoff {{ margin-top: 58px; display: flex; flex-direction: column; align-items: center; text-align: center; }}
.signoff .rule {{ width: 92px; height: 1px; margin-bottom: 20px; background: linear-gradient(90deg, transparent, var(--emerald), transparent); box-shadow: 0 0 12px rgba(16, 185, 129, 0.45); }}
.signoff .ar {{ color: #E7FFF6; font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 46px; line-height: 1.25; direction: rtl; text-shadow: 0 0 60px rgba(16, 185, 129, 0.18); }}
.signoff .en {{ margin-top: 8px; color: #6F7A75; font-size: 9px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; }}
footer.footer {{ margin-top: auto; }}
{APP_CARD_CSS}
"""
    return html_page(1080, 1920, body, css, fonts_css)


def readme_banner_page(fonts_css: str) -> str:
    body = f"""
<div class="readme">
  <div class="ambient"></div>
  <div class="frame"></div>
  <div class="content">
    <div class="icon-wrap">{icon_svg("rb")}</div>
    <div class="title-row">
      <div class="word-ar arabic">ناطق</div>
      <div class="title-div"></div>
      <div class="word-en">nateq</div>
    </div>
    <div class="subline">The Precision Arabic Typing Trainer</div>
    <div class="pills">
      <span class="pill"><span class="emoji">🌍</span>Levantine &amp; Egyptian</span>
      <span class="pill"><span class="emoji">📖</span>Quranic / Classical</span>
      <span class="pill"><span class="emoji">⚡</span>Zero-Latency Browser Engine</span>
      <span class="pill"><span class="emoji">⌨️</span>Arabizi &amp; Arabic</span>
    </div>
  </div>
</div>
"""
    css = f"""
.readme {{
  position: relative;
  width: 1280px;
  height: 420px;
  background: #000000;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}}
.ambient {{
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% -20%, rgba(16, 185, 129, 0.08) 0%, transparent 65%);
  pointer-events: none;
}}
.frame {{
  position: absolute;
  inset: 1px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  pointer-events: none;
}}
.content {{
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}}
.icon-wrap {{
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}}
.icon-wrap::before {{
  content: "";
  position: absolute;
  inset: -52px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.20) 0%, rgba(16, 185, 129, 0.06) 44%, transparent 70%);
  filter: blur(12px);
}}
.icon-wrap .mark {{
  position: relative;
  z-index: 1;
  width: 80px;
  height: 80px;
  filter: drop-shadow(0 0 18px rgba(16, 185, 129, 0.30));
}}
.title-row {{
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}}
.word-ar {{
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 700;
  font-size: 64px;
  line-height: 1.08;
  letter-spacing: 0;
  color: #FFFFFF;
}}
.title-div {{
  width: 1px;
  height: 32px;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.18), transparent);
}}
.word-en {{
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 26px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #F4F4F5;
  padding-bottom: 4px;
}}
.subline {{
  margin-top: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #A1A1A6;
}}
.pills {{
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}}
.pill {{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 15px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.03);
  color: #8E8E93;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0;
  text-transform: none;
  white-space: nowrap;
}}
.pill .emoji {{
  font-family: 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;
  font-size: 14px;
  line-height: 1;
}}
"""
    return html_page(1280, 420, body, css, fonts_css)


def logo_square_page(fonts_css: str) -> str:
    body = f"""
<div class="square">
  <div class="bg"></div><div class="grid"></div><div class="vignette"></div><div class="top-edge"></div>
  <div class="frame"></div>
  <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
  <div class="content">
    <div class="icon-wrap">{icon_svg("sq")}</div>
    <div class="word arabic">ناطق</div>
    <div class="sub">nateq / arabic typing trainer</div>
    <div class="pill"><span class="dot"></span> ARABIC TYPING TRAINER</div>
  </div>
  <div class="meta"><span>NATEQ</span><span>AR / EN</span></div>
</div>
"""
    css = f"""
.square {{ position: relative; width: 800px; height: 800px; overflow: hidden; }}
.square .bg, .square .grid, .square .vignette, .square .top-edge, .square .frame {{ position: absolute; }}
.square .bg {{ inset: 0; background: radial-gradient(circle at 50% 12%, rgba(16, 185, 129, 0.11), transparent 64%), radial-gradient(600px 400px at 50% 110%, rgba(244, 63, 94, 0.04), transparent 70%), #000; }}
.square .grid {{ inset: 0; opacity: 0.36; background-size: 56px 56px; }}
.square .vignette {{ inset: 0; background: radial-gradient(circle at 50% 48%, transparent 34%, rgba(0, 0, 0, 0.68) 100%); }}
.frame {{ inset: 28px; border: 1px solid rgba(255, 255, 255, 0.075); border-radius: 52px; }}
.frame::after {{ content: ""; position: absolute; inset: 10px; border: 1px solid rgba(255, 255, 255, 0.025); border-radius: 42px; }}
.content {{
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding-bottom: 26px;
  z-index: 2;
}}
.icon-wrap {{ filter: drop-shadow(0 0 46px rgba(16, 185, 129, 0.30)); }}
.icon-wrap .mark {{ width: 348px; height: 348px; }}
.word {{
  margin-top: 24px;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 700;
  font-size: 112px;
  line-height: 1.08;
  color: #F7FAF9;
  letter-spacing: -0.02em;
  text-align: center;
}}
.sub {{ margin-top: 26px; color: #8A9490; font-size: 15px; font-weight: 500; letter-spacing: 0.055em; }}
.pill {{ margin-top: 18px; padding: 8px 13px; font-size: 8px; }}
.corner {{ position: absolute; width: 18px; height: 18px; border-color: rgba(16, 185, 129, 0.45); z-index: 3; }}
.corner.tl {{ top: 52px; left: 52px; border-top: 1px solid; border-left: 1px solid; border-top-left-radius: 6px; }}
.corner.tr {{ top: 52px; right: 52px; border-top: 1px solid; border-right: 1px solid; border-top-right-radius: 6px; }}
.corner.bl {{ bottom: 52px; left: 52px; border-bottom: 1px solid; border-left: 1px solid; border-bottom-left-radius: 6px; }}
.corner.br {{ bottom: 52px; right: 52px; border-bottom: 1px solid; border-right: 1px solid; border-bottom-right-radius: 6px; }}
.meta {{
  position: absolute; left: 58px; right: 58px; bottom: 30px;
  display: flex; justify-content: space-between;
  color: #46514C;
  font-size: 8px; font-weight: 600; letter-spacing: 0.24em;
  z-index: 3;
}}
"""
    return html_page(800, 800, body, css, fonts_css)


# ---------------------------------------------------------------------------
# Standalone SVG lockups
# ---------------------------------------------------------------------------


def logo_horizontal_svg(fonts: list[dict[str, str]]) -> str:
    font_block = svg_font_css(fonts)
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300" role="img" aria-labelledby="nateq-logo-title nateq-logo-desc">
  <title id="nateq-logo-title">Nateq — ناطق</title>
  <desc id="nateq-logo-desc">Nateq Arabic typing trainer horizontal logo lockup.</desc>
  <defs>
    <style type="text/css"><![CDATA[
{font_block}
      .ar {{ font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; }}
      .en {{ font-family: 'Inter', sans-serif; letter-spacing: -0.02em; }}
      .label {{ font-family: 'Inter', sans-serif; font-weight: 600; letter-spacing: 0.18em; }}
    ]]></style>
    <linearGradient id="lg-line" x1="880" y1="0" x2="1136" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="{EMERALD}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="{EMERALD}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="lg-divider" x1="0" y1="82" x2="0" y2="218" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <svg x="64" y="66" width="168" height="168" viewBox="0 0 64 64">{icon_inner("lgh")}</svg>

  <line x1="264" y1="82" x2="264" y2="218" stroke="url(#lg-divider)" stroke-width="1"/>

  <text class="ar" x="302" y="174" font-size="130" fill="#F7FAF9">ناطق</text>
  <text class="en" x="304" y="262" font-size="19" fill="#8A9490">nateq / arabic typing trainer</text>

  <g>
    <text class="label" x="880" y="121" font-size="10" fill="{EMERALD}">ARABIC TYPING TRAINER</text>
    <text class="en" x="880" y="158" font-size="16" fill="#EEF5F2">Type with rhythm.</text>
    <text class="en" x="880" y="182" font-size="16" fill="#7E8984">Feedback in real time.</text>
    <line x1="880" y1="210" x2="1136" y2="210" stroke="url(#lg-line)" stroke-width="1"/>
    <text class="ar" x="1136" y="242" font-size="27" fill="#B9F8DF" text-anchor="start" direction="rtl">ناطق</text>
    <text class="label" x="1040" y="242" font-size="8" fill="#5F6A65" text-anchor="end">NATEQ / 01</text>
  </g>
</svg>
"""


README_PILLS = [
    ("🌍", "Levantine &amp; Egyptian", 178),
    ("📖", "Quranic / Classical", 162),
    ("⚡", "Zero-Latency Browser Engine", 228),
    ("⌨️", "Arabizi &amp; Arabic", 148),
]


def readme_banner_svg(fonts: list[dict[str, str]]) -> str:
    font_block = svg_font_css(fonts, ("400", "500", "600"))
    gap = 10
    pill_y = 303
    pill_h = 34
    total = sum(width for _emoji, _label, width in README_PILLS) + gap * (len(README_PILLS) - 1)
    start_x = 640 - total / 2

    pill_markup = []
    cursor = start_x
    for emoji, label, width in README_PILLS:
        pill_markup.append(
            f'<rect x="{cursor:.1f}" y="{pill_y}" width="{width}" height="{pill_h}" '
            f'rx="{pill_h / 2}" fill="#FFFFFF" fill-opacity="0.03" '
            f'stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1"/>'
        )
        pill_markup.append(
            f'<text class="emoji" x="{cursor + 15:.1f}" y="{pill_y + 22.5:.1f}" '
            f'font-size="14">{emoji}</text>'
        )
        pill_markup.append(
            f'<text class="pill-label" x="{cursor + 39:.1f}" y="{pill_y + 22.5:.1f}" '
            f'font-size="13" fill="#8E8E93">{label}</text>'
        )
        cursor += width + gap

    pills = "\n  ".join(pill_markup)

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="420" viewBox="0 0 1280 420" role="img" aria-labelledby="nateq-readme-title nateq-readme-desc">
  <title id="nateq-readme-title">Nateq — ناطق</title>
  <desc id="nateq-readme-desc">Nateq README banner: the precision Arabic typing trainer.</desc>
  <defs>
    <style type="text/css"><![CDATA[
{font_block}
      .ar {{ font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 700; }}
      .en {{ font-family: 'Inter', sans-serif; font-weight: 400; letter-spacing: -0.02em; }}
      .en-med {{ font-family: 'Inter', sans-serif; font-weight: 500; letter-spacing: -0.02em; }}
      .pill-label {{ font-family: 'Inter', sans-serif; font-weight: 500; letter-spacing: 0; }}
      .emoji {{ font-family: 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif; }}
    ]]></style>
    <radialGradient id="rb-ambient" cx="50%" cy="-20%" r="65%">
      <stop stop-color="{EMERALD}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="{EMERALD}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="rb-aura" cx="50%" cy="50%" r="50%">
      <stop stop-color="{EMERALD}" stop-opacity="0.20"/>
      <stop offset="0.44" stop-color="{EMERALD}" stop-opacity="0.06"/>
      <stop offset="1" stop-color="{EMERALD}" stop-opacity="0"/>
    </radialGradient>
    <filter id="rb-glow" x="-70%" y="-70%" width="240%" height="240%">
      <feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="{EMERALD}" flood-opacity="0.34"/>
    </filter>
  </defs>

  <rect width="1280" height="420" fill="#000000"/>
  <rect width="1280" height="420" fill="url(#rb-ambient)"/>
  <rect x="0.5" y="0.5" width="1279" height="419" rx="20" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1"/>

  <circle cx="640" cy="124" r="92" fill="url(#rb-aura)"/>
  <g filter="url(#rb-glow)">
    <svg x="600" y="84" width="80" height="80" viewBox="0 0 64 64">{icon_inner("rb")}</svg>
  </g>

  <text class="ar" x="592" y="232" font-size="64" fill="#FFFFFF" text-anchor="middle" direction="rtl">ناطق</text>
  <line x1="666" y1="198.5" x2="666" y2="230.5" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1"/>
  <text class="en-med" x="681" y="224" font-size="26" fill="#F4F4F5">nateq</text>
  <text class="en" x="640" y="276" font-size="22" fill="#A1A1A6" text-anchor="middle">The Precision Arabic Typing Trainer</text>

  {pills}
</svg>
"""


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------


def chrome_screenshot(
    chrome: str,
    html: str,
    png_path: Path,
    width: int,
    height: int,
    *,
    transparent: bool = False,
) -> None:
    html_path = TMP_ROOT / f"{png_path.stem}.html"
    html_path.write_text(html, encoding="utf-8")
    profile = TMP_ROOT / f"chrome-{png_path.stem}"
    cmd = [
        chrome,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        "--force-color-profile=srgb",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=4000",
        f"--window-size={width},{height}",
        "--force-device-scale-factor=2",
        f"--user-data-dir={profile}",
        f"--screenshot={png_path}",
    ]
    if transparent:
        cmd.insert(-1, "--default-background-color=00000000")
    cmd.append(html_path.as_uri())
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0 or not png_path.exists():
        stderr = (result.stderr or "").strip()
        raise RuntimeError(f"Headless Chromium failed for {png_path.name}:\n{stderr}")
    with Image.open(png_path) as im:
        if im.size != (width * 2, height * 2):
            raise RuntimeError(
                f"Unexpected capture size for {png_path.name}: {im.size}; "
                f"expected {(width * 2, height * 2)}"
            )


def finalize_png(
    src: Path,
    dest: Path,
    width: int,
    height: int,
    *,
    transparent: bool = False,
    quantize: bool = False,
) -> int:
    with Image.open(src) as im:
        if im.size != (width, height):
            im = im.resize((width, height), Image.Resampling.LANCZOS)
        if transparent:
            im = im.convert("RGBA")
        else:
            im = im.convert("RGB")
        if quantize:
            if transparent:
                im = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE).convert("RGBA")
            else:
                im = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
        im.save(dest, format="PNG", optimize=True, compress_level=9)
    return dest.stat().st_size


def render_page(
    chrome: str,
    name: str,
    html: str,
    width: int,
    height: int,
    *,
    transparent: bool = False,
    quantize: bool = False,
) -> int:
    raw = TMP_ROOT / f"{name}.raw.png"
    chrome_screenshot(chrome, html, raw, width, height, transparent=transparent)
    dest = ASSETS / f"{name}.png"
    size = finalize_png(
        raw, dest, width, height, transparent=transparent, quantize=quantize
    )
    log(f"{dest.name}: {width}×{height} · {size / 1024:.0f} KB")
    return size


def svg_image_page(svg_path: Path, width: int, height: int) -> str:
    return f"""<!doctype html>
<html><head><meta charset="utf-8">
<style>
html, body {{ margin: 0; width: {width}px; height: {height}px; overflow: hidden; background: transparent; }}
img {{ display: block; width: {width}px; height: {height}px; }}
</style></head>
<body><img src="{svg_path.as_uri()}" width="{width}" height="{height}" alt=""></body>
</html>
"""


def solid_page(width: int, height: int, body: str, css: str = "") -> str:
    return f"""<!doctype html>
<html><head><meta charset="utf-8">
<style>
html, body {{ margin: 0; width: {width}px; height: {height}px; overflow: hidden; background: #000; }}
{css}
</style></head><body>{body}</body></html>
"""


# ---------------------------------------------------------------------------
# Apple touch icon
# ---------------------------------------------------------------------------


def apple_icon_page(fonts_css: str) -> str:
    body = f"""
<div class="apple">
  <div class="glow"></div>
  {icon_svg("apple", "mark")}
  <div class="ring"></div>
</div>
"""
    css = f"""
.apple {{ position: relative; width: 180px; height: 180px; background: #000; overflow: hidden; }}
.apple .mark {{ position: absolute; inset: 0; width: 180px; height: 180px; }}
.apple .glow {{
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.26), transparent 62%);
}}
.apple .ring {{
  position: absolute; inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}}
"""
    return html_page(
        180,
        180,
        body,
        css,
        fonts_css,
        background="#000000",
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the Nateq brand asset kit.")
    parser.add_argument("--chrome", help="Path to Chrome/Chromium (auto-detected by default)")
    parser.add_argument("--keep-temp", action="store_true", help="Keep temporary render files")
    args = parser.parse_args()

    ASSETS.mkdir(parents=True, exist_ok=True)

    sizes: list[tuple[str, int]] = []
    try:
        chrome = find_chrome(args.chrome)
        log(f"Chromium: {chrome}")
        log(f"Temporary workspace: {TMP_ROOT}")

        fonts = load_fonts()
        fonts_css = font_css(fonts)

        # ---- Vector favicon (write first so PNGs can be rasterized from it) ----
        favicon_path = ASSETS / "favicon.svg"
        favicon_path.write_text(favicon_svg(), encoding="utf-8")
        sizes.append((favicon_path.name, favicon_path.stat().st_size))
        log(f"favicon.svg: {favicon_path.stat().st_size / 1024:.1f} KB")

        # ---- Raster favicons ----
        sizes.append(
            (
                "favicon-32x32.png",
                render_page(
                    chrome,
                    "favicon-32x32",
                    svg_image_page(favicon_path, 32, 32),
                    32,
                    32,
                    transparent=True,
                ),
            )
        )
        sizes.append(
            (
                "apple-touch-icon.png",
                render_page(
                    chrome,
                    "apple-touch-icon",
                    apple_icon_page(fonts_css),
                    180,
                    180,
                    transparent=False,
                ),
            )
        )

        # ---- Horizontal logo SVG + PNGs ----
        logo_svg = logo_horizontal_svg(fonts)
        logo_svg_path = ASSETS / "logo_horizontal.svg"
        logo_svg_path.write_text(logo_svg, encoding="utf-8")
        sizes.append((logo_svg_path.name, logo_svg_path.stat().st_size))
        log(f"logo_horizontal.svg: {logo_svg_path.stat().st_size / 1024:.1f} KB")

        sizes.append(
            (
                "logo_horizontal.png",
                render_page(
                    chrome,
                    "logo_horizontal",
                    svg_image_page(logo_svg_path, 1200, 300),
                    1200,
                    300,
                    transparent=True,
                ),
            )
        )
        sizes.append(
            (
                "logo_horizontal_solid.png",
                render_page(
                    chrome,
                    "logo_horizontal_solid",
                    solid_page(
                        1200,
                        300,
                        f'<img src="{logo_svg_path.as_uri()}" width="1200" height="300" alt="" style="display:block">',
                        "img{display:block}",
                    ),
                    1200,
                    300,
                    transparent=False,
                ),
            )
        )

        # ---- Square profile card ----
        sizes.append(
            (
                "logo_square.png",
                render_page(
                    chrome,
                    "logo_square",
                    logo_square_page(fonts_css),
                    800,
                    800,
                    transparent=False,
                ),
            )
        )

        # ---- Social / OpenGraph cards ----
        sizes.append(
            (
                "og_banner_1200x630.png",
                render_page(
                    chrome,
                    "og_banner_1200x630",
                    og_page(fonts_css),
                    1200,
                    630,
                    transparent=False,
                ),
            )
        )
        sizes.append(
            (
                "banner_wide_1500x500.png",
                render_page(
                    chrome,
                    "banner_wide_1500x500",
                    wide_page(fonts_css),
                    1500,
                    500,
                    transparent=False,
                ),
            )
        )
        sizes.append(
            (
                "banner_story_1080x1920.png",
                render_page(
                    chrome,
                    "banner_story_1080x1920",
                    story_page(fonts_css),
                    1080,
                    1920,
                    transparent=False,
                ),
            )
        )

        # ---- README banner (SVG + raster) ----
        readme_svg = readme_banner_svg(fonts)
        readme_svg_path = ASSETS / "readme_banner.svg"
        readme_svg_path.write_text(readme_svg, encoding="utf-8")
        sizes.append((readme_svg_path.name, readme_svg_path.stat().st_size))
        log(f"readme_banner.svg: {readme_svg_path.stat().st_size / 1024:.1f} KB")

        sizes.append(
            (
                "readme_banner.png",
                render_page(
                    chrome,
                    "readme_banner",
                    readme_banner_page(fonts_css),
                    1280,
                    420,
                    transparent=False,
                ),
            )
        )

        # ---- Total / budget report ----
        total = sum(size for _name, size in sizes)
        print()
        log(f"Total kit size: {total / (1024 * 1024):.2f} MB")
        if total > 3 * 1024 * 1024:
            log("WARNING: kit exceeds the 3 MB target.")
            return 2
        log(f"All assets written to {ASSETS}")
        return 0
    finally:
        if args.keep_temp:
            log(f"Kept temporary files at {TMP_ROOT}")
        else:
            shutil.rmtree(TMP_ROOT, ignore_errors=True)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        raise SystemExit(130)
