import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
const cache = join(root, ".build");
const assets = join(output, "assets");
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));

if (process.platform !== "darwin") throw new Error("Build on macOS with Xcode Command Line Tools installed.");
await rm(output, { recursive: true, force: true });
await mkdir(assets, { recursive: true });
await mkdir(cache, { recursive: true });

console.log("Compiling the native macOS eyedropper (Apple silicon + Intel)…");
for (const arch of ["arm64", "x86_64"]) {
  execFileSync("/usr/bin/xcrun", [
    "swiftc", "-O", "-target", `${arch}-apple-macosx26.0`,
    "-module-cache-path", join(cache, "modules"),
    join(root, "native/ColorSampler.swift"), "-o", join(cache, `color-sampler-${arch}`),
  ], { stdio: "inherit" });
}
const helper = join(assets, "color-sampler");
execFileSync("/usr/bin/lipo", [
  "-create", join(cache, "color-sampler-arm64"), join(cache, "color-sampler-x86_64"), "-output", helper,
]);
execFileSync("/usr/bin/codesign", ["--force", "--sign", "-", "--identifier", "dev.tinycast.color-picker.sampler", helper]);

console.log("Bundling TinyCast commands…");
await build({
  absWorkingDir: root,
  entryPoints: manifest.commands.map(({ name }) => `src/${name}.ts`),
  outdir: output,
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "es2020",
  external: ["@raycast/api"],
  minify: true,
});
await cp(join(root, "assets/extension-icon.png"), join(assets, "extension-icon.png"));
const { scripts, devDependencies, ...installManifest } = manifest;
await writeFile(join(output, "package.json"), `${JSON.stringify(installManifest, null, 2)}\n`);
await cp(join(root, "README.md"), join(output, "README.md"));
await cp(join(root, "LICENSE"), join(output, "LICENSE"));
console.log(`Ready to install: ${output}`);
