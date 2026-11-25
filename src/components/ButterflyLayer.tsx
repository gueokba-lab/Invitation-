import React from 'react';
import { clamp01, easeInOutSine } from '../constants/invitation';

export interface ButterflyPoint {
  x: number;
  y: number;
}

export interface ButterflySpec {
  id: string;
  startTime: number;
  duration: number;
  wingSpeed: number;
  scale: number;
  p0: ButterflyPoint;
  p1: ButterflyPoint;
  p2: ButterflyPoint;
  p3: ButterflyPoint;
  hoverAmplitude: number;
  phaseOffset: number;
}

export const BUTTERFLY_SPECS: ButterflySpec[] = [
  {
    id: 'butterfly-lead',
    startTime: 4.8,
    duration: 9.2,
    wingSpeed: 5.2,
    scale: 1.0,
    p0: { x: -70, y: 1260 },
    p1: { x: 140, y: 920 },
    p2: { x: 250, y: 420 },
    p3: { x: 895, y: 315 },
    hoverAmplitude: 14,
    phaseOffset: 0.4,
  },
  {
    id: 'butterfly-companion',
    startTime: 8.2,
    duration: 7.4,
    wingSpeed: 6.1,
    scale: 0.78,
    p0: { x: 1140, y: 460 },
    p1: { x: 890, y: 690 },
    p2: { x: 790, y: 1080 },
    p3: { x: 845, y: 1320 },
    hoverAmplitude: 11,
    phaseOffset: 2.1,
  },
  {
    id: 'butterfly-accent',
    startTime: 10.6,
    duration: 6.2,
    wingSpeed: 6.8,
    scale: 0.64,
    p0: { x: -50, y: 1580 },
    p1: { x: 120, y: 1440 },
    p2: { x: 165, y: 1240 },
    p3: { x: 155, y: 1065 },
    hoverAmplitude: 9,
    phaseOffset: 4.0,
  },
];

export function evaluateCubicBezier(
  p0: ButterflyPoint,
  p1: ButterflyPoint,
  p2: ButterflyPoint,
  p3: ButterflyPoint,
  t: number
): { x: number; y: number; angleDeg: number } {
  const u = 1 - t;
  const x =
    u * u * u * p0.x +
    3 * u * u * t * p1.x +
    3 * u * t * t * p2.x +
    t * t * t * p3.x;
  const y =
    u * u * u * p0.y +
    3 * u * u * t * p1.y +
    3 * u * t * t * p2.y +
    t * t * t * p3.y;

  const dx =
    3 * u * u * (p1.x - p0.x) +
    6 * u * t * (p2.x - p1.x) +
    3 * t * t * (p3.x - p2.x);
  const dy =
    3 * u * u * (p1.y - p0.y) +
    6 * u * t * (p2.y - p1.y) +
    3 * t * t * (p3.y - p2.y);

  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  return { x, y, angleDeg };
}

function organicDrift(t: number, seed: number): { dx: number; dy: number; dAngle: number } {
  const dx =
    Math.sin(t * 0.67 + seed * 1.3) * 0.52 +
    Math.sin(t * 1.49 + seed * 2.7) * 0.31 +
    Math.cos(t * 2.31 + seed * 0.6) * 0.17;
  const dy =
    Math.cos(t * 0.59 + seed * 1.9) * 0.50 +
    Math.sin(t * 1.37 + seed * 0.8) * 0.33 +
    Math.cos(t * 2.13 + seed * 3.1) * 0.17;
  const dAngle =
    Math.sin(t * 0.93 + seed * 2.2) * 5.5 +
    Math.cos(t * 1.87 + seed * 1.1) * 2.8;
  return { dx, dy, dAngle };
}

