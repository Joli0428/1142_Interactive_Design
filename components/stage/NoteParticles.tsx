"use client";

import { useEffect, useState } from "react";

type Particle = { id: number; x: number; y: number; symbol: string };

let particleId = 0;

type Props = {
  isPinching: boolean;
  activeAnimalX: number;
};

export function NoteParticles({ isPinching, activeAnimalX }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isPinching) return;
    const interval = setInterval(() => {
      const symbols = ["♪", "♫", "♬"];
      const p: Particle = {
        id: particleId++,
        x: activeAnimalX + (Math.random() - 0.5) * 80,
        y: window.innerHeight * 0.55 + Math.random() * 40,
        symbol: symbols[Math.floor(Math.random() * symbols.length)]!,
      };
      setParticles((prev) => [...prev.slice(-12), p]);
    }, 280);
    return () => clearInterval(interval);
  }, [isPinching, activeAnimalX]);

  if (!isPinching) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[25] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-[float-up_1.8s_ease-out_forwards] text-2xl text-amber-200/90"
          style={{ left: p.x, top: p.y }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
}
