/**
 * Tiny original 8-bit style background music, synthesized entirely in the
 * browser with the Web Audio API (triangle-wave oscillators). No audio
 * files, no external source -- so no licensing concerns whatsoever.
 * Slow, gentle "shop theme" pace rather than an action tune.
 */

const NOTE_DURATION = 0.55; // seconds each note rings for (soft, lingering)
const TEMPO_INTERVAL = 0.6; // seconds between note starts (relaxed pace)
const SCHEDULE_AHEAD = 0.2; // how far ahead we schedule notes
const SCHEDULER_INTERVAL_MS = 50;
const BASS_NOTE = 130.81; // C3, a soft continuous drone underneath

// A calm, wandering original pentatonic melody (C D E G A) -- not copied
// from any existing game.
const MELODY = [
  523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33,
];

let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
let bassOscillator: OscillatorNode | null = null;
let isPlaying = false;
let nextNoteTime = 0;
let currentNoteIndex = 0;
let schedulerHandle: ReturnType<typeof setTimeout> | null = null;

function ensureContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.05; // keep it subtle, it's background music
    gainNode.connect(audioContext.destination);
  }
  return audioContext;
}

function playNote(freq: number, time: number) {
  if (!audioContext || !gainNode) return;

  const osc = audioContext.createOscillator();
  osc.type = "triangle"; // softer/mellower than a square wave
  osc.frequency.setValueAtTime(freq, time);

  const noteGain = audioContext.createGain();
  noteGain.gain.setValueAtTime(0, time);
  noteGain.gain.linearRampToValueAtTime(0.7, time + 0.03); // gentle fade-in
  noteGain.gain.exponentialRampToValueAtTime(0.001, time + NOTE_DURATION);

  osc.connect(noteGain);
  noteGain.connect(gainNode);

  osc.start(time);
  osc.stop(time + NOTE_DURATION);
}

function startBassDrone() {
  if (!audioContext || !gainNode || bassOscillator) return;

  const bassGain = audioContext.createGain();
  bassGain.gain.value = 0.35; // quiet, just adds warmth underneath

  bassOscillator = audioContext.createOscillator();
  bassOscillator.type = "triangle";
  bassOscillator.frequency.value = BASS_NOTE;
  bassOscillator.connect(bassGain);
  bassGain.connect(gainNode);
  bassOscillator.start();
}

function stopBassDrone() {
  bassOscillator?.stop();
  bassOscillator = null;
}

function scheduler() {
  if (!audioContext || !isPlaying) return;

  while (nextNoteTime < audioContext.currentTime + SCHEDULE_AHEAD) {
    playNote(MELODY[currentNoteIndex], nextNoteTime);
    nextNoteTime += TEMPO_INTERVAL;
    currentNoteIndex = (currentNoteIndex + 1) % MELODY.length;
  }

  schedulerHandle = setTimeout(scheduler, SCHEDULER_INTERVAL_MS);
}

export function startMusic() {
  if (isPlaying) return;

  const ctx = ensureContext();
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  isPlaying = true;
  nextNoteTime = ctx.currentTime + 0.05;
  currentNoteIndex = 0;
  startBassDrone();
  scheduler();
}

export function stopMusic() {
  isPlaying = false;
  if (schedulerHandle !== null) {
    clearTimeout(schedulerHandle);
    schedulerHandle = null;
  }
  stopBassDrone();
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
