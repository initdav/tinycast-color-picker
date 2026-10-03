import { Clipboard, closeMainWindow, environment, showHUD } from "@raycast/api";
import { execFile } from "child_process";
import { join } from "path";
import { ColorFormat, formatColor, parseSample } from "./color";

function sampleScreen(): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      join(environment.assetsPath, "color-sampler"),
      [],
      { encoding: "utf8", maxBuffer: 16 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(new Error("Could not launch the screen eyedropper. Rebuild and reinstall Color Picker."));
        } else {
          resolve(stdout);
        }
      },
    );
  });
}

export async function pickAndCopy(format: ColorFormat): Promise<void> {
  try {
    // Dismiss the launcher so the pixel beneath it is available to the eyedropper.
    await closeMainWindow();
    const color = parseSample(await sampleScreen());
    if (!color) return; // Escape leaves the existing clipboard untouched.
    const value = formatColor(color, format);
    await Clipboard.copy(value);
    await showHUD(`Copied ${value}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not pick a color. Please try again.";
    await showHUD(message);
  }
}
