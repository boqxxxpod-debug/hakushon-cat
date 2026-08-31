import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/style.css", import.meta.url), "utf8");

test("the current level can always be restarted from inside the visible stage", () => {
  const stageStart = appSource.indexOf('<section className="game-stage"');
  const restartStart = appSource.indexOf('className="stage-restart-button"', stageStart);
  const stageEnd = appSource.indexOf("</section>", stageStart);

  assert.ok(stageStart >= 0);
  assert.ok(restartStart > stageStart);
  assert.ok(restartStart < stageEnd);
  assert.match(appSource, /className="stage-restart-button"[\s\S]*onClick={resetGame}/);
  assert.match(appSource, /aria-label={`Level \${level}を最初からやり直す`}/);
  assert.match(styles, /\.stage-restart-button\s*{[^}]*position:\s*absolute;[^}]*z-index:\s*1;/s);
  assert.match(styles, /\.stage-restart-button\s*{[^}]*min-height:\s*44px;/s);
});

test("restart restores transient play state without changing the selected level", () => {
  const resetStart = appSource.indexOf("const resetGame = useCallback(() => {");
  const resetEnd = appSource.indexOf("}, []);", resetStart);
  const resetBody = appSource.slice(resetStart, resetEnd);

  assert.match(resetBody, /freshPhysics\(levelRef\.current\)/);
  assert.match(resetBody, /aimRef\.current\.active = false/);
  assert.match(resetBody, /sneezeRef\.current = null/);
  assert.match(resetBody, /cooldownUntilRef\.current = 0/);
  assert.match(resetBody, /statusRef\.current = "playing"/);
  assert.match(resetBody, /shotsRef\.current = 0/);
  assert.doesNotMatch(resetBody, /levelRef\.current\s*=/);
});
