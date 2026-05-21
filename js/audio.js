// js/audio.js

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function playSound(type) {
  if (audioCtx.state === 'suspended') audioCtx.resume();

  if (type === 'click') {
    const bufferSize = audioCtx.sampleRate * 0.02;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, audioCtx.currentTime);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.01);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);

    oscGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.015);

    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);

    noiseNode.start();
    osc.start();
    osc.stop(audioCtx.currentTime + 0.02);
  } else if (type === 'fanfare') {
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, index) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g);
      g.connect(audioCtx.destination);
      o.type = 'triangle';
      const startTime = audioCtx.currentTime + index * 0.12;
      o.frequency.setValueAtTime(freq, startTime);
      g.gain.setValueAtTime(0, audioCtx.currentTime);
      g.gain.setValueAtTime(0.15, startTime);
      g.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      o.start(startTime);
      o.stop(startTime + 0.4);
    });
  }
}
