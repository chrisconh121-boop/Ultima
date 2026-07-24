---
name: FarmCity isometric canvas architecture
description: Key design decisions in isometric-canvas.tsx — all-refs, A*, click detection
---

## Architecture: all-refs
The canvas uses all React refs for mutable state (player positions, camera, animation frame) — no `useState` inside the render loop. This avoids re-renders during animation.

**Why:** State updates trigger React re-renders which would interrupt the 60fps game loop and cause flickering.

## A* pathfinding
- Uses an `OBSTACLES` Set<string> with `"x,y"` keys for O(1) lookup
- Grid is 20×20
- Players walk around obstacles; direct tile clicks within the grid trigger pathfinding

## Click → tile detection (screenToIso)
The `screenToIso` function corrects for the camera offset (stored in a ref that lerps toward the target). Without camera offset correction, clicks would hit the wrong tile when the camera has moved.

## World objects
- `TREE_SET`: Set<string> of `"x,y"` positions
- Fountain, bench, tree trigger `onClickObject(name)` → WorldObjectPanel
- Self-tile click → `onClickSelf()` → OwnAvatarPanel
- Other player tile click → `onClickPlayer(player)` → OtherPlayerPanel
