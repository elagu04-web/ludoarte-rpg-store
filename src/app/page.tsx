import styles from "./page.module.css";
import GameLoader from "@/components/GameLoader";
import CartBadge from "@/components/CartBadge";
import CartViewLoader from "@/components/CartViewLoader";
import SearchScreenLoader from "@/components/SearchScreenLoader";
import OrderTruckScreenLoader from "@/components/OrderTruckScreenLoader";
import MusicController from "@/components/MusicController";
import { CartProvider } from "@/context/CartContext";

export default function Home() {
  return (
    <CartProvider>
      <div className={styles.page}>
        <main className={styles.main}>
          <h1>Ludoarte RPG Store</h1>
          <div className={styles.headerRow}>
            <CartBadge />
            <MusicController />
          </div>
          <GameLoader />
        </main>
      </div>
      <div className={styles.rotateOverlay}>
        <span className={styles.rotateIcon}>📱↻</span>
        <p>Gira tu telefono para jugar</p>
      </div>
      <CartViewLoader />
      <SearchScreenLoader />
      <OrderTruckScreenLoader />
    </CartProvider>
  );
}
