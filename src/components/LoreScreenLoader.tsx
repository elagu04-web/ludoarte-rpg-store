"use client";

import dynamic from "next/dynamic";

const LoreScreen = dynamic(() => import("./LoreScreen"), { ssr: false });

export default function LoreScreenLoader() {
  return <LoreScreen />;
}
