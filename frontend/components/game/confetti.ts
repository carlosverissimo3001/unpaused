import confetti from "canvas-confetti";

const DURATION_MS = 2500;
const DEFAULTS = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

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
