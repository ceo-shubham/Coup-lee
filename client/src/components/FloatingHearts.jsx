import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';

// Synthesize pleasant popping bubble sound effect using Web Audio API
function playPopSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    // Bubbly pitch drop from 680Hz to 160Hz
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
    setTimeout(() => ctx.close(), 120);
  } catch {}
}

const HEART_EMOJIS = ['❤️', '💖', '💕', '💓', '💗', '💘', '💞', '✨'];

export function FloatingHearts({ reactions }) {
  const [hearts, setHearts] = useState([]);
  const [bursts, setBursts] = useState([]);
  const lastProcessedIdRef = useRef(null);

  // When a new reaction event arrives
  useEffect(() => {
    if (!reactions || reactions.length === 0) return;
    const latest = reactions[reactions.length - 1];
    if (!latest || latest.id === lastProcessedIdRef.current) return;
    lastProcessedIdRef.current = latest.id;

    // Small celebratory confetti at bottom
    confetti({
      origin: { y: 0.88, x: 0.5 },
      particleCount: 16,
      spread: 70,
      startVelocity: 22,
      gravity: 0.7,
      scalar: 1.1,
      colors: ['#f43f5e', '#fb7185', '#fda4af', '#ff7eb3', '#ffffff'],
    });

    // Spawn 7-10 interactive floating hearts across the screen
    const count = 8;
    const newHearts = Array.from({ length: count }).map((_, i) => {
      const id = `heart_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`;
      // Distribute across screen width: 12% to 88%
      const left = 12 + Math.random() * 76;
      const duration = 3.6 + Math.random() * 1.6; // 3.6s - 5.2s
      const delay = Math.random() * 0.4;
      const size = 32 + Math.floor(Math.random() * 18); // 32px to 50px
      const emoji = Math.random() > 0.4 ? (latest.reaction || '❤️') : HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];

      return {
        id,
        emoji,
        left,
        duration,
        delay,
        size,
        popped: false,
      };
    });

    setHearts((prev) => [...prev.slice(-20), ...newHearts]);

    // Clean up expired hearts after max duration
    const timer = setTimeout(() => {
      setHearts((prev) => prev.filter((h) => !newHearts.some((nh) => nh.id === h.id)));
    }, 5500);

    return () => clearTimeout(timer);
  }, [reactions]);

  // Handle popping / bursting a heart on tap/click
  const handlePopHeart = (heartId, e) => {
    e.preventDefault();
    e.stopPropagation();

    // Get click/touch position
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (!clientX && e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (!clientX) {
      const rect = e.currentTarget.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }

    // Play cheerful bubble pop sound
    playPopSound();

    // Trigger crisp canvas-confetti spark burst at exact pop point
    if (window.innerWidth && window.innerHeight) {
      confetti({
        origin: {
          x: Math.max(0.05, Math.min(0.95, clientX / window.innerWidth)),
          y: Math.max(0.05, Math.min(0.95, clientY / window.innerHeight)),
        },
        particleCount: 18,
        spread: 80,
        startVelocity: 16,
        ticks: 50,
        gravity: 0.9,
        scalar: 0.85,
        colors: ['#ff1744', '#f43f5e', '#ff758c', '#ffffff', '#ffd1dc', '#fda4af'],
        shapes: ['circle'],
      });
    }

    // Create 8 radiating sparkles around the pop coordinate
    const burstId = `burst_${Date.now()}_${Math.random()}`;
    const sparkCount = 8;
    const particles = Array.from({ length: sparkCount }).map((_, idx) => {
      const angle = (idx / sparkCount) * 2 * Math.PI;
      const dist = 35 + Math.random() * 30;
      return {
        tx: `${Math.cos(angle) * dist}px`,
        ty: `${Math.sin(angle) * dist}px`,
        emoji: ['✨', '💖', '💕', '🌸', '💫'][Math.floor(Math.random() * 5)],
      };
    });

    setBursts((prev) => [...prev, { id: burstId, x: clientX, y: clientY, particles }]);

    // Remove popped heart from screen with quick pop animation
    setHearts((prev) =>
      prev.map((h) => (h.id === heartId ? { ...h, popped: true } : h))
    );

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== heartId));
    }, 200);

    setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 600);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none">
      {/* Floating Hearts */}
      {hearts.map((heart) => (
        <div
          key={heart.id}
          data-interactive="true"
          onClick={(e) => handlePopHeart(heart.id, e)}
          onTouchStart={(e) => handlePopHeart(heart.id, e)}
          className={`absolute bottom-20 pointer-events-auto cursor-pointer transition-transform hover:scale-135 active:scale-90 ${
            heart.popped ? 'animate-heart-pop pointer-events-none' : 'animate-float-up'
          }`}
          style={{
            left: `${heart.left}%`,
            fontSize: `${heart.size}px`,
            animationDuration: `${heart.duration}s`,
            animationDelay: `${heart.delay}s`,
            touchAction: 'manipulation',
            filter: 'drop-shadow(0 4px 10px rgba(244,63,94,0.4))',
          }}
          title="Tap to pop heart! 💥"
        >
          {heart.emoji}
        </div>
      ))}

      {/* Sparkle Particles on Pop Explosion */}
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute pointer-events-none"
          style={{
            left: `${burst.x}px`,
            top: `${burst.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {burst.particles.map((p, idx) => (
            <span
              key={idx}
              className="absolute text-sm sm:text-base animate-particle-burst select-none"
              style={{
                '--tx': p.tx,
                '--ty': p.ty,
              }}
            >
              {p.emoji}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
