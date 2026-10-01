import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Space } from "lucide-react";

import tokenAsset from "@/assets/bfg-token.png.asset.json";
import jumpAsset from "@/assets/jump.png.asset.json";
import run1Asset from "@/assets/run1.png.asset.json";
import run2Asset from "@/assets/run2.png.asset.json";
import run3Asset from "@/assets/run3.png.asset.json";
import run4Asset from "@/assets/run4.png.asset.json";
import { Button } from "@/components/ui/button";

const VIEW_W = 1280;
const VIEW_H = 720;
const WORLD_W = 7800;
const PLAYER_W = 62;
const PLAYER_H = 88;
const GRAVITY = 2350;
const MOVE_SPEED = 390;
const JUMP_SPEED = 870;
const RUN_ORDER = [0, 1, 2, 3, 2, 1];

type Status = "loading" | "ready" | "playing" | "complete" | "gameover";
type Rect = { x: number; y: number; w: number; h: number; style?: "felt" | "chip" | "gold" };
type Token = { x: number; y: number; collected: boolean };
type Enemy = { x: number; y: number; minX: number; maxX: number; dir: number; speed: number; alive: boolean; angle: number };
type InputState = { left: boolean; right: boolean; jump: boolean; jumpPressed: boolean };
type Player = {
  x: number; y: number; vx: number; vy: number; grounded: boolean; facing: 1 | -1;
  coyote: number; jumpBuffer: number; invulnerable: number; checkpoint: number; lives: number;
};
type Hud = { score: number; coins: number; lives: number };

const platforms: Rect[] = [
  { x: 0, y: 610, w: 690, h: 110, style: "felt" },
  { x: 770, y: 565, w: 260, h: 155, style: "chip" },
  { x: 1110, y: 500, w: 180, h: 24, style: "gold" },
  { x: 1370, y: 590, w: 420, h: 130, style: "felt" },
  { x: 1510, y: 440, w: 180, h: 22, style: "chip" },
  { x: 1870, y: 540, w: 190, h: 180, style: "gold" },
  { x: 2140, y: 470, w: 190, h: 26, style: "chip" },
  { x: 2410, y: 610, w: 580, h: 110, style: "felt" },
  { x: 2540, y: 455, w: 150, h: 22, style: "gold" },
  { x: 2780, y: 365, w: 170, h: 22, style: "chip" },
  { x: 3070, y: 555, w: 300, h: 165, style: "chip" },
  { x: 3435, y: 485, w: 150, h: 24, style: "gold" },
  { x: 3650, y: 410, w: 150, h: 24, style: "chip" },
  { x: 3880, y: 580, w: 460, h: 140, style: "felt" },
  { x: 4020, y: 420, w: 170, h: 22, style: "gold" },
  { x: 4415, y: 525, w: 210, h: 195, style: "chip" },
  { x: 4690, y: 445, w: 190, h: 24, style: "gold" },
  { x: 4960, y: 600, w: 470, h: 120, style: "felt" },
  { x: 5160, y: 430, w: 160, h: 22, style: "chip" },
  { x: 5510, y: 540, w: 180, h: 180, style: "gold" },
  { x: 5760, y: 460, w: 180, h: 24, style: "chip" },
  { x: 6020, y: 580, w: 340, h: 140, style: "felt" },
  { x: 6425, y: 500, w: 175, h: 220, style: "chip" },
  { x: 6680, y: 410, w: 185, h: 24, style: "gold" },
  { x: 6945, y: 550, w: 250, h: 170, style: "chip" },
  { x: 7280, y: 610, w: 520, h: 110, style: "felt" },
];

const tokenPositions = [
  [330, 515], [620, 510], [890, 460], [1195, 405], [1510, 500], [1600, 345], [1960, 440],
  [2235, 375], [2510, 505], [2615, 355], [2865, 270], [3200, 455], [3510, 390], [3725, 315],
  [3990, 485], [4110, 325], [4515, 425], [4785, 350], [5050, 500], [5240, 335], [5595, 440],
  [5850, 365], [6185, 480], [6510, 400], [6770, 315], [7070, 450], [7410, 510], [7560, 510],
] as const;

