import { getPreferenceValues } from "@raycast/api";
import { ColorFormat } from "./color";
import { pickAndCopy } from "./picker";

export default async function Command() {
  const { colorFormat } = getPreferenceValues<{ colorFormat?: ColorFormat }>();
  await pickAndCopy(colorFormat === "rgb" ? "rgb" : "hex");
}
