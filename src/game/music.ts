/**
 * Background music: a playlist of real audio files dropped into
 * public/assets/game songs/, fetched from /api/songs (so adding a new
 * song is just adding a file there, no code change needed). Plays one
 * track, then advances to the next when it ends, looping back to the
 * first after the last -- with a single song that's just "repeat it".
 *
 * Short sound effects (below) are separate: those stay fully synthesized
 * with the Web Audio API, no audio files, no licensing concerns.
 */

const MUSIC_VOLUME = 0.35;

let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
let musicElement: HTMLAudioElement | null = null;
let playlist: string[] = [];
let playlistLoaded = false;
let playlistIndex = 0;
let isPlaying = false;

function ensureContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.05; // keep it subtle, it's background music
    gainNode.connect(audioContext.destination);
  }
  return audioContext;
}

async function loadPlaylist(): Promise<string[]> {
  if (playlistLoaded) return playlist;
  try {
    const res = await fetch("/api/songs");
    const data = await res.json();
    playlist = Array.isArray(data.songs) ? data.songs : [];
  } catch {
    playlist = [];
  }
  playlistLoaded = true;
  return playlist;
}

function ensureMusicElement(): HTMLAudioElement {
  if (!musicElement) {
    musicElement = new Audio();
    musicElement.volume = MUSIC_VOLUME;
    musicElement.addEventListener("ended", () => {
      if (playlist.length === 0) return;
      playlistIndex = (playlistIndex + 1) % playlist.length;
      playCurrentTrack();
    });
  }
  return musicElement;
}

function playCurrentTrack() {
  if (!musicElement || playlist.length === 0) return;
  musicElement.src = playlist[playlistIndex];
  musicElement.play().catch(() => {});
}

export function startMusic() {
  if (isPlaying) return;
  isPlaying = true;

  ensureMusicElement();
  loadPlaylist().then((list) => {
    if (!isPlaying || list.length === 0) return;
    playCurrentTrack();
  });
}

export function stopMusic() {
  isPlaying = false;
  musicElement?.pause();
}

export function toggleMusic(): boolean {
  if (isPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
  return isPlaying;
}

export function isMusicPlaying(): boolean {
  return isPlaying;
}

// A background <audio> element keeps playing even while the tab is
// hidden/backgrounded (unlike the AudioContext-driven scheduler this
// replaced) -- but on mobile in particular that's exactly when you don't
// want it audibly running on. Pausing on hide and resuming on show keeps
// the audible state tied to whether the player can actually see the game.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!musicElement) return;
    if (document.hidden) {
      musicElement.pause();
    } else if (isPlaying) {
      musicElement.play().catch(() => {});
    }
  });
}

/** Short synthesized "zap" sound for firing a fireball -- also self-generated, no audio files. */
export function playFireballSound() {
  const ctx = ensureContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

  // Connects straight to the output (not through the quiet music gain) so
  // it stays punchy regardless of the background music's low volume.
  const sfxGain = ctx.createGain();
  sfxGain.gain.setValueAtTime(0.8, now);
  sfxGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

  osc.connect(sfxGain);
  sfxGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.13);
}

/** Helper: a single short beep straight to the output, bypassing the quiet music gain. */
function playBeep(freq: number, startOffset: number, duration: number, volume: number) {
  const ctx = ensureContext();
  const start = ctx.currentTime + startOffset;

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, start);

  const beepGain = ctx.createGain();
  beepGain.gain.setValueAtTime(volume, start);
  beepGain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(beepGain);
  beepGain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration);
}

/** Short cursor-move blip for menu navigation (up/down). */
export function playMenuMoveSound() {
  const ctx = ensureContext();
  if (ctx.state === "suspended") ctx.resume();
  playBeep(660, 0, 0.06, 0.3);
}

/** Slightly richer two-note chime for confirming/adding to cart. */
export function playMenuConfirmSound() {
  const ctx = ensureContext();
  if (ctx.state === "suspended") ctx.resume();
  playBeep(660, 0, 0.09, 0.35);
  playBeep(990, 0.07, 0.09, 0.35);
}

/** Helper: a quick frequency sweep, for opening/closing whoosh sounds. */
function playSweep(fromFreq: number, toFreq: number, duration: number, volume: number) {
  const ctx = ensureContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(fromFreq, now);
  osc.frequency.exponentialRampToValueAtTime(toFreq, now + duration);

  const sweepGain = ctx.createGain();
  sweepGain.gain.setValueAtTime(volume, now);
  sweepGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(sweepGain);
  sweepGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/** Rising whoosh for when a menu (shop or cart) opens. */
export function playMenuOpenSound() {
  const ctx = ensureContext();
  if (ctx.state === "suspended") ctx.resume();
  playSweep(300, 750, 0.12, 0.4);
}

/** Falling whoosh for when a menu (shop or cart) closes. */
export function playMenuCloseSound() {
  const ctx = ensureContext();
  if (ctx.state === "suspended") ctx.resume();
  playSweep(600, 250, 0.12, 0.4);
}

/** Tiny blip per letter for the typewriter dialogue box, old-RPG style. */
export function playDialogueBlipSound() {
  const ctx = ensureContext();
  if (ctx.state === "suspended") ctx.resume();
  playBeep(1100, 0, 0.02, 0.07);
}
