import React from 'react';
import { INVITATION_COPY, easeOutCubic, progressIn } from '../constants/invitation';

interface BallroomCornersProps {
  time: number;
}

/**
 * Foreground bottom corners matching the uploaded luxury ballroom reference:
 * - Bottom-left: flowing deep navy satin drape with gold piping & closing message
 * - Bottom-right: blush pink & ivory garden roses with navy and gold-foil foliage
 */
export const BallroomCorners: React.FC<BallroomCornersProps> = ({ time }) => {
  const sashReveal = easeOutCubic(progressIn(time, 11.8, 13.4));
  const floralSway = Math.sin(time * 0.75) * 1.4;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      {/* Bottom-Left Deep Navy Satin Drape + Gold Piping */}
      <svg
        viewBox="0 0 1080 1920"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="navySashMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B305C" />
            <stop offset="48%" stopColor="#0E1B37" />
            <stop offset="100%" stopColor="#081124" />
          </linearGradient>
          <linearGradient id="navySashFold" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0B162D" />
            <stop offset="55%" stopColor="#1F3666" />
            <stop offset="100%" stopColor="#122346" />
          </linearGradient>
          <linearGradient id="sashGoldPiping" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3DC9E" />
            <stop offset="50%" stopColor="#C89B49" />
            <stop offset="100%" stopColor="#EBD08E" />
          </linearGradient>
          <linearGradient id="goldLeafBotanical" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9C7228" />
            <stop offset="50%" stopColor="#DFBA6B" />
            <stop offset="100%" stopColor="#F7E5B4" />
          </linearGradient>
          <linearGradient id="navyLeafBotanical" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0B162D" />
            <stop offset="65%" stopColor="#1A2F5A" />
            <stop offset="100%" stopColor="#284274" />
          </linearGradient>
          <radialGradient id="blushRoseGrad" cx="40%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#FBE7E6" />
            <stop offset="55%" stopColor="#E7B3B4" />
            <stop offset="100%" stopColor="#C68488" />
          </radialGradient>
          <radialGradient id="ivoryRoseGrad" cx="42%" cy="36%" r="65%">
            <stop offset="0%" stopColor="#FFFDF8" />
            <stop offset="60%" stopColor="#F2E4D1" />
            <stop offset="100%" stopColor="#D6BE9F" />
          </radialGradient>
        </defs>

        {/* Bottom-left satin fabric waves */}
        <g style={{ filter: 'drop-shadow(0 -8px 22px rgba(6, 11, 24, 0.55))' }}>
          <path
            d="M -20,1605 C 145,1675 295,1750 475,1825 C 585,1870 675,1905 745,1940 L -20,1940 Z"
            fill="url(#navySashMain)"
          />
          <path
            d="M -20,1690 C 120,1748 255,1815 410,1875 C 485,1904 545,1922 615,1940 L -20,1940 Z"
            fill="url(#navySashFold)"
            opacity="0.88"
          />
          {/* Gold satin edge trim */}
          <path
            d="M -10,1608 C 150,1678 298,1752 478,1827 C 585,1871 672,1906 742,1938"
            fill="none"
            stroke="url(#sashGoldPiping)"
            strokeWidth="3.2"
          />
          <path
            d="M -10,1622 C 138,1690 278,1762 448,1834"
            fill="none"
            stroke="url(#sashGoldPiping)"
            strokeWidth="1.2"
            opacity="0.55"
          />
        </g>

        {/* Bottom-Right Blush Pink, Ivory Roses & Navy/Gold Foliage */}
        <g
          transform={`translate(0, ${floralSway})`}
          style={{ filter: 'drop-shadow(-6px 10px 20px rgba(7, 12, 26, 0.45))' }}
        >
          {/* Gold foil fern/laurel sprays */}
          <g fill="url(#goldLeafBotanical)">
            <ellipse cx="835" cy="1615" rx="11" ry="30" transform="rotate(-18 835 1615)" />
            <ellipse cx="868" cy="1588" rx="9" ry="26" transform="rotate(-6 868 1588)" />
            <ellipse cx="806" cy="1652" rx="10" ry="25" transform="rotate(-34 806 1652)" />
            <ellipse cx="968" cy="1615" rx="10" ry="28" transform="rotate(24 968 1615)" />
            <ellipse cx="1015" cy="1675" rx="10" ry="26" transform="rotate(42 1015 1675)" />
          </g>

          {/* Deep navy leaves */}
          <g fill="url(#navyLeafBotanical)">
            <ellipse cx="772" cy="1755" rx="18" ry="42" transform="rotate(-55 772 1755)" />
            <ellipse cx="755" cy="1835" rx="17" ry="40" transform="rotate(-76 755 1835)" />
            <ellipse cx="905" cy="1655" rx="16" ry="38" transform="rotate(14 905 1655)" />
            <ellipse cx="1028" cy="1735" rx="18" ry="40" transform="rotate(48 1028 1735)" />
            <ellipse cx="825" cy="1895" rx="18" ry="38" transform="rotate(-64 825 1895)" />
          </g>

          {/* Delicate ivory baby's breath accents */}
          <g fill="#FFF9F0" opacity="0.9">
            <circle cx="888" cy="1672" r="4.5" />
            <circle cx="904" cy="1660" r="3.8" />
            <circle cx="805" cy="1720" r="4.2" />
            <circle cx="792" cy="1736" r="3.5" />
            <circle cx="998" cy="1712" r="4.5" />
            <circle cx="1012" cy="1698" r="3.8" />
            <circle cx="882" cy="1878" r="4" />
          </g>

          {/* Main Blush Garden Rose (upper-left of bouquet) */}
          <g transform="translate(862, 1752)">
            <circle cx="0" cy="0" r="66" fill="url(#blushRoseGrad)" />
            <path
              d="M-38,-22 C-24,-46 22,-48 40,-20 C50,0 44,32 18,44 C-14,52 -46,34 -46,4 C-46,-8 -42,-16 -38,-22 Z"
              fill="#E5B0B1"
              stroke="#C9888B"
              strokeWidth="1.2"
            />
            <path
              d="M-24,-14 C-14,-30 16,-30 26,-12 C32,2 24,22 4,26 C-16,28 -30,12 -24,-14 Z"
              fill="#F1CACA"
              stroke="#CC8E91"
              strokeWidth="1.1"
            />
            <path
              d="M-12,-6 C-6,-16 10,-16 14,-4 C16,8 4,16 -6,12 C-14,8 -16,0 -12,-6 Z"
              fill="#DC9A9D"
            />
            <circle cx="0" cy="0" r="6" fill="#C47C80" />
          </g>

          {/* Cream Ivory Rose (right-upper of bouquet) */}
          <g transform="translate(972, 1775)">
            <circle cx="0" cy="0" r="56" fill="url(#ivoryRoseGrad)" />
            <path
              d="M-32,-18 C-20,-38 18,-38 32,-18 C40,0 34,26 14,34 C-12,42 -38,26 -38,2 Z"
              fill="#F5E9D8"
              stroke="#CBB394"
              strokeWidth="1.1"
            />
            <path
              d="M-18,-10 C-10,-24 14,-22 20,-8 C24,6 16,18 2,20 C-14,20 -22,6 -18,-10 Z"
              fill="#FFFDF8"
              stroke="#D8C2A5"
              strokeWidth="1"
            />
            <circle cx="0" cy="0" r="7" fill="#E3CCA9" />
          </g>

          {/* Lower Blush Rose */}
          <g transform="translate(918, 1852)">
            <circle cx="0" cy="0" r="54" fill="url(#blushRoseGrad)" />
            <path
              d="M-30,-16 C-18,-36 18,-36 30,-16 C38,2 30,26 10,32 C-14,38 -36,22 -36,0 Z"
              fill="#EEBEBF"
              stroke="#C9888B"
              strokeWidth="1.1"
            />
            <path
              d="M-14,-8 C-6,-18 12,-18 16,-6 C18,6 8,16 -4,14 C-14,12 -18,0 -14,-8 Z"
              fill="#F9DCD9"
            />
            <circle cx="0" cy="0" r="6" fill="#CA8488" />
          </g>
        </g>
      </svg>

      {/* Bottom-left Satin Ribbon Text ("On a hâte de partager ce moment inoubliable avec vous !") */}
      <div
        className="absolute left-[46px] bottom-[84px] max-w-[335px] text-center"
        style={{
          opacity: sashReveal,
          transform: `translate3d(0, ${(1 - sashReveal) * 10}px, 0) rotate(-3deg)`,
        }}
      >
        <p
          className="font-luxury-serif italic m-0 text-[#FBF5E9] leading-[1.38]"
          style={{
            fontSize: '23px',
            textShadow: '0 2px 10px rgba(6, 12, 26, 0.75)',
          }}
        >
          {INVITATION_COPY.closingSecond}{' '}
          <span className="not-italic text-[#E58B94]" aria-hidden="true">
            ♥
          </span>
        </p>
      </div>
    </div>
  );
};
