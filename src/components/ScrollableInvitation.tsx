import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarPlus,
  Check,
  ChevronDown,
  Clock,
  Download,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  Music,
  RotateCcw,
  Sparkles,
  Utensils,
} from 'lucide-react';
import {
  ASSETS,
  EVENING_SCHEDULE,
  INVITATION_COPY,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  VENUE_DIRECTIONS_URL,
  VENUE_GPS_COORDS,
  WEDDING_TARGET_DATE,
  getWhatsAppShareUrl,
} from '../constants/invitation';
import {
  downloadAppleCalendarIcs,
  getGoogleCalendarUrl,
} from '../utils/calendar';
import { ButterflyLayer } from './ButterflyLayer';
import { GoldParticlesLayer } from './GoldParticlesLayer';
import { RsvpSection, RsvpSubmission } from './RsvpSection';
import { WaxSeal } from './WaxSeal';

interface ScrollableInvitationProps {
  ambientTime: number;
  paperDataUrl: string | null;
  savedRsvp: RsvpSubmission | null;
  onSubmitRsvp: (data: RsvpSubmission) => void;
  onReplayOpening: () => void;
  prefersReducedMotion: boolean;
}

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeCountdown(): CountdownValues {
  const target = new Date(WEDDING_TARGET_DATE).getTime();
  const diff = Math.max(0, target - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 34,
    scale: 0.975,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
      when: 'beforeChildren' as const,
      staggerChildren: 0.09,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const ScrollRevealCard: React.FC<{
  id?: string;
  children: React.ReactNode;
  className?: string;
  reducedMotion?: boolean;
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  immediate?: boolean;
}> = ({
  id,
  children,
  className = '',
  reducedMotion = false,
  scrollRootRef,
  immediate = false,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(
    reducedMotion || immediate
  );

  useEffect(() => {
    if (reducedMotion || immediate || isVisible) return;
    const node = sectionRef.current;
    const root = scrollRootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        root: root ?? null,
        threshold: 0.16,
        rootMargin: '0px 0px -36px 0px',
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion, immediate, isVisible, scrollRootRef]);

  if (reducedMotion) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      ref={sectionRef}
      id={id}
      variants={cardVariants}
      initial={immediate ? { opacity: 0, y: 18, scale: 0.985, filter: 'blur(2px)' } : 'hidden'}
      animate={isVisible ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  );
};

const RevealItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  reducedMotion?: boolean;
}> = ({ children, className = '', reducedMotion = false }) => {
  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};

export const ScrollableInvitation: React.FC<ScrollableInvitationProps> = ({
  ambientTime,
  paperDataUrl,
  savedRsvp,
  onSubmitRsvp,
  onReplayOpening,
  prefersReducedMotion,
}) => {
  const [countdown, setCountdown] = useState<CountdownValues>(computeCountdown);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isRsvpVisible, setIsRsvpVisible] = useState(false);
  const [ambientScale, setAmbientScale] = useState(0.5);
  const [scrollProgress, setScrollProgress] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const rsvpAnchorRef = useRef<HTMLDivElement | null>(null);
  const calendarMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown(computeCountdown());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      const s = Math.max(rect.width / STAGE_WIDTH, rect.height / STAGE_HEIGHT);
      setAmbientScale(s);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const target = rsvpAnchorRef.current;
    const root = scrollContainerRef.current;
    if (!target || !root) return;

    const io = new IntersectionObserver(
      (entries) => {
        setIsRsvpVisible(entries[0]?.isIntersecting ?? false);
      },
      { root, threshold: 0.2 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) {
        setScrollProgress(0);
        return;
      }
      setScrollProgress(Math.min(1, Math.max(0, container.scrollTop / maxScroll)));
    };
    onScroll();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isCalendarOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        calendarMenuRef.current &&
        !calendarMenuRef.current.contains(e.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isCalendarOpen]);

  const scrollToSection = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  const paperOverlayStyle = paperDataUrl
    ? {
        backgroundImage: `url(${paperDataUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  return (
    <div className="relative flex-1 w-full min-h-0 overflow-hidden">
      {/* Fixed candlelit ballroom & midnight-navy atmospheric backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#0D172E]">
        <img
          src={ASSETS.ballroomBackdrop}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top opacity-45 blur-[10px] scale-105"
          draggable={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11, 20, 42, 0.72) 0%, rgba(12, 22, 46, 0.88) 48%, rgba(9, 17, 36, 0.94) 100%)',
          }}
        />
      </div>

      {/* Fixed ambient butterflies & gold dust floating around the scrollable invitation */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-20"
        aria-hidden="true"
      >
        <div
          style={{
            width: `${STAGE_WIDTH}px`,
            height: `${STAGE_HEIGHT}px`,
            transform: `scale(${ambientScale})`,
            transformOrigin: 'center center',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <GoldParticlesLayer time={ambientTime} />
          <ButterflyLayer time={ambientTime} />
        </div>
      </div>

      {/* Subtle golden reading-progress hairline */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-[2px] z-30 bg-[#C89D4C]/15 pointer-events-none"
      >
        <div
          className="h-full bg-gradient-to-r from-[#BA8C37] via-[#F2DFB4] to-[#D4AC5D] transition-[width] duration-150 ease-out"
          style={{ width: `${Math.round(scrollProgress * 100)}%` }}
        />
      </div>

      {/* Main Scrollable Column ("gliss down to see every details one by one") */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 h-full w-full overflow-y-auto scroll-smooth px-3.5 sm:px-5 pt-3.5 pb-24"
      >
        <div className="w-full max-w-[440px] mx-auto space-y-5">
          {/* ÉTAPE 1 — Wedding Invitation Card, Bride & Groom Names & Wedding Date */}
          <ScrollRevealCard
            id="step-hero"
            immediate
            scrollRootRef={scrollContainerRef}
            reducedMotion={prefersReducedMotion}
            className="relative rounded-2xl bg-[#FAF4E7] border-2 border-[#D4AC5D]/85 shadow-[0_24px_60px_rgba(3,6,16,0.62)] overflow-hidden px-6 pt-8 pb-7 text-center"
          >
            {paperOverlayStyle && (
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-25 mix-blend-multiply pointer-events-none"
                style={paperOverlayStyle}
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-[8px] rounded-xl border border-[#C89D4C]/45 pointer-events-none"
            />

            <div className="relative z-10 flex flex-col items-center">
              {/* Top Heart & Botanical Scroll Crest */}
              <svg
                width="136"
                height="32"
                viewBox="0 0 160 38"
                fill="none"
                aria-hidden="true"
                className="mb-3"
              >
                <path
                  d="M12 22 C28 22, 34 12, 48 16 C56 18, 60 25, 68 23"
                  stroke="#B88B38"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path
                  d="M148 22 C132 22, 126 12, 112 16 C104 18, 100 25, 92 23"
                  stroke="#B88B38"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path
                  d="M80 28 C80 28 70 21 70 14.5 C70 11 72.8 8.5 76 8.5 C78 8.5 79.4 9.8 80 11.4 C80.6 9.8 82 8.5 84 8.5 C87.2 8.5 90 11 90 14.5 C90 21 80 28 80 28 Z"
                  stroke="#B88B38"
                  strokeWidth="1.6"
                  fill="rgba(210, 170, 92, 0.16)"
                />
              </svg>

              <p className="font-luxury-serif uppercase text-[13px] font-semibold tracking-[0.1em] text-[#2A221C] leading-[1.45] max-w-[310px] m-0">
                {INVITATION_COPY.intro}
              </p>
              <span className="text-[#BA8D3A] text-sm my-1" aria-hidden="true">
                ♥
              </span>

              {/* Bride & Groom Names */}
              <h1 className="m-0 font-normal flex flex-col items-center leading-[0.94] my-2">
                <span className="font-luxury-script text-[62px] sm:text-[68px] text-[#102042]">
                  Mourad
                </span>
                <span className="inline-flex items-center gap-2.5 my-1">
                  <span className="text-[#8E2D42] text-sm" aria-hidden="true">
                    ♥
                  </span>
                  <span className="font-luxury-serif italic font-semibold text-[#BA8C37] text-[30px] leading-none">
                    &amp;
                  </span>
                  <span className="text-[#8E2D42] text-sm" aria-hidden="true">
                    ♥
                  </span>
                </span>
                <span className="font-luxury-script text-[60px] sm:text-[66px] text-[#913044]">
                  Dounia
                </span>
              </h1>

              {/* Gold Divider */}
              <div className="flex items-center justify-center gap-3 w-52 my-3">
                <div className="h-[1px] flex-1 bg-[#BA8D3A]/60" />
                <span className="text-[#BA8D3A] text-xs" aria-hidden="true">
                  ✦
                </span>
                <div className="h-[1px] flex-1 bg-[#BA8D3A]/60" />
              </div>

              {/* Wedding Date */}
              <div className="flex flex-col items-center mb-5">
                <span className="font-luxury-serif uppercase text-[14px] font-semibold tracking-[0.22em] text-[#3B2E25]">
                  JEUDI
                </span>
                <p className="font-luxury-serif uppercase m-0 mt-0.5 text-[28px] sm:text-[30px] font-semibold tracking-[0.06em] text-[#7D2238]">
                  28 JANVIER 2027
                </p>
              </div>

              {/* Gentle Swipe / Scroll Down Cue */}
              <button
                type="button"
                onClick={() => scrollToSection('step-countdown')}
                className="inline-flex flex-col items-center gap-1 text-[#8E6A2C] hover:text-[#7D2238] transition-colors cursor-pointer bg-transparent border-0 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88B38]"
              >
                <span className="font-luxury-serif italic text-[15px]">
                  {INVITATION_COPY.scrollHint}
                </span>
                <ChevronDown
                  className="w-4 h-4 animate-bounce"
                  aria-hidden="true"
                />
              </button>
            </div>
          </ScrollRevealCard>

          {/* ÉTAPE 2 — Compte à rebours (Countdown) */}
          <ScrollRevealCard
            id="step-countdown"
            scrollRootRef={scrollContainerRef}
            reducedMotion={prefersReducedMotion}
            className="relative rounded-2xl bg-[#FAF4E7] border border-[#D4AC5D]/75 shadow-[0_20px_50px_rgba(3,6,16,0.52)] overflow-hidden px-5 py-7 text-center"
          >
            {paperOverlayStyle && (
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none"
                style={paperOverlayStyle}
              />
            )}
            <div className="relative z-10">
              <RevealItem reducedMotion={prefersReducedMotion}>
                <div className="inline-flex items-center gap-2 text-[#9A7A42] mb-1">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="font-luxury-serif uppercase tracking-[0.2em] text-[11px] font-semibold">
                    En attendant le grand jour
                  </span>
                </div>
                <h2 className="font-luxury-serif text-[26px] font-semibold text-[#102042] m-0 mb-4">
                  Compte à rebours
                </h2>
              </RevealItem>

              <RevealItem reducedMotion={prefersReducedMotion}>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Jours', value: countdown.days },
                    { label: 'Heures', value: countdown.hours },
                    { label: 'Minutes', value: countdown.minutes },
                    { label: 'Secondes', value: countdown.seconds },
                  ].map((unit) => (
                    <div
                      key={unit.label}
                      className="rounded-xl bg-[#F2E9D6] border border-[#D4AC5D]/50 py-3 px-1.5 flex flex-col items-center"
                    >
                      <span className="font-luxury-serif text-[28px] sm:text-[32px] font-semibold leading-none text-[#7D2238] tabular-nums">
                        {String(unit.value).padStart(2, '0')}
                      </span>
                      <span className="mt-1.5 text-[10px] uppercase tracking-[0.12em] font-medium text-[#5C4E41]">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              </RevealItem>
            </div>
          </ScrollRevealCard>

          {/* ÉTAPE 3 — Lieu de réception & Messages romantiques */}
          <ScrollRevealCard
            id="step-venue-messages"
            scrollRootRef={scrollContainerRef}
            reducedMotion={prefersReducedMotion}
            className="relative rounded-2xl bg-[#FAF4E7] border border-[#D4AC5D]/75 shadow-[0_20px_50px_rgba(3,6,16,0.52)] overflow-hidden px-6 py-7 text-center"
          >
            {paperOverlayStyle && (
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none"
                style={paperOverlayStyle}
              />
            )}
            <div className="relative z-10 flex flex-col items-center">
              <span className="font-luxury-serif uppercase text-[14px] font-semibold tracking-[0.14em] text-[#332820]">
                {INVITATION_COPY.venueLines[0]}
              </span>

              <div className="inline-flex items-center justify-center gap-2.5 my-1">
                <span className="font-luxury-script text-[44px] text-[#102042] leading-[1.08]">
                  le petit port
                </span>
                <svg
                  width="24"
                  height="28"
                  viewBox="0 0 36 42"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="18" cy="7" r="4" stroke="#B88A34" strokeWidth="2.5" />
                  <line
                    x1="18"
                    y1="11"
                    x2="18"
                    y2="35"
                    stroke="#B88A34"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <line
                    x1="9"
                    y1="17"
                    x2="27"
                    y2="17"
                    stroke="#B88A34"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 6,25 C 7,34 13,37 18,35 C 23,37 29,34 30,25"
                    stroke="#B88A34"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span className="font-luxury-serif uppercase text-[14px] font-semibold tracking-[0.16em] text-[#332820]">
                • {INVITATION_COPY.venueLines[2]} •
              </span>

              <div className="flex items-center justify-center gap-3 w-40 my-4">
                <div className="h-[1px] flex-1 bg-[#BA8D3A]/60" />
                <Heart
                  className="w-3.5 h-3.5 text-[#8E2D42] fill-[#8E2D42]/20"
                  aria-hidden="true"
                />
                <div className="h-[1px] flex-1 bg-[#BA8D3A]/60" />
              </div>

              {/* Romantic Messages */}
              <RevealItem reducedMotion={prefersReducedMotion}>
                <p className="font-luxury-serif italic text-[19px] text-[#3B2E25] leading-[1.4] m-0 max-w-[330px]">
                  {INVITATION_COPY.closingFirst}
                </p>
              </RevealItem>

              <RevealItem reducedMotion={prefersReducedMotion} className="w-full">
                <blockquote className="mt-4 mb-0 px-3 py-3 rounded-xl bg-[#F3EAD8]/80 border border-[#D4AC5D]/40 font-luxury-serif italic text-[18px] text-[#2A221C] leading-[1.5]">
                  {INVITATION_COPY.coupleQuote}
                </blockquote>
              </RevealItem>
            </div>
          </ScrollRevealCard>

          {/* ÉTAPE 4 — Localisation, Google Maps & Ajouter au calendrier */}
          <ScrollRevealCard
            id="step-location"
            scrollRootRef={scrollContainerRef}
            reducedMotion={prefersReducedMotion}
            className="relative rounded-2xl bg-[#FAF4E7] border border-[#D4AC5D]/75 shadow-[0_20px_50px_rgba(3,6,16,0.52)] overflow-visible px-5 py-6 text-center"
          >
            <div className="mb-3">
              <p className="font-luxury-serif uppercase tracking-[0.18em] text-[11px] text-[#9A7A42] font-semibold m-0">
                Lieu &amp; Accès
              </p>
              <h2 className="font-luxury-serif text-[25px] font-semibold text-[#102042] m-0 mt-0.5">
                Nous rejoindre à Oran
              </h2>
            </div>

            {/* Interactive Stylized Location Preview Card */}
            <a
              href={VENUE_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ouvrir Google Maps vers Le Petit Port, Krystel, Oran"
              className="group block relative rounded-xl overflow-hidden border border-[#D4AC5D]/65 bg-[#112246] text-left shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88B38]"
            >
              <div className="relative h-44 w-full overflow-hidden">
                {/* Stylized coastal map illustration for Krystel / Le Petit Port, Oran */}
                <svg
                  viewBox="0 0 400 180"
                  className="w-full h-full object-cover"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="seaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#142B59" />
                      <stop offset="100%" stopColor="#0C1B3B" />
                    </linearGradient>
                    <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F3EAD8" />
                      <stop offset="100%" stopColor="#E6D8BC" />
                    </linearGradient>
                  </defs>
                  {/* Mediterranean Sea */}
                  <rect width="400" height="180" fill="url(#seaGrad)" />
                  {/* Subtle grid lines */}
                  <g stroke="#294885" strokeOpacity="0.35" strokeWidth="0.7">
                    <line x1="0" y1="45" x2="400" y2="45" />
                    <line x1="0" y1="90" x2="400" y2="90" />
                    <line x1="0" y1="135" x2="400" y2="135" />
                    <line x1="100" y1="0" x2="100" y2="180" />
                    <line x1="200" y1="0" x2="200" y2="180" />
                    <line x1="300" y1="0" x2="300" y2="180" />
                  </g>
                  {/* Coastline of Krystel, Oran */}
                  <path
                    d="M 0,108 Q 70,96 135,104 T 265,92 Q 335,84 400,65 L 400,180 L 0,180 Z"
                    fill="url(#landGrad)"
                  />
                  {/* Coastal road */}
                  <path
                    d="M 0,136 Q 90,122 185,124 T 400,98"
                    fill="none"
                    stroke="#C89D4C"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                  />
                  {/* Secondary road */}
                  <path
                    d="M 198,123 L 222,180"
                    fill="none"
                    stroke="#B88B38"
                    strokeOpacity="0.6"
                    strokeWidth="2"
                  />
                  {/* Location Pulse Ring */}
                  <circle
                    cx="200"
                    cy="94"
                    r="22"
                    fill="#B88B38"
                    fillOpacity="0.22"
                    stroke="#D4AC5D"
                    strokeOpacity="0.7"
                    strokeWidth="1.2"
                  />
                </svg>

                {/* Center Map Pin */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pb-3 pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-[#7D2238] border-2 border-[#FAF4E7] shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-4 h-4 text-[#F2DFB4]" />
                  </div>
                  <span className="mt-1.5 px-2.5 py-0.5 rounded-md bg-[#102042]/92 border border-[#D4AC5D]/60 text-[#FAF4E7] text-[11px] font-medium shadow">
                    Le Petit Port • Krystel, Oran
                  </span>
                </div>

                {/* Coordinates badge */}
                <div className="absolute bottom-2 right-2.5 px-2 py-0.5 rounded bg-[#0C1832]/85 text-[#E8CE8E] text-[10px] font-mono">
                  GPS {VENUE_GPS_COORDS}
                </div>
              </div>
            </a>

            {/* Action Buttons right under the map */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3.5">
              <a
                href={VENUE_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#7D2238] hover:bg-[#913044] text-[#FAF4E7] text-xs font-medium tracking-[0.04em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88B38]"
              >
                <MapPin className="w-3.5 h-3.5 text-[#E8CE8E]" aria-hidden="true" />
                <span>{INVITATION_COPY.directionsLabel}</span>
              </a>

              <div ref={calendarMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen((prev) => !prev)}
                  aria-expanded={isCalendarOpen}
                  aria-haspopup="menu"
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#122244] hover:bg-[#19305E] text-[#FAF4E7] text-xs font-medium tracking-[0.04em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88B38] cursor-pointer"
                >
                  <CalendarPlus
                    className="w-3.5 h-3.5 text-[#E8CE8E]"
                    aria-hidden="true"
                  />
                  <span>Ajouter au calendrier</span>
                </button>

                {isCalendarOpen && (
                  <div
                    role="menu"
                    aria-label="Choisir un calendrier"
                    className="absolute bottom-full left-0 right-0 mb-2 rounded-lg bg-[#162442] border border-[#C89D4C]/60 shadow-[0_12px_32px_rgba(3,6,16,0.55)] p-1.5 z-50 flex flex-col gap-1 text-left"
                  >
                    <a
                      role="menuitem"
                      href={getGoogleCalendarUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsCalendarOpen(false)}
                      className="flex items-center justify-between gap-2 min-h-[40px] px-3 py-2 rounded-md text-xs font-medium text-[#F5EDE0] hover:bg-[#223763] transition-colors"
                    >
                      <span>Google Agenda</span>
                      <ExternalLink
                        className="w-3.5 h-3.5 text-[#E4C278]"
                        aria-hidden="true"
                      />
                    </a>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        downloadAppleCalendarIcs();
                        setIsCalendarOpen(false);
                      }}
                      className="flex items-center justify-between gap-2 min-h-[40px] px-3 py-2 rounded-md text-xs font-medium text-[#F5EDE0] hover:bg-[#223763] transition-colors cursor-pointer text-left"
                    >
                      <span>Calendrier Apple (.ics)</span>
                      <Download
                        className="w-3.5 h-3.5 text-[#E4C278]"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </ScrollRevealCard>

          {/* ÉTAPE 5 — Programme de la soirée */}
          <ScrollRevealCard
            id="step-schedule"
            scrollRootRef={scrollContainerRef}
            reducedMotion={prefersReducedMotion}
            className="relative rounded-2xl bg-[#FAF4E7] border border-[#D4AC5D]/75 shadow-[0_20px_50px_rgba(3,6,16,0.52)] overflow-hidden px-6 py-7 text-center"
          >
            {paperOverlayStyle && (
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none"
                style={paperOverlayStyle}
              />
            )}
            <div className="relative z-10">
              <RevealItem reducedMotion={prefersReducedMotion}>
                <p className="font-luxury-serif uppercase tracking-[0.18em] text-[11px] text-[#9A7A42] font-semibold m-0">
                  Déroulement
                </p>
                <h2 className="font-luxury-serif text-[26px] font-semibold text-[#102042] m-0 mt-0.5 mb-5">
                  Programme de la soirée
                </h2>
              </RevealItem>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                {EVENING_SCHEDULE.map((item) => {
                  const Icon =
                    item.icon === 'welcome'
                      ? Sparkles
                      : item.icon === 'dinner'
                      ? Utensils
                      : Music;
                  return (
                    <RevealItem
                      key={item.time}
                      reducedMotion={prefersReducedMotion}
                      className="rounded-xl bg-[#F3EAD8]/90 border border-[#D4AC5D]/45 px-2 py-3.5 flex flex-col items-center"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#122244] flex items-center justify-center mb-2">
                        <Icon
                          className="w-3.5 h-3.5 text-[#E8CE8E]"
                          aria-hidden="true"
                        />
                      </div>
                      <span className="font-luxury-serif text-[19px] font-semibold text-[#7D2238] tabular-nums">
                        {item.time}
                      </span>
                      <span className="text-[12px] font-medium text-[#102042] mt-1 leading-tight">
                        {item.title}
                      </span>
                      <span className="text-[10.5px] text-[#5C4E41] mt-1 leading-snug">
                        {item.subtitle}
                      </span>
                    </RevealItem>
                  );
                })}
              </div>
            </div>
          </ScrollRevealCard>

          {/* ÉTAPE 6 — RSVP (Guest Name, Attendance Confirmation, Number of Guests, Success Confirmation) */}
          <div ref={rsvpAnchorRef} id="rsvp-section">
            <ScrollRevealCard
              scrollRootRef={scrollContainerRef}
              reducedMotion={prefersReducedMotion}
              className="relative rounded-2xl bg-[#FAF4E7] border-2 border-[#D4AC5D]/80 shadow-[0_22px_54px_rgba(3,6,16,0.58)] overflow-hidden px-5 py-7"
            >
              {paperOverlayStyle && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none"
                  style={paperOverlayStyle}
                />
              )}
              <div className="relative z-10">
                <RsvpSection
                  existingRsvp={savedRsvp}
                  onSubmitRsvp={onSubmitRsvp}
                />
              </div>
            </ScrollRevealCard>
          </div>

          {/* ÉTAPE 7 — Wax Seal & Closing Screen */}
          <ScrollRevealCard
            id="step-closing"
            scrollRootRef={scrollContainerRef}
            reducedMotion={prefersReducedMotion}
            className="relative rounded-2xl bg-gradient-to-b from-[#13254B] to-[#0B162F] border border-[#D4AC5D]/60 shadow-[0_22px_56px_rgba(3,6,16,0.65)] overflow-hidden px-6 py-8 text-center text-[#FAF4E7]"
          >
            <div className="flex flex-col items-center">
              {/* Wax Seal scaled cleanly */}
              <div className="transform scale-[0.76] -my-5">
                <WaxSeal size={184} glintProgress={0.5} />
              </div>

              <p className="font-luxury-script text-[32px] text-[#F2DFB4] leading-[1.2] m-0 mt-3 max-w-[300px]">
                {INVITATION_COPY.closingSecond}{' '}
                <span className="text-[#E06D7E]" aria-hidden="true">
                  ♥
                </span>
              </p>

              <p className="font-luxury-serif uppercase tracking-[0.18em] text-[12px] text-[#D4AC5D] mt-2 mb-5">
                Mourad &amp; Dounia • 28 Janvier 2027
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
                <a
                  href={getWhatsAppShareUrl(
                    typeof window !== 'undefined' ? window.location.href : ''
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-lg bg-[#FAF4E7] hover:bg-[#EFE2C6] text-[#102042] text-xs font-medium transition-colors"
                >
                  <MessageCircle
                    className="w-3.5 h-3.5 text-[#7D2238]"
                    aria-hidden="true"
                  />
                  <span>{INVITATION_COPY.shareWhatsappLabel}</span>
                </a>

                <button
                  type="button"
                  onClick={onReplayOpening}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg border border-[#D4AC5D]/55 hover:bg-[#1A315E] text-[#F5EDE0] text-xs font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#E4C278]" aria-hidden="true" />
                  <span>Revoir l&apos;enveloppe</span>
                </button>
              </div>
            </div>
          </ScrollRevealCard>
        </div>
      </div>

      {/* Discreet Floating RSVP Jump Button (hidden once RSVP section is in view) */}
      {!isRsvpVisible && (
        <button
          type="button"
          onClick={() => scrollToSection('rsvp-section')}
          aria-label="Aller à la confirmation de présence"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-5 py-2 rounded-lg bg-[#122244]/92 hover:bg-[#19305E] backdrop-blur-sm border border-[#D4AC5D]/75 text-[#FBF5E9] font-luxury-serif text-[15px] font-medium tracking-[0.04em] shadow-[0_10px_28px_rgba(4,8,20,0.55)] transition-all duration-200 whitespace-nowrap cursor-pointer"
        >
          {savedRsvp ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#E4C278]" aria-hidden="true" />
              <span>Confirmation enregistrée</span>
            </>
          ) : (
            <>
              <span>{INVITATION_COPY.rsvpLabel}</span>
              <ChevronDown
                className="w-3.5 h-3.5 text-[#E4C278]"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      )}
    </div>
  );
};
