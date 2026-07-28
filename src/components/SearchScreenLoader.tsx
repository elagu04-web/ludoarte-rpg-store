"use client";

import dynamic from "next/dynamic";

const SearchScreen = dynamic(() => import("./SearchScreen"), { ssr: false });

export default function SearchScreenLoader() {
  return <SearchScreen />;
}