export function computeButterflyState(spec: ButterflySpec, time: number) {
  if (time < spec.startTime) {
    return null;
  }

  const rawProgress = clamp01((time - spec.startTime) / spec.duration);
  const flightT = easeInOutSine(rawProgress);
  const base = evaluateCubicBezier(spec.p0, spec.p1, spec.p2, spec.p3, flightT);

  // Smooth transition from flight heading to serene resting angle after arrival
  const settleBlend = clamp01((rawProgress - 0.84) / 0.16);
  const restAngle =
    spec.id === 'butterfly-lead' ? -24 : spec.id === 'butterfly-companion' ? 20 : 15;
  const angleDiff = ((restAngle - base.angleDeg + 540) % 360) - 180;

  // Multi-harmonic organic micro-wandering (subtle breeze drift around path & perch)
  const floatTime = time - spec.startTime;
  const drift = organicDrift(floatTime, spec.phaseOffset);
  const driftAmp = spec.hoverAmplitude * (0.55 + 0.75 * settleBlend);
  const wanderX = drift.dx * driftAmp;
  const wanderY = drift.dy * (driftAmp * 0.88);

  const headingDeg = base.angleDeg + angleDiff * settleBlend + drift.dAngle;

  // Subtle flutter-and-glide cadence: gentler wingbeats with soft open-wing glides
  const glideEnvelope = 0.62 + 0.38 * Math.sin(floatTime * 0.85 + spec.phaseOffset * 1.7);
  const effectiveSpeed = spec.wingSpeed * (1 - 0.52 * settleBlend) * glideEnvelope;
  const wingPhase =
    floatTime * effectiveSpeed +
    0.45 * Math.sin(floatTime * 1.1 + spec.phaseOffset) +
    spec.phaseOffset;

  // Asymmetric natural wing stroke (soft linger near open, gentle quickened downstroke)
  const shapedWave = Math.sin(wingPhase) + 0.16 * Math.sin(wingPhase * 2);
  const wingTiltDeg = 22 + shapedWave * (34 - 10 * settleBlend);

  // Subtle vertical body bob & depth breath synced with wing stroke
  const lift = Math.max(0, -shapedWave * 0.5 + 0.5); // 0..1
  const bobY = -shapedWave * (2.6 - 1.2 * settleBlend);
  const depthScale = spec.scale * (1 + lift * 0.035);

  const fadeIn = clamp01((time - spec.startTime) / 0.75);

  return {
    x: base.x + wanderX,
    y: base.y + wanderY + bobY,
    headingDeg,
    wingTiltDeg,
    lift,
    opacity: fadeIn * 0.94,
    scale: depthScale,
  };
}

interface ButterflyLayerProps {
  time: number;
}

