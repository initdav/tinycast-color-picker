import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));

async function run({ output, failure, copyFailure, format = "hex" } = {}) {
  const calls = [];
  const module = { exports: {} };
  const context = vm.createContext({
    Error,
    module,
    exports: module.exports,
    require(name) {
      if (name === "@raycast/api") return {
        environment: { assetsPath: "/extension path with spaces/assets" },
        getPreferenceValues: () => ({ colorFormat: format }),
        closeMainWindow: async () => { calls.push(["close"]); },
        Clipboard: { copy: async (value) => {
          if (copyFailure) throw new Error("Clipboard unavailable");
          calls.push(["copy", value]);
        } },
        showHUD: async (message) => { calls.push(["hud", message]); },
      };
      if (name === "path") return { join };
      if (name === "child_process") return {
        execFile(file, args, options, callback) {
          calls.push(["sample", file, Array.from(args)]);
          assert.equal(options.encoding, "utf8");
          callback(failure ? new Error("ENOENT") : null, output ?? "");
        },
      };
      throw new Error(`Unexpected runtime dependency: ${name}`);
    },
  });
  vm.runInContext(readFileSync(join(root, "dist/pick-color.js"), "utf8"), context);
  await module.exports.default();
  return calls;
}

const picked = (red, green, blue) => JSON.stringify({ status: "picked", red, green, blue });

test("HEX preference dismisses the launcher, samples, copies and confirms", async () => {
  assert.deepEqual(await run({ output: picked(255, 90, 54) }), [
    ["close"], ["sample", "/extension path with spaces/assets/color-sampler", []],
    ["copy", "#FF5A36"], ["hud", "Copied #FF5A36"],
  ]);
});

test("RGB preference changes the same command's clipboard output", async () => {
  const calls = await run({ output: picked(0, 128, 255), format: "rgb" });
  assert.deepEqual(calls.slice(2), [["copy", "rgb(0, 128, 255)"], ["hud", "Copied rgb(0, 128, 255)"]]);
});

test("HEX preserves leading zeroes, black and white", async () => {
  for (const [channels, expected] of [
    [[0, 1, 15], "#00010F"], [[0, 0, 0], "#000000"], [[255, 255, 255], "#FFFFFF"],
  ]) {
    const calls = await run({ output: picked(...channels) });
    assert.deepEqual(calls[2], ["copy", expected]);
  }
});

test("Escape preserves the clipboard and shows no failure", async () => {
  for (const format of ["hex", "rgb"]) {
    const calls = await run({ output: '{"status":"cancelled"}\n', format });
    assert.equal(calls.length, 2);
  }
});

test("failed helper shows a useful error and preserves the clipboard", async () => {
  const calls = await run({ failure: true });
  assert.equal(calls.some(([kind]) => kind === "copy"), false);
  assert.match(calls.at(-1)[1], /Rebuild and reinstall/);
});

test("malformed or out-of-range results never reach the clipboard", async () => {
  for (const output of [
    "", "not JSON", "null", "42", '{"status":"error"}',
    '{"status":"picked","red":0,"green":0}',
    '{"status":"picked","red":"0","green":0,"blue":0}',
    picked(-1, 0, 0), picked(256, 0, 0), picked(1.5, 0, 0),
  ]) {
    const calls = await run({ output, format: "rgb" });
    assert.equal(calls.some(([kind]) => kind === "copy"), false, output);
    assert.equal(calls.at(-1)[0], "hud", output);
  }
});

test("clipboard failure cannot produce a success confirmation", async () => {
  const calls = await run({ output: picked(255, 90, 54), copyFailure: true });
  assert.deepEqual(calls.at(-1), ["hud", "Clipboard unavailable"]);
});

test("compiled native helper converts sRGB, clamps extended colors and reports cancellation", () => {
  const samples = execFileSync(join(root, "dist/assets/color-sampler"), ["--self-test"], { encoding: "utf8" })
    .trim().split("\n").map((line) => JSON.parse(line));
  assert.deepEqual(samples, [
    { status: "picked", red: 255, green: 90, blue: 54 },
    { status: "picked", red: 0, green: 0, blue: 0 },
    { status: "picked", red: 255, green: 255, blue: 255 },
    { status: "picked", red: 0, green: 255, blue: 128 },
    { status: "picked", red: 255, green: 0, blue: 0 },
    { status: "cancelled" },
  ]);
});

test("missing or unrecognized preferences fall back to HEX", async () => {
  for (const format of [null, "", "unexpected"]) {
    const calls = await run({ output: picked(255, 90, 54), format });
    assert.deepEqual(calls[2], ["copy", "#FF5A36"]);
  }
});

test("every declared command and required asset exists in the installable folder", () => {
  const manifest = JSON.parse(readFileSync(join(root, "dist/package.json"), "utf8"));
  assert.deepEqual(manifest.platforms, ["macOS"]);
  assert.equal(manifest.commands.length, 1);
  assert.equal(manifest.commands[0].name, "pick-color");
  assert.equal(manifest.preferences[0].default, "hex");
  assert.deepEqual(manifest.preferences[0].data.map(({ value }) => value), ["hex", "rgb"]);
  for (const command of manifest.commands) {
    assert.equal(command.mode, "no-view");
    assert.ok(readFileSync(join(root, "dist", `${command.name}.js`)).length > 0);
  }
  assert.ok(readFileSync(join(root, "dist/assets", manifest.icon)).length > 0);
  const architectures = execFileSync("/usr/bin/lipo", ["-archs", join(root, "dist/assets/color-sampler")], { encoding: "utf8" });
  assert.match(architectures, /arm64/);
  assert.match(architectures, /x86_64/);
  execFileSync("/usr/bin/codesign", ["--verify", "--strict", join(root, "dist/assets/color-sampler")]);
});
