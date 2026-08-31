import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/style.css", import.meta.url), "utf8");

test("the clear actions render inside the stage instead of below the canvas", () => {
  const stageStart = appSource.indexOf('<section className="game-stage"');
  const overlayStart = appSource.indexOf('className="win-overlay"', stageStart);
  const stageEnd = appSource.indexOf("</section>", stageStart);

  assert.ok(stageStart >= 0);
  assert.ok(overlayStart > stageStart);
  assert.ok(overlayStart < stageEnd);
  assert.match(styles, /\.win-overlay\s*{[^}]*position:\s*absolute;[^}]*inset:\s*0;/s);
  assert.match(styles, /\.win-card\s*{[^}]*width:\s*min\(100%,\s*276px\);/s);
});

test("the clear dialog exposes working actions for both progression states", () => {
  assert.match(appSource, /role="dialog"/);
  assert.match(appSource, /onClick={startNextLevel}[\s\S]*つぎのレベル/);
  assert.match(appSource, /onClick={resetGame}[\s\S]*もう一度遊ぶ/);
  assert.match(styles, /\.win-primary-button\s*{[^}]*min-height:\s*48px;/s);
});