const enemyTemplates = [
  { x: 470, y: 560, minX: 380, maxX: 620, speed: 125 },
  { x: 1460, y: 540, minX: 1410, maxX: 1740, speed: 145 },
  { x: 2670, y: 560, minX: 2460, maxX: 2920, speed: 150 },
  { x: 3180, y: 505, minX: 3100, maxX: 3310, speed: 140 },
  { x: 4050, y: 530, minX: 3920, maxX: 4280, speed: 165 },
  { x: 5110, y: 550, minX: 5000, maxX: 5370, speed: 170 },
  { x: 6140, y: 530, minX: 6050, maxX: 6300, speed: 175 },
  { x: 7040, y: 500, minX: 6980, maxX: 7145, speed: 150 },
] as const;

const suitGlyphs = ["♠", "♦", "♣", "♥"];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.closePath();
}

function intersects(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function makeTokens(): Token[] {
  return tokenPositions.map(([x, y]) => ({ x, y, collected: false }));
}

function makeEnemies(): Enemy[] {
  return enemyTemplates.map((enemy, i) => ({ ...enemy, dir: i % 2 ? -1 : 1, alive: true, angle: 0 }));
}

function drawBackdrop(ctx: CanvasRenderingContext2D, camera: number, time: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  gradient.addColorStop(0, "#070711"); gradient.addColorStop(0.58, "#111025"); gradient.addColorStop(1, "#190b20");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.save(); ctx.translate(-(camera * 0.08) % 320, 0);
  for (let x = -320; x < VIEW_W + 640; x += 320) {
    ctx.fillStyle = "rgba(255,255,255,.028)"; ctx.fillRect(x + 15, 115, 2, 410);
    ctx.fillRect(x + 160, 70, 1, 500);
  }
  ctx.restore();

  ctx.save(); ctx.globalAlpha = 0.2;
  for (let i = 0; i < 26; i += 1) {
    const x = ((i * 173 - camera * 0.16) % (VIEW_W + 160)) - 80;
    const y = 80 + ((i * 97) % 410) + Math.sin(time * 0.001 + i) * 5;
    ctx.fillStyle = i % 3 === 0 ? "#ff266f" : i % 3 === 1 ? "#34f5c5" : "#f7c95c";
    ctx.beginPath(); ctx.arc(x, y, i % 4 === 0 ? 2.4 : 1.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  ctx.save(); ctx.translate(-camera * 0.22, 0);
  for (let x = -100; x < WORLD_W; x += 420) {
    const h = 140 + ((x / 20) % 140);
    ctx.fillStyle = "#0d0b1c"; ctx.fillRect(x, 560 - h, 280, h + 160);
    ctx.strokeStyle = "rgba(52,245,197,.1)"; ctx.lineWidth = 2; ctx.strokeRect(x, 560 - h, 280, h + 160);
    for (let wy = 450 - h; wy < 520; wy += 38) {
      for (let wx = x + 26; wx < x + 260; wx += 54) {
        ctx.fillStyle = ((wx + wy) / 20) % 3 < 1 ? "rgba(255,38,111,.1)" : "rgba(247,201,92,.08)";
        ctx.fillRect(wx, wy, 16, 8);
      }
    }
  }
  ctx.restore();

  const floorGlow = ctx.createLinearGradient(0, 570, 0, 720);
  floorGlow.addColorStop(0, "rgba(255,38,111,.09)"); floorGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = floorGlow; ctx.fillRect(0, 570, VIEW_W, 150);
}

function drawPlatform(ctx: CanvasRenderingContext2D, p: Rect, camera: number) {
  const x = p.x - camera;
  if (x + p.w < -20 || x > VIEW_W + 20) return;
  const colors = p.style === "gold"
    ? ["#f6c85b", "#815313", "rgba(247,201,92,.65)"]
    : p.style === "chip"
      ? ["#ff276f", "#4e102f", "rgba(255,38,111,.6)"]
      : ["#32e4b8", "#073e3a", "rgba(52,245,197,.55)"];
  ctx.save(); ctx.shadowColor = colors[2]; ctx.shadowBlur = 18;
  const g = ctx.createLinearGradient(0, p.y, 0, p.y + Math.min(p.h, 100));
  g.addColorStop(0, colors[0]); g.addColorStop(0.09, colors[0]); g.addColorStop(0.11, colors[1]); g.addColorStop(1, "#090b16");
  ctx.fillStyle = g; roundRect(ctx, x, p.y, p.w, p.h, 8); ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = colors[2]; ctx.lineWidth = 2; roundRect(ctx, x, p.y, p.w, p.h, 8); ctx.stroke();
  ctx.globalAlpha = 0.28;
  for (let px = x + 24; px < x + p.w - 10; px += 54) {
    ctx.fillStyle = colors[0]; ctx.beginPath(); ctx.arc(px, p.y + 33, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawDice(ctx: CanvasRenderingContext2D, enemy: Enemy, camera: number) {
  const x = enemy.x - camera;
  ctx.save(); ctx.translate(x + 25, enemy.y + 25); ctx.rotate(enemy.angle);
  ctx.shadowColor = "#ff266f"; ctx.shadowBlur = 15; ctx.fillStyle = "#f5f2ff";
  roundRect(ctx, -25, -25, 50, 50, 10); ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = "#ff266f"; ctx.lineWidth = 3; roundRect(ctx, -25, -25, 50, 50, 10); ctx.stroke();
  ctx.fillStyle = "#171226";
  [[-11,-11],[11,-11],[0,0],[-11,11],[11,11]].forEach(([dx,dy]) => { ctx.beginPath(); ctx.arc(dx,dy,4.2,0,Math.PI*2); ctx.fill(); });
  ctx.restore();
}

function drawFinish(ctx: CanvasRenderingContext2D, camera: number, time: number) {
  const x = 7520 - camera;
  if (x < -140 || x > VIEW_W + 140) return;
  ctx.save(); ctx.shadowColor = "#f7c95c"; ctx.shadowBlur = 30; ctx.strokeStyle = "#f7c95c"; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(x - 66, 610); ctx.lineTo(x - 66, 320); ctx.quadraticCurveTo(x, 245, x + 66, 320); ctx.lineTo(x + 66, 610); ctx.stroke();
  ctx.shadowColor = "#34f5c5"; ctx.fillStyle = "rgba(52,245,197,.15)"; ctx.fillRect(x - 55, 335, 110, 275);
  ctx.font = "700 25px 'Arial Narrow', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#ffffff"; ctx.fillText("VAULT", x, 302);
  ctx.fillStyle = Math.sin(time * .006) > 0 ? "#ff266f" : "#f7c95c"; ctx.beginPath(); ctx.arc(x, 365, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawHazards(ctx: CanvasRenderingContext2D, camera: number) {
  const hazards = [[690,770],[1790,1870],[2330,2410],[2990,3070],[3370,3435],[3800,3880],[4340,4415],[4880,4960],[5430,5510],[5940,6020],[6360,6425],[6865,6945],[7195,7280]];
  ctx.save(); ctx.translate(-camera, 0);
  hazards.forEach(([start,end]) => {
    ctx.fillStyle = "rgba(255,38,111,.28)"; ctx.fillRect(start, 683, end-start, 37);
    for (let x = start; x < end; x += 22) {
      ctx.fillStyle = "#ff276f"; ctx.beginPath(); ctx.moveTo(x, 700); ctx.lineTo(x+11, 674); ctx.lineTo(x+22, 700); ctx.fill();
    }
  });
  ctx.restore();
}

export function NeonRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<InputState>({ left: false, right: false, jump: false, jumpPressed: false });
  const gameStartRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [hud, setHud] = useState<Hud>({ score: 0, coins: 0, lives: 3 });

  const setControl = useCallback((key: "left" | "right" | "jump", active: boolean) => {
    const input = inputRef.current;
    if (key === "jump" && active && !input.jump) input.jumpPressed = true;
    input[key] = active;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageUrls = [run1Asset.url, run2Asset.url, run3Asset.url, run4Asset.url, jumpAsset.url, tokenAsset.url];
    const images = imageUrls.map((url) => { const img = new Image(); img.src = url; return img; });
    let loaded = 0;
    images.forEach((img) => { img.onload = () => { loaded += 1; if (loaded === images.length) setStatus("ready"); }; });

    let tokens = makeTokens();
    let enemies = makeEnemies();
    let player: Player = { x: 120, y: 500, vx: 0, vy: 0, grounded: false, facing: 1, coyote: 0, jumpBuffer: 0, invulnerable: 0, checkpoint: 120, lives: 3 };
    let score = 0;
    let coins = 0;
    let camera = 0;
    let gameStatus: Status = "loading";
    let lastTime = performance.now();
    let accumulator = 0;
    let lastHudTime = 0;
    let raf = 0;

    const resetRun = () => {
      tokens = makeTokens(); enemies = makeEnemies(); score = 0; coins = 0; camera = 0;
      player = { x: 120, y: 500, vx: 0, vy: 0, grounded: false, facing: 1, coyote: 0, jumpBuffer: 0, invulnerable: 0, checkpoint: 120, lives: 3 };
      gameStatus = "playing"; setHud({ score, coins, lives: 3 }); setStatus("playing");
    };
    gameStartRef.current = resetRun;

    const loseLife = () => {
      if (player.invulnerable > 0 || gameStatus !== "playing") return;
      player.lives -= 1;
      if (player.lives <= 0) { gameStatus = "gameover"; setStatus("gameover"); setHud({ score, coins, lives: 0 }); return; }
      player.x = player.checkpoint; player.y = 420; player.vx = 0; player.vy = -260; player.invulnerable = 1.8;
      setHud({ score, coins, lives: player.lives });
    };

    const step = (dt: number) => {
      if (gameStatus !== "playing") return;
      const input = inputRef.current;
      if (input.jumpPressed) { player.jumpBuffer = 0.13; input.jumpPressed = false; }
      player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
      player.coyote = player.grounded ? 0.11 : Math.max(0, player.coyote - dt);
      player.invulnerable = Math.max(0, player.invulnerable - dt);

      const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const target = axis * MOVE_SPEED;
      const accel = player.grounded ? 2500 : 1500;
      player.vx += Math.max(-accel * dt, Math.min(accel * dt, target - player.vx));
      if (axis === 0 && player.grounded) player.vx *= Math.pow(0.0008, dt);
      if (axis !== 0) player.facing = axis > 0 ? 1 : -1;
      if (player.jumpBuffer > 0 && player.coyote > 0) {
        player.vy = -JUMP_SPEED; player.grounded = false; player.coyote = 0; player.jumpBuffer = 0;
      }
      if (!input.jump && player.vy < -280) player.vy += 1850 * dt;
      player.vy = Math.min(1150, player.vy + GRAVITY * dt);

      player.x += player.vx * dt;
      player.x = Math.max(0, Math.min(WORLD_W - PLAYER_W, player.x));
      const oldBottom = player.y + PLAYER_H;
      player.y += player.vy * dt;
      player.grounded = false;
      if (player.vy >= 0) {
        for (const p of platforms) {
          const newBottom = player.y + PLAYER_H;
          if (player.x + PLAYER_W * .72 > p.x && player.x + PLAYER_W * .28 < p.x + p.w && oldBottom <= p.y + 7 && newBottom >= p.y) {
            player.y = p.y - PLAYER_H; player.vy = 0; player.grounded = true; break;
          }
        }
      }

      if (player.y > VIEW_H + 120) loseLife();
      if (player.x > 1400) player.checkpoint = Math.floor((player.x - 140) / 1200) * 1200 + 140;

      for (const token of tokens) {
        if (!token.collected && intersects(player.x + 12, player.y + 10, 42, 72, token.x - 23, token.y - 23, 46, 46)) {
          token.collected = true; coins += 1; score += 150;
        }
      }

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        enemy.x += enemy.dir * enemy.speed * dt; enemy.angle += enemy.dir * enemy.speed * dt / 24;
        if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) { enemy.dir *= -1; enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX, enemy.x)); }
        if (Math.abs(player.x - enemy.x) < 280 && player.grounded) enemy.dir = player.x < enemy.x ? -1 : 1;
        if (intersects(player.x + 10, player.y + 8, 44, 78, enemy.x, enemy.y, 50, 50)) {
          if (player.vy > 150 && player.y + PLAYER_H < enemy.y + 30) {
            enemy.alive = false; player.vy = -590; score += 300;
          } else loseLife();
        }
      }

      if (player.x > 7475) { gameStatus = "complete"; score += 1000 + player.lives * 250; setHud({ score, coins, lives: player.lives }); setStatus("complete"); }
      camera += ((Math.max(0, Math.min(WORLD_W - VIEW_W, player.x - VIEW_W * .35))) - camera) * Math.min(1, dt * 5.5);
      if (performance.now() - lastHudTime > 80) { lastHudTime = performance.now(); setHud({ score, coins, lives: player.lives }); }
    };

    const draw = (time: number) => {
      drawBackdrop(ctx, camera, time);
      drawHazards(ctx, camera);
      platforms.forEach((platform) => drawPlatform(ctx, platform, camera));

      ctx.save(); ctx.translate(-camera, 0);
      for (let i = 0; i < 12; i += 1) {
        const x = 420 + i * 610; const y = 145 + (i % 3) * 42;
        ctx.font = "700 45px Georgia"; ctx.fillStyle = i % 2 ? "rgba(255,38,111,.08)" : "rgba(52,245,197,.07)";
        ctx.fillText(suitGlyphs[i % 4] ?? "♠", x, y);
      }
      ctx.restore();

      for (const token of tokens) {
        if (token.collected || token.x - camera < -60 || token.x - camera > VIEW_W + 60) continue;
        const bob = Math.sin(time * .004 + token.x) * 6;
        ctx.save(); ctx.shadowColor = "#ff266f"; ctx.shadowBlur = 18;
        ctx.drawImage(images[5], token.x - camera - 23, token.y - 23 + bob, 46, 46); ctx.restore();
      }
      enemies.forEach((enemy) => { if (enemy.alive) drawDice(ctx, enemy, camera); });
      drawFinish(ctx, camera, time);

      if (gameStatus !== "loading") {
        const moving = Math.abs(player.vx) > 25;
        const runIndex = RUN_ORDER[Math.floor(time / 100) % RUN_ORDER.length] ?? 0;
        const sprite = !player.grounded ? images[4] : moving ? images[runIndex] : images[1];
        const drawW = !player.grounded ? 111 : 106;
        const drawH = !player.grounded ? 115 : 105;
        const footY = player.y + PLAYER_H + 5;
        const drawX = player.x - camera + PLAYER_W / 2;
        ctx.save(); ctx.translate(drawX, footY); if (player.facing === -1) ctx.scale(-1, 1);
        if (player.invulnerable > 0 && Math.floor(time / 90) % 2 === 0) ctx.globalAlpha = .32;
        ctx.shadowColor = "rgba(255,38,111,.45)"; ctx.shadowBlur = 13;
        ctx.drawImage(sprite, -drawW / 2, -drawH, drawW, drawH); ctx.restore();
      }

      ctx.save();
      const vignette = ctx.createRadialGradient(VIEW_W/2, VIEW_H/2, 260, VIEW_W/2, VIEW_H/2, 760);
      vignette.addColorStop(0, "rgba(0,0,0,0)"); vignette.addColorStop(1, "rgba(0,0,0,.45)");
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.restore();
    };

    const loop = (time: number) => {
      const frame = Math.min(.05, (time - lastTime) / 1000); lastTime = time; accumulator += frame;
      while (accumulator >= 1/120) { step(1/120); accumulator -= 1/120; }
      draw(time); raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onKey = (event: KeyboardEvent, active: boolean) => {
      if (["ArrowLeft","ArrowRight","ArrowUp","Space","KeyA","KeyD","KeyW"].includes(event.code)) event.preventDefault();
      if (event.code === "ArrowLeft" || event.code === "KeyA") setControl("left", active);
      if (event.code === "ArrowRight" || event.code === "KeyD") setControl("right", active);
      if (["ArrowUp","KeyW","Space"].includes(event.code)) setControl("jump", active);
      if (active && event.code === "Enter" && (gameStatus === "ready" || gameStatus === "gameover" || gameStatus === "complete")) resetRun();
    };
    const down = (event: KeyboardEvent) => onKey(event, true);
    const up = (event: KeyboardEvent) => onKey(event, false);
    const blur = () => { inputRef.current = { left: false, right: false, jump: false, jumpPressed: false }; };
    window.addEventListener("keydown", down, { passive: false }); window.addEventListener("keyup", up, { passive: false }); window.addEventListener("blur", blur);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); gameStartRef.current = null; };
  }, [setControl]);

  const begin = () => gameStartRef.current?.();
  const bindTouch = (key: "left" | "right" | "jump") => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setControl(key, true); },
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => { event.preventDefault(); setControl(key, false); },
    onPointerCancel: () => setControl(key, false),
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
  });

  return (
    <main className="game-shell">
      <div className="game-topbar">
        <div className="brand-lockup"><span className="brand-mark">BFG</span><span className="brand-sub">NEON RUN</span></div>
        <div className="hud" aria-live="polite">
          <div><span>SCORE</span><strong>{hud.score.toString().padStart(6, "0")}</strong></div>
          <div><span>COINS</span><strong>{hud.coins.toString().padStart(2, "0")}</strong></div>
          <div><span>LIVES</span><strong>{"♥".repeat(hud.lives)}<i>{"♡".repeat(Math.max(0, 3 - hud.lives))}</i></strong></div>
        </div>
      </div>

      <section className="game-frame" aria-label="BFG Neon Run platform game">
        <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} />
        {status !== "playing" && (
          <div className="game-overlay">
            <div className="overlay-kicker">{status === "complete" ? "JACKPOT" : status === "gameover" ? "OUT OF LUCK" : "THE HOUSE IS OPEN"}</div>
            <h1>{status === "complete" ? "LEVEL COMPLETE" : status === "gameover" ? "GAME OVER" : "BFG NEON RUN"}</h1>
            {status === "ready" && <p>Collect every token. Stomp the rolling dice. Reach the vault.</p>}
            {status === "complete" && <p>{hud.coins} tokens secured · Final score {hud.score.toLocaleString()}</p>}
            {status === "gameover" && <p>The dice won this round. Your score: {hud.score.toLocaleString()}</p>}
            <Button className="start-button" size="lg" onClick={begin} disabled={status === "loading"}>
              {status === "loading" ? "LOADING TABLE…" : status === "ready" ? "START RUN" : <><RotateCcw /> PLAY AGAIN</>}
            </Button>
            {status === "ready" && <div className="key-hints"><span>← → / A D</span><b>MOVE</b><span>SPACE / W / ↑</span><b>JUMP</b></div>}
          </div>
        )}
      </section>

      <div className="touch-controls" aria-label="Touch controls">
        <div className="touch-left">
          <Button variant="outline" size="icon" aria-label="Move left" {...bindTouch("left")}><ChevronLeft /></Button>
          <Button variant="outline" size="icon" aria-label="Move right" {...bindTouch("right")}><ChevronRight /></Button>
        </div>
        <Button className="jump-control" size="icon" aria-label="Jump" {...bindTouch("jump")}><Space /></Button>
      </div>
    </main>
  );
}
