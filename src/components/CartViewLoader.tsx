"use client";

import dynamic from "next/dynamic";

const CartView = dynamic(() => import("./CartView"), { ssr: false });

export default function CartViewLoader() {
  return <CartView />;
}
