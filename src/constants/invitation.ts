export const STAGE_WIDTH = 1080;
export const STAGE_HEIGHT = 1920;
export const TOTAL_DURATION = 24.0;

export const ASSETS = {
  ballroomBackdrop: '/assets/aistudio/IMG-20261125-WA0001_ba1ef2f9.jpg',
  backdrop: '/src/assets/images/wedding_backdrop_stage_1795620534879.jpg',
  cottonPaper: '/src/assets/images/cotton_paper_texture_1795620535368.jpg',
  waxSeal: '/src/assets/images/wax_seal_blank_1795620536175.jpg',
} as const;

export const YOUTUBE_VIDEO_ID = 'UIPrqrYfUuc';

export const INVITATION_COPY = {
  intro: 'Vous êtes chaleureusement invités à célébrer l’union de',
  couple: 'Mourad & Dounia',
  date: 'Jeudi 28 janvier 2027',
  venueLines: ['Salle des Fêtes', 'Le Petit Port', 'Krystel, Oran'],
  closingFirst: 'Votre présence rendra cette journée encore plus spéciale.',
  closingSecond: 'On a hâte de partager ce moment inoubliable avec vous !',
  coupleQuote:
    '« Deux cœurs unis par l’amour, une promesse pour la vie, et le bonheur immense de vous accueillir pour célébrer notre histoire. »',
  welcomeSubtitle: 'Bienvenue à notre union',
  waxSealText: 'Amour Bonheur & Souvenirs pour la vie',
  pageTitle: 'Invitation de Mariage',
  enterLabel: 'Cliquez pour entrer',
  rsvpLabel: 'Confirmer ma présence',
  shareWhatsappLabel: 'Envoyer sur WhatsApp',
  directionsLabel: "Voir l'itinéraire",
  scrollHint: 'Faites défiler vers le bas',
} as const;

// Jeudi 28 janvier 2027 à 18h30 (UTC+1 Oran)
export const WEDDING_TARGET_DATE = '2027-01-28T18:30:00+01:00';

export const EVENING_SCHEDULE = [
  {
    time: '18:30',
    title: 'Accueil des invités',
    subtitle: 'Installation & cocktail de bienvenue',
    icon: 'welcome',
  },
  {
    time: '20:00',
    title: 'Dîner de réception',
    subtitle: 'Partage & célébration en famille',
    icon: 'dinner',
  },
  {
    time: '22:30',
    title: 'Pièce montée & soirée',
    subtitle: 'Musique, danse & souvenirs pour la vie',
    icon: 'party',
  },
] as const;

export const WHATSAPP_CONTACT_E164 = '33666418885';
export const WHATSAPP_CONTACT_DISPLAY = '+33 6 66 41 88 85';

export const VENUE_GPS_COORDS: string =
  (import.meta.env.VITE_VENUE_COORDS as string | undefined)?.trim() ||
  '35.82111,-0.49212';

export const VENUE_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  VENUE_GPS_COORDS
)}`;

export const RSVP_URL: string =
  (import.meta.env.VITE_RSVP_URL as string | undefined)?.trim() ||
  `https://wa.me/${WHATSAPP_CONTACT_E164}?text=${encodeURIComponent(
    'Bonjour, je confirme avec joie ma présence au mariage de Mourad & Dounia le jeudi 28 janvier 2027.'
  )}`;

export function getWhatsAppShareUrl(pageUrl: string): string {
  const message = [
    '✨ Mourad & Dounia ✨',
    'Vous êtes chaleureusement invités à célébrer notre union le jeudi 28 janvier 2027 à la Salle des Fêtes Le Petit Port (Krystel, Oran).',
    '',
    `Découvrir le faire-part animé : ${pageUrl}`,
    `Confirmation de présence (WhatsApp) : ${WHATSAPP_CONTACT_DISPLAY}`,
  ].join('\n');

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function progressIn(time: number, start: number, end: number): number {
  if (end <= start) return time >= end ? 1 : 0;
  return clamp01((time - start) / (end - start));
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

export function easeOutQuart(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 4);
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeInOutSine(t: number): number {
  const x = clamp01(t);
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function computeCardCrossfade(time: number) {
  const mainOut = easeInOutSine(progressIn(time, 14.9, 16.0));
  const mainBack = easeInOutSine(progressIn(time, 19.9, 21.0));
  const quoteIn = easeInOutSine(progressIn(time, 15.2, 16.3));
  const quoteOut = easeInOutSine(progressIn(time, 19.6, 20.6));

  const mainAlpha = clamp01(1 - mainOut + mainBack);
  const quoteAlpha = clamp01(quoteIn * (1 - quoteOut));
  const mainShiftY = (1 - mainAlpha) * -8;
  const quoteShiftY = (1 - quoteIn) * 10 - quoteOut * 8;

  return {
    mainAlpha,
    quoteAlpha,
    mainShiftY,
    quoteShiftY,
  };
}
