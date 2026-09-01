import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  BOX_HALF,
  CAT_R,
  FLOOR_Y,
  LEVELS,
  LEFT_WALL,
  MAX_AIM_DISTANCE,
  RIGHT_WALL,
  WORLD_H,
  WORLD_W,
  clamp,
  freshPhysics,
  nextLevel,
  powerForDistance,
  sneezeVelocity,
  stepPhysics,
  type AimState,
  type LevelId,
  type PhysicsState,
  type PlayStatus,
  type SneezeState,
} from "./physics";

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  width: number,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 12 * Math.cos(angle - Math.PI / 6), toY - 12 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - 12 * Math.cos(angle + Math.PI / 6), toY - 12 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export default function Home() {
  const levelRef = useRef<LevelId>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const physicsRef = useRef<PhysicsState>(freshPhysics());
  const aimRef = useRef<AimState>({ active: false, pointerId: -1, x: 0, y: 0 });
  const sneezeRef = useRef<SneezeState | null>(null);
  const catImageRef = useRef<HTMLImageElement | null>(null);
  const lastAimRef = useRef({ x: 1, y: 0 });
  const cooldownUntilRef = useRef(0);
  const statusRef = useRef<PlayStatus>("playing");
  const shotsRef = useRef(0);
  const [status, setStatus] = useState<PlayStatus>("playing");
  const [shots, setShots] = useState(0);
  const [level, setLevel] = useState<LevelId>(1);

  const resetGame = useCallback(() => {
    physicsRef.current = freshPhysics(levelRef.current);
    aimRef.current.active = false;
    sneezeRef.current = null;
    lastAimRef.current = { x: 1, y: 0 };
    cooldownUntilRef.current = 0;
    statusRef.current = "playing";
    shotsRef.current = 0;
    setStatus("playing");
    setShots(0);
  }, []);

  const startNextLevel = useCallback(() => {
    const following = nextLevel(levelRef.current);
    if (following === null) return;
    levelRef.current = following;
    setLevel(following);
    physicsRef.current = freshPhysics(following);
    aimRef.current.active = false;
    sneezeRef.current = null;
    cooldownUntilRef.current = 0;
    statusRef.current = "playing";
    shotsRef.current = 0;
    setStatus("playing");
    setShots(0);
  }, []);

  useEffect(() => {
    const image = new Image();
    image.src = `${import.meta.env.BASE_URL}cat-sprite.png`;
    catImageRef.current = image;
    return () => {
      catImageRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WORLD_W * dpr;
    canvas.height = WORLD_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let animationFrame = 0;
    let previous = performance.now();
    let accumulator = 0;

    const step = (dt: number) => {
      if (statusRef.current !== "playing") return;
      const world = physicsRef.current;
      stepPhysics(world, dt);

      if (sneezeRef.current) {
        sneezeRef.current.age += dt;
        if (sneezeRef.current.age > 0.42) sneezeRef.current = null;
      }

      if (world.goalHold >= 0.6) {
        statusRef.current = "won";
        setStatus("won");
      }
      if (world.cat.y > WORLD_H + 50) {
        statusRef.current = "failed";
        setStatus("failed");
      }
    };

    const drawAim = (world: PhysicsState) => {
      if (!aimRef.current.active) return;
      const cat = world.cat;
      const dx = aimRef.current.x - cat.x;
      const dy = aimRef.current.y - cat.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 2) return;
      const dirX = dx / distance;
      const dirY = dy / distance;
      const power = powerForDistance(distance);
      const length = Math.min(distance, MAX_AIM_DISTANCE);

      ctx.save();
      ctx.fillStyle = "rgba(65, 190, 255, 0.16)";
      ctx.beginPath();
      ctx.moveTo(cat.x + dirX * 20, cat.y + dirY * 20);
      ctx.arc(cat.x, cat.y, 132, Math.atan2(dirY, dirX) - 0.34, Math.atan2(dirY, dirX) + 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      drawArrow(ctx, cat.x + dirX * 30, cat.y + dirY * 30, cat.x + dirX * length, cat.y + dirY * length, "#2aa8ef", 7);
      drawArrow(ctx, cat.x - dirX * 28, cat.y - dirY * 28, cat.x - dirX * (34 + length * 0.48), cat.y - dirY * (34 + length * 0.48), "#f6bc32", 6);

      const launchSpeed = 320 + 210 * power;
      const vx = -dirX * launchSpeed;
      const vy = -dirY * (260 + 160 * power);
      ctx.fillStyle = "rgba(246, 188, 50, 0.72)";
      for (let i = 1; i <= 8; i += 1) {
        const t = i * 0.105;
        const px = cat.x + vx * t;
        const py = cat.y + vy * t + 0.5 * 1180 * t * t;
        if (px < LEFT_WALL || px > RIGHT_WALL || py > FLOOR_Y) break;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(2.4, 5 - i * 0.32), 0, Math.PI * 2);
        ctx.fill();
      }

      roundedRect(ctx, 94, 76, 172, 42, 21);
      ctx.fillStyle = "rgba(22, 31, 52, 0.88)";
      ctx.fill();
      const activeSegments = power < 0.45 ? 1 : power < 0.78 ? 2 : 3;
      ["#7dd7ff", "#44b9f3", "#168ed0"].forEach((color, index) => {
        roundedRect(ctx, 111 + index * 48, 91, 38, 12, 6);
        ctx.fillStyle = index < activeSegments ? color : "rgba(255,255,255,.2)";
        ctx.fill();
      });
    };

    const draw = () => {
      const world = physicsRef.current;
      const definition = LEVELS[world.level];
      ctx.clearRect(0, 0, WORLD_W, WORLD_H);

      const background = ctx.createLinearGradient(0, 0, 0, WORLD_H);
      background.addColorStop(0, "#fff9e8");
      background.addColorStop(1, "#f2dcb6");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);

      ctx.fillStyle = "rgba(255,255,255,.55)";
      for (let y = 138; y < FLOOR_Y - 10; y += 56) ctx.fillRect(22, y, 316, 2);

      ctx.fillStyle = "#28344f";
      roundedRect(ctx, 24, 20, 312, 50, 20);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 18px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`LEVEL ${world.level}`, 43, 45);
      ctx.fillStyle = "#b7c2d8";
      ctx.font = "700 12px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(definition.hint, 226, 45, 112);

      ctx.fillStyle = "#d5aa76";
      ctx.fillRect(LEFT_WALL, FLOOR_Y, RIGHT_WALL - LEFT_WALL, 50);
      ctx.fillStyle = "#9b6d46";
      ctx.fillRect(LEFT_WALL, FLOOR_Y, RIGHT_WALL - LEFT_WALL, 8);
      ctx.fillStyle = "rgba(100, 67, 42, .15)";
      for (let x = 38; x < RIGHT_WALL; x += 64) ctx.fillRect(x, FLOOR_Y + 16, 2, 28);

      ctx.save();
      ctx.shadowColor = "rgba(52, 110, 80, .2)";
      ctx.shadowBlur = 10;
      const goalX = definition.goal.left - 5;
      const goalWidth = definition.goal.right - definition.goal.left + 10;
      roundedRect(ctx, goalX, 511, goalWidth, 31, 15);
      ctx.fillStyle = "#8cd7ab";
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "#3f9a6a";
      ctx.lineWidth = 3;
      roundedRect(ctx, goalX, 511, goalWidth, 31, 15);
      ctx.stroke();
      ctx.fillStyle = "#28794f";
      ctx.font = "800 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("おひるね", goalX + goalWidth / 2, 527);

      for (const obstacle of world.obstacles) {
        ctx.fillStyle = "#66748d";
        ctx.strokeStyle = "#28344f";
        ctx.lineWidth = 4;
        roundedRect(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.22)";
        roundedRect(ctx, obstacle.x + 7, obstacle.y + 9, 7, obstacle.height - 18, 4);
        ctx.fill();
      }

      if (world.box) {
        ctx.save();
        ctx.translate(world.box.x, world.box.y);
        ctx.rotate(clamp(world.box.vx / 900, -0.12, 0.12));
        ctx.fillStyle = "#cb834d";
        ctx.strokeStyle = "#764326";
        ctx.lineWidth = 4;
        roundedRect(ctx, -BOX_HALF, -BOX_HALF, BOX_HALF * 2, BOX_HALF * 2, 5);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "rgba(118, 67, 38, .55)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-13, -13);
        ctx.lineTo(13, 13);
        ctx.moveTo(13, -13);
        ctx.lineTo(-13, 13);
        ctx.stroke();
        ctx.restore();
      }

      if (sneezeRef.current) {
        const sneeze = sneezeRef.current;
        const fade = 1 - sneeze.age / 0.42;
        const angle = Math.atan2(sneeze.dirY, sneeze.dirX);
        const radius = 55 + sneeze.age * 210;
        ctx.fillStyle = `rgba(72, 194, 255, ${0.26 * fade})`;
        ctx.beginPath();
        ctx.moveTo(world.cat.x, world.cat.y);
        ctx.arc(world.cat.x, world.cat.y, radius, angle - 0.36, angle + 0.36);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${0.86 * fade})`;
        for (let i = 0; i < 5; i += 1) {
          const spread = (i - 2) * 0.11;
          const distance = 38 + i * 11 + sneeze.age * 155;
          ctx.beginPath();
          ctx.arc(world.cat.x + Math.cos(angle + spread) * distance, world.cat.y + Math.sin(angle + spread) * distance, 5 - i * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const catImage = catImageRef.current;
      ctx.save();
      ctx.translate(world.cat.x, world.cat.y);
      ctx.rotate(clamp(world.cat.vx / 850, -0.18, 0.18));
      if (lastAimRef.current.x < 0) ctx.scale(-1, 1);
      if (catImage?.complete && catImage.naturalWidth > 0) {
        ctx.drawImage(catImage, -38, -39, 76, 76);
      } else {
        ctx.fillStyle = "#f2a34d";
        ctx.beginPath();
        ctx.arc(0, 0, CAT_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#26334d";
        ctx.font = "30px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("猫", 0, 1);
      }
      ctx.restore();

      drawAim(world);

      if (!aimRef.current.active && statusRef.current === "playing" && shotsRef.current === 0) {
        roundedRect(ctx, 49, 132, 262, 70, 18);
        ctx.fillStyle = "rgba(255,255,255,.92)";
        ctx.fill();
        ctx.fillStyle = "#26334d";
        ctx.textAlign = "center";
        ctx.font = "800 17px system-ui, sans-serif";
        ctx.fillText("ネコを押したまま", 180, 157);
        ctx.font = "700 15px system-ui, sans-serif";
        ctx.fillStyle = "#59657c";
        ctx.fillText(
          world.level === 1 ? "右へドラッグ → 離して発射" : "左下へ長くドラッグ → 離す",
          180,
          182,
        );
      }

    };

    const frame = (now: number) => {
      const elapsed = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      accumulator += elapsed * (aimRef.current.active ? 0.15 : 1);
      while (accumulator >= 1 / 60) {
        step(1 / 60);
        accumulator -= 1 / 60;
      }
      draw();
      animationFrame = requestAnimationFrame(frame);
    };

    animationFrame = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const pointerPosition = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WORLD_W,
      y: ((event.clientY - rect.top) / rect.height) * WORLD_H,
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (statusRef.current !== "playing" || performance.now() < cooldownUntilRef.current) return;
    const point = pointerPosition(event);
    const cat = physicsRef.current.cat;
    if (Math.hypot(point.x - cat.x, point.y - cat.y) > 48) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    aimRef.current = { active: true, pointerId: event.pointerId, x: point.x, y: point.y };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!aimRef.current.active || aimRef.current.pointerId !== event.pointerId) return;
    const point = pointerPosition(event);
    aimRef.current.x = point.x;
    aimRef.current.y = point.y;
  };

  const releaseAim = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!aimRef.current.active || aimRef.current.pointerId !== event.pointerId) return;
    const point = pointerPosition(event);
    const cat = physicsRef.current.cat;
    const dx = point.x - cat.x;
    const dy = point.y - cat.y;
    const distance = Math.hypot(dx, dy);
    aimRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (distance < 10) return;

    const dirX = dx / distance;
    const dirY = dy / distance;
    const power = powerForDistance(distance);
    lastAimRef.current = { x: dirX, y: dirY };
    const velocity = sneezeVelocity(dirX, dirY, power);
    cat.vx += velocity.vx;
    cat.vy += velocity.vy;

    const box = physicsRef.current.box;
    if (box) {
      const toBoxX = box.x - cat.x;
      const toBoxY = box.y - cat.y;
      const boxDistance = Math.hypot(toBoxX, toBoxY);
      const coneDot = boxDistance > 0 ? (toBoxX * dirX + toBoxY * dirY) / boxDistance : -1;
      if (boxDistance < 155 && coneDot > 0.82) {
        box.vx += dirX * (230 + 220 * power);
        box.vy += dirY * (130 + 130 * power) - 50 * power;
      }
    }

    sneezeRef.current = { age: 0, dirX, dirY, power };
    cooldownUntilRef.current = performance.now() + 600;
    shotsRef.current += 1;
    setShots(shotsRef.current);
  };

  return (
    <main className="game-page">
      <div className="game-shell">
        <header className="game-header">
          <div>
            <p className="eyebrow">PHYSICS PUZZLE · PROTOTYPE</p>
            <h1>ハクション・キャット</h1>
          </div>
          <div className="shot-counter" aria-label={`くしゃみ ${shots}回`}>
            <span>くしゃみ</span>
            <strong>{shots}</strong>
          </div>
        </header>

        <section className="game-stage" aria-label={`ハクション・キャット Level ${level}`}>
          <canvas
            ref={canvasRef}
            className="game-canvas"
            aria-label={
              level === 1
                ? "ネコを押して右へドラッグし、離すとくしゃみます。ネコは反動で左へ動きます。"
                : "ネコを押して左下へ長くドラッグし、離すとくしゃみます。ネコは反動で右上へ動きます。"
            }
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={releaseAim}
            onPointerCancel={releaseAim}
          />
          <button
            className="stage-restart-button"
            type="button"
            onClick={resetGame}
            aria-label={`Level ${level}を最初からやり直す`}
          >
            <span aria-hidden="true">↻</span>
            やり直す
          </button>
          <div className="status-live" aria-live="polite">
            {status === "won" ? "クリア。おひるね成功！" : status === "failed" ? "失敗。もう一度挑戦できます。" : ""}
          </div>
          {status === "won" ? (
            <div className="win-overlay">
              <div
                className="win-card"
                role="dialog"
                aria-labelledby="win-title"
                aria-describedby="win-message"
              >
                <h2 id="win-title">おひるね成功！</h2>
                <p id="win-message">
                  {level === 1 ? "つぎは障害物をこえよう" : "全レベル クリア！"}
                </p>
                <span className="win-sleep" aria-hidden="true">Z z z ...</span>
                {nextLevel(level) !== null ? (
                  <button className="win-primary-button" type="button" onClick={startNextLevel} autoFocus>
                    つぎのレベル
                  </button>
                ) : (
                  <button className="win-primary-button" type="button" onClick={resetGame} autoFocus>
                    もう一度遊ぶ
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <div className="controls-row">
          <div className="legend" aria-label="操作の凡例">
            <span><i className="wind-dot" />青：風</span>
            <span><i className="recoil-dot" />黄：反動</span>
          </div>
          <div className="action-buttons">
            <button className="restart-button" type="button" onClick={resetGame}>
              {status === "won" ? "もう一度" : "リスタート"}
            </button>
          </div>
        </div>

        <p className="game-tip">ネコは歩けません。くしゃみの向きと逆へ飛びます。</p>
      </div>
    </main>
  );
}
