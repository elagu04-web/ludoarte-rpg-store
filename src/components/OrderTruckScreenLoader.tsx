"use client";

import dynamic from "next/dynamic";

const OrderTruckScreen = dynamic(() => import("./OrderTruckScreen"), {
  ssr: false,
});

export default function OrderTruckScreenLoader() {
  return <OrderTruckScreen />;
}
