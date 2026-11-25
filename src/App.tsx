import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Maximize2,
  MessageCircle,
  Minimize2,
} from 'lucide-react';
import { InvitationStage } from './components/InvitationStage';
import { RsvpSubmission } from './components/RsvpSection';
import { ScrollableInvitation } from './components/ScrollableInvitation';
import {
  ASSETS,
  INVITATION_COPY,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  TOTAL_DURATION,
  getWhatsAppShareUrl,
} from './constants/invitation';
import { loadCroppedCottonPaper } from './utils/processCottonPaper';
import { loadTransparentWaxSeal } from './utils/processWaxSeal';

const RSVP_STORAGE_KEY = 'mourad_dounia_rsvp_v1';
const ENVELOPE_HANDOFF_TIME = 8.4;

type ExperiencePhase = 'welcome' | 'opening' | 'scrollable';

export default function App() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [phase, setPhase] = useState<ExperiencePhase>('welcome');
  const [time, setTime] = useState<number>(0);
  const [ambientTime, setAmbientTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
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

  // Measure available container so the 9:16 (1080x1920) opening stage scales cleanly
  useEffect(() => {
    if (phase === 'scrollable') return;
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
  }, [isFullscreen, phase]);

  // Continuous 60fps clock after entry: drives envelope opening -> hands off to scrollable details -> keeps butterflies alive
  useEffect(() => {
    if (phase === 'welcome' || prefersReducedMotion) {
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

      if (phase === 'opening') {
        const nextTime = Math.min(TOTAL_DURATION, timeRef.current + dt);
        setTime(nextTime);
        if (nextTime >= ENVELOPE_HANDOFF_TIME) {
          setPhase('scrollable');
        }
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
  }, [phase, prefersReducedMotion]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleEnter = useCallback(() => {
    if (phase !== 'welcome') return;
    if (prefersReducedMotion) {
      setTime(TOTAL_DURATION);
      setAmbientTime(TOTAL_DURATION);
      setPhase('scrollable');
    } else {
      // Jump straight to the seal-unsealing / flap-opening beat so the reveal feels immediate
      setTime(1.65);
      setAmbientTime(4.8);
      setPhase('opening');
    }
  }, [phase, prefersReducedMotion]);

  const handleSkipToScrollable = useCallback(() => {
    setTime(ENVELOPE_HANDOFF_TIME);
    setPhase('scrollable');
  }, []);

  const handleReplayOpening = useCallback(() => {
    if (prefersReducedMotion) {
      setTime(0);
      setPhase('welcome');
      return;
    }
    setTime(1.65);
    setAmbientTime(4.8);
    setPhase('opening');
  }, [prefersReducedMotion]);

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

  return (
    <main
      ref={frameContainerRef}
      className="h-dvh w-screen overflow-hidden flex flex-col bg-[#0B1325] text-[#F5EDE0]"
    >
      {/* French Invitation Header */}
      <header className="shrink-0 w-full flex items-center justify-between px-4 py-2.5 border-b border-[#C89D4C]/20 bg-[#0D172E]/95 z-30">
        <div className="w-9 sm:w-20" aria-hidden="true" />
        <p className="font-luxury-serif text-[18px] sm:text-[22px] font-medium tracking-[0.16em] uppercase text-[#F2DFB4] m-0 text-center">
          {INVITATION_COPY.pageTitle}
        </p>
        <div className="flex items-center justify-end gap-1.5 w-9 sm:w-20">
          <a
            href={getWhatsAppShareUrl(
              typeof window !== 'undefined' ? window.location.href : ''
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={INVITATION_COPY.shareWhatsappLabel}
            className="hidden sm:inline-flex items-center justify-center min-h-[36px] min-w-[36px] p-1.5 rounded-lg text-[#E4C278] hover:bg-[#19294B] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={handleFullscreen}
            className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] p-1.5 rounded-lg text-[#CFC3B0] hover:bg-[#1E2F54] transition-colors cursor-pointer"
            aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* PHASE 1 & 2: Welcome Screen + Envelope Opening Animation */}
      {phase !== 'scrollable' ? (
        <div
          ref={viewportRef}
          className="flex-1 w-full flex items-center justify-center min-h-0 px-3 py-3"
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

            {/* Welcome Screen: Click to Enter */}
            {phase === 'welcome' && (
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

            {/* Quick skip to scrollable details once envelope has started opening */}
            {phase === 'opening' && time >= 4.2 && (
              <button
                type="button"
                onClick={handleSkipToScrollable}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-5 py-2 rounded-[4px] bg-[#122244]/90 hover:bg-[#192F5C] backdrop-blur-sm border border-[#D4AC5D]/70 text-[#FBF5E9] font-luxury-serif text-[15px] font-medium tracking-[0.04em] shadow-[0_8px_24px_rgba(4,8,20,0.45)] transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Découvrir les détails</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#E4C278]" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* PHASE 3: Post-Envelope Vertical Scrollable Step-by-Step Invitation */
        <ScrollableInvitation
          ambientTime={ambientTime}
          paperDataUrl={paperDataUrl}
          savedRsvp={savedRsvp}
          onSubmitRsvp={handleRsvpSubmit}
          onReplayOpening={handleReplayOpening}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </main>
  );
}
