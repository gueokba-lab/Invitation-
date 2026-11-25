import React, { useState } from 'react';
import { Check, MessageCircle, Minus, Plus, Send } from 'lucide-react';
import { WHATSAPP_CONTACT_E164 } from '../constants/invitation';

export interface RsvpSubmission {
  guestName: string;
  attending: boolean;
  guestCount: number;
  message?: string;
  submittedAt: string;
}

interface RsvpSectionProps {
  existingRsvp: RsvpSubmission | null;
  onSubmitRsvp: (data: RsvpSubmission) => void;
}

function buildRsvpWhatsAppUrl(data: RsvpSubmission): string {
  const statusLine = data.attending
    ? `Présence confirmée : Oui, avec joie (${data.guestCount} ${
        data.guestCount > 1 ? 'personnes' : 'personne'
      })`
    : 'Présence confirmée : Ne pourra malheureusement pas assister';

  const lines = [
    'Confirmation de présence — Mariage de Mourad & Dounia',
    `Invité(e) : ${data.guestName}`,
    statusLine,
    'Date : Jeudi 28 janvier 2027 — Le Petit Port, Krystel, Oran',
  ];

  if (data.message?.trim()) {
    lines.push(`Mot aux mariés : ${data.message.trim()}`);
  }

  return `https://wa.me/${WHATSAPP_CONTACT_E164}?text=${encodeURIComponent(
    lines.join('\n')
  )}`;
}

