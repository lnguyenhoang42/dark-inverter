# dark-inverter
Invert any site color you want with just a click. Designed for site that forced white mode, very saturated depend on the site.
--
## To use, make sure to enable developer mode.
- `brave://extensions` → Load unpacked and select the folder with source code.
- Click the D icon and simply toggle it or with `Alt + Shift + D`.
## Feature
- Save site toggle locally.
- Assumingly work on any site, even toggle white-mode if you are a maniac.
- Work partially on video media.
- Filter and pick element that need to be inverted.

| Element | CSS re-invert | JS inline | Fullscreen exempt |
|---------|:---:|:---:|:---:|
| `img` | ✓ | ✓ | — |
| `svg` | ✓ | ✓ | — |
| `canvas` | ✓ | ✓ | — |
| `video` | ✓ | — (CSS only) | ✓ |
| `iframe` | ✓ | — (CSS only) | ✓ |
| `embed` | ✓ | ✓ | ✓ |
| `object` | ✓ | ✓ | ✓ |   

If you want dark-mode for cloudflare error check here: https://gist.github.com/lnguyenhoang42/ffe5d4d96d14a4b39f3af5e134663d66
