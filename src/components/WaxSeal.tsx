import React from 'react';
import { INVITATION_COPY, clamp01 } from '../constants/invitation';

interface WaxSealProps {
  sealDataUrl?: string | null;
  size?: number;
  glintProgress?: number;
}

/**
 * Navy & Champagne-Gold Nautical Anchor Medallion Seal
 * matching the reference design ("AMOUR BONHEUR & SOUVENIRS POUR LA VIE")
 * flanked by delicate golden laurel sprigs.
 */
export const WaxSeal: React.FC<WaxSealProps> = ({
  size = 186,
  glintProgress = 0,
}) => {
  const glintOpacity = Math.sin(clamp01(glintProgress) * Math.PI) * 0.52;
  const glintShift = (clamp01(glintProgress) - 0.5) * 200;

  return (
    <div
      className="relative select-none pointer-events-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        filter:
          'drop-shadow(0px 12px 22px rgba(7, 13, 28, 0.52)) drop-shadow(0px 3px 8px rgba(7, 13, 28, 0.36))',
      }}
    >
      <svg
        viewBox="0 0 240 240"
        className="w-full h-full overflow-visible"
        aria-label={INVITATION_COPY.waxSealText}
      >
        <defs>
          <radialGradient id="navyMedallionBg" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#1E3563" />
            <stop offset="55%" stopColor="#122142" />
            <stop offset="100%" stopColor="#0B152B" />
          </radialGradient>
          <linearGradient id="goldBezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F4DFA8" />
            <stop offset="35%" stopColor="#CFA452" />
            <stop offset="70%" stopColor="#A97D32" />
            <stop offset="100%" stopColor="#EAD192" />
          </linearGradient>
          <linearGradient id="goldLeafGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A67A2E" />
            <stop offset="50%" stopColor="#DFBA6B" />
            <stop offset="100%" stopColor="#F5E1AC" />
          </linearGradient>
          <clipPath id="medallionInnerClip">
            <circle cx="120" cy="120" r="82" />
          </clipPath>
          <linearGradient id="medallionGlintGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFDF5" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFDF5" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFFDF5" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Golden laurel sprigs flanking the lower-left and lower-right */}
        <g fill="url(#goldLeafGrad)" opacity="0.96">
          {/* Left sprig */}
          <path d="M52,186 C35,166 26,138 28,110 C32,135 42,162 58,180 Z" />
          <ellipse cx="32" cy="150" rx="13" ry="5.5" transform="rotate(-48 32 150)" />
          <ellipse cx="26" cy="128" rx="12" ry="5" transform="rotate(-64 26 128)" />
          <ellipse cx="44" cy="168" rx="12" ry="5" transform="rotate(-30 44 168)" />
          <ellipse cx="64" cy="188" rx="13" ry="5.2" transform="rotate(-14 64 188)" />
          {/* Right sprig */}
          <path d="M188,186 C205,166 214,138 212,110 C208,135 198,162 182,180 Z" />
          <ellipse cx="208" cy="150" rx="13" ry="5.5" transform="rotate(48 208 150)" />
          <ellipse cx="214" cy="128" rx="12" ry="5" transform="rotate(64 214 128)" />
          <ellipse cx="196" cy="168" rx="12" ry="5" transform="rotate(30 196 168)" />
          <ellipse cx="176" cy="188" rx="13" ry="5.2" transform="rotate(14 176 188)" />
        </g>

        {/* Outer metallic gold bezel */}
        <circle cx="120" cy="120" r="88" fill="url(#goldBezelGrad)" />
        <circle cx="120" cy="120" r="83" fill="url(#navyMedallionBg)" />

        {/* Inner dashed rope & fine gold ring */}
        <circle
          cx="120"
          cy="120"
          r="77"
          fill="none"
          stroke="url(#goldBezelGrad)"
          strokeWidth="1.4"
          strokeDasharray="3.2 2.4"
          opacity="0.88"
        />
        <circle
          cx="120"
          cy="120"
          r="72.5"
          fill="none"
          stroke="url(#goldBezelGrad)"
          strokeWidth="0.9"
          opacity="0.6"
        />

        {/* Gold nautical anchor at top center */}
        <g transform="translate(120, 74)" fill="none" stroke="url(#goldBezelGrad)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="0" cy="-12" r="3.4" />
          <line x1="0" y1="-8.5" x2="0" y2="12" />
          <line x1="-8" y1="-2.5" x2="8" y2="-2.5" />
          <path d="M -11,4 C -10,12 -4,14 0,12 C 4,14 10,12 11,4" />
          <polygon points="-13,5 -9,2 -9,7" fill="#E8CE8E" stroke="none" />
          <polygon points="13,5 9,2 9,7" fill="#E8CE8E" stroke="none" />
        </g>

        {/* Stacked Cream-Gold Typography matching reference */}
        <g
          fill="#F5EBD6"
          textAnchor="middle"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
        >
          <text x="120" y="106" fontSize="14.5" fontWeight="600" letterSpacing="1.1">
            AMOUR
          </text>
          <text x="120" y="124" fontSize="14.5" fontWeight="600" letterSpacing="1.0">
            BONHEUR
          </text>
          <text x="120" y="142" fontSize="13.5" fontWeight="600" letterSpacing="0.8">
            &amp; SOUVENIRS
          </text>
          <text x="120" y="160" fontSize="13.5" fontWeight="600" letterSpacing="0.9">
            POUR LA VIE
          </text>
        </g>

        {/* Blush coral heart accent at bottom */}
        <path
          d="M120,180 C120,180 112.5,174.5 112.5,170.2 C112.5,167.8 114.4,166.2 116.6,166.2 C118.1,166.2 119.4,167.1 120,168.3 C120.6,167.1 121.9,166.2 123.4,166.2 C125.6,166.2 127.5,167.8 127.5,170.2 C127.5,174.5 120,180 120,180 Z"
          fill="#E58B94"
        />

        {/* Specular glint sweep */}
        {glintOpacity > 0.01 && (
          <g clipPath="url(#medallionInnerClip)" opacity={glintOpacity}>
            <rect
              x={glintShift}
              y="10"
              width="62"
              height="220"
              transform="rotate(28 120 120)"
              fill="url(#medallionGlintGrad)"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