export const RsvpSection: React.FC<RsvpSectionProps> = ({
  existingRsvp,
  onSubmitRsvp,
}) => {
  const [guestName, setGuestName] = useState(existingRsvp?.guestName ?? '');
  const [attending, setAttending] = useState<boolean>(
    existingRsvp?.attending ?? true
  );
  const [guestCount, setGuestCount] = useState<number>(
    existingRsvp?.guestCount && existingRsvp.guestCount > 0
      ? existingRsvp.guestCount
      : 1
  );
  const [guestNote, setGuestNote] = useState(existingRsvp?.message ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedData, setConfirmedData] = useState<RsvpSubmission | null>(
    existingRsvp
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guestName.trim();
    if (!trimmed) {
      setErrorMsg('Veuillez saisir votre nom complet.');
      return;
    }
    setErrorMsg(null);
    const submission: RsvpSubmission = {
      guestName: trimmed,
      attending,
      guestCount: attending ? guestCount : 0,
      message: guestNote.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };
    setConfirmedData(submission);
    onSubmitRsvp(submission);
  };

  if (confirmedData) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-[#122244] border border-[#D4AC5D] flex items-center justify-center mb-3 shadow-sm">
          <Check className="w-5 h-5 text-[#E8CE8E]" aria-hidden="true" />
        </div>

        <h3 className="font-luxury-serif text-[26px] font-semibold text-[#102042] m-0">
          Confirmation enregistrée
        </h3>

        <p className="font-luxury-serif italic text-[18px] text-[#5C4E41] mt-1 mb-4">
          Merci {confirmedData.guestName} pour votre réponse.
        </p>

        <div className="w-full rounded-lg bg-[#F3EAD8] border border-[#D4AC5D]/45 px-4 py-3 text-left text-[13px] space-y-2 mb-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#6B5B4B]">Invité(e)</span>
            <span className="font-medium text-[#2A221C] text-right">
              {confirmedData.guestName}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#6B5B4B]">Réponse</span>
            <span className="font-medium text-[#7D2238] text-right">
              {confirmedData.attending ? 'Oui, présent(e)' : 'Absent(e)'}
            </span>
          </div>
          {confirmedData.attending && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#6B5B4B]">Nombre d&apos;invités</span>
              <span className="font-medium text-[#102042] tabular-nums">
                {confirmedData.guestCount}{' '}
                {confirmedData.guestCount > 1 ? 'personnes' : 'personne'}
              </span>
            </div>
          )}
          {confirmedData.message && (
            <div className="pt-1.5 border-t border-[#D4AC5D]/30">
              <span className="block text-[#6B5B4B] mb-0.5">Votre mot</span>
              <p className="m-0 italic text-[#3B2E25]">
                « {confirmedData.message} »
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <a
            href={buildRsvpWhatsAppUrl(confirmedData)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full px-4 py-2.5 rounded-lg bg-[#122244] hover:bg-[#19305E] text-[#FAF4E7] text-xs font-medium tracking-[0.04em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88B38]"
          >
            <MessageCircle className="w-4 h-4 text-[#E4C278]" aria-hidden="true" />
            <span>Envoyer ma réponse sur WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => setConfirmedData(null)}
            className="min-h-[40px] px-4 py-2 rounded-lg border border-[#C8B9A0] hover:bg-[#EFE5D1] text-[#3B2E25] text-xs font-medium transition-colors cursor-pointer"
          >
            Modifier ma réponse
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="text-center mb-1">
        <p className="font-luxury-serif uppercase tracking-[0.18em] text-[12px] text-[#9A7A42] font-semibold m-0">
          Réponse souhaitée
        </p>
        <h3 className="font-luxury-serif text-[27px] font-semibold text-[#102042] m-0 mt-0.5">
          Confirmer ma présence
        </h3>
        <p className="font-luxury-serif italic text-[16px] text-[#5C4E41] m-0 mt-0.5">
          Nous serons honorés de vous compter parmi nous
        </p>
      </div>

      {/* Attendance Confirmation */}
      <div>
        <span className="block text-xs font-medium text-[#4A3D32] mb-1.5">
          Serez-vous des nôtres ?
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setAttending(true)}
            aria-pressed={attending}
            className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              attending
                ? 'bg-[#122244] border-[#122244] text-[#FAF4E7] shadow-sm'
                : 'bg-[#FFFDF8] border-[#CDBB9E] text-[#3B2E25] hover:bg-[#F2E9D6]'
            }`}
          >
            Oui, avec joie
          </button>
          <button
            type="button"
            onClick={() => setAttending(false)}
            aria-pressed={!attending}
            className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              !attending
                ? 'bg-[#7D2238] border-[#7D2238] text-[#FAF4E7] shadow-sm'
                : 'bg-[#FFFDF8] border-[#CDBB9E] text-[#3B2E25] hover:bg-[#F2E9D6]'
            }`}
          >
            Ne pourra pas venir
          </button>
        </div>
      </div>

      {/* Guest Name */}
      <div>
        <label
          htmlFor="rsvp-inline-name"
          className="block text-xs font-medium text-[#4A3D32] mb-1.5"
        >
          Nom de l&apos;invité(e)
        </label>
        <input
          id="rsvp-inline-name"
          type="text"
          value={guestName}
          onChange={(e) => {
            setGuestName(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="Ex. Sarah Benali"
          className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-[#FFFDF8] border border-[#CDBB9E] text-sm text-[#2A221C] placeholder:text-[#9A8B7A] focus:outline-none focus:border-[#B88B38]"
        />
        {errorMsg && (
          <p className="text-xs text-[#8F2E43] mt-1 mb-0">{errorMsg}</p>
        )}
      </div>

      {/* Number of Guests */}
      {attending && (
        <div>
          <span className="block text-xs font-medium text-[#4A3D32] mb-1.5">
            Nombre d&apos;invités
          </span>
          <div className="flex items-center justify-between rounded-lg bg-[#FFFDF8] border border-[#CDBB9E] px-2.5 py-1">
            <button
              type="button"
              onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
              disabled={guestCount <= 1}
              aria-label="Diminuer le nombre d'invités"
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-[#3B2E25] hover:bg-[#EFE5D1] disabled:opacity-35 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-[#102042] tabular-nums">
              {guestCount} {guestCount > 1 ? 'personnes' : 'personne'}
            </span>
            <button
              type="button"
              onClick={() => setGuestCount((c) => Math.min(10, c + 1))}
              disabled={guestCount >= 10}
              aria-label="Augmenter le nombre d'invités"
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-[#3B2E25] hover:bg-[#EFE5D1] disabled:opacity-35 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Optional message for the couple */}
      <div>
        <label
          htmlFor="rsvp-inline-note"
          className="block text-xs font-medium text-[#4A3D32] mb-1.5"
        >
          Un petit mot pour les mariés (facultatif)
        </label>
        <textarea
          id="rsvp-inline-note"
          rows={2}
          value={guestNote}
          onChange={(e) => setGuestNote(e.target.value)}
          placeholder="Tous nos vœux de bonheur..."
          className="w-full px-3.5 py-2 rounded-lg bg-[#FFFDF8] border border-[#CDBB9E] text-sm text-[#2A221C] placeholder:text-[#9A8B7A] focus:outline-none focus:border-[#B88B38] resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#7D2238] hover:bg-[#913044] text-[#FAF4E7] text-xs font-medium tracking-[0.06em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88B38] cursor-pointer shadow-sm"
      >
        <Send className="w-3.5 h-3.5 text-[#E8CE8E]" aria-hidden="true" />
        <span>Envoyer la confirmation</span>
      </button>
    </form>
  );
};
