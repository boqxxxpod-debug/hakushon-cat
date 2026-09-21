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

test("level four explains the automatic spring jump", () => {
  assert.match(appSource, /world\.level === 4 && shotsRef\.current < 1/);
  assert.match(appSource, /バネに乗ると自動でジャンプ！/);
  assert.match(appSource, /左へ長くドラッグ → 右へ反動/);
  assert.match(appSource, /level === 3[\s\S]*ネコを左へ長くドラッグ[\s\S]*バネで跳ね上がり、高い足場のクッションへ着地/);
});

test("level five explains the balloon's strong wind response", () => {
  assert.match(appSource, /world\.level === 5 && shotsRef\.current < 2/);
  assert.match(appSource, /① 左へ短くドラッグ → 風船/);
  assert.match(appSource, /① 風船をどかせた！/);
  assert.match(appSource, /② 右下へ長く → クッション/);
  assert.match(appSource, /level === 4[\s\S]*軽い風船だけを大きく動かします[\s\S]*空いたクッションへ戻りましょう/);
});

test("level six explains how the box holds the pressure switch", () => {
  assert.match(appSource, /world\.level === 6 && shotsRef\.current < 2/);
  assert.match(appSource, /① 左へ長く → 箱をスイッチへ/);
  assert.match(appSource, /① スイッチON！/);
  assert.match(appSource, /② 右下へ長く → クッション/);
  assert.match(appSource, /level === 5[\s\S]*箱を赤いスイッチまで運んでON[\s\S]*使えるようになったクッションへ戻りましょう/);
});

test("level seven explains how the pressure switch opens the gate", () => {
  assert.match(appSource, /world\.level === 7 && shotsRef\.current < 2/);
  assert.match(appSource, /① 箱をスイッチへ → ゲートOPEN/);
  assert.match(appSource, /① ゲートOPEN！/);
  assert.match(appSource, /② 右下へ長く → 通り抜ける/);
  assert.match(appSource, /level === 6[\s\S]*箱を赤いスイッチへ運ぶとゲートが開きます[\s\S]*開いた通路を抜け/);
});

test("level eight explains how the box tilts the seesaw", () => {
  assert.match(appSource, /world\.level === 8 && shotsRef\.current < 2/);
  assert.match(appSource, /① 左へ長く → 箱を左側へ/);
  assert.match(appSource, /① 右側が上がった！/);
  assert.match(appSource, /② 右下へ短く → 高いクッション/);
  assert.match(appSource, /level === 7[\s\S]*箱をシーソーの左側へ動かすと、反対側が高く上がります[\s\S]*高くなった右側のクッションへ着地/);
});

test("level nine explains how a fast box breaks the wall", () => {
  assert.match(appSource, /world\.level === 9 && shotsRef\.current < 2/);
  assert.match(appSource, /① 右へ長く → 箱で壁を壊す/);
  assert.match(appSource, /① 壁を壊せた！/);
  assert.match(appSource, /② 左下へ長く → 通り抜ける/);
  assert.match(appSource, /level === 8[\s\S]*箱を十分に加速して壁へぶつけます[\s\S]*反動で開いた通路を抜けましょう/);
});

test("level ten explains the moving-platform timing window", () => {
  assert.match(appSource, /world\.level === 10 && shotsRef\.current < 1/);
  assert.match(appSource, /足場が右端まで来たら…/);
  assert.match(appSource, /いま！ 左下へ短く/);
  assert.match(appSource, /反動で右上のクッションへ/);
  assert.match(appSource, /level === 10[\s\S]*足場が右端へ近づいた瞬間に左下へ短くドラッグ[\s\S]*右上のクッションへ着地/);
});

test("level eleven explains automatic rope grab, swing boost, and release", () => {
  assert.match(appSource, /world\.level === 11 && \([\s\S]*!world\.ropeEverGrabbed \|\| world\.ropeAttached !== null/);
  assert.match(appSource, /① 左下へ長く → ロープへ/);
  assert.match(appSource, /近づくと自動でつかまる！/);
  assert.match(appSource, /ロープをつかんだ！/);
  assert.match(appSource, /② 左へ長く → 右でボタン/);
  assert.match(appSource, /左下へ長くドラッグしてロープへ飛び[\s\S]*ロープをはなすボタンで高いクッションへ着地/);
});

test("the clear messages lead into the next stage before final completion", () => {
  assert.match(appSource, /level === 1[\s\S]*つぎは箱をどかそう[\s\S]*つぎは氷で滑ろう[\s\S]*つぎはバネでジャンプ[\s\S]*つぎは風船を飛ばそう[\s\S]*つぎはスイッチON[\s\S]*つぎはゲートを開けよう[\s\S]*つぎはシーソーで登ろう[\s\S]*つぎは壁を壊そう[\s\S]*つぎは動く足場へ[\s\S]*つぎはロープにつかまろう[\s\S]*全レベル クリア！/);
});
