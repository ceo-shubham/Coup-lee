import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function FloatingHearts({ reactions }) {
  useEffect(() => {
    if (!reactions || reactions.length === 0) return;
    const latest = reactions[reactions.length - 1];
    if (!latest) return;

    // Trigger romantic floating heart burst
    const count = 18;
    const defaults = {
      origin: { y: 0.85, x: 0.5 },
      spread: 80,
      ticks: 200,
      gravity: 0.6,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['circle'],
      colors: ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#ff758c', '#ff7eb3'],
    };

    confetti({
      ...defaults,
      particleCount: Math.floor(count * 0.7),
      scalar: 1.2,
    });

    confetti({
      ...defaults,
      particleCount: Math.floor(count * 0.3),
      scalar: 1.6,
    });
  }, [reactions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.slice(-6).map((item) => (
        <div
          key={item.id}
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 animate-float text-3xl sm:text-4xl opacity-90 transition-all"
          style={{
            left: `${45 + (Math.random() * 10 - 5)}%`,
            animationDuration: `${2.5 + Math.random()}s`,
          }}
        >
          {item.reaction}
        </div>
      ))}
    </div>
  );
}
