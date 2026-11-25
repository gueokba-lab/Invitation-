import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  CalendarPlus,
  Check,
  Download,
  ExternalLink,
  Maximize2,
  MessageCircle,
  Minimize2,
} from 'lucide-react';
import { InvitationStage } from './components/InvitationStage';
import { RsvpModal, RsvpSubmission } from './components/RsvpModal';
import {
  ASSETS,
  INVITATION_COPY,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  TOTAL_DURATION,
  getWhatsAppShareUrl,
} from './constants/invitation';
import {
  downloadAppleCalendarIcs,
  getGoogleCalendarUrl,
} from './utils/calendar';
import { loadCroppedCottonPaper } from './utils/processCottonPaper';
import { loadTransparentWaxSeal } from './utils/processWaxSeal';

const RSVP_STORAGE_KEY = 'mourad_dounia_rsvp_v1';

export default function App() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  const [ambientTime, setAmbientTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isRsvpOpen, setIsRsvpOpen] = useState<boolean>(false);
  const [savedRsvp, setSavedRsvp] = useState<RsvpSubmission | null>(() => {
    try {
      const raw = localStorage.getItem(RSVP_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as RsvpSubmission) : null;
    } catch {
      return null;
    }
  });

  const [paperDataUrl, setPaperDataUrl] = useState<string | null>(null);
  const [sealDataUrl, setSealDataUrl] = useState<string | null>(null);

  const [stageScale, setStageScale] = useState<number>(0.42);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const frameContainerRef = useRef<HTMLDivElement | null>(null);
  const calendarMenuRef = useRef<HTMLDivElement | null>(null);
  const timeRef = useRef<number>(time);
  const ambientTimeRef = useRef<number>(ambientTime);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    ambientTimeRef.current = ambientTime;
  }, [ambientTime]);

  // Pre-process luxury paper & wax seal transparency once on mount
  useEffect(() => {
    let active = true;
    loadCroppedCottonPaper(ASSETS.cottonPaper)
      .then((res) => {
        if (active) setPaperDataUrl(res.dataUrl);
      })
      .catch(() => {});

    loadTransparentWaxSeal(ASSETS.waxSeal)
      .then((res) => {
        if (active) setSealDataUrl(res.dataUrl);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Measure available container so the 9:16 (1080x1920) stage scales cleanly on any screen
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateScale = () => {
      const rect = el.getBoundingClientRect();
      const padW = 16;
      const padH = 12;
      const availW = Math.max(200, rect.width - padW);
      const availH = Math.max(300, rect.height - padH);
      const nextScale = Math.min(availW / STAGE_WIDTH, availH / STAGE_HEIGHT);
      setStageScale(nextScale);
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFullscreen]);

  // Continuous 60fps clock after entry: advances main sequence to 24s, then keeps butterflies & light alive
  useEffect(() => {
    if (!hasEntered || prefersReducedMotion) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTsRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTsRef.current === null) {
        lastTsRef.current = now;
      }
      const dt = Math.min(0.1, (now - lastTsRef.current) / 1000);
      lastTsRef.current = now;

      const nextAmbient = ambientTimeRef.current + dt;
      setAmbientTime(nextAmbient);

      if (timeRef.current < TOTAL_DURATION) {
        const nextTime = Math.min(TOTAL_DURATION, timeRef.current + dt);
        setTime(nextTime);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTsRef.current = null;
    };
  }, [hasEntered, prefersReducedMotion]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalendarOpen]);

  const handleEnter = useCallback(() => {
    if (hasEntered) return;
    setHasEntered(true);
    if (prefersReducedMotion) {
      setTime(TOTAL_DURATION);
      setAmbientTime(TOTAL_DURATION);
    } else {
      setTime(0.05);
      setAmbientTime(0.05);
    }
  }, [hasEntered, prefersReducedMotion]);

  const handleRsvpSubmit = useCallback((data: RsvpSubmission) => {
    setSavedRsvp(data);
    try {
      localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const handleFullscreen = useCallback(async () => {
    const target = frameContainerRef.current;
    if (!target) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await target.requestFullscreen();
      }
    } catch {
      // Ignore if fullscreen is restricted in embedded iframe
    }
  }, []);

  const scaledW = Math.round(STAGE_WIDTH * stageScale);
  const scaledH = Math.round(STAGE_HEIGHT * stageScale);
  const showRsvpButton = hasEntered && (prefersReducedMotion || time >= 12.6);

  return (
    <main
      ref={frameContainerRef}
      className="h-dvh w-screen overflow-hidden flex flex-col items-center justify-between bg-[#0B1325] text-[#F5EDE0] px-4 py-3 sm:py-4"
    >
      {/* French Invitation Title */}
      <header className="shrink-0 pb-1.5 text-center">
        <p className="font-luxury-serif text-[20px] sm:text-[24px] font-medium tracking-[0.16em] uppercase text-[#F2DFB4] m-0">
          {INVITATION_COPY.pageTitle}
        </p>
      </header>

      {/* Centered 9:16 Stage Viewport */}
      <div
        ref={viewportRef}
        className="flex-1 w-full flex items-center justify-center min-h-0"
      >
        <div
          className="relative overflow-hidden rounded-[6px] bg-[#0D172E] border border-[#C89D4C]/30"
          style={{
            width: `${scaledW}px`,
            height: `${scaledH}px`,
            boxShadow:
              '0 28px 72px rgba(3, 6, 16, 0.72), 0 4px 18px rgba(3, 6, 16, 0.45)',
          }}
        >
          <div
            style={{
              width: `${STAGE_WIDTH}px`,
              height: `${STAGE_HEIGHT}px`,
              transform: `scale(${stageScale})`,
              transformOrigin: 'top left',
            }}
          >
            <InvitationStage
              time={time}
              ambientTime={ambientTime}
              paperDataUrl={paperDataUrl}
              sealDataUrl={sealDataUrl}
            />
          </div>

          {/* 1. Welcome Screen: Click to Enter */}
          {!hasEntered && (
            <button
              type="button"
              onClick={handleEnter}
              aria-label={`${INVITATION_COPY.enterLabel} — ${INVITATION_COPY.couple}`}
              className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-[14%] bg-transparent cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#E8CE8E] group"
            >
              <span className="inline-flex items-center justify-center min-h-[44px] px-7 py-3 rounded-[4px] bg-[#101F3F]/90 group-hover:bg-[#19305E] backdrop-blur-sm border border-[#D4AC5D]/75 group-hover:border-[#EED596] text-[#FBF5E9] font-luxury-serif text-[16px] sm:text-[17px] font-medium tracking-[0.12em] uppercase shadow-[0_12px_32px_rgba(3,6,16,0.55)] transition-all duration-200 whitespace-nowrap">
                {INVITATION_COPY.enterLabel}
              </span>
              <span className="mt-2.5 font-luxury-serif text-[13px] tracking-[0.18em] uppercase text-[#E4C886]/90">
                {INVITATION_COPY.couple}
              </span>
            </button>
          )}

          {/* 9. Discreet Floating RSVP Button (opens interactive RSVP form) */}
          {showRsvpButton && (
            <button
              type="button"
              onClick={() => setIsRsvpOpen(true)}
              aria-label={`${INVITATION_COPY.rsvpLabel} — Mourad & Dounia`}
              className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-40 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-5 py-2 rounded-[4px] bg-[#122244]/88 hover:bg-[#192F5C]/96 backdrop-blur-sm border border-[#D4AC5D]/70 text-[#FBF5E9] font-luxury-serif text-[15px] font-medium tracking-[0.04em] shadow-[0_8px_24px_rgba(4,8,20,0.45)] transition-all duration-200 hover:border-[#E8CE8E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8CE8E] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {savedRsvp ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#E4C278]" aria-hidden="true" />
                  <span>Confirmation enregistrée</span>
                </>
              ) : (
                <>
                  <span>{INVITATION_COPY.rsvpLabel}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#E4C278]" aria-hidden="true" />
                </>
              )}
            </button>
          )}

          {/* RSVP Dialog: Guest Name, Attendance Confirmation, Number of Guests, Success Confirmation */}
          <RsvpModal
            isOpen={isRsvpOpen}
            onClose={() => setIsRsvpOpen(false)}
            existingRsvp={savedRsvp}
            onSubmitRsvp={handleRsvpSubmit}
          />
        </div>
      </div>

      {/* Guest Actions Bar (Outside 9:16 Stage) */}
      <div className="shrink-0 pt-2">
        <div className="flex flex-wrap items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#131F3A]/92 border border-[#C89D4C]/30 shadow-lg">
          <a
            href={getWhatsAppShareUrl(
              typeof window !== 'undefined' ? window.location.href : ''
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#C89D4C]/35 bg-[#19294B] hover:bg-[#223763] text-[#F5EDE0] text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8CE8E] whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#E4C278]" aria-hidden="true" />
            <span>{INVITATION_COPY.shareWhatsappLabel}</span>
          </a>

          <div ref={calendarMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsCalendarOpen((prev) => !prev)}
              aria-expanded={isCalendarOpen}
              aria-haspopup="menu"
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#C89D4C]/35 bg-[#19294B] hover:bg-[#223763] text-[#F5EDE0] text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8CE8E] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#E4C278]" aria-hidden="true" />
              <span>Ajouter au calendrier</span>
            </button>

            {isCalendarOpen && (
              <div
                role="menu"
                aria-label="Choisir un calendrier"
                className="absolute bottom-full right-0 mb-2 w-56 rounded-lg bg-[#162442] border border-[#C89D4C]/40 shadow-[0_12px_32px_rgba(3,6,16,0.55)] p-1.5 z-50 flex flex-col gap-1"
              >
                <a
                  role="menuitem"
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsCalendarOpen(false)}
                  className="flex items-center justify-between gap-2 min-h-[40px] px-3 py-2 rounded-md text-xs font-medium text-[#F5EDE0] hover:bg-[#223763] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#E8CE8E] whitespace-nowrap"
                >
                  <span>Google Agenda</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#E4C278]" aria-hidden="true" />
                </a>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    downloadAppleCalendarIcs();
                    setIsCalendarOpen(false);
                  }}
                  className="flex items-center justify-between gap-2 min-h-[40px] px-3 py-2 rounded-md text-xs font-medium text-[#F5EDE0] hover:bg-[#223763] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#E8CE8E] whitespace-nowrap cursor-pointer text-left"
                >
                  <span>Calendrier Apple (.ics)</span>
                  <Download className="w-3.5 h-3.5 text-[#E4C278]" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleFullscreen}
            className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-lg text-[#CFC3B0] hover:bg-[#1E2F54] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8CE8E] shrink-0 cursor-pointer"
            aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
