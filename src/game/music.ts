/**
 * Background music: a playlist of real audio files dropped into
 * public/assets/game songs/, fetched from /api/songs (so adding a new
 * song is just adding a file there, no code change needed). Plays one
 * track, then advances to the next when it ends, looping back to the
 * first after the last -- with a single song that's just "repeat it".
 *
 * Played through the Web Audio API (fetch + decodeAudioData +
 * AudioBufferSourceNode) rather than a plain <audio> element on purpose:
 * a real <audio>/<video> element gets registered by mobile browsers as a
 * background media session (like a music/podcast player), so it keeps
 * playing after the tab is backgrounded or even closed -- there's no such
 * special-cased persistence for AudioContext-driven playback, which is
 * exactly why the old synthesized-oscillator version never had this
 * problem. This keeps that same "stops when you leave" behavior while
 * still playing a real audio file.
 *
 * Short sound effects (below) share the same AudioContext, fully
 * synthesized, no audio files.
 */

const MUSIC_VOLUME = 0.35;

let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
let musicGainNode: GainNode | null = null;
let musicSource: AudioBufferSourceNode | null = null;
const musicBuffers = new Map<string, AudioBuffer>();
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

async function getBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const cached = musicBuffers.get(url);
  if (cached) return cached;

  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arrayBuffer);
  musicBuffers.set(url, buffer);
  return buffer;
}

async function playCurrentTrack() {
  if (!isPlaying || playlist.length === 0) return;

  const ctx = ensureContext();
  const url = playlist[playlistIndex];
  const buffer = await getBuffer(ctx, url);
  if (!isPlaying) return; // toggled off while the file was loading/decoding

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(musicGainNode!);
  source.onended = () => {
    // Fires both when a track finishes naturally AND when stopMusic() calls
    // .stop() on it -- only advance to the next track in the first case.
    if (!isPlaying || musicSource !== source) return;
    playlistIndex = (playlistIndex + 1) % playlist.length;
    playCurrentTrack();
  };

  musicSource = source;
  source.start();
}

export function startMusic() {
  if (isPlaying) return;
  isPlaying = true;

  const ctx = ensureContext();
  if (ctx.state === "suspended") ctx.resume();
  if (!musicGainNode) {
    musicGainNode = ctx.createGain();
    musicGainNode.gain.value = MUSIC_VOLUME;
    musicGainNode.connect(ctx.destination);
  }

  loadPlaylist().then((list) => {
    if (!isPlaying || list.length === 0) return;
    playCurrentTrack();
  });
}

export function stopMusic() {
  isPlaying = false;
  const source = musicSource;
  musicSource = null;
  source?.stop();
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

// The AudioContext clock keeps running even while the tab is hidden --
// suspending it on hide and resuming on show keeps the audible state tied
// to whether the player can actually see the game (same pattern used for
// every other sound in this file).
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!audioContext || audioContext.state === "closed") return;
    if (document.hidden) {
      audioContext.suspend();
    } else if (isPlaying) {
      audioContext.resume();
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
