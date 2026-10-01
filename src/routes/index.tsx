import { createFileRoute } from "@tanstack/react-router";

import { NeonRunnerGame } from "@/components/NeonRunnerGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BFG Neon Run | Casino Platformer" },
      { name: "description", content: "Race through a neon casino, collect BFG tokens, and outplay rolling dice in this side-scrolling platform adventure." },
      { property: "og:title", content: "BFG Neon Run | Casino Platformer" },
      { property: "og:description", content: "Race through a neon casino, collect BFG tokens, and outplay rolling dice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NeonRunnerGame,
});
