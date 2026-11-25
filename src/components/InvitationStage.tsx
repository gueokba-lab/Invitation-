import React from 'react';
import { MapPin } from 'lucide-react';
import {
  ASSETS,
  INVITATION_COPY,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  VENUE_DIRECTIONS_URL,
  clamp01,
  computeCardCrossfade,
  easeInOutCubic,
  easeOutCubic,
  easeOutQuart,
  lerp,
  progressIn,
} from '../constants/invitation';
import { BallroomCorners } from './BallroomCorners';
import { ButterflyLayer } from './ButterflyLayer';
import { GoldParticlesLayer } from './GoldParticlesLayer';
import { WaxSeal } from './WaxSeal';

interface InvitationStageProps {
  time: number;
  ambientTime: number;
  paperDataUrl: string | null;
  sealDataUrl: string | null;
}

/**
 * Exact scalloped bracket-arch card silhouette path (670 x 920)
 * matching the uploaded luxury ballroom reference design.
 */
function buildScallopedCardPath(inset: number): string {
  const w = 670;
  const h = 920;
  const cx = w / 2;
  const topPeakY = 6 + inset;
  const shoulderY = 58 + inset * 0.85;
  const sideTopY = 122 + inset * 0.5;
  const sideBotY = h - 122 - inset * 0.5;
  const botShoulderY = h - 58 - inset * 0.85;
  const botPeakY = h - 6 - inset;
  const leftX = 4 + inset;
  const rightX = w - 4 - inset;
  const innerShoulderInset = 78 + inset * 0.65;

  return [
    `M ${cx},${topPeakY}`,
    `C ${cx + 26},${topPeakY + 26} ${cx + 52},${shoulderY - 6} ${rightX - innerShoulderInset},${shoulderY}`,
    `C ${rightX - 42},${shoulderY + 4} ${rightX - 18},${shoulderY + 28} ${rightX},${sideTopY}`,
    `L ${rightX},${sideBotY}`,
    `C ${rightX - 18},${botShoulderY - 28} ${rightX - 42},${botShoulderY - 4} ${rightX - innerShoulderInset},${botShoulderY}`,
    `C ${cx + 52},${botShoulderY + 6} ${cx + 26},${botPeakY - 26} ${cx},${botPeakY}`,
    `C ${cx - 26},${botPeakY - 26} ${cx - 52},${botShoulderY + 6} ${leftX + innerShoulderInset},${botShoulderY}`,
    `C ${leftX + 42},${botShoulderY - 4} ${leftX + 18},${botShoulderY - 28} ${leftX},${sideBotY}`,
    `L ${leftX},${sideTopY}`,
    `C ${leftX + 18},${shoulderY + 28} ${leftX + 42},${shoulderY + 4} ${leftX + innerShoulderInset},${shoulderY}`,
    `C ${cx - 52},${shoulderY - 6} ${cx - 26},${topPeakY + 26} ${cx},${topPeakY}`,
    'Z',
  ].join(' ');
}

const OUTER_CARD_PATH = buildScallopedCardPath(0);
const GOLD_OUTER_BORDER_PATH = buildScallopedCardPath(10);
const GOLD_INNER_BORDER_PATH = buildScallopedCardPath(18);

