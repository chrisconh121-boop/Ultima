---
name: FarmCity hair sprites
description: Hair overlay sprites — where they are, how they map to directions, and why they're used only in the avatar creator
---

## Files
`artifacts/farmcity/public/hair/<style>_r<row>.png`
- Styles: `short`, `spiky`, `long`
- Rows 0–4 → sprite directions: 0=S(front), 1=SW, 2=W, 3=NW, 4=N(back)
- All images are 1024×1024 PNG, transparent background

## Direction mapping (from user's original asset filenames)
| short | spiky | long |
|-------|-------|------|
| r0 = file 0 | r0 = file 5 | r0 = file 11 |
| r1 = file 1 | r1 = file 6 | r1 = file 12 |
| r2 = file 4 | r2 = file 10| r2 = file 15 |
| r3 = file 3 | r3 = file 9 | r3 = file 14 |
| r4 = file 2 | r4 = file 8 | r4 = file 13 |

## Usage
- **Avatar creator**: image cards shown as style selectors (`<style>_r0.png` as 64×64 thumbnail)
- **In-game canvas**: NOT used as overlays (full-body images with character body included; aligning them over the base sprite requires pixel-math). Rectangle-based hair tinting is used instead.

**Why:** The hair images are complete character sprites (body + hair together), not isolated hair overlays. Drawing them as overlays over the existing tinted sprite would cover the correctly-colored body. Implementing a proper mask/blend requires per-pixel work that was deferred.

**How to apply:** If adding in-game hair overlay later:
- Character in 1024×1024 image: foot ≈ y=0.69×1024, center_x ≈ 0.478×1024
- Sprite frame 460×460 at CHAR_SCALE=0.25: foot at sy=SPRITE_FOOT_Y×0.25=107.5px from dy
- hair_draw_size = 107.5 / 0.69 ≈ 156px; draw_x = dw/2 − 0.478×156 ≈ −17; draw_y ≈ 0
