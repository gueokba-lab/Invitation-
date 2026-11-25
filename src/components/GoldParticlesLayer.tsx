import React from 'react';
import { STAGE_HEIGHT, STAGE_WIDTH, clamp01 } from '../constants/invitation';

interface ParticleSeed {
  id: number;
  baseX: number;
  baseY: number;
  radius: number;
  riseSpeed: number;
  swayAmp: number;
  swayFreq: number;
  shimmerFreq: number;
  phase: number;
  maxAlpha: number;
  isStarred: boolean;
}

export interface ComputedParticle {
  id: number;
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkle: number;
  isStarred: boolean;
}

// Deterministic pseudo-random generator for reproducible luxury gold-dust motes
function seededUnit(index: number, salt: number): number {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

const PARTICLE_SEEDS: ParticleSeed[] = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  baseX: 60 + seededUnit(i, 1) * (STAGE_WIDTH - 120),
  baseY: 80 + seededUnit(i, 2) * (STAGE_HEIGHT - 160),
  radius: 1.6 + seededUnit(i, 3) * 2.8,
  riseSpeed: 10 + seededUnit(i, 4) * 16,
  swayAmp: 12 + seededUnit(i, 5) * 22,
  swayFreq: 0.45 + seededUnit(i, 6) * 0.55,
  shimmerFreq: 1.1 + seededUnit(i, 7) * 1.6,
  phase: seededUnit(i, 8) * Math.PI * 2,
  maxAlpha: 0.36 + seededUnit(i, 9) * 0.38,
  isStarred: i % 4 === 0,
}));

export function computeGoldParticles(time: number): ComputedParticle[] {
  const globalFade = clamp01((time - 0.3) / 1.6);
  if (globalFade <= 0) return [];

  return PARTICLE_SEEDS.map((seed) => {
    // Gentle upward float with seamless vertical wrap inside stage margins
    const spanY = STAGE_HEIGHT + 120;
    const rawY = seed.baseY - time * seed.riseSpeed;
    const wrappedY = (((rawY + 60) % spanY) + spanY) % spanY - 60;

    // Soft organic lateral breeze sway
    const x =
      seed.baseX +
      Math.sin(time * seed.swayFreq + seed.phase) * seed.swayAmp +
      Math.cos(time * (seed.swayFreq * 0.53) + seed.phase * 1.7) * (seed.swayAmp * 0.45);

    // Edge fade so particles enter and exit softly
    const edgeFadeTop = clamp01((wrappedY + 40) / 140);
    const edgeFadeBottom = clamp01((STAGE_HEIGHT + 40 - wrappedY) / 140);
    const edgeFade = Math.min(edgeFadeTop, edgeFadeBottom);

    // Smooth staggered shimmer pulse (0.12 .. 1.0)
    const shimmerWave =
      0.5 +
      0.34 * Math.sin(time * seed.shimmerFreq + seed.phase) +
      0.16 * Math.cos(time * (seed.shimmerFreq * 1.73) + seed.phase * 2.3);
    const twinkle = clamp01(shimmerWave);

    const alpha = globalFade * edgeFade * seed.maxAlpha * (0.18 + 0.82 * twinkle);

    return {
      id: seed.id,
      x,
      y: wrappedY,
      radius: seed.radius * (0.85 + 0.3 * twinkle),
      alpha,
      twinkle,
      isStarred: seed.isStarred,
    };
  });
}

interface GoldParticlesLayerProps {
  time: number;
}

export const GoldParticlesLayer: React.FC<GoldParticlesLayerProps> = ({ time }) => {
  const particles = computeGoldParticles(time);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 24 }}
      aria-hidden="true"
    >
      {particles.map((p) => {
        const size = p.radius * 5.2;
        return (
          <div
            key={p.id}
            className="absolute top-0 left-0"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              transform: `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`,
              opacity: p.alpha,
            }}
          >
            {/* Soft warm champagne-gold halo */}
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(255, 248, 224, 0.98) 0%, rgba(227, 192, 114, 0.65) 36%, rgba(204, 166, 86, 0) 74%)',
              }}
            />
            {/* Delicate 4-point star glint at peak shimmer on select motes */}
            {p.isStarred && p.twinkle > 0.62 && (
              <svg
                viewBox="0 0 24 24"
                className="absolute inset-0 w-full h-full scale-125"
                style={{ opacity: (p.twinkle - 0.62) / 0.38 }}
              >
                <path
                  d="M12 2 L13.1 10.9 L22 12 L13.1 13.1 L12 22 L10.9 13.1 L2 12 L10.9 10.9 Z"
                  fill="#FFF8DF"
                />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};
