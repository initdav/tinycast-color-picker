# Color Picker for TinyCast

Pick a screen pixel and copy its color as HEX or RGB.

## Install

Requires TinyCast and macOS 26 or newer. Supports Apple silicon and Intel.

1. [Download the extension ZIP](https://github.com/initdav/tinycast-color-picker/releases/latest/download/tinycast-color-picker.zip) and unzip it.
2. In **TinyCast → Settings → Extensions**, enable extensions and choose **Install → Add from folder**.
3. Select the extracted **tinycast-color-picker** folder.

To update, repeat these steps with the latest ZIP.

## Use

Run **Pick Color** and click a pixel to copy its color. Press **Escape** to cancel.

Choose the format under **Settings → Extensions → Color Picker → Configure → Color Format**:

| Format | Clipboard output |
| --- | --- |
| HEX (default) | `#FF5A36` |
| RGB | `rgb(255, 90, 54)` |

You can assign a global shortcut to **Pick Color**.

## Build

Requires Node.js and Xcode Command Line Tools on macOS.

```sh
npm ci --ignore-scripts
npm run check
npm run build
npm test
```

In TinyCast, choose **Install → Add from folder** and select `dist`. Re-add it after rebuilding.
