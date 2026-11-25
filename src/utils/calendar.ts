const EVENT_TITLE = 'Mariage de Mourad & Dounia';
const EVENT_LOCATION = 'Salle des Fêtes Le Petit Port, Krystel, Oran';
const EVENT_DESCRIPTION =
  'Vous êtes chaleureusement invités à célébrer l’union de Mourad & Dounia. Votre présence rendra cette journée encore plus spéciale.';

export function getGoogleCalendarUrl(): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENT_TITLE,
    dates: '20270128/20270129',
    location: EVENT_LOCATION,
    details: EVENT_DESCRIPTION,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function downloadAppleCalendarIcs(): void {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mourad et Dounia//Faire-part de Mariage//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:mourad-dounia-20270128@mariage',
    'DTSTAMP:20261125T000000Z',
    'DTSTART;VALUE=DATE:20270128',
    'DTEND;VALUE=DATE:20270129',
    `SUMMARY:${escapeIcsText(EVENT_TITLE)}`,
    `LOCATION:${escapeIcsText(EVENT_LOCATION)}`,
    `DESCRIPTION:${escapeIcsText(EVENT_DESCRIPTION)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsContent = `${lines.join('\r\n')}\r\n`;
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'Mariage-Mourad-et-Dounia.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