export const InvitationStage: React.FC<InvitationStageProps> = ({
  time,
  ambientTime,
  paperDataUrl,
}) => {
  // 1. Subtle breathing backdrop camera zoom (0s -> 24s)
  const bgScale = lerp(1.045, 1.0, easeOutCubic(progressIn(time, 0, 20.0)));

  // 2. Gentle warm candlelight shimmer drift
  const sunDriftX = Math.sin(ambientTime * 0.34) * 16;
  const sunDriftY = Math.cos(ambientTime * 0.25) * 10;

  // 3. Envelope top flap opening (2.1s -> 4.6s)
  const flapOpenT = easeInOutCubic(progressIn(time, 2.1, 4.6));
  const flapAngleDeg = lerp(0, 174, flapOpenT);
  const flapIsPastVertical = flapAngleDeg >= 88;
  const flapZIndex = flapIsPastVertical ? 2 : 16;

  // 4. Envelope settles downward while scalloped card emerges (4.2s -> 8.2s)
  const emergeT = easeInOutCubic(progressIn(time, 4.2, 8.2));
  const envelopeTop = lerp(500, 1105, emergeT);
  const envelopeScale = lerp(1.0, 0.80, emergeT);

  // 5. Scalloped invitation card glides upward smoothly out of navy pocket
  const cardTop = lerp(516, 205, emergeT);
  const cardLiftShadow = lerp(0.28, 0.48, emergeT);

  // 6. Round navy-gold anchor medallion settles onto front pocket apex (2.1s -> 3.4s)
  const sealUnsealT = easeInOutCubic(progressIn(time, 2.1, 3.4));
  const sealLocalY = lerp(420, 464, sealUnsealT);
  const sealLiftPulse = 1 + Math.sin(sealUnsealT * Math.PI) * 0.04;

  // Specular gold glints on medallion
  const sealGlint =
    progressIn(time, 1.3, 2.5) > 0 && progressIn(time, 1.3, 2.5) < 1
      ? progressIn(time, 1.3, 2.5)
      : progressIn(time, 13.6, 15.2);

  // 7. Progressive reveal ordered:
  //    Wedding Invitation -> Bride & Groom Names -> Wedding Date -> Wedding Venue -> Romantic Messages -> Location & Google Maps
  const crestT = easeOutCubic(progressIn(time, 6.5, 7.5));
  const introT = easeOutCubic(progressIn(time, 7.0, 8.0));
  const coupleT = easeOutQuart(progressIn(time, 7.8, 9.2));
  const dividerT = easeOutCubic(progressIn(time, 9.0, 9.8));
  const dateT = easeOutCubic(progressIn(time, 9.5, 10.5));
  const venueT = easeOutCubic(progressIn(time, 10.3, 11.4));
  const closing1T = easeOutCubic(progressIn(time, 11.3, 12.4));
  const directionsT = easeOutCubic(progressIn(time, 12.4, 13.4));

  // Soft golden shimmer sweep across couple names
  const nameShimmerT = progressIn(time, 8.8, 10.7);
  const nameShimmerPos = lerp(-120, 220, nameShimmerT);
  const nameShimmerOpacity = Math.sin(clamp01(nameShimmerT) * Math.PI) * 0.45;

  // 8. Crossfade between main invitation details and couple welcome quote
  const { mainAlpha, quoteAlpha, mainShiftY, quoteShiftY } =
    computeCardCrossfade(time);

  return (
    <div
      className="relative overflow-hidden select-none bg-[#0D172E]"
      style={{
        width: `${STAGE_WIDTH}px`,
        height: `${STAGE_HEIGHT}px`,
      }}
    >
      {/* LAYER 0A: Ambient blurred candlelit ballroom depth fill */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `scale(${bgScale * 1.18})`,
          transformOrigin: 'center center',
        }}
      >
        <img
          src={ASSETS.ballroomBackdrop}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center blur-[20px] brightness-[0.62]"
          draggable={false}
        />
      </div>

      {/* LAYER 0B: Upper ballroom chandelier, fairy lights & balloons from reference image */}
      <div
        className="absolute top-0 left-0 w-full h-[1120px] pointer-events-none"
        style={{
          transform: `scale(${bgScale * 1.03})`,
          transformOrigin: 'top center',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 36%, rgba(0,0,0,0.6) 64%, rgba(0,0,0,0) 94%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,1) 36%, rgba(0,0,0,0.6) 64%, rgba(0,0,0,0) 94%)',
        }}
      >
        <img
          src={ASSETS.ballroomBackdrop}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top"
          draggable={false}
        />
      </div>

      {/* Center midnight-navy atmospheric scrim masking center static card region cleanly */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 52% 48% at 50% 54%, rgba(12, 22, 46, 0.90) 0%, rgba(14, 25, 52, 0.68) 54%, rgba(12, 22, 46, 0.14) 100%)',
        }}
      />

      {/* Warm golden candlelight glow drift */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate3d(${sunDriftX}px, ${sunDriftY}px, 0)`,
          background:
            'radial-gradient(ellipse 64% 42% at 50% 34%, rgba(255, 225, 165, 0.16) 0%, rgba(255, 210, 140, 0.05) 56%, rgba(0, 0, 0, 0) 100%)',
        }}
      />

      {/* LAYER 1A (z: 2): Deep Navy Envelope Back Panel & Champagne Inner Liner */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '180px',
          top: `${envelopeTop}px`,
          width: '720px',
          height: '920px',
          transform: `scale(${envelopeScale})`,
          transformOrigin: 'top center',
          zIndex: 2,
          boxShadow:
            '0 30px 72px rgba(5, 10, 22, 0.56), 0 8px 24px rgba(5, 10, 22, 0.36)',
          borderRadius: '4px',
        }}
      >
        <div
          className="absolute inset-0 rounded-[4px] overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #F3EAD7 0%, #E6D8BC 100%)',
            border: '1.5px solid rgba(208, 166, 86, 0.65)',
          }}
        >
          {paperDataUrl && (
            <img
              src={paperDataUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-45 mix-blend-multiply"
              draggable={false}
            />
          )}
          <svg
            viewBox="0 0 720 420"
            className="absolute top-0 left-0 w-full h-[420px] opacity-30"
            aria-hidden="true"
          >
            <path
              d="M360 36 C340 86, 305 124, 265 148 M360 36 C380 86, 415 124, 455 148 M360 36 L360 175"
              stroke="#B88B38"
              strokeWidth="1.5"
              fill="none"
            />
            <circle cx="360" cy="36" r="3.5" fill="#B88B38" />
          </svg>
        </div>
      </div>

      {/* LAYER 1B (dynamic z: 16 closed -> 2 open): 3D Hinged Navy & Gold Top Flap */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '180px',
          top: `${envelopeTop}px`,
          width: '720px',
          height: '435px',
          transform: `scale(${envelopeScale})`,
          transformOrigin: 'top center',
          zIndex: flapZIndex,
          perspective: '1800px',
        }}
      >
        <div
          style={{
            width: '720px',
            height: '435px',
            transformOrigin: 'top center',
            transform: `rotateX(${flapAngleDeg}deg)`,
            filter: flapIsPastVertical
              ? 'drop-shadow(0 -8px 18px rgba(5, 10, 22, 0.36))'
              : 'drop-shadow(0 14px 24px rgba(5, 10, 22, 0.45))',
          }}
        >
          <svg viewBox="0 0 720 435" className="w-full h-full block overflow-visible">
            <defs>
              <linearGradient id="navyFlapOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1B315E" />
                <stop offset="55%" stopColor="#122244" />
                <stop offset="100%" stopColor="#0C1832" />
              </linearGradient>
              <linearGradient id="navyFlapInnerLiner" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EFE4CD" />
                <stop offset="65%" stopColor="#F6EFE0" />
                <stop offset="100%" stopColor="#E3D3B4" />
              </linearGradient>
            </defs>

            <path
              d="M 2,0 L 718,0 C 718,8 712,18 704,26 L 392,412 C 374,433 346,433 328,412 L 16,26 C 8,18 2,8 2,0 Z"
              fill={flapIsPastVertical ? 'url(#navyFlapInnerLiner)' : 'url(#navyFlapOuter)'}
            />

            {/* Champagne gold border piping */}
            <path
              d="M 16,6 L 704,6 L 386,399 C 372,416 348,416 334,399 Z"
              fill="none"
              stroke={flapIsPastVertical ? '#C59A4B' : '#D5AF63'}
              strokeOpacity={flapIsPastVertical ? 0.42 : 0.65}
              strokeWidth="1.5"
            />

            <path
              d="M 2,0 L 718,0 C 718,8 712,18 704,26 L 392,412 C 374,433 346,433 328,412 L 16,26 C 8,18 2,8 2,0 Z"
              fill="none"
              stroke="rgba(218, 180, 102, 0.52)"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* LAYER 2 (z: 6): Ornate Scalloped Bracket-Arch Cream Invitation Card */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '205px',
          top: `${cardTop}px`,
          width: '670px',
          height: '920px',
          zIndex: 6,
          filter: `drop-shadow(0 26px 54px rgba(5, 10, 24, ${cardLiftShadow})) drop-shadow(0 6px 16px rgba(5, 10, 24, 0.25))`,
        }}
      >
        {/* Scalloped Cotton-Paper Silhouette + Double Gold Frame */}
        <svg
          viewBox="0 0 670 920"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="scallopedCardClip">
              <path d={OUTER_CARD_PATH} />
            </clipPath>
            <linearGradient id="cardIvoryWash" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDF9F0" />
              <stop offset="55%" stopColor="#F9F2E3" />
              <stop offset="100%" stopColor="#F3E8D4" />
            </linearGradient>
            <linearGradient id="cardGoldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E6C983" />
              <stop offset="45%" stopColor="#C49642" />
              <stop offset="100%" stopColor="#DFBE74" />
            </linearGradient>
          </defs>

          <g clipPath="url(#scallopedCardClip)">
            <rect width="670" height="920" fill="url(#cardIvoryWash)" />
            {paperDataUrl && (
              <image
                href={paperDataUrl}
                x="0"
                y="0"
                width="670"
                height="920"
                preserveAspectRatio="xMidYMid slice"
                opacity="0.32"
              />
            )}
          </g>

          {/* Outer & Inner Scalloped Gold Borders */}
          <path
            d={OUTER_CARD_PATH}
            fill="none"
            stroke="url(#cardGoldStroke)"
            strokeWidth="2.4"
          />
          <path
            d={GOLD_OUTER_BORDER_PATH}
            fill="none"
            stroke="url(#cardGoldStroke)"
            strokeWidth="1.2"
            opacity="0.85"
          />
          <path
            d={GOLD_INNER_BORDER_PATH}
            fill="none"
            stroke="#C79B48"
            strokeWidth="0.7"
            opacity="0.4"
          />
        </svg>

        {/* Invitation Typography Container */}
        <div className="relative z-10 flex flex-col items-center text-center px-[56px] pt-[56px] pb-[76px] h-full">
          {/* 1. Top Gold Heart & Botanical Scroll Crest */}
          <div
            style={{
              opacity: crestT,
              transform: `translate3d(0, ${(1 - crestT) * 10}px, 0)`,
            }}
            className="mb-[14px]"
          >
            <svg width="160" height="38" viewBox="0 0 160 38" fill="none" aria-hidden="true">
              {/* Left & right symmetrical scrollwork */}
              <path
                d="M12 22 C28 22, 34 12, 48 16 C56 18, 60 25, 68 23"
                stroke="#B88B38"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
              <path
                d="M148 22 C132 22, 126 12, 112 16 C104 18, 100 25, 92 23"
                stroke="#B88B38"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
              <ellipse cx="42" cy="14" rx="5.5" ry="2.6" transform="rotate(-24 42 14)" fill="#C99C48" fillOpacity="0.6" />
              <ellipse cx="118" cy="14" rx="5.5" ry="2.6" transform="rotate(24 118 14)" fill="#C99C48" fillOpacity="0.6" />
              {/* Center gold heart outline */}
              <path
                d="M80 28 C80 28 70 21 70 14.5 C70 11 72.8 8.5 76 8.5 C78 8.5 79.4 9.8 80 11.4 C80.6 9.8 82 8.5 84 8.5 C87.2 8.5 90 11 90 14.5 C90 21 80 28 80 28 Z"
                stroke="#B88B38"
                strokeWidth="1.6"
                fill="rgba(210, 170, 92, 0.16)"
              />
            </svg>
          </div>

          {/* Crossfade Container inside Card Frame */}
          <div className="relative w-full flex-1">
            {/* A. Main Invitation Details */}
            <div
              className="flex flex-col items-center w-full"
              style={{
                opacity: mainAlpha,
                transform: `translate3d(0, ${mainShiftY}px, 0)`,
              }}
            >
              {/* 2. Intro line (tracked uppercase serif + small gold heart) */}
              <div
                className="flex flex-col items-center"
                style={{
                  opacity: introT,
                  transform: `translate3d(0, ${(1 - introT) * 12}px, 0)`,
                }}
              >
                <p
                  className="font-luxury-serif uppercase text-[#2A221C] leading-[1.35] tracking-[0.06em] max-w-[495px] m-0"
                  style={{ fontSize: '21px', fontWeight: 600 }}
                >
                  {INVITATION_COPY.intro}
                </p>
                <span className="text-[#BA8D3A] text-[18px] mt-[4px]" aria-hidden="true">
                  ♥
                </span>
              </div>

              {/* 3. Couple Names (Mourad in Navy, & in Gold with burgundy hearts, Dounia in Rose-Burgundy) */}
              <div
                className="relative flex flex-col items-center mt-[2px] mb-[6px]"
                style={{
                  opacity: coupleT,
                  transform: `translate3d(0, ${(1 - coupleT) * 14}px, 0) scale(${lerp(0.96, 1, coupleT)})`,
                }}
              >
                <h1 className="m-0 font-normal flex flex-col items-center leading-[0.94]">
                  <span
                    className="font-luxury-script text-[#102042]"
                    style={{
                      fontSize: '96px',
                      textShadow: '0 2px 4px rgba(16, 32, 66, 0.08)',
                    }}
                  >
                    Mourad
                  </span>
                  <span className="inline-flex items-center gap-[12px] my-[2px]">
                    <span className="text-[#8E2D42] text-[18px]" aria-hidden="true">
                      ♥
                    </span>
                    <span
                      className="font-luxury-serif italic font-semibold text-[#BA8C37]"
                      style={{ fontSize: '46px', lineHeight: 1 }}
                    >
                      &amp;
                    </span>
                    <span className="text-[#8E2D42] text-[18px]" aria-hidden="true">
                      ♥
                    </span>
                  </span>
                  <span
                    className="font-luxury-script text-[#913044]"
                    style={{
                      fontSize: '92px',
                      textShadow: '0 2px 4px rgba(145, 48, 68, 0.08)',
                    }}
                  >
                    Dounia
                  </span>
                </h1>

                {nameShimmerOpacity > 0.01 && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none mix-blend-screen"
                    style={{
                      opacity: nameShimmerOpacity,
                      background: `linear-gradient(110deg, transparent ${nameShimmerPos - 25}%, rgba(255, 240, 198, 0.78) ${nameShimmerPos}%, transparent ${nameShimmerPos + 25}%)`,
                    }}
                  />
                )}
              </div>

              {/* 4. Gold Scrollwork Divider */}
              <div
                className="flex items-center justify-center w-[280px] mb-[12px]"
                style={{
                  opacity: dividerT,
                  transform: `scaleX(${lerp(0.4, 1, dividerT)})`,
                }}
              >
                <svg width="260" height="22" viewBox="0 0 260 22" fill="none" aria-hidden="true">
                  <path
                    d="M10 11 H108 M152 11 H250"
                    stroke="#BA8D3A"
                    strokeOpacity="0.7"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M114 11 C120 4, 126 18, 130 11 C134 4, 140 18, 146 11"
                    stroke="#BA8D3A"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <circle cx="130" cy="11" r="2.5" fill="#BA8D3A" />
                </svg>
              </div>

              {/* 5. Wedding Date (JEUDI + 28 JANVIER 2027 in deep burgundy) */}
              <div
                className="flex flex-col items-center mb-[14px]"
                style={{
                  opacity: dateT,
                  transform: `translate3d(0, ${(1 - dateT) * 10}px, 0)`,
                }}
              >
                <div className="flex items-center justify-center gap-[14px] w-[360px] mb-[4px]">
                  <div className="h-[1px] flex-1 bg-[#BA8D3A]/65" />
                  <span className="font-luxury-serif uppercase text-[20px] font-semibold tracking-[0.18em] text-[#3B2E25]">
                    JEUDI
                  </span>
                  <div className="h-[1px] flex-1 bg-[#BA8D3A]/65" />
                </div>
                <p
                  className="font-luxury-serif uppercase m-0 text-[#7D2238] tracking-[0.06em]"
                  style={{ fontSize: '38px', fontWeight: 600 }}
                >
                  28 JANVIER 2027
                </p>
                <div className="flex items-center justify-center gap-[12px] w-[360px] mt-[4px]">
                  <div className="h-[1px] flex-1 bg-[#BA8D3A]/65" />
                  <span className="text-[#BA8D3A] text-[15px]" aria-hidden="true">
                    ♥
                  </span>
                  <div className="h-[1px] flex-1 bg-[#BA8D3A]/65" />
                </div>
              </div>

              {/* 6. Venue Block with Gold Anchor & Directions Link */}
              <div
                className="flex flex-col items-center mb-[14px]"
                style={{
                  opacity: venueT,
                  transform: `translate3d(0, ${(1 - venueT) * 10}px, 0)`,
                }}
              >
                <span className="font-luxury-serif uppercase text-[22px] font-semibold text-[#332820] tracking-[0.1em]">
                  {INVITATION_COPY.venueLines[0]}
                </span>

                <div className="inline-flex items-center justify-center gap-[12px] my-[2px]">
                  <span
                    className="font-luxury-script text-[#102042] leading-[1.08]"
                    style={{ fontSize: '54px' }}
                  >
                    le petit port
                  </span>
                  {/* Metallic Gold Anchor Icon */}
                  <svg
                    width="34"
                    height="40"
                    viewBox="0 0 36 42"
                    fill="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="cardAnchorGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E6C67E" />
                        <stop offset="50%" stopColor="#B88A34" />
                        <stop offset="100%" stopColor="#8C6420" />
                      </linearGradient>
                    </defs>
                    <circle cx="18" cy="7" r="4" stroke="url(#cardAnchorGold)" strokeWidth="2.5" />
                    <line x1="18" y1="11" x2="18" y2="35" stroke="url(#cardAnchorGold)" strokeWidth="2.8" strokeLinecap="round" />
                    <line x1="9" y1="17" x2="27" y2="17" stroke="url(#cardAnchorGold)" strokeWidth="2.6" strokeLinecap="round" />
                    <path
                      d="M 6,25 C 7,34 13,37 18,35 C 23,37 29,34 30,25"
                      stroke="url(#cardAnchorGold)"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    />
                    <polygon points="4,26 8,22 9,28" fill="#B88A34" />
                    <polygon points="32,26 28,22 27,28" fill="#B88A34" />
                  </svg>
                </div>

                <span className="font-luxury-serif uppercase text-[21px] font-semibold text-[#332820] tracking-[0.14em]">
                  • {INVITATION_COPY.venueLines[2]} •
                </span>

                <a
                  href={VENUE_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Voir l'itinéraire vers Salle des Fêtes Le Petit Port, Krystel, Oran sur Google Maps"
                  className="mt-[10px] inline-flex items-center justify-center gap-[8px] px-[18px] py-[7px] rounded-[4px] border border-[#B88B38]/55 bg-[#FAF4E6]/90 hover:bg-[#EFE2C6] text-[#102042] hover:text-[#7D2238] text-[19px] font-luxury-serif font-semibold tracking-[0.04em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88B38] whitespace-nowrap"
                  style={{
                    opacity: directionsT,
                    transform: `translate3d(0, ${(1 - directionsT) * 8}px, 0)`,
                    pointerEvents: directionsT > 0.25 && mainAlpha > 0.35 ? 'auto' : 'none',
                  }}
                >
                  <MapPin className="w-[17px] h-[17px] text-[#B88B38]" aria-hidden="true" />
                  <span>{INVITATION_COPY.directionsLabel}</span>
                </a>
              </div>

              {/* 7. Closing Wish inside Card + Bottom Heart Flourish */}
              <div
                className="flex flex-col items-center max-w-[465px]"
                style={{
                  opacity: closing1T,
                  transform: `translate3d(0, ${(1 - closing1T) * 9}px, 0)`,
                }}
              >
                <p
                  className="font-luxury-serif italic m-0 text-[#3B2E25] leading-[1.38]"
                  style={{ fontSize: '23px' }}
                >
                  {INVITATION_COPY.closingFirst}
                </p>
                <div className="flex items-center justify-center gap-[10px] mt-[8px]">
                  <div className="w-[36px] h-[1px] bg-[#BA8D3A]/65" />
                  <span className="text-[#BA8D3A] text-[16px]" aria-hidden="true">
                    ♥
                  </span>
                  <div className="w-[36px] h-[1px] bg-[#BA8D3A]/65" />
                </div>
              </div>
            </div>

            {/* B. Crossfaded Couple Quote & Welcome Section */}
            {quoteAlpha > 0.005 && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-[18px] pb-[44px] pointer-events-none"
                style={{
                  opacity: quoteAlpha,
                  transform: `translate3d(0, ${quoteShiftY}px, 0) scale(${lerp(0.985, 1, quoteAlpha)})`,
                }}
              >
                <p className="font-luxury-serif uppercase tracking-[0.22em] text-[18px] text-[#8E6A2C] font-semibold m-0 mb-[28px]">
                  {INVITATION_COPY.welcomeSubtitle}
                </p>

                <blockquote className="font-luxury-serif italic m-0 text-[#2A221C] leading-[1.58] max-w-[465px] text-[31px]">
                  {INVITATION_COPY.coupleQuote}
                </blockquote>

                <div className="flex items-center justify-center gap-[12px] w-[180px] my-[32px]">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#BA8D3A]/75" />
                  <span className="text-[#8E2D42] text-[16px]" aria-hidden="true">
                    ♥
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#BA8D3A]/75" />
                </div>

                <p className="font-luxury-script m-0 text-[58px] leading-[1.15]">
                  <span className="text-[#102042]">Mourad</span>{' '}
                  <span className="font-luxury-serif italic text-[#BA8C37] text-[40px] mx-[4px]">
                    &amp;
                  </span>{' '}
                  <span className="text-[#913044]">Dounia</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LAYER 3 (z: 12): Deep Navy Envelope Front Pocket with Gold Piping */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '180px',
          top: `${envelopeTop}px`,
          width: '720px',
          height: '920px',
          transform: `scale(${envelopeScale})`,
          transformOrigin: 'top center',
          zIndex: 12,
        }}
      >
        <svg viewBox="0 0 720 920" className="w-full h-full block overflow-visible">
          <defs>
            <linearGradient id="navyPocketBase" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#162A52" />
              <stop offset="55%" stopColor="#101F3F" />
              <stop offset="100%" stopColor="#0A152C" />
            </linearGradient>
            <linearGradient id="navyPocketLower" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#192F5B" />
              <stop offset="100%" stopColor="#0D1A35" />
            </linearGradient>
          </defs>

          <path
            d="M 0,0 Q 360,54 720,0 L 720,920 L 0,920 Z"
            fill="url(#navyPocketBase)"
            stroke="rgba(213, 175, 99, 0.55)"
            strokeWidth="1.4"
          />

          {/* Side triangular paper flaps */}
          <polygon
            points="0,0 265,455 0,920"
            fill="rgba(28, 50, 96, 0.42)"
            stroke="rgba(213, 175, 99, 0.25)"
            strokeWidth="1.2"
          />
          <polygon
            points="720,0 455,455 720,920"
            fill="rgba(9, 17, 36, 0.42)"
            stroke="rgba(213, 175, 99, 0.25)"
            strokeWidth="1.2"
          />

          {/* Lower trapezoidal envelope pocket flap */}
          <path
            d="M 0,920 L 295,462 C 332,406 388,406 425,462 L 720,920 Z"
            fill="url(#navyPocketLower)"
            stroke="rgba(213, 175, 99, 0.45)"
            strokeWidth="1.4"
          />
        </svg>
      </div>

      {/* LAYER 4 (z: 20): Foreground Navy Satin Sash & Blush/Navy/Gold Floral Corner */}
      <BallroomCorners time={ambientTime} />

      {/* LAYER 4.2 (z: 22): Navy & Gold Nautical Anchor Medallion Seal */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '180px',
          top: `${envelopeTop}px`,
          width: '720px',
          height: '920px',
          transform: `scale(${envelopeScale})`,
          transformOrigin: 'top center',
          zIndex: 22,
        }}
      >
        <div
          className="absolute"
          style={{
            left: '360px',
            top: `${sealLocalY}px`,
            transform: `translate(-50%, -50%) scale(${sealLiftPulse})`,
          }}
        >
          <WaxSeal size={196} glintProgress={sealGlint} />
        </div>
      </div>

      {/* LAYER 4.5 (z: 24): Subtle Shimmering Champagne-Gold Particles */}
      <GoldParticlesLayer time={ambientTime} />

      {/* LAYER 5 (z: 30): Delicate Butterflies Flying Gently Around Invitation */}
      <ButterflyLayer time={ambientTime} />
    </div>
  );
};
