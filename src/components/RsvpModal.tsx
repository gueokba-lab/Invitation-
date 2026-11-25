import React, { useEffect, useState } from 'react';
import { Check, MessageCircle, Minus, Plus, X } from 'lucide-react';
import { WHATSAPP_CONTACT_E164 } from '../constants/invitation';

export interface RsvpSubmission {
  guestName: string;
  attending: boolean;
  guestCount: number;
  submittedAt: string;
}

interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRsvp: RsvpSubmission | null;
  onSubmitRsvp: (data: RsvpSubmission) => void;
}

function buildRsvpWhatsAppUrl(data: RsvpSubmission): string {
  const statusLine = data.attending
    ? `Présence confirmée : Oui, avec plaisir (${data.guestCount} ${
        data.guestCount > 1 ? 'personnes' : 'personne'
      })`
    : 'Présence confirmée : Ne pourra malheureusement pas assister';

  const message = [
    'Confirmation de présence — Mariage de Mourad & Dounia',
    `Invité(e) : ${data.guestName}`,
    statusLine,
    'Date : Jeudi 28 janvier 2027 — Le Petit Port, Krystel, Oran',
  ].join('\n');

  return `https://wa.me/${WHATSAPP_CONTACT_E164}?text=${encodeURIComponent(message)}`;
}

export const RsvpModal: React.FC<RsvpModalProps> = ({
  isOpen,
  onClose,
  existingRsvp,
  onSubmitRsvp,
}) => {
  const [guestName, setGuestName] = useState(existingRsvp?.guestName ?? '');
  const [attending, setAttending] = useState<boolean>(
    existingRsvp?.attending ?? true
  );
  const [guestCount, setGuestCount] = useState<number>(
    existingRsvp?.guestCount ?? 1
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedData, setConfirmedData] = useState<RsvpSubmission | null>(
    existingRsvp
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
      submittedAt: new Date().toISOString(),
    };
    setConfirmedData(submission);
    onSubmitRsvp(submission);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#070E1F]/78 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rsvp-dialog-title"
    >
      <div className="relative w-full max-w-[360px] rounded-xl bg-[#FAF4E7] border border-[#C89D4C]/70 text-[#2A221C] shadow-[0_24px_60px_rgba(3,6,16,0.65)] p-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#5C4E41] hover:bg-[#EDE2CC] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88B38] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {confirmedData ? (
          /* Success Confirmation Screen */
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="w-12 h-12 rounded-full bg-[#122244] border border-[#D4AC5D] flex items-center justify-center mb-3">
              <Check className="w-5 h-5 text-[#E8CE8E]" />
            </div>

            <h2
              id="rsvp-dialog-title"
              className="font-luxury-serif text-[24px] font-semibold text-[#102042] m-0"
            >
              Confirmation enregistrée
            </h2>

            <p className="font-luxury-serif italic text-[16px] text-[#5C4E41] mt-1.5 mb-4">
              Merci {confirmedData.guestName} pour votre réponse.
            </p>

            <div className="w-full rounded-lg bg-[#F2E9D6] border border-[#D4AC5D]/40 px-4 py-3 text-left text-[13px] space-y-1.5 mb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6B5B4B]">Invité(e)</span>
                <span className="font-medium text-[#2A221C] text-right">
                  {confirmedData.guestName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6B5B4B]">Réponse</span>
                <span className="font-medium text-[#7D2238] text-right">
                  {confirmedData.attending ? 'Présent(e)' : 'Absent(e)'}
                </span>
              </div>
              {confirmedData.attending && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6B5B4B]">Nombre d'invités</span>
                  <span className="font-medium text-[#102042] tabular-nums">
                    {confirmedData.guestCount}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full">
              <a
                href={buildRsvpWhatsAppUrl(confirmedData)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[42px] w-full px-4 py-2 rounded-lg bg-[#122244] hover:bg-[#19305E] text-[#FAF4E7] text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88B38]"
              >
                <MessageCircle className="w-4 h-4 text-[#E4C278]" aria-hidden="true" />
                <span>Envoyer via WhatsApp</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmedData(null)}
                  className="flex-1 min-h-[40px] px-3 py-2 rounded-lg border border-[#C8B9A0] hover:bg-[#EFE5D1] text-[#3B2E25] text-xs font-medium transition-colors cursor-pointer"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 min-h-[40px] px-3 py-2 rounded-lg bg-[#D4AC5D] hover:bg-[#DFBC72] text-[#0E1830] text-xs font-medium transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* RSVP Form: Guest Name, Attendance Confirmation, Number of Guests */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center pr-4 pl-4">
              <p className="font-luxury-serif uppercase tracking-[0.14em] text-[11px] text-[#9A7A42] m-0">
                Mourad &amp; Dounia
              </p>
              <h2
                id="rsvp-dialog-title"
                className="font-luxury-serif text-[23px] font-semibold text-[#102042] m-0 mt-0.5"
              >
                Confirmer ma présence
              </h2>
            </div>

            {/* Guest Name */}
            <div>
              <label
                htmlFor="rsvp-guest-name"
                className="block text-xs font-medium text-[#4A3D32] mb-1.5"
              >
                Nom de l'invité(e)
              </label>
              <input
                id="rsvp-guest-name"
                type="text"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ex. Sarah Benali"
                className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-[#FFFDF8] border border-[#CDBB9E] text-sm text-[#2A221C] placeholder:text-[#9A8B7A] focus:outline-none focus:border-[#B88B38]"
              />
              {errorMsg && (
                <p className="text-xs text-[#8F2E43] mt-1 mb-0">{errorMsg}</p>
              )}
            </div>

            {/* Attendance Confirmation */}
            <div>
              <span className="block text-xs font-medium text-[#4A3D32] mb-1.5">
                Confirmation de présence
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAttending(true)}
                  aria-pressed={attending}
                  className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    attending
                      ? 'bg-[#122244] border-[#122244] text-[#FAF4E7]'
                      : 'bg-[#FFFDF8] border-[#CDBB9E] text-[#3B2E25] hover:bg-[#F2E9D6]'
                  }`}
                >
                  Oui, avec joie
                </button>
                <button
                  type="button"
                  onClick={() => setAttending(false)}
                  aria-pressed={!attending}
                  className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    !attending
                      ? 'bg-[#7D2238] border-[#7D2238] text-[#FAF4E7]'
                      : 'bg-[#FFFDF8] border-[#CDBB9E] text-[#3B2E25] hover:bg-[#F2E9D6]'
                  }`}
                >
                  Absent(e)
                </button>
              </div>
            </div>

            {/* Number of Guests */}
            {attending && (
              <div>
                <span className="block text-xs font-medium text-[#4A3D32] mb-1.5">
                  Nombre d'invités
                </span>
                <div className="flex items-center justify-between rounded-lg bg-[#FFFDF8] border border-[#CDBB9E] px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                    disabled={guestCount <= 1}
                    aria-label="Diminuer le nombre d'invités"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-md text-[#3B2E25] hover:bg-[#EFE5D1] disabled:opacity-40 cursor-pointer"
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
                    className="inline-flex items-center justify-center w-9 h-9 rounded-md text-[#3B2E25] hover:bg-[#EFE5D1] disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#122244] hover:bg-[#19305E] text-[#FAF4E7] text-xs font-medium tracking-[0.04em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88B38] cursor-pointer"
            >
              Valider ma confirmation
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
