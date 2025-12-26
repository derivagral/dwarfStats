// Sound notification utility

export async function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 760;
    gain.gain.value = 0.1;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 150);
  } catch (e) {
    // Silently fail if audio isn't available
  }
}
