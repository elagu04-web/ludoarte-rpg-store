"use client";

import dynamic from "next/dynamic";

const GameOverExitListener = dynamic(() => import("./GameOverExitListener"), {
  ssr: false,
});

export default function GameOverExitListenerLoader({ onExit }: { onExit: () => void }) {
  return <GameOverExitListener onExit={onExit} />;
}
