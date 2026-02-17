// Generate call sounds using Web Audio API - no external files needed

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ─── Outgoing Ring (caller hears while waiting) ───
// Classic "ring... ring..." pattern: two short tones, pause, repeat
let outgoingRingOscillators: OscillatorNode[] = [];
let outgoingRingGain: GainNode | null = null;
let outgoingRingInterval: ReturnType<typeof setInterval> | null = null;

export function startOutgoingRing() {
  stopOutgoingRing();
  const ctx = getAudioContext();
  outgoingRingGain = ctx.createGain();
  outgoingRingGain.gain.setValueAtTime(0, ctx.currentTime);
  outgoingRingGain.connect(ctx.destination);

  const playRingBurst = () => {
    const ctx = getAudioContext();
    if (!outgoingRingGain) return;

    // First tone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime + 0.4);
    gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);

    // Second tone (slightly higher)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(480, ctx.currentTime);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.4);
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.5);

    // Second burst after short pause
    setTimeout(() => {
      const ctx2 = getAudioContext();
      const osc3 = ctx2.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(440, ctx2.currentTime);
      const gain3 = ctx2.createGain();
      gain3.gain.setValueAtTime(0, ctx2.currentTime);
      gain3.gain.linearRampToValueAtTime(0.15, ctx2.currentTime + 0.05);
      gain3.gain.setValueAtTime(0.15, ctx2.currentTime + 0.4);
      gain3.gain.linearRampToValueAtTime(0, ctx2.currentTime + 0.5);
      osc3.connect(gain3);
      gain3.connect(ctx2.destination);
      osc3.start(ctx2.currentTime);
      osc3.stop(ctx2.currentTime + 0.5);

      const osc4 = ctx2.createOscillator();
      osc4.type = 'sine';
      osc4.frequency.setValueAtTime(480, ctx2.currentTime);
      const gain4 = ctx2.createGain();
      gain4.gain.setValueAtTime(0, ctx2.currentTime);
      gain4.gain.linearRampToValueAtTime(0.15, ctx2.currentTime + 0.05);
      gain4.gain.setValueAtTime(0.15, ctx2.currentTime + 0.4);
      gain4.gain.linearRampToValueAtTime(0, ctx2.currentTime + 0.5);
      osc4.connect(gain4);
      gain4.connect(ctx2.destination);
      osc4.start(ctx2.currentTime);
      osc4.stop(ctx2.currentTime + 0.5);
    }, 600);
  };

  playRingBurst();
  outgoingRingInterval = setInterval(playRingBurst, 3000);
}

export function stopOutgoingRing() {
  if (outgoingRingInterval) {
    clearInterval(outgoingRingInterval);
    outgoingRingInterval = null;
  }
  outgoingRingOscillators.forEach(o => { try { o.stop(); } catch {} });
  outgoingRingOscillators = [];
  outgoingRingGain = null;
}

// ─── Incoming Ring (receiver hears) ───
// More urgent, melodic pattern
let incomingRingInterval: ReturnType<typeof setInterval> | null = null;

export function startIncomingRing() {
  stopIncomingRing();

  const playMelody = () => {
    const ctx = getAudioContext();
    const notes = [523, 659, 784, 659]; // C5, E5, G5, E5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.02);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.15 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.15);
    });
  };

  playMelody();
  incomingRingInterval = setInterval(playMelody, 2000);
}

export function stopIncomingRing() {
  if (incomingRingInterval) {
    clearInterval(incomingRingInterval);
    incomingRingInterval = null;
  }
}

// ─── Call Connected Sound ───
// Short pleasant ascending chime
export function playConnectedSound() {
  const ctx = getAudioContext();
  const notes = [523, 659, 784]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.08 + 0.02);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08 + 0.12);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.08 + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.08);
    osc.stop(ctx.currentTime + i * 0.08 + 0.25);
  });
}

// ─── Call End Sound ───
// Short descending tone - classic "call ended" beep
export function playEndCallSound() {
  const ctx = getAudioContext();

  // Three descending beeps
  const notes = [600, 500, 400];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.15 + 0.01);
    gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.15 + 0.1);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.15 + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.15);
    osc.stop(ctx.currentTime + i * 0.15 + 0.15);
  });
}

// ─── Busy / Not Answering Sound ───
// Repeated short beeps (busy signal)
export function playBusySound() {
  const ctx = getAudioContext();
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.35);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.35 + 0.01);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.35 + 0.2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.35 + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.35);
    osc.stop(ctx.currentTime + i * 0.35 + 0.3);
  }
}
