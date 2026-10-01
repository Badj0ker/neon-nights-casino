# Neon Nights Casino

Create a side-scrolling Mario-style platformer game in English with a dark neon casino aesthetic (inspired by Betfury).

Character & Sprite Animations:
- Use the attached images for the raccoon hero: run1, run2, run3, run4 for the 4-frame running cycle animation, and jump.png for the jump state.
- Run cycle animation: 01 → 02 → 03 → 04 → 03 → 02 → ... looping at ~10 FPS. Ensure proper foot alignment and sizing so the sprite doesn't jitter.
- The attached bfg-token.png is the collectible coin in the game.

Gameplay & Level Design:
- Build a challenging, non-repeating custom level with casino platforms, gaps, and obstacles.
- Add rolling dice enemies that patrol or roll toward the player, which the player can jump on or avoid.
- Collectible BFG tokens scattered across the level.
- English UI: Score, Coins, Lives, Level Complete, and Game Over overlays.
- Responsive keyboard controls (Arrows / WASD / Space) and on-screen touch controls for mobile.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/eed325d3-130a-4ee9-9106-75c7565ce626).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
