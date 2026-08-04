"use client";

import dynamic from "next/dynamic";

const GameOverScreen = dynamic(() => import("./GameOverScreen"), { ssr: false });

export default function GameOverScreenLoader() {
  return <GameOverScreen />;
}
