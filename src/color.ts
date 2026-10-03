export type RGB = { red: number; green: number; blue: number };
export type ColorFormat = "hex" | "rgb";

// Validate the helper's output before allowing it to change the clipboard.
export function parseSample(output: string): RGB | null {
  const result: unknown = JSON.parse(output);
  if (typeof result !== "object" || result === null) {
    throw new Error("The color picker returned an invalid response.");
  }
  const sample = result as Record<string, unknown>;
  if (sample.status === "cancelled") return null;
  if (sample.status !== "picked") {
    throw new Error("The color picker could not sample that pixel.");
  }
  for (const channel of ["red", "green", "blue"]) {
    const value = sample[channel];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 255) {
      throw new Error("The color picker returned an invalid RGB value.");
    }
  }
  return { red: sample.red as number, green: sample.green as number, blue: sample.blue as number };
}

export function formatColor(color: RGB, format: ColorFormat): string {
  const channels = [color.red, color.green, color.blue];
  if (format === "rgb") return `rgb(${channels.join(", ")})`;
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}
