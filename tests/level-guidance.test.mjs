import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

test("level one explains the two-step recoil lesson", () => {
  assert.match(appSource, /world\.level === 1 && shotsRef\.current < 2/);
  assert.match(appSource, /① 右へ長くドラッグ/);
  assert.match(appSource, /① 反動で左へ進めた！/);
  assert.match(appSource, /② もう一度右へ → クッション/);
  assert.match(appSource, /level === 1[\s\S]*反動で左へ動きます。2回ほど繰り返してクッションで止まりましょう/);
});

test("level two explains how wind and recoil move the box and cat apart", () => {
  assert.match(appSource, /world\.level === 2 && shotsRef\.current < 2/);
  assert.match(appSource, /① 左へ長くドラッグ → 箱を押す/);
  assert.match(appSource, /① 箱をどかせた！/);
  assert.match(appSource, /② 右下へ長くドラッグ → ゴール/);
  assert.match(appSource, /level === 2[\s\S]*風で箱を左へ押しながら反動で右へ移動[\s\S]*箱が空けたクッションへ戻ります/);
});

test("level three explains the low-friction ice surface", () => {
  assert.match(appSource, /world\.level === 3 && shotsRef\.current < 1/);
  assert.match(appSource, /氷の上は止まりにくい！/);
  assert.match(appSource, /右へ長くドラッグ → 左へ滑る/);
  assert.match(appSource, /level === 3[\s\S]*氷の上ではネコが長く滑ります[\s\S]*氷の先のクッションで止まりましょう/);
});

test("level four explains how wind and recoil move the box and cat apart", () => {
  assert.match(appSource, /world\.level === 4 && shotsRef\.current < 2/);
  assert.match(appSource, /① 左へ長くドラッグ → 箱を押す/);
  assert.match(appSource, /① 箱をどかせた！/);
  assert.match(appSource, /② 右下へ長くドラッグ → ゴール/);
  assert.match(appSource, /風で箱を左へ押しながら反動で右へ移動[\s\S]*箱が空けたクッションへ戻ります/);
});

test("the clear messages lead into the next stage before final completion", () => {
  assert.match(appSource, /level === 1[\s\S]*つぎは箱をどかそう[\s\S]*つぎは氷で滑ろう[\s\S]*全レベル クリア！/);
});
