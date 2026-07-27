import styles from "./page.module.css";
import GameLoader from "@/components/GameLoader";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Ludoarte RPG Store</h1>
        <GameLoader />
      </main>
    </div>
  );
}
