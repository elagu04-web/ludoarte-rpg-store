"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { eventBus } from "@/game/eventBus";
import {
  playMenuOpenSound,
  playMenuCloseSound,
  playMenuMoveSound,
  playMenuConfirmSound,
} from "@/game/music";
import styles from "./TvMenu.module.css";

interface MenuItem {
  id: string;
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "fotos", label: "Fotos" },
  { id: "videos", label: "Videos" },
];

export default function TvMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "gallery" | "video">("menu");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const viewRef = useRef(view);
  const selectedIndexRef = useRef(selectedIndex);
  const photosRef = useRef(photos);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setView("menu");
      setSelectedIndex(0);
    };
    eventBus.on("tv-menu-open", handleOpen);
    return () => {
      eventBus.off("tv-menu-open", handleOpen);
    };
  }, []);

  useEffect(() => {
    eventBus.emit("menu-open", isOpen);
    eventBus.emit("background-blur", isOpen && view !== "menu");
  }, [isOpen, view]);

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      playMenuOpenSound();
    } else if (!isOpen && wasOpenRef.current) {
      playMenuCloseSound();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const closeAll = () => setIsOpen(false);

  const openItem = async (item: MenuItem) => {
    if (item.id === "videos") {
      playMenuConfirmSound();
      setView("video");
      return;
    }

    if (item.id !== "fotos") return;

    playMenuConfirmSound();
    setView("gallery");
    setPhotoIndex(0);
    setLoadingPhotos(true);
    try {
      const res = await fetch("/api/photos");
      const data = await res.json();
      setPhotos(data.photos ?? []);
    } catch {
      setPhotos([]);
    }
    setLoadingPhotos(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (viewRef.current === "menu") {
        if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
          setSelectedIndex((prev) => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
          playMenuMoveSound();
        } else if (
          event.key === "ArrowDown" ||
          event.key === "s" ||
          event.key === "S"
        ) {
          setSelectedIndex((prev) => (prev + 1) % MENU_ITEMS.length);
          playMenuMoveSound();
        } else if (event.key === "e" || event.key === "E" || event.key === "Enter") {
          openItem(MENU_ITEMS[selectedIndexRef.current]);
        } else if (event.key === "Escape") {
          closeAll();
        }
      } else if (viewRef.current === "video") {
        if (event.key === "Escape") setView("menu");
      } else {
        const count = photosRef.current.length;
        if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
          if (count > 0) setPhotoIndex((prev) => (prev - 1 + count) % count);
        } else if (
          event.key === "ArrowRight" ||
          event.key === "d" ||
          event.key === "D"
        ) {
          if (count > 0) setPhotoIndex((prev) => (prev + 1) % count);
        } else if (event.key === "Escape") {
          setView("menu");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (view === "video") {
    return (
      <div className={styles.galleryOverlay}>
        <button className={styles.galleryClose} onClick={() => setView("menu")}>
          ESC
        </button>
        <video
          className={styles.videoPlayer}
          src="/assets/videos/videos.mp4"
          controls
          autoPlay
        />
      </div>
    );
  }

  if (view === "gallery") {
    return (
      <div className={styles.galleryOverlay}>
        <button className={styles.galleryClose} onClick={() => setView("menu")}>
          ESC
        </button>

        {loadingPhotos ? (
          <p className={styles.galleryMessage}>Cargando fotos...</p>
        ) : photos.length === 0 ? (
          <p className={styles.galleryMessage}>Todavia no hay fotos.</p>
        ) : (
          <>
            <button
              className={`${styles.galleryNav} ${styles.galleryNavLeft}`}
              onClick={() =>
                setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
              }
            >
              ◀
            </button>
            <div className={styles.galleryImageWrapper}>
              <Image
                src={photos[photoIndex]}
                alt={`Foto ${photoIndex + 1}`}
                fill
                sizes="65vw"
                style={{ objectFit: "contain" }}
              />
            </div>
            <button
              className={`${styles.galleryNav} ${styles.galleryNavRight}`}
              onClick={() =>
                setPhotoIndex((prev) => (prev + 1) % photos.length)
              }
            >
              ▶
            </button>
            <p className={styles.galleryCounter}>
              {photoIndex + 1} / {photos.length}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={styles.backdrop} onClick={closeAll}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Menu</h2>
          <button className={styles.closeButton} onClick={closeAll}>
            ESC
          </button>
        </div>
        <ul className={styles.itemList}>
          {MENU_ITEMS.map((item, index) => (
            <li
              key={item.id}
              className={
                index === selectedIndex ? styles.itemSelected : styles.item
              }
              onClick={() => openItem(item)}
            >
              {index === selectedIndex ? "▶ " : "  "}
              {item.label}
            </li>
          ))}
        </ul>
        <p className={styles.hint}>E: Seleccionar &middot; ESC: Salir</p>
      </div>
    </div>
  );
}
