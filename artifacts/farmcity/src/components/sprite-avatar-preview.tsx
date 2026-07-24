import { useEffect, useRef } from 'react';

/**
 * Renders Character0_Idle (front-facing, animated) with per-zone colour tinting,
 * then overlays the selected hair-style sprite (short/spiky/long) on top,
 * coloured with the chosen hair colour.
 *
 * Technique:
 *  1. Draw sprite on white background → apply multiply tints per zone → mask with 'destination-in'.
 *  2. Draw hair overlay image (1024×1024) scaled so its foot aligns with the character foot,
 *     fill all opaque pixels with hair colour using 'source-in', clip to head+hair region,
 *     composite on top with 'source-over'.
 */

const SPRITE_FW   = 460;
const SPRITE_FH   = 460;
const IDLE_FRAMES = 8;
const IDLE_FPS    = 6;
const SPRITE_FOOT_Y = 430; // foot anchor in raw frame

// Fraction of the 1024×1024 hair image where character foot / centre-x sit
const HAIR_FOOT_FRAC = 0.69;
const HAIR_CX_FRAC   = 0.478;

// Module-level image caches
let cachedIdle: HTMLImageElement | null = null;
function getIdleImg(): HTMLImageElement {
  if (!cachedIdle) {
    cachedIdle     = new Image();
    cachedIdle.src = `${import.meta.env.BASE_URL}sprites/Character0_Idle.png`;
  }
  return cachedIdle;
}

const hairPreviewCache = new Map<string, HTMLImageElement>();
function getHairPreviewImg(style: string): HTMLImageElement {
  const key = `${style}_r0`;
  if (!hairPreviewCache.has(key)) {
    const img = new Image();
    img.src = `${import.meta.env.BASE_URL}hair/${key}.png`;
    hairPreviewCache.set(key, img);
  }
  return hairPreviewCache.get(key)!;
}

// Off-screen canvas for hair overlay coloring
let _hairPvCanvas: HTMLCanvasElement | null = null;
let _hairPvCtx:    CanvasRenderingContext2D | null = null;
function getHairPvCtx(minW: number, minH: number): CanvasRenderingContext2D {
  if (!_hairPvCanvas) {
    _hairPvCanvas = document.createElement('canvas');
    _hairPvCtx    = _hairPvCanvas.getContext('2d')!;
    _hairPvCtx.imageSmoothingEnabled = false;
  }
  if (_hairPvCanvas.width  < minW) _hairPvCanvas.width  = minW;
  if (_hairPvCanvas.height < minH) _hairPvCanvas.height = minH;
  return _hairPvCtx!;
}

export interface SpriteAvatarPreviewProps {
  skinColor:  string;
  hairColor:  string;
  hairStyle?: string;
  shirtColor: string;
  pantsColor: string;
  /** Canvas / display size in px (square). Default 180. */
  size?: number;
}

export function SpriteAvatarPreview({
  skinColor,
  hairColor,
  hairStyle,
  shirtColor,
  pantsColor,
  size = 180,
}: SpriteAvatarPreviewProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  // Keep colours up-to-date in the rAF loop without restarting the loop
  const colorsRef  = useRef({ skinColor, hairColor, hairStyle, shirtColor, pantsColor });
  colorsRef.current = { skinColor, hairColor, hairStyle, shirtColor, pantsColor };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const img = getIdleImg();
    const s   = size;

    // Reusable temp canvas (white bg so multiply works)
    const tmp    = document.createElement('canvas');
    tmp.width    = s;
    tmp.height   = s;
    const tCtx   = tmp.getContext('2d')!;
    tCtx.imageSmoothingEnabled = false;

    let frame         = 0;
    let lastFrameTime = 0;
    let animId: number;

    // Foot position in preview canvas (px from top)
    const footY = SPRITE_FOOT_Y * (s / SPRITE_FH); // ≈ 168 for s=180

    function loop(now: number) {
      if (!ctx) return; // type-guard for closure (ctx is non-null; checked above)
      // Advance animation frame at IDLE_FPS
      if (now - lastFrameTime >= 1000 / IDLE_FPS) {
        frame         = (frame + 1) % IDLE_FRAMES;
        lastFrameTime = now;
      }

      // Wait for base sprite to load
      if (!img.complete || img.naturalWidth === 0) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const { skinColor, hairColor, hairStyle, shirtColor, pantsColor } = colorsRef.current;
      const srcX = frame * SPRITE_FW;

      // ── Step 1: render to temp canvas (white background + sprite) ────────
      tCtx.clearRect(0, 0, s, s);
      tCtx.fillStyle = '#ffffff';
      tCtx.fillRect(0, 0, s, s);
      // Row 0 = S / front-facing
      tCtx.drawImage(img, srcX, 0, SPRITE_FW, SPRITE_FH, 0, 0, s, s);

      // ── Step 2: tint body zones with multiply ────────────────────────────
      tCtx.globalCompositeOperation = 'multiply';

      // Hair — crown + sideburns (base rectangle tint, always applied)
      tCtx.fillStyle = hairColor;
      tCtx.fillRect(s * 0.23, s * 0.15, s * 0.54, s * 0.15); // crown
      tCtx.fillRect(s * 0.17, s * 0.17, s * 0.13, s * 0.11); // left sideburn
      tCtx.fillRect(s * 0.70, s * 0.17, s * 0.13, s * 0.11); // right sideburn

      // Skin — face + hands
      tCtx.fillStyle = skinColor;
      tCtx.fillRect(s * 0.26, s * 0.22, s * 0.48, s * 0.30); // face / neck
      tCtx.fillRect(s * 0.07, s * 0.62, s * 0.14, s * 0.08); // left hand
      tCtx.fillRect(s * 0.79, s * 0.62, s * 0.14, s * 0.08); // right hand

      // Shirt — torso + sleeves
      tCtx.fillStyle = shirtColor;
      tCtx.fillRect(s * 0.22, s * 0.51, s * 0.56, s * 0.22); // torso
      tCtx.fillRect(s * 0.05, s * 0.51, s * 0.19, s * 0.14); // left sleeve
      tCtx.fillRect(s * 0.76, s * 0.51, s * 0.19, s * 0.14); // right sleeve

      // Pants — legs
      tCtx.fillStyle = pantsColor;
      tCtx.fillRect(s * 0.25, s * 0.72, s * 0.50, s * 0.21); // legs

      tCtx.globalCompositeOperation = 'source-over';

      // ── Step 3: copy to main canvas + mask out white background ──────────
      ctx.clearRect(0, 0, s, s);
      ctx.drawImage(tmp, 0, 0);

      // destination-in keeps only pixels that overlap with the sprite's alpha
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(img, srcX, 0, SPRITE_FW, SPRITE_FH, 0, 0, s, s);
      ctx.globalCompositeOperation = 'source-over';

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [size]); // colours read from colorsRef — no loop restart needed on colour change

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  );
}
