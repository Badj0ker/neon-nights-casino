# Neon Casino Platformer

## Goal
Build the playable first screen as a polished side-scrolling platform game using the supplied raccoon and BFG token artwork. The experience will be in English, work with keyboard and touch, and use a dark neon casino visual language.

## What will be built
- A responsive game stage with a fixed gameplay viewport, layered neon-casino scenery, camera scrolling, and a handcrafted level with distinct platform sequences, gaps, hazards, and a finish gate.
- Responsive movement using Arrow keys or WASD, with Space/W/Up to jump; mobile players get large left, right, and jump controls.
- The supplied four running images animated in the requested `1 → 2 → 3 → 4 → 3 → 2` cycle at about 10 FPS, normalized to one stable visual baseline; the supplied jump pose appears whenever airborne.
- BFG token collectibles placed along safe and risky routes, with score, coin count, and lives shown during play.
- Rolling dice enemies with patrol/chase behavior, visible rotation, player damage, invulnerability feedback, and stomp-to-defeat interactions.
- Start, level-complete, and game-over states with restart/replay controls; falling or taking damage costs a life and respawns at a checkpoint.
- Casino-world details such as chip platforms, card-suit signage, hazard lights, atmospheric depth, and restrained motion that remains readable during play.

## Technical approach
- Use an HTML canvas for deterministic physics, collisions, sprites, enemies, pickups, particles, and camera rendering, wrapped in React for overlays and touch controls.
- Keep level geometry and entities as declarative game data so the course is custom and non-repeating while remaining maintainable.
- Store the uploaded images through the project asset flow, preload them before play, and render all sprite frames into the same destination rectangle with per-frame alignment offsets.
- Use fixed-step physics with requestAnimationFrame rendering, swept/axis-separated platform collision, coyote time, jump buffering, and capped frame delta for responsive, stable controls.
- Add page-specific title and social metadata, semantic color tokens, accessible labels, reduced-motion handling, and cleanup for keyboard/touch listeners.

## Validation
- Verify the complete flow in the running preview: start, run animation, jump, collect a token, stomp/avoid an enemy, lose a life, and reach both completion and game-over states.
- Check desktop and mobile-sized layouts for readable HUD, unobstructed gameplay, usable touch controls, and correctly scaled assets.
- Confirm there are no build, runtime, console, or asset-loading errors.
