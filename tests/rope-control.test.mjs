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
  assert.match(appSource, /aria-label="ロープをはなして、そのままの勢いで飛ぶ"/);
  assert.match(styles, /\.rope-release-button\s*{[^}]*position:\s*absolute;[^}]*min-height:\s*50px;/s);
});

test("the rope has distinct free and held canvas visuals", () => {
  assert.match(appSource, /world\.ropes\.forEach/);
  assert.match(appSource, /const attached = world\.ropeAttached === index/);
  assert.match(appSource, /attached \? "#69cf91" : "#f6bc32"/);
  assert.match(appSource, /ctx\.fillText\("つかんだ！"/);
});
