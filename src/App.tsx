import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  BALLOON_R,
  BOX_HALF,
  CAT_R,
  FLOOR_Y,
  LEVELS,
  LEFT_WALL,
  MAX_AIM_DISTANCE,
  ROPE_SNEEZE_SCALE,
  RIGHT_WALL,
  WORLD_H,
  WORLD_W,
  applySneeze,
  clamp,
  freshPhysics,
  isSeesawReady,
  nextLevel,
  powerForDistance,
  releaseRope,
  ropeEndPosition,
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
  const ropeAttachedUiRef = useRef(false);
  const [status, setStatus] = useState<PlayStatus>("playing");
  const [shots, setShots] = useState(0);
  const [level, setLevel] = useState<LevelId>(1);
  const [ropeAttached, setRopeAttached] = useState(false);

  const resetGame = useCallback(() => {
    physicsRef.current = freshPhysics(levelRef.current);
    aimRef.current.active = false;
    sneezeRef.current = null;
    lastAimRef.current = { x: 1, y: 0 };
    cooldownUntilRef.current = 0;
    statusRef.current = "playing";
    shotsRef.current = 0;
    ropeAttachedUiRef.current = false;
    setStatus("playing");
    setShots(0);
    setRopeAttached(false);
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
    ropeAttachedUiRef.current = false;
    setStatus("playing");
    setShots(0);
    setRopeAttached(false);
  }, []);

  const handleReleaseRope = useCallback(() => {
    if (!releaseRope(physicsRef.current)) return;
    aimRef.current.active = false;
    ropeAttachedUiRef.current = false;
    setRopeAttached(false);
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

      const isAttached = world.ropeAttached !== null;
      if (isAttached !== ropeAttachedUiRef.current) {
        ropeAttachedUiRef.current = isAttached;
        setRopeAttached(isAttached);
      }

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
      const recoilScale = world.ropeAttached === null ? 1 : ROPE_SNEEZE_SCALE;

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

      const launchSpeed = (320 + 210 * power) * recoilScale;
      const vx = -dirX * launchSpeed;
      const vy = -dirY * (260 + 160 * power) * recoilScale;
      ctx.fillStyle = "rgba(246, 188, 50, 0.72)";
      if (world.ropeAttached !== null) {
        const rope = world.ropes[world.ropeAttached];
        const angle = world.ropeAngles[world.ropeAttached] ?? 0;
        const tangentImpulse = vx * Math.cos(angle) - vy * Math.sin(angle);
        const swingDirection = tangentImpulse >= 0 ? 1 : -1;
        for (let i = 1; i <= 8; i += 1) {
          const previewAngle = angle + swingDirection * i * 0.035;
          const px = rope.anchorX + Math.sin(previewAngle) * rope.length;
          const py = rope.anchorY + Math.cos(previewAngle) * rope.length;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(2.4, 5 - i * 0.32), 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        for (let i = 1; i <= 8; i += 1) {
          const t = i * 0.105;
          const px = cat.x + vx * t;
          const py = cat.y + vy * t + 0.5 * 1180 * t * t;
          if (px < LEFT_WALL || px > RIGHT_WALL || py > FLOOR_Y) break;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(2.4, 5 - i * 0.32), 0, Math.PI * 2);
          ctx.fill();
        }
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
      const goalLocked = (
        (world.level === 5 && !world.balloonCleared) ||
        (world.level === 6 && !world.switchOn.every(Boolean)) ||
        (world.level === 8 && !isSeesawReady(world)) ||
        (world.level === 9 && !world.wallBroken.every(Boolean)) ||
        (world.level === 11 && (!world.ropeEverGrabbed || world.ropeAttached !== null))
      );
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

      for (const zone of definition.iceZones) {
        const iceGradient = ctx.createLinearGradient(zone.x, 0, zone.x + zone.width, 0);
        iceGradient.addColorStop(0, "#bcefff");
        iceGradient.addColorStop(0.5, "#e8fbff");
        iceGradient.addColorStop(1, "#91d9f3");
        ctx.fillStyle = iceGradient;
        roundedRect(ctx, zone.x, FLOOR_Y - 8, zone.width, 17, 7);
        ctx.fill();
        ctx.strokeStyle = "#53b8dc";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.76)";
        for (let x = zone.x + 18; x < zone.x + zone.width - 8; x += 42) {
          ctx.fillRect(x, FLOOR_Y - 4, 18, 2);
        }
      }

      world.movingPlatforms.forEach((platform, index) => {
        const position = world.platformPositions[index];
        ctx.save();
        ctx.strokeStyle = "rgba(64, 91, 118, .38)";
        ctx.lineWidth = 4;
        ctx.setLineDash([7, 8]);
        ctx.beginPath();
        if (platform.axis === "x") {
          ctx.moveTo(platform.x - platform.distance, platform.y + platform.height / 2);
          ctx.lineTo(
            platform.x + platform.distance + platform.width,
            platform.y + platform.height / 2,
          );
        } else {
          ctx.moveTo(platform.x + platform.width / 2, platform.y - platform.distance);
          ctx.lineTo(
            platform.x + platform.width / 2,
            platform.y + platform.distance + platform.height,
          );
        }
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.shadowColor = world.platformContacts[index]
          ? "rgba(48, 177, 211, .52)"
          : "rgba(40, 74, 100, .25)";
        ctx.shadowBlur = world.platformContacts[index] ? 15 : 8;
        roundedRect(ctx, position.x, position.y, position.width, position.height, 7);
        ctx.fillStyle = "#5bc3dc";
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = "#246e89";
        ctx.lineWidth = 3;
        roundedRect(ctx, position.x, position.y, position.width, position.height, 7);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.78)";
        ctx.beginPath();
        ctx.moveTo(position.x + position.width / 2 - 13, position.y + 4);
        ctx.lineTo(position.x + position.width / 2, position.y + position.height - 4);
        ctx.lineTo(position.x + position.width / 2 + 13, position.y + 4);
        ctx.closePath();
        ctx.fill();
      });

      world.ropes.forEach((rope, index) => {
        const end = ropeEndPosition(world, index);
        if (!end) return;
        const attached = world.ropeAttached === index;

        ctx.save();
        ctx.lineCap = "round";
        ctx.shadowColor = attached ? "rgba(55, 181, 105, .42)" : "rgba(91, 59, 32, .24)";
        ctx.shadowBlur = attached ? 14 : 7;
        ctx.strokeStyle = attached ? "#237948" : "#76502e";
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(rope.anchorX, rope.anchorY);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = attached ? "#8cd7ab" : "#d6a85f";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(rope.anchorX, rope.anchorY);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        roundedRect(ctx, rope.anchorX - 24, rope.anchorY - 12, 48, 20, 8);
        ctx.fillStyle = "#4d566d";
        ctx.fill();
        ctx.strokeStyle = "#26334d";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "#9aa5ba";
        ctx.beginPath();
        ctx.arc(rope.anchorX, rope.anchorY - 2, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = attached ? "rgba(55, 181, 105, .6)" : "rgba(246, 188, 50, .48)";
        ctx.shadowBlur = attached ? 18 : 11;
        ctx.fillStyle = attached ? "#69cf91" : "#f6bc32";
        ctx.strokeStyle = attached ? "#237948" : "#82502a";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(end.x, end.y, attached ? 14 : 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        if (attached) {
          roundedRect(ctx, end.x - 32, end.y - 55, 64, 25, 12);
          ctx.fillStyle = "#237948";
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 10px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("つかんだ！", end.x, end.y - 42);
        }
      });

      world.springs.forEach((spring, index) => {
        const compressed = world.springArmed[index] === false;
        const springY = compressed ? FLOOR_Y - 8 : FLOOR_Y - 17;
        ctx.fillStyle = "#f15b67";
        ctx.strokeStyle = "#8f2632";
        ctx.lineWidth = 3;
        roundedRect(ctx, spring.x, springY, spring.width, compressed ? 12 : 21, 6);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#fff4b8";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = spring.x + 8; x <= spring.x + spring.width - 8; x += 10) {
          ctx.moveTo(x, springY + 5);
          ctx.lineTo(x + 5, springY + (compressed ? 8 : 16));
        }
        ctx.stroke();
      });

      world.seesaws.forEach((seesaw, index) => {
        const angle = world.seesawAngles[index];
        ctx.fillStyle = "#8b6a48";
        ctx.beginPath();
        ctx.moveTo(seesaw.x, seesaw.y + 2);
        ctx.lineTo(seesaw.x - 24, seesaw.y + 45);
        ctx.lineTo(seesaw.x + 24, seesaw.y + 45);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#533b29";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.save();
        ctx.translate(seesaw.x, seesaw.y);
        ctx.rotate(angle);
        ctx.shadowColor = "rgba(75, 48, 30, .28)";
        ctx.shadowBlur = 8;
        roundedRect(
          ctx,
          -seesaw.width / 2,
          -seesaw.thickness / 2,
          seesaw.width,
          seesaw.thickness,
          7,
        );
        ctx.fillStyle = "#e0a454";
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#82502a";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.48)";
        for (let x = -seesaw.width / 2 + 18; x < seesaw.width / 2; x += 38) {
          ctx.fillRect(x, -3, 20, 3);
        }
        ctx.restore();

        ctx.fillStyle = "#533b29";
        ctx.beginPath();
        ctx.arc(seesaw.x, seesaw.y, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      world.switches.forEach((pressureSwitch, index) => {
        const isOn = world.switchOn[index];
        const switchY = isOn ? FLOOR_Y - 7 : FLOOR_Y - 13;
        ctx.save();
        ctx.shadowColor = isOn ? "rgba(55, 181, 105, .42)" : "rgba(210, 69, 69, .25)";
        ctx.shadowBlur = isOn ? 14 : 7;
        roundedRect(ctx, pressureSwitch.x, switchY, pressureSwitch.width, isOn ? 8 : 14, 5);
        ctx.fillStyle = isOn ? "#5bd089" : "#ef6b67";
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = isOn ? "#237948" : "#9e3437";
        ctx.lineWidth = 3;
        roundedRect(ctx, pressureSwitch.x, switchY, pressureSwitch.width, isOn ? 8 : 14, 5);
        ctx.stroke();
        ctx.fillStyle = isOn ? "#237948" : "#9e3437";
        ctx.font = "900 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(isOn ? "ON" : "OFF", pressureSwitch.x + pressureSwitch.width / 2, FLOOR_Y + 20);
      });

      world.gates.forEach((gate, index) => {
        const isOpen = world.gateOpen[index];
        const panelY = isOpen ? gate.y - gate.height + 82 : gate.y;
        ctx.fillStyle = "rgba(55, 65, 84, .35)";
        ctx.fillRect(gate.x - 4, gate.y, 3, gate.height);
        ctx.fillRect(gate.x + gate.width + 1, gate.y, 3, gate.height);
        ctx.save();
        ctx.shadowColor = isOpen ? "rgba(55, 181, 105, .35)" : "rgba(204, 73, 54, .35)";
        ctx.shadowBlur = 10;
        roundedRect(ctx, gate.x, panelY, gate.width, gate.height, 5);
        ctx.fillStyle = isOpen ? "#67c991" : "#d95d4e";
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = isOpen ? "#237948" : "#873328";
        ctx.lineWidth = 3;
        roundedRect(ctx, gate.x, panelY, gate.width, gate.height, 5);
        ctx.stroke();
        for (let y = panelY + 14; y < panelY + gate.height; y += 28) {
          ctx.fillStyle = "rgba(255,255,255,.42)";
          ctx.fillRect(gate.x + 3, y, gate.width - 6, 4);
        }
        roundedRect(ctx, gate.x - 27, 96, gate.width + 54, 28, 12);
        ctx.fillStyle = isOpen ? "#237948" : "#873328";
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(isOpen ? "OPEN" : "CLOSED", gate.x + gate.width / 2, 110);
      });

      world.breakableWalls.forEach((wall, index) => {
        const broken = world.wallBroken[index];
        const healthRatio = world.wallHealth[index] / wall.durability;
        if (broken) {
          ctx.fillStyle = "#8b6f61";
          roundedRect(ctx, wall.x - 7, FLOOR_Y - 13, wall.width + 14, 13, 3);
          ctx.fill();
          ctx.fillStyle = "#b29483";
          ctx.fillRect(wall.x - 3, FLOOR_Y - 22, 11, 9);
          ctx.fillRect(wall.x + 10, FLOOR_Y - 18, 10, 5);
        } else {
          ctx.fillStyle = healthRatio < 1 ? "#c98769" : "#9c8d87";
          ctx.strokeStyle = healthRatio < 1 ? "#743d31" : "#514a49";
          ctx.lineWidth = 3;
          roundedRect(ctx, wall.x, wall.y, wall.width, wall.height, 3);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = "rgba(255,255,255,.38)";
          ctx.lineWidth = 2;
          for (let y = wall.y + 18; y < wall.y + wall.height; y += 32) {
            ctx.beginPath();
            ctx.moveTo(wall.x + 2, y);
            ctx.lineTo(wall.x + wall.width - 2, y);
            ctx.stroke();
          }
          if (healthRatio < 1) {
            ctx.strokeStyle = "#5d3028";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(wall.x + wall.width / 2, wall.y + 120);
            ctx.lineTo(wall.x + 3, wall.y + 158);
            ctx.lineTo(wall.x + wall.width - 3, wall.y + 196);
            ctx.lineTo(wall.x + 4, wall.y + 238);
            ctx.stroke();
          }
        }
        roundedRect(ctx, wall.x - 29, 96, wall.width + 58, 28, 12);
        ctx.fillStyle = broken ? "#28794f" : healthRatio < 1 ? "#9d4d36" : "#514a49";
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          broken ? "BROKEN" : healthRatio < 1 ? "ひび" : "じょうぶ",
          wall.x + wall.width / 2,
          110,
        );
      });

      ctx.save();
      ctx.shadowColor = "rgba(52, 110, 80, .2)";
      ctx.shadowBlur = 10;
      const goalX = definition.goal.left - 5;
      const goalWidth = definition.goal.right - definition.goal.left + 10;
      const goalY = definition.goal.bottom - 11;
      roundedRect(ctx, goalX, goalY, goalWidth, 31, 15);
      ctx.fillStyle = goalLocked ? "#b8bdc9" : "#8cd7ab";
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = goalLocked ? "#687085" : "#3f9a6a";
      ctx.lineWidth = 3;
      roundedRect(ctx, goalX, goalY, goalWidth, 31, 15);
      ctx.stroke();
      ctx.fillStyle = goalLocked ? "#555d70" : "#28794f";
      ctx.font = "800 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        goalLocked
          ? (world.level === 6
              ? "スイッチ待ち"
              : world.level === 8
                ? "かたむき待ち"
                : world.level === 9
                  ? "カベ待ち"
                  : world.level === 11
                    ? (world.ropeAttached !== null ? "はなして着地" : "ロープ待ち")
                  : "ふうせん待ち")
          : "おひるね",
        goalX + goalWidth / 2,
        goalY + 16,
      );

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

      if (world.balloon) {
        ctx.save();
        ctx.translate(world.balloon.x, world.balloon.y);
        const balloonGradient = ctx.createRadialGradient(-6, -7, 2, 0, 0, BALLOON_R);
        balloonGradient.addColorStop(0, "#ffe0f1");
        balloonGradient.addColorStop(1, "#ef6aa7");
        ctx.fillStyle = balloonGradient;
        ctx.strokeStyle = "#9d3567";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, BALLOON_R - 2, BALLOON_R, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#9d3567";
        ctx.beginPath();
        ctx.moveTo(-4, BALLOON_R - 1);
        ctx.lineTo(4, BALLOON_R - 1);
        ctx.lineTo(0, BALLOON_R + 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(90,65,80,.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, BALLOON_R + 5);
        ctx.quadraticCurveTo(7, BALLOON_R + 17, 1, BALLOON_R + 28);
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

      if (world.ropeAttached !== null) {
        ctx.save();
        ctx.strokeStyle = "#28794f";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.arc(world.cat.x, world.cat.y, 47, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      drawAim(world);

      const showLevelOneGuide = world.level === 1 && shotsRef.current < 2;
      const showLevelTwoGuide = world.level === 2 && shotsRef.current < 2;
      const showLevelThreeGuide = world.level === 3 && shotsRef.current < 1;
      const showLevelFourGuide = world.level === 4 && shotsRef.current < 1;
      const showLevelFiveGuide = world.level === 5 && shotsRef.current < 2;
      const showLevelSixGuide = world.level === 6 && shotsRef.current < 2;
      const showLevelSevenGuide = world.level === 7 && shotsRef.current < 2;
      const showLevelEightGuide = world.level === 8 && shotsRef.current < 2;
      const showLevelNineGuide = world.level === 9 && shotsRef.current < 2;
      const showLevelTenGuide = world.level === 10 && shotsRef.current < 1;
      const showLevelElevenGuide = world.level === 11 && (
        !world.ropeEverGrabbed || world.ropeAttached !== null
      );
      if (
        !aimRef.current.active &&
        statusRef.current === "playing" &&
        (shotsRef.current === 0 || showLevelOneGuide || showLevelTwoGuide || showLevelThreeGuide || showLevelFourGuide || showLevelFiveGuide || showLevelSixGuide || showLevelSevenGuide || showLevelEightGuide || showLevelNineGuide || showLevelTenGuide || showLevelElevenGuide)
      ) {
        const isLevelOne = world.level === 1;
        const isLevelTwo = world.level === 2;
        const isLevelThree = world.level === 3;
        const isLevelFour = world.level === 4;
        const isLevelFive = world.level === 5;
        const isLevelSix = world.level === 6;
        const isLevelSeven = world.level === 7;
        const isLevelEight = world.level === 8;
        const isLevelNine = world.level === 9;
        const isLevelTen = world.level === 10;
        const isLevelEleven = world.level === 11;
        const movedBoxAside = world.box !== null && world.box.x <= 100;
        const switchIsOn = world.switchOn.every(Boolean);
        roundedRect(ctx, 39, 132, 282, isLevelOne || isLevelTwo || isLevelThree || isLevelFour || isLevelFive || isLevelSix || isLevelSeven || isLevelEight || isLevelNine || isLevelTen || isLevelEleven ? 82 : 70, 18);
        ctx.fillStyle = "rgba(255,255,255,.92)";
        ctx.fill();
        ctx.fillStyle = "#26334d";
        ctx.textAlign = "center";
        if (isLevelOne) {
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.fillStyle = shotsRef.current === 0 ? "#26334d" : "#28794f";
          ctx.fillText(
            shotsRef.current === 0 ? "① 右へ長くドラッグ" : "① 反動で左へ進めた！",
            180,
            158,
          );
          ctx.fillStyle = shotsRef.current === 0 ? "#59657c" : "#26334d";
          ctx.fillText("② もう一度右へ → クッション", 180, 187);
        } else if (isLevelTwo) {
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.fillStyle = movedBoxAside ? "#28794f" : "#26334d";
          ctx.fillText(
            movedBoxAside ? "① 箱をどかせた！" : "① 左へ長くドラッグ → 箱を押す",
            180,
            158,
          );
          ctx.fillStyle = movedBoxAside ? "#26334d" : "#59657c";
          ctx.fillText("② 右下へ長くドラッグ → ゴール", 180, 187);
        } else if (isLevelThree) {
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.fillStyle = "#2685a7";
          ctx.fillText("氷の上は止まりにくい！", 180, 158);
          ctx.fillStyle = "#26334d";
          ctx.fillText("右へ長くドラッグ → 左へ滑る", 180, 187);
        } else if (isLevelFour) {
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.fillStyle = "#c33c4a";
          ctx.fillText("バネに乗ると自動でジャンプ！", 180, 158);
          ctx.fillStyle = "#26334d";
          ctx.fillText("左へ長くドラッグ → 右へ反動", 180, 187);
        } else if (isLevelFive) {
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.fillStyle = world.balloonCleared ? "#28794f" : "#b83d78";
          ctx.fillText(
            world.balloonCleared ? "① 風船をどかせた！" : "① 左へ短くドラッグ → 風船",
            180,
            158,
          );
          ctx.fillStyle = world.balloonCleared ? "#26334d" : "#59657c";
          ctx.fillText("② 右下へ長く → クッション", 180, 187);
        } else if (isLevelSix) {
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.fillStyle = switchIsOn ? "#28794f" : "#9e3437";
          ctx.fillText(
            switchIsOn ? "① スイッチON！" : "① 左へ長く → 箱をスイッチへ",
            180,
            158,
          );
          ctx.fillStyle = switchIsOn ? "#26334d" : "#59657c";
          ctx.fillText("② 右下へ長く → クッション", 180, 187);
        } else if (isLevelSeven) {
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.fillStyle = world.gateOpen.every(Boolean) ? "#28794f" : "#873328";
          ctx.fillText(
            world.gateOpen.every(Boolean) ? "① ゲートOPEN！" : "① 箱をスイッチへ → ゲートOPEN",
            180,
            158,
          );
          ctx.fillStyle = world.gateOpen.every(Boolean) ? "#26334d" : "#59657c";
          ctx.fillText("② 右下へ長く → 通り抜ける", 180, 187);
        } else if (isLevelEight) {
          const seesawReady = isSeesawReady(world);
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.fillStyle = seesawReady ? "#28794f" : "#82502a";
          ctx.fillText(
            seesawReady ? "① 右側が上がった！" : "① 左へ長く → 箱を左側へ",
            180,
            158,
          );
          ctx.fillStyle = seesawReady ? "#26334d" : "#59657c";
          ctx.fillText("② 右下へ短く → 高いクッション", 180, 187);
        } else if (isLevelNine) {
          const wallIsBroken = world.wallBroken.every(Boolean);
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.fillStyle = wallIsBroken ? "#28794f" : "#743d31";
          ctx.fillText(
            wallIsBroken ? "① 壁を壊せた！" : "① 右へ長く → 箱で壁を壊す",
            180,
            158,
          );
          ctx.fillStyle = wallIsBroken ? "#26334d" : "#59657c";
          ctx.fillText("② 左下へ長く → 通り抜ける", 180, 187);
        } else if (isLevelTen) {
          const platform = world.movingPlatforms[0];
          const position = world.platformPositions[0];
          const atLaunchPoint = position.x >= platform.x + platform.distance - 12;
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.fillStyle = atLaunchPoint ? "#28794f" : "#246e89";
          ctx.fillText(
            atLaunchPoint ? "いま！ 左下へ短く" : "足場が右端まで来たら…",
            180,
            158,
          );
          ctx.fillStyle = "#26334d";
          ctx.fillText("反動で右上のクッションへ", 180, 187);
        } else if (isLevelEleven) {
          const holdingRope = world.ropeAttached !== null;
          ctx.font = "800 15px system-ui, sans-serif";
          ctx.fillStyle = holdingRope ? "#28794f" : "#82502a";
          ctx.fillText(
            holdingRope ? "ロープをつかんだ！" : "① 左下へ長く → ロープへ",
            180,
            158,
          );
          ctx.fillStyle = "#26334d";
          ctx.fillText(
            holdingRope ? "② ネコをタップしてはなす" : "近づくと自動でつかまる！",
            180,
            187,
          );
        } else {
          ctx.font = "800 17px system-ui, sans-serif";
          ctx.fillText("ネコを押したまま", 180, 157);
          ctx.font = "700 15px system-ui, sans-serif";
          ctx.fillStyle = "#59657c";
          ctx.fillText(
            "左下へ長くドラッグ → 離す",
            180,
            182,
          );
        }
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
    if (statusRef.current !== "playing") return;
    const point = pointerPosition(event);
    const cat = physicsRef.current.cat;
    if (Math.hypot(point.x - cat.x, point.y - cat.y) > 48) return;
    if (levelRef.current === 11 && physicsRef.current.ropeAttached !== null) {
      handleReleaseRope();
      return;
    }
    if (performance.now() < cooldownUntilRef.current) return;
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
    applySneeze(physicsRef.current, dirX, dirY, power);

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
                ? "ネコを押して右へ長くドラッグし、離すとくしゃみます。ネコは反動で左へ動きます。2回ほど繰り返してクッションで止まりましょう。"
                : level === 2
                  ? "最初はネコを左へ長くドラッグし、風で箱を左へ押しながら反動で右へ移動します。次に右下へ長くドラッグし、箱が空けたクッションへ戻ります。"
                  : level === 3
                    ? "氷の上ではネコが長く滑ります。ネコを右へ長くドラッグし、反動で左へ滑って氷の先のクッションで止まりましょう。"
                    : level === 4
                      ? "ネコを左へ長くドラッグし、反動で右のバネへ乗せます。バネで跳ね上がり、高い足場のクッションへ着地しましょう。"
                      : level === 5
                        ? "最初は左へ短くドラッグし、軽い風船だけを大きく動かします。次に右下へ長くドラッグし、空いたクッションへ戻りましょう。"
                        : level === 6
                          ? "最初は左へ長くドラッグし、箱を赤いスイッチまで運んでONにします。次に右下へ長くドラッグし、使えるようになったクッションへ戻りましょう。"
                          : level === 7
                            ? "箱を赤いスイッチへ運ぶとゲートが開きます。箱を載せたまま、右下へ長くドラッグして開いた通路を抜け、クッションへ戻りましょう。"
                            : level === 8
                              ? "箱をシーソーの左側へ動かすと、反対側が高く上がります。右下へ短くドラッグし、高くなった右側のクッションへ着地しましょう。"
                              : level === 9
                                ? "右へ長くドラッグし、箱を十分に加速して壁へぶつけます。壁が壊れたら左下へ長くドラッグし、反動で開いた通路を抜けましょう。"
                                : level === 10
                                  ? "ネコは水色の足場に乗ったまま運ばれます。足場が右端へ近づいた瞬間に左下へ短くドラッグし、反動で右上のクッションへ着地しましょう。"
                                  : "左下へ長くドラッグしてロープへ飛び、近づくと自動でつかまります。右へ揺れたらネコをタップしてロープを離すか、画面下のボタンで離して高いクッションへ着地しましょう。"
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
          {level === 11 && status === "playing" && ropeAttached ? (
            <button
              className="rope-release-button"
              type="button"
              onClick={handleReleaseRope}
              aria-label="ロープをはなして、そのままの勢いで飛ぶ。ネコのタップでも離せます"
            >
              ロープをはなす
              <span aria-hidden="true">→</span>
            </button>
          ) : null}
          <div className="status-live" aria-live="polite">
            {status === "won"
              ? "クリア。おひるね成功！"
              : status === "failed"
                ? "失敗。もう一度挑戦できます。"
                : ropeAttached
                  ? "ロープをつかみました。ネコをタップするか、画面下のボタンでロープをはなして飛べます。"
                  : ""}
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
                  {level === 1
                    ? "つぎは箱をどかそう"
                    : level === 2
                      ? "つぎは氷で滑ろう"
                      : level === 3
                        ? "つぎはバネでジャンプ"
                        : level === 4
                          ? "つぎは風船を飛ばそう"
                          : level === 5
                            ? "つぎはスイッチON"
                            : level === 6
                              ? "つぎはゲートを開けよう"
                              : level === 7
                                ? "つぎはシーソーで登ろう"
                                : level === 8
                                  ? "つぎは壁を壊そう"
                                  : level === 9
                                    ? "つぎは動く足場へ"
                                    : level === 10
                                      ? "つぎはロープにつかまろう"
                                      : "全レベル クリア！"}
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
