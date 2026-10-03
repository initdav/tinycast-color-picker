import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const release = join(root, ".build/release");
const folderName = "tinycast-color-picker";
const archiveName = `${folderName}.zip`;
const archive = join(release, archiveName);

if (process.platform !== "darwin") throw new Error("Package releases on macOS after npm run build and npm test.");
await rm(release, { recursive: true, force: true });
await mkdir(release, { recursive: true });
await cp(join(root, "dist"), join(release, folderName), { recursive: true });
execFileSync("/usr/bin/zip", ["-q", "-r", archiveName, folderName], { cwd: release });

// Verify the actual download, including executable permissions after extraction.
const verification = join(release, "verification");
await mkdir(verification);
execFileSync("/usr/bin/unzip", ["-q", archive, "-d", verification]);
const extracted = join(verification, folderName);
const manifest = JSON.parse(await readFile(join(extracted, "package.json"), "utf8"));
const sourceManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
assert.equal(manifest.version, sourceManifest.version);
for (const command of manifest.commands) {
  assert.ok((await stat(join(extracted, `${command.name}.js`))).size > 0);
}
assert.ok((await stat(join(extracted, "assets", manifest.icon))).size > 0);
const helper = join(extracted, "assets/color-sampler");
assert.ok((await stat(helper)).mode & 0o111, "Extracted helper must be executable");
const architectures = execFileSync("/usr/bin/lipo", ["-archs", helper], { encoding: "utf8" });
assert.match(architectures, /arm64/);
assert.match(architectures, /x86_64/);
execFileSync("/usr/bin/codesign", ["--verify", "--strict", helper]);
const samples = execFileSync(helper, ["--self-test"], { encoding: "utf8" }).trim().split("\n").map(JSON.parse);
assert.equal(samples.length, 6);
assert.deepEqual(samples[0], { status: "picked", red: 255, green: 90, blue: 54 });
assert.deepEqual(samples.at(-1), { status: "cancelled" });

const checksum = createHash("sha256").update(await readFile(archive)).digest("hex");
await writeFile(join(release, "SHA256SUMS"), `${checksum}  ${archiveName}\n`);
console.log(`Verified release archive: ${archive}`);
