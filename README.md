# Color Picker for TinyCast

A native screen eyedropper with one **Pick Color** command and a configurable clipboard format:

| Color Format preference | Clipboard output |
| --- | --- |
| **HEX** (default) | `#FF5A36` |
| **RGB** | `rgb(255, 90, 54)` |

Run **Pick Color**, move the eyedropper to the pixel you want, and click. The color is copied automatically and a confirmation appears. Press **Escape** to cancel without changing your clipboard.

Colors are converted to sRGB, rounded to 8-bit channels, and clipped to the sRGB range. The macOS sampler supplies the magnified pixel preview and works across displays.

## Install in TinyCast

1. Open **TinyCast → Settings → Extensions** and enable extensions if needed.
2. Choose **Install → Add from folder** and select this project's **`dist`** folder.
3. Open the launcher and search for **Pick Color**.

Choose **Settings → Extensions → Color Picker → Configure → Color Format** to select HEX or RGB. Assign one global shortcut to **Pick Color**; it uses your saved format each time. You can also open the extension's configuration from the launcher's **⌘K → Configure Extension** action.

If you rebuild the extension, add `dist` again; TinyCast runs its installed copy. When upgrading from the original two-command version, assign your shortcut to the new **Pick Color** command.

The prebuilt `dist` folder contains everything needed at runtime. Node.js and Swift are only needed to rebuild. The helper is a universal binary for Apple silicon and Intel Macs running macOS 26 or newer, matching TinyCast's current minimum requirement.

## Build from source

On macOS, install Node.js and Xcode Command Line Tools (`xcode-select --install`), then run:

```sh
npm ci --ignore-scripts
npm run check
npm run build
npm test
```

The build emits a Raycast-compatible manifest and CommonJS command bundles, plus an ad-hoc signed Swift helper in `dist/assets`. It does not require Raycast to be installed.

## How it works

TinyCast runs the command as a `no-view` extension. It reads the saved format preference, closes the launcher, launches the bundled helper with `child_process.execFile`, validates the sampled color, and copies it through TinyCast's `Clipboard` API. The helper uses Apple's `NSColorSampler`; it does not install a background service, save screenshots, or contact a server.

If macOS prompts for screen access, follow its permission prompt and rerun the command. If the eyedropper fails to launch, rebuild and reinstall the `dist` folder. Cancelling or a failed sample preserves your clipboard.

References: [TinyCast extensions](https://tinycast.dev/docs/extensions/), [compatibility](https://tinycast.dev/docs/extensions/compatibility/), [folder installation](https://tinycast.dev/docs/extensions/installing/), [Apple NSColorSampler](https://developer.apple.com/documentation/appkit/nscolorsampler).
