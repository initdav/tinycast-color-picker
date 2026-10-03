# Color Picker for TinyCast

A native screen eyedropper with one **Pick Color** command and a configurable clipboard format:

| Color Format preference | Clipboard output |
| --- | --- |
| **HEX** (default) | `#FF5A36` |
| **RGB** | `rgb(255, 90, 54)` |

Run **Pick Color**, move the eyedropper to the pixel you want, and click. The color is copied automatically and a confirmation appears. Press **Escape** to cancel without changing your clipboard.

Colors are converted to sRGB, rounded to 8-bit channels, and clipped to the sRGB range. The macOS sampler supplies the magnified pixel preview and works across displays.

## Install in TinyCast

**[Download the prebuilt extension](https://github.com/initdav/tinycast-color-picker/releases/latest/download/tinycast-color-picker.zip)** · [All releases](https://github.com/initdav/tinycast-color-picker/releases)

Requires macOS 26 or newer and TinyCast. Supports Apple silicon and Intel. **No Node.js, Xcode, or compilation needed.**

1. Download **`tinycast-color-picker.zip`** and unzip it. The extracted folder is named **`tinycast-color-picker`**.
2. Open **TinyCast → Settings → Extensions** and enable extensions if needed.
3. Choose **Install → Add from folder** and select the extracted **`tinycast-color-picker`** folder.
4. Open the launcher and search for **Pick Color**.

Choose the extension ZIP from the release's assets; GitHub's **Source code** downloads are for developers.

Choose **Settings → Extensions → Color Picker → Configure → Color Format** to select HEX or RGB. Assign one global shortcut to **Pick Color**; it uses your saved format each time. You can also open the extension's configuration from the launcher's **⌘K → Configure Extension** action.

To update, download the latest release and add its extracted folder again; TinyCast runs its installed copy. When upgrading from the original two-command version, assign your shortcut to the new **Pick Color** command.

The release contains everything needed at runtime, including the universal native helper.

## Build from source

On macOS, install Node.js and Xcode Command Line Tools (`xcode-select --install`), then run:

```sh
npm ci --ignore-scripts
npm run check
npm run build
npm test
```

The build emits a Raycast-compatible manifest and CommonJS command bundles, plus an ad-hoc signed Swift helper in `dist/assets`. It does not require Raycast to be installed.

To install your own build, use **Add from folder** and select **`dist`**. After rebuilding, add `dist` again to update TinyCast's installed copy.

## Release a new version

The [Release workflow](.github/workflows/release.yml) builds and publishes a precompiled extension whenever a version tag is pushed. It uses macOS 26 and Node.js 24, checks types, builds the universal helper and commands, runs the tests, then packages and verifies the extracted ZIP before uploading it and `SHA256SUMS` to a GitHub Release. It uses GitHub's automatic `GITHUB_TOKEN`; no additional secret is needed.

1. Set the new version in `package.json` and update the lockfile with `npm install --package-lock-only --ignore-scripts`.
2. Commit and push the changes, including the release workflow.
3. Create and push a matching tag. For example, for version `1.1.0`:

   ```sh
   git tag -a v1.1.0 -m "Release v1.1.0"
   git push origin v1.1.0
   ```

The tag must exactly match `v` plus the version in `package.json`. Releases currently use stable versions (`MAJOR.MINOR.PATCH`). Watch **GitHub → Actions → Release** for the result. A release is published only after the checks and archive verification pass. Published releases are left unchanged on reruns; failed runs can be retried from GitHub Actions.

To build an existing tag manually, open **GitHub → Actions → Release → Run workflow** and enter its tag (for example `v1.1.0`). The workflow checks out that tag's source, so retrying never builds unrelated changes from the default branch.

For a local packaging check after building and testing, run `npm run package:release`. The ZIP and checksum are written to `.build/release/`, which is excluded from Git.

## How it works

TinyCast runs the command as a `no-view` extension. It reads the saved format preference, closes the launcher, launches the bundled helper with `child_process.execFile`, validates the sampled color, and copies it through TinyCast's `Clipboard` API. The helper uses Apple's `NSColorSampler`; it does not install a background service, save screenshots, or contact a server.

If macOS prompts for screen access, follow its permission prompt and rerun the command. If the eyedropper fails to launch, download and reinstall the latest release. Cancelling or a failed sample preserves your clipboard.

References: [TinyCast extensions](https://tinycast.dev/docs/extensions/), [compatibility](https://tinycast.dev/docs/extensions/compatibility/), [folder installation](https://tinycast.dev/docs/extensions/installing/), [Apple NSColorSampler](https://developer.apple.com/documentation/appkit/nscolorsampler).
