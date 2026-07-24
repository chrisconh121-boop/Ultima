---
name: FarmCity sprite system
description: How the isometric character sprite sheets are integrated — frame layout, direction mapping, animation state machine, and anchor point math.
---

## Sprite sheets (Character0_*.png)
- Stored in `artifacts/farmcity/public/sprites/`
- Frame size: **460×460 px** per cell
- Grid: **5 rows × variable columns** — rows = directions, cols = animation frames
- Row order (confirmed from actual sheet): 0=S(front), 1=SW, 2=W(left profile), 3=NW, 4=N(back)
- Rows 1–3 are the LEFT-FACING variants; flip horizontally to get SE/E/NE
- **IMPORTANT**: rows 1-3 are SW/W/NW (left side), NOT SE/E/NE — flip gives the right-side variants

## Animation inventory
| Key       | Sheet file        | Frames | FPS | Loop |
|-----------|-------------------|--------|-----|------|
| idle      | Character0_Idle   | 8      | 6   | yes  |
| walk      | Character0_Walk   | 6      | 10  | yes  |
| run       | Character0_Run    | 4      | 12  | yes  |
| sit       | Character0_Sit    | 4      | 6   | no → sit_loop |
| sit_loop  | Character0_Sit    | 1      | 1   | yes (frameOffset=3, holds last frame) |
| getup     | Character0_GetUp  | 4      | 6   | no → idle |
| dig       | Character0_Dig    | 6      | 8   | yes  |
| fish      | Character0_Fish   | 6      | 6   | yes  |
| swing     | Character0_Swing  | 6      | 8   | yes  |
| interact  | Character0_Interact | 3    | 6   | no → idle |

## Render constants
- `CHAR_SCALE = 0.20` → frame drawn at ~92×92 px
- `SPRITE_FOOT_Y = 430` → foot anchor within the raw 460px frame
- Draw anchor: feet at `(sx, sy + TILE_H/2)` where sx/sy is the tile's iso-screen center

## Direction from velocity (grid dx/dy)
```
+x, 0  → row 1, flip=false  (SE)
-x, 0  → row 1, flip=true   (NW = mirror SE)
 0,+y  → row 1, flip=true   (SW = mirror SE)
 0,-y  → row 1, flip=false  (NE)
+x,-y  → row 2, flip=false  (E)
-x,+y  → row 2, flip=true   (W)
+x,+y  → row 0, flip=false  (S)
-x,-y  → row 4, flip=false  (N)
```

## Flip implementation
```ts
ctx.translate(sx, 0); ctx.scale(-1, 1); ctx.translate(-sx, 0);
// then draw; mirrors around the character centre x
```

## Sit/getup transition
- Panel action 'sit' → sets `localActionRef.anim = {type:'sit', until: now+60000}`
- Panel action 'standup' → sets `localActionRef.anim = null`
- Canvas: when anim goes null while prevAnimKey is 'sit_loop' → switches to 'getup'
- 'getup' has `nextAnim='idle'`, so it transitions automatically via `advanceAnim`

## State machine (local player)
1. Action active? → use action anim (dance→swing, dig→dig, fish→fish, sit→sit/sit_loop)
2. Action expired + was sitting? → getup
3. Moving (velocity > 0.001)? → walk
4. Default → idle

## Module-level sprite cache
`spriteCache: Map<string, HTMLImageElement>` persists across component re-mounts.
`loadSprites()` called in `useEffect(()=>{},[])` inside the component.

**Why:** Canvas render loop runs at 60fps; image loads must happen once, not per-frame.
