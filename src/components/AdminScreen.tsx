"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./AdminScreen.module.css";

interface ProfileRow {
  id: string;
  email: string | null;
  monsters_defeated: number;
  created_at: string;
}

export default function AdminScreen({ onExit }: { onExit: () => void }) {
  const [profiles, setProfiles] = useState<ProfileRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .from("profiles")
      .select("id, email, monsters_defeated, created_at")
      .order("monsters_defeated", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setProfiles(data ?? []);
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.title}>PANEL ADMIN · JUGADORES</span>
        <button className={styles.exitButton} onClick={onExit}>
          SALIR (ESC)
        </button>
      </div>

      {error && <p className={styles.error}>Error: {error}</p>}
      {!profiles && !error && <p className={styles.hint}>Cargando...</p>}

      {profiles && profiles.length === 0 && (
        <p className={styles.hint}>Todavia no hay nadie registrado.</p>
      )}

      {profiles && profiles.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Monstruos vencidos</th>
                <th>Registrado</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td>{p.email}</td>
                  <td className={styles.numberCell}>{p.monsters_defeated}</td>
                  <td>{new Date(p.created_at).toLocaleDateString("es-UY")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