const SingleButterfly: React.FC<{
  id: string;
  x: number;
  y: number;
  headingDeg: number;
  wingTiltDeg: number;
  lift: number;
  opacity: number;
  scale: number;
}> = ({ id, x, y, headingDeg, wingTiltDeg, lift, opacity, scale }) => {
  const wingScaleX = Math.max(0.26, Math.cos((wingTiltDeg * Math.PI) / 180));
  const shadowOffsetX = 16 + lift * 6;
  const shadowOffsetY = 22 + lift * 8;
  const shadowOpacity = 0.25 - lift * 0.05;

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`,
        opacity,
      }}
    >
      {/* Soft natural cast shadow on paper below */}
      <div
        className="absolute top-0 left-0"
        style={{
          width: '92px',
          height: '78px',
          transform: `translate3d(${shadowOffsetX}px, ${shadowOffsetY}px, 0) rotate(${headingDeg}deg) scaleX(${0.65 + 0.35 * wingScaleX})`,
          filter: `blur(${6.5 + lift * 2}px)`,
          opacity: shadowOpacity,
        }}
      >
        <svg viewBox="0 0 100 90" className="w-full h-full">
          <path
            d="M49 40 C36 14, 10 8, 6 24 C3 37, 22 46, 46 47 C24 51, 14 66, 23 76 C33 84, 45 69, 49 52 Z"
            fill="#4B3B28"
          />
          <path
            d="M51 40 C64 14, 90 8, 94 24 C97 37, 78 46, 54 47 C76 51, 86 66, 77 76 C67 84, 55 69, 51 52 Z"
            fill="#4B3B28"
          />
        </svg>
      </div>

      {/* Main pearlescent ivory & champagne-gold butterfly */}
      <div
        style={{
          width: '92px',
          height: '78px',
          transform: `rotate(${headingDeg}deg)`,
          perspective: '340px',
          transformStyle: 'preserve-3d',
        }}
      >
        <svg viewBox="0 0 100 90" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`wingGradL-${id}`} x1="100%" y1="30%" x2="0%" y2="70%">
              <stop offset="0%" stopColor="#FFFDF8" stopOpacity="0.96" />
              <stop offset="55%" stopColor="#F4E9D4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#D6B980" stopOpacity="0.88" />
            </linearGradient>
            <linearGradient id={`wingGradR-${id}`} x1="0%" y1="30%" x2="100%" y2="70%">
              <stop offset="0%" stopColor="#FFFDF8" stopOpacity="0.96" />
              <stop offset="55%" stopColor="#F4E9D4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#D6B980" stopOpacity="0.88" />
            </linearGradient>
          </defs>

          {/* Left wing group */}
          <g
            style={{
              transformOrigin: '50px 45px',
              transform: `rotateY(${wingTiltDeg}deg)`,
            }}
          >
            {/* Forewing */}
            <path
              d="M49 41 C37 13, 9 7, 5 24 C2 37, 21 47, 48 47 Z"
              fill={`url(#wingGradL-${id})`}
              stroke="#C5A362"
              strokeWidth="0.9"
            />
            {/* Hindwing */}
            <path
              d="M48 48 C23 50, 13 65, 22 76 C32 85, 45 70, 49 52 Z"
              fill={`url(#wingGradL-${id})`}
              stroke="#C5A362"
              strokeWidth="0.85"
            />
            {/* Delicate filigree veins */}
            <path
              d="M46 43 C34 31, 20 24, 10 24 M46 45 C32 39, 20 38, 12 36 M46 50 C35 58, 28 66, 24 72"
              fill="none"
              stroke="#B89352"
              strokeWidth="0.55"
              strokeOpacity="0.55"
            />
          </g>

          {/* Right wing group */}
          <g
            style={{
              transformOrigin: '50px 45px',
              transform: `rotateY(${-wingTiltDeg}deg)`,
            }}
          >
            {/* Forewing */}
            <path
              d="M51 41 C63 13, 91 7, 95 24 C98 37, 79 47, 52 47 Z"
              fill={`url(#wingGradR-${id})`}
              stroke="#C5A362"
              strokeWidth="0.9"
            />
            {/* Hindwing */}
            <path
              d="M52 48 C77 50, 87 65, 78 76 C68 85, 55 70, 51 52 Z"
              fill={`url(#wingGradR-${id})`}
              stroke="#C5A362"
              strokeWidth="0.85"
            />
            {/* Delicate filigree veins */}
            <path
              d="M54 43 C66 31, 80 24, 90 24 M54 45 C68 39, 80 38, 88 36 M54 50 C65 58, 72 66, 76 72"
              fill="none"
              stroke="#B89352"
              strokeWidth="0.55"
              strokeOpacity="0.55"
            />
          </g>

          {/* Thorax & delicate antennae */}
          <ellipse cx="50" cy="46" rx="1.9" ry="9.5" fill="#7C674B" />
          <circle cx="50" cy="35.5" r="2.1" fill="#6B573D" />
          <path
            d="M49.2 34 C46 27, 43 24, 41 23 M50.8 34 C54 27, 57 24, 59 23"
            fill="none"
            stroke="#7C674B"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};

export const ButterflyLayer: React.FC<ButterflyLayerProps> = ({ time }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {BUTTERFLY_SPECS.map((spec) => {
        const state = computeButterflyState(spec, time);
        if (!state) return null;
        return (
          <SingleButterfly
            key={spec.id}
            id={spec.id}
            x={state.x}
            y={state.y}
            headingDeg={state.headingDeg}
            wingTiltDeg={state.wingTiltDeg}
            lift={state.lift}
            opacity={state.opacity}
            scale={state.scale}
          />
        );
      })}
    </div>
  );
};
