import confetti from "canvas-confetti";

const DURATION_MS = 2500;
const DEFAULTS = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function triggerConfetti(): void {
  const animationEnd = Date.now() + DURATION_MS;
  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = 50 * (timeLeft / DURATION_MS);
    confetti({
      ...DEFAULTS,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() * 0.2 },
    });
    confetti({
      ...DEFAULTS,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() * 0.2 },
    });
  }, 250);
}

/** Green and white burst from center — for win reveal celebration */
export function triggerRevealConfetti(): void {
  const count = 120;
  const defaults = { origin: { x: 0.5, y: 0.5 }, zIndex: 9999 };

  confetti({
    ...defaults,
    particleCount: count * 0.6,
    spread: 100,
    startVelocity: 35,
    colors: ["#1DB954", "#1ed760", "#91ed91"],
  });
  confetti({
    ...defaults,
    particleCount: count * 0.4,
    spread: 120,
    startVelocity: 28,
    scalar: 0.9,
    colors: ["#ffffff", "#e0e0e0"],
  });
}
