"use client";

import { useEffect, useState } from "react";
import { eventBus } from "@/game/eventBus";
import styles from "./GameOverlay.module.css";

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/
  );
  return match ? match[1] : null;
}

export default function GameVideoPopup() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = (url: string | null) => setVideoUrl(url);
    eventBus.on("game-video-open", handleOpen);
    return () => {
      eventBus.off("game-video-open", handleOpen);
    };
  }, []);

  if (!videoUrl) return null;

  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) return null;

  return (
    <div className={styles.videoPopup}>
      <button
        className={styles.videoCloseButton}
        onClick={() => setVideoUrl(null)}
      >
        ✕
      </button>
      <iframe
        className={styles.videoFrame}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`}
        title="Video del juego"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
