# dark-inverter

Invert any site's colors with just a click. Designed for sites that force white mode; results vary in saturation depending on the site.

---

## Setup

Make sure to enable developer mode first.

- `brave://extensions` → **Load unpacked** → select the folder with the source code.
- Click the **D** icon to toggle, or use `Alt + Shift + D`.

## Features

- Saves site toggles locally.
- Works on any site, even toggling white mode if you're a maniac.
- Works partially on video media.
- Pick elements that need to be inverted.

| Element | CSS counter-invert | JS inline | Fullscreen exempt |
|---------|:---:|:---:|:---:|
| `img` | ✓ | ✓ | — |
| `svg` | ✓ | ✓ | — |
| `canvas` | ✓ | ✓ | — |
| `video` | ✓ | — (CSS only) | ✓ |
| `iframe` | ✓ | — (CSS only) | ✓ |
| `embed` | ✓ | ✓ | ✓ |
| `object` | ✓ | ✓ | ✓ |

---

For dark mode on Cloudflare error pages, see: https://gist.github.com/lnguyenhoang42/ffe5d4d96d14a4b39f3af5e134663d66   
