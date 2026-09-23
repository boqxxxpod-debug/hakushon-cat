import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/style.css", import.meta.url), "utf8");

test("the rope release control appears inside Level 11 only while attached", () => {
  const stageStart = appSource.indexOf('<section className="game-stage"');
  const releaseStart = appSource.indexOf('className="rope-release-button"', stageStart);
  const stageEnd = appSource.indexOf("</section>", stageStart);

  assert.ok(releaseStart > stageStart);
  assert.ok(releaseStart < stageEnd);
  assert.match(appSource, /level === 11 && status === "playing" && ropeAttached/);
  assert.match(appSource, /className="rope-release-button"[\s\S]*onClick={handleReleaseRope}/);
  assert.match(appSource, /aria-label="ロープをはなして、そのままの勢いで飛ぶ。ネコのタップでも離せます"/);
  assert.match(styles, /\.rope-release-button\s*{[^}]*position:\s*absolute;[^}]*min-height:\s*50px;/s);
});

test("tapping the held cat releases the rope before the sneeze cooldown or aim gesture", () => {
  const downStart = appSource.indexOf("const handlePointerDown =");
  const moveStart = appSource.indexOf("const handlePointerMove =", downStart);
  const pointerDown = appSource.slice(downStart, moveStart);

  assert.match(pointerDown, /Math\.hypot\(point\.x - cat\.x, point\.y - cat\.y\) > 48\) return/);
  assert.match(pointerDown, /levelRef\.current === 11 && physicsRef\.current\.ropeAttached !== null\)\s*\{\s*handleReleaseRope\(\);\s*return;/);
  assert.ok(pointerDown.indexOf("handleReleaseRope();") < pointerDown.indexOf("performance.now() < cooldownUntilRef.current"));
  assert.ok(pointerDown.indexOf("handleReleaseRope();") < pointerDown.indexOf("aimRef.current = { active: true"));
  assert.match(appSource, /holdingRope \? "② ネコをタップしてはなす"/);
  assert.match(appSource, /ネコをタップしてロープを離すか、画面下のボタン/);
  assert.match(appSource, /ctx\.arc\(world\.cat\.x, world\.cat\.y, 47, 0, Math\.PI \* 2\)/);
});

test("the rope has distinct free and held canvas visuals", () => {
  assert.match(appSource, /world\.ropes\.forEach/);
  assert.match(appSource, /const attached = world\.ropeAttached === index/);
  assert.match(appSource, /attached \? "#69cf91" : "#f6bc32"/);
  assert.match(appSource, /ctx\.fillText\("つかんだ！"/);
});
