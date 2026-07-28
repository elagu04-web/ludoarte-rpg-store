import styles from "./page.module.css";
import GameLoader from "@/components/GameLoader";
import CartBadge from "@/components/CartBadge";
import CartViewLoader from "@/components/CartViewLoader";
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
      <CartViewLoader />
    </CartProvider>
  );
}
