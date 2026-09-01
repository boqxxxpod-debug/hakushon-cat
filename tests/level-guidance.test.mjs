import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

test("the first-shot guide gives each level its own drag direction", () => {
  assert.match(appSource, /world\.level === 1[\s\S]*右へドラッグ → 離して発射[\s\S]*左下へ長くドラッグ → 離す/);
  assert.match(appSource, /level === 1[\s\S]*ネコを押して右へドラッグ[\s\S]*ネコを押して左下へ長くドラッグ/);
});
