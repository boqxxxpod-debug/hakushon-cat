import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

test("the opening guides give levels one and two their own drag direction", () => {
  assert.match(appSource, /world\.level === 1[\s\S]*右へドラッグ → 離して発射[\s\S]*左下へ長くドラッグ → 離す/);
  assert.match(appSource, /level === 1[\s\S]*ネコを押して右へドラッグ[\s\S]*ネコを押して左下へ長くドラッグ/);
});

test("level three explains both wall-setup steps and their drag directions", () => {
  assert.match(appSource, /world\.level === 3 && shotsRef\.current < 2/);
  assert.match(appSource, /① 右へ長くドラッグ → 左壁へ/);
  assert.match(appSource, /① 左壁まで移動できた！/);
  assert.match(appSource, /② 左下へ長くドラッグ → 壁越え/);
  assert.match(appSource, /最初はネコを右へ長くドラッグして左壁まで移動[\s\S]*次に左下へ長くドラッグ/);
});

test("level two leads into level three before the final completion message", () => {
  assert.match(appSource, /level === 2[\s\S]*つぎは壁で向きを変えよう[\s\S]*全レベル クリア！/);
});
