import {
  ASSETS,
  INVITATION_COPY,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  TOTAL_DURATION,
  clamp01,
  computeCardCrossfade,
  easeInOutCubic,
  easeOutCubic,
  easeOutQuart,
  lerp,
  progressIn,
} from '../constants/invitation';
import { BUTTERFLY_SPECS, computeButterflyState } from '../components/ButterflyLayer';
import { computeGoldParticles } from '../components/GoldParticlesLayer';
import { loadCroppedCottonPaper } from './processCottonPaper';

export interface ExportProgress {
  progress: number;
  phase: 'preparing' | 'rendering' | 'encoding';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function traceScallopedCardPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  inset: number
) {
  const cx = x + w / 2;
  const topPeakY = y + 6 + inset;
  const shoulderY = y + 58 + inset * 0.85;
  const sideTopY = y + 122 + inset * 0.5;
  const sideBotY = y + h - 122 - inset * 0.5;
  const botShoulderY = y + h - 58 - inset * 0.85;
  const botPeakY = y + h - 6 - inset;
  const leftX = x + 4 + inset;
  const rightX = x + w - 4 - inset;
  const innerShoulderInset = 78 + inset * 0.65;

  ctx.beginPath();
  ctx.moveTo(cx, topPeakY);
  ctx.bezierCurveTo(
    cx + 26,
    topPeakY + 26,
    cx + 52,
    shoulderY - 6,
    rightX - innerShoulderInset,
    shoulderY
  );
  ctx.bezierCurveTo(
    rightX - 42,
    shoulderY + 4,
    rightX - 18,
    shoulderY + 28,
    rightX,
    sideTopY
  );
  ctx.lineTo(rightX, sideBotY);
  ctx.bezierCurveTo(
    rightX - 18,
    botShoulderY - 28,
    rightX - 42,
    botShoulderY - 4,
    rightX - innerShoulderInset,
    botShoulderY
  );
  ctx.bezierCurveTo(
    cx + 52,
    botShoulderY + 6,
    cx + 26,
    botPeakY - 26,
    cx,
    botPeakY
  );
  ctx.bezierCurveTo(
    cx - 26,
    botPeakY - 26,
    cx - 52,
    botShoulderY + 6,
    leftX + innerShoulderInset,
    botShoulderY
  );
  ctx.bezierCurveTo(
    leftX + 42,
    botShoulderY - 4,
    leftX + 18,
    botShoulderY - 28,
    leftX,
    sideBotY
  );
  ctx.lineTo(leftX, sideTopY);
  ctx.bezierCurveTo(
    leftX + 18,
    shoulderY + 28,
    leftX + 42,
    shoulderY + 4,
    leftX + innerShoulderInset,
    shoulderY
  );
  ctx.bezierCurveTo(
    cx - 52,
    shoulderY - 6,
    cx - 26,
    topPeakY + 26,
    cx,
    topPeakY
  );
  ctx.closePath();
}

function drawWrappedCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  lines.forEach((line, idx) => {
    ctx.fillText(line, cx, startY + idx * lineHeight);
  });
  return lines.length;
}

function drawNavyAnchorMedallion(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const scale = size / 240;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.shadowColor = 'rgba(7, 13, 28, 0.52)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;

  // Gold bezel
  const bezelGrad = ctx.createLinearGradient(-88, -88, 88, 88);
  bezelGrad.addColorStop(0, '#F4DFA8');
  bezelGrad.addColorStop(0.5, '#CFA452');
  bezelGrad.addColorStop(1, '#EAD192');
  ctx.fillStyle = bezelGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 88, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  const navyGrad = ctx.createRadialGradient(-20, -24, 12, 0, 0, 86);
  navyGrad.addColorStop(0, '#1E3563');
  navyGrad.addColorStop(0.6, '#122142');
  navyGrad.addColorStop(1, '#0B152B');
  ctx.fillStyle = navyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 83, 0, Math.PI * 2);
  ctx.fill();

  // Inner ring
  ctx.strokeStyle = 'rgba(229, 195, 118, 0.72)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([3.2, 2.4]);
  ctx.beginPath();
  ctx.arc(0, 0, 77, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Gold anchor
  ctx.save();
  ctx.translate(0, -46);
  ctx.strokeStyle = '#E8CE8E';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, -12, 3.4, 0, Math.PI * 2);
  ctx.moveTo(0, -8.5);
  ctx.lineTo(0, 12);
  ctx.moveTo(-8, -2.5);
  ctx.lineTo(8, -2.5);
  ctx.moveTo(-11, 4);
  ctx.bezierCurveTo(-10, 12, -4, 14, 0, 12);
  ctx.bezierCurveTo(4, 14, 10, 12, 11, 4);
  ctx.stroke();
  ctx.restore();

  // Medallion stacked text
  ctx.fillStyle = '#F5EBD6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 14px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('AMOUR', 0, -16);
  ctx.fillText('BONHEUR', 0, 2);
  ctx.font = '600 13px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('& SOUVENIRS', 0, 20);
  ctx.fillText('POUR LA VIE', 0, 38);

  // Blush heart
  ctx.fillStyle = '#E58B94';
  ctx.font = '14px serif';
  ctx.fillText('♥', 0, 56);

  ctx.restore();
}

function drawCanvasButterfly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  headingDeg: number,
  wingTiltDeg: number,
  lift: number,
  opacity: number,
  scale: number
) {
  const wingScaleX = Math.max(0.26, Math.cos((wingTiltDeg * Math.PI) / 180));
  const headingRad = (headingDeg * Math.PI) / 180;

  ctx.save();
  ctx.globalAlpha = opacity * (0.24 - lift * 0.05);
  ctx.translate(x + (16 + lift * 6) * scale, y + (22 + lift * 8) * scale);
  ctx.rotate(headingRad);
  ctx.scale(scale * (0.65 + 0.35 * wingScaleX), scale);
  ctx.filter = `blur(${6.5 + lift * 2}px)`;
  ctx.fillStyle = '#181410';
  ctx.beginPath();
  ctx.ellipse(-18, -5, 22, 13, -0.45, 0, Math.PI * 2);
  ctx.ellipse(18, -5, 22, 13, 0.45, 0, Math.PI * 2);
  ctx.ellipse(-14, 15, 14, 10, 0.4, 0, Math.PI * 2);
  ctx.ellipse(14, 15, 14, 10, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y);
  ctx.rotate(headingRad);
  ctx.scale(scale, scale);

  const drawWingSide = (dir: -1 | 1) => {
    ctx.save();
    ctx.scale(dir * wingScaleX, 1);

    const grad = ctx.createLinearGradient(0, -10, 44, 24);
    grad.addColorStop(0, 'rgba(255, 253, 248, 0.96)');
    grad.addColorStop(0.55, 'rgba(244, 233, 212, 0.90)');
    grad.addColorStop(1, 'rgba(214, 185, 128, 0.88)');

    ctx.beginPath();
    ctx.moveTo(1, -4);
    ctx.bezierCurveTo(13, -32, 41, -38, 45, -21);
    ctx.bezierCurveTo(48, -8, 29, 2, 2, 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#C5A362';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2, 3);
    ctx.bezierCurveTo(27, 5, 37, 20, 28, 31);
    ctx.bezierCurveTo(18, 40, 5, 25, 1, 7);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  drawWingSide(-1);
  drawWingSide(1);

  ctx.fillStyle = '#7C674B';
  ctx.beginPath();
  ctx.ellipse(0, 1, 1.9, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -9.5, 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export async function exportInvitationVideo(
  onProgress: (info: ExportProgress) => void,
  signal?: AbortSignal
): Promise<{ blob: Blob; filename: string }> {
  onProgress({ progress: 0.02, phase: 'preparing' });
  await document.fonts.ready;

  const [ballroomImg, paperSprite] = await Promise.all([
    loadImage(ASSETS.ballroomBackdrop),
    loadCroppedCottonPaper(ASSETS.cottonPaper),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = STAGE_WIDTH;
  canvas.height = STAGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Impossible d’initialiser le contexte vidéo.');
  }

  const mimeCandidates = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  const mimeType =
    mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

  const fps = 30;
  const totalFrames = Math.round(TOTAL_DURATION * fps);
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const stopPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error('Erreur lors de l’encodage vidéo.'));
  });

  recorder.start(200);

  const renderFrame = (time: number) => {
    ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    ctx.fillStyle = '#0D172E';
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

    const bgScale = lerp(1.045, 1.0, easeOutCubic(progressIn(time, 0, 20.0)));

    // Ambient blurred ballroom depth
    ctx.save();
    ctx.translate(STAGE_WIDTH / 2, STAGE_HEIGHT / 2);
    ctx.scale(bgScale * 1.25, bgScale * 1.25);
    ctx.filter = 'blur(20px) brightness(0.62)';
    ctx.drawImage(ballroomImg, -STAGE_WIDTH / 2, -STAGE_HEIGHT / 2, STAGE_WIDTH, STAGE_HEIGHT);
    ctx.restore();

    // Upper chandelier & balloons canopy
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, STAGE_WIDTH, 980);
    ctx.clip();
    ctx.translate(STAGE_WIDTH / 2, 0);
    ctx.scale(bgScale * 1.03, bgScale * 1.03);
    ctx.drawImage(ballroomImg, -STAGE_WIDTH / 2, 0, STAGE_WIDTH, STAGE_WIDTH);
    ctx.restore();

    // Midnight-navy center scrim masking center region
    const scrim = ctx.createRadialGradient(
      STAGE_WIDTH / 2,
      STAGE_HEIGHT * 0.54,
      90,
      STAGE_WIDTH / 2,
      STAGE_HEIGHT * 0.54,
      780
    );
    scrim.addColorStop(0, 'rgba(12, 22, 46, 0.92)');
    scrim.addColorStop(0.55, 'rgba(14, 25, 52, 0.72)');
    scrim.addColorStop(1, 'rgba(12, 22, 46, 0.16)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

    // Envelope & Card parameters
    const flapOpenT = easeInOutCubic(progressIn(time, 2.1, 4.6));
    const flapAngleDeg = lerp(0, 174, flapOpenT);
    const flapRad = (flapAngleDeg * Math.PI) / 180;
    const flapIsPastVertical = flapAngleDeg >= 88;

    const emergeT = easeInOutCubic(progressIn(time, 4.2, 8.2));
    const envelopeTop = lerp(500, 1105, emergeT);
    const envelopeScale = lerp(1.0, 0.80, emergeT);

    const envW = 720 * envelopeScale;
    const envH = 920 * envelopeScale;
    const envX = (STAGE_WIDTH - envW) / 2;
    const envY = envelopeTop;

    // Layer 1A: Envelope Back Panel
    ctx.save();
    ctx.shadowColor = 'rgba(5, 10, 22, 0.56)';
    ctx.shadowBlur = 46;
    ctx.shadowOffsetY = 18;
    drawRoundedRectPath(ctx, envX, envY, envW, envH, 4 * envelopeScale);
    ctx.fillStyle = '#EDE2CE';
    ctx.fill();
    ctx.restore();

    const drawFlap = () => {
      const cosF = Math.cos(flapRad);
      const flapTipY = envY + 426 * envelopeScale * cosF;
      const shoulderY = envY + 26 * envelopeScale * cosF;
      const shoulderInset = Math.sin(flapRad) * 14 * envelopeScale;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(envX + 2 * envelopeScale, envY);
      ctx.lineTo(envX + envW - 2 * envelopeScale, envY);
      ctx.lineTo(envX + envW - 16 * envelopeScale + shoulderInset, shoulderY);
      ctx.lineTo(envX + envW / 2 + 28 * envelopeScale, flapTipY);
      ctx.quadraticCurveTo(
        envX + envW / 2,
        flapTipY + 14 * envelopeScale * cosF,
        envX + envW / 2 - 28 * envelopeScale,
        flapTipY
      );
      ctx.lineTo(envX + 16 * envelopeScale - shoulderInset, shoulderY);
      ctx.closePath();

      if (flapIsPastVertical) {
        const innerGrad = ctx.createLinearGradient(0, envY, 0, flapTipY);
        innerGrad.addColorStop(0, '#EFE4CD');
        innerGrad.addColorStop(1, '#E3D3B4');
        ctx.fillStyle = innerGrad;
      } else {
        const outerGrad = ctx.createLinearGradient(envX, envY, envX + envW, flapTipY);
        outerGrad.addColorStop(0, '#1B315E');
        outerGrad.addColorStop(0.55, '#122244');
        outerGrad.addColorStop(1, '#0C1832');
        ctx.fillStyle = outerGrad;
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(218, 180, 102, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };

    if (flapIsPastVertical) {
      drawFlap();
    }

    // Layer 2: Scalloped Bracket-Arch Card
    const cardTop = lerp(516, 205, emergeT);
    const cardX = 205;
    const cardW = 670;
    const cardH = 920;

    ctx.save();
    ctx.shadowColor = `rgba(5, 10, 24, ${lerp(0.28, 0.48, emergeT)})`;
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 18;
    traceScallopedCardPath(ctx, cardX, cardTop, cardW, cardH, 0);
    ctx.fillStyle = '#FAF4E7';
    ctx.fill();
    ctx.restore();

    ctx.save();
    traceScallopedCardPath(ctx, cardX, cardTop, cardW, cardH, 0);
    ctx.clip();
    ctx.globalAlpha = 0.32;
    ctx.drawImage(paperSprite.canvas, cardX, cardTop, cardW, cardH);
    ctx.globalAlpha = 1;

    // Gold double scalloped borders
    ctx.strokeStyle = '#C99C48';
    ctx.lineWidth = 2.4;
    traceScallopedCardPath(ctx, cardX, cardTop, cardW, cardH, 0);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    traceScallopedCardPath(ctx, cardX, cardTop, cardW, cardH, 10);
    ctx.stroke();

    // Progressive typography
    const crestT = easeOutCubic(progressIn(time, 6.5, 7.5));
    const introT = easeOutCubic(progressIn(time, 7.0, 8.2));
    const coupleT = easeOutQuart(progressIn(time, 7.9, 9.5));
    const dividerT = easeOutCubic(progressIn(time, 9.1, 10.0));
    const dateT = easeOutCubic(progressIn(time, 9.6, 10.7));
    const venueT = easeOutCubic(progressIn(time, 10.5, 11.7));
    const closing1T = easeOutCubic(progressIn(time, 11.6, 12.7));
    const { mainAlpha, quoteAlpha, mainShiftY, quoteShiftY } =
      computeCardCrossfade(time);

    const cx = STAGE_WIDTH / 2;

    // Top crest heart
    ctx.save();
    ctx.globalAlpha = crestT;
    ctx.fillStyle = '#B88B38';
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♡', cx, cardTop + 74 + (1 - crestT) * 10);
    ctx.restore();

    // Intro
    ctx.save();
    ctx.globalAlpha = introT * mainAlpha;
    ctx.fillStyle = '#2A221C';
    ctx.font = '600 21px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    drawWrappedCenteredText(
      ctx,
      INVITATION_COPY.intro.toUpperCase(),
      cx,
      cardTop + 108 + (1 - introT) * 12 + mainShiftY,
      490,
      29
    );
    ctx.restore();

    // Couple names
    ctx.save();
    ctx.globalAlpha = coupleT * mainAlpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const baseNameY = cardTop + 236 + (1 - coupleT) * 14 + mainShiftY;
    ctx.font = '400 94px "Great Vibes", cursive';
    ctx.fillStyle = '#102042';
    ctx.fillText('Mourad', cx, baseNameY);

    ctx.font = 'italic 600 44px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = '#BA8C37';
    ctx.fillText('&', cx, baseNameY + 62);
    ctx.fillStyle = '#8E2D42';
    ctx.font = '18px serif';
    ctx.fillText('♥', cx - 34, baseNameY + 60);
    ctx.fillText('♥', cx + 34, baseNameY + 60);

    ctx.font = '400 90px "Great Vibes", cursive';
    ctx.fillStyle = '#913044';
    ctx.fillText('Dounia', cx, baseNameY + 124);
    ctx.restore();

    // Divider
    ctx.save();
    ctx.globalAlpha = dividerT * mainAlpha;
    const divY = cardTop + 408 + mainShiftY;
    ctx.strokeStyle = 'rgba(186, 141, 58, 0.72)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 120, divY);
    ctx.lineTo(cx + 120, divY);
    ctx.stroke();
    ctx.restore();

    // Date
    ctx.save();
    ctx.globalAlpha = dateT * mainAlpha;
    const dy = cardTop + 432 + (1 - dateT) * 10 + mainShiftY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#3B2E25';
    ctx.font = '600 20px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('JEUDI', cx, dy);
    ctx.fillStyle = '#7D2238';
    ctx.font = '600 38px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('28 JANVIER 2027', cx, dy + 28);
    ctx.restore();

    // Venue + Gold Anchor
    ctx.save();
    ctx.globalAlpha = venueT * mainAlpha;
    const vy = cardTop + 528 + (1 - venueT) * 10 + mainShiftY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#332820';
    ctx.font = '600 22px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(INVITATION_COPY.venueLines[0].toUpperCase(), cx, vy);

    ctx.fillStyle = '#102042';
    ctx.font = '400 54px "Great Vibes", cursive';
    ctx.fillText('le petit port', cx - 18, vy + 28);
    ctx.fillStyle = '#B88A34';
    ctx.font = '32px serif';
    ctx.fillText('⚓', cx + 128, vy + 40);

    ctx.fillStyle = '#332820';
    ctx.font = '600 21px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('• KRYSTEL, ORAN •', cx, vy + 94);
    ctx.restore();

    // Closing wish
    ctx.save();
    ctx.globalAlpha = closing1T * mainAlpha;
    ctx.fillStyle = '#3B2E25';
    ctx.font = 'italic 400 23px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    drawWrappedCenteredText(
      ctx,
      INVITATION_COPY.closingFirst,
      cx,
      cardTop + 706 + (1 - closing1T) * 9 + mainShiftY,
      465,
      32
    );
    ctx.restore();

    // Crossfaded Couple Quote
    if (quoteAlpha > 0.005) {
      ctx.save();
      ctx.globalAlpha = quoteAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#8E6A2C';
      ctx.font = '600 18px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(
        INVITATION_COPY.welcomeSubtitle.toUpperCase(),
        cx,
        cardTop + 210 + quoteShiftY
      );
      ctx.fillStyle = '#2A221C';
      ctx.font = 'italic 400 31px "Cormorant Garamond", Georgia, serif';
      drawWrappedCenteredText(
        ctx,
        INVITATION_COPY.coupleQuote,
        cx,
        cardTop + 274 + quoteShiftY,
        465,
        48
      );
      ctx.textBaseline = 'middle';
      ctx.font = '400 56px "Great Vibes", cursive';
      ctx.fillStyle = '#102042';
      ctx.fillText('Mourad', cx - 102, cardTop + 590 + quoteShiftY);
      ctx.fillStyle = '#BA8C37';
      ctx.font = 'italic 600 40px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('&', cx, cardTop + 590 + quoteShiftY);
      ctx.fillStyle = '#913044';
      ctx.font = '400 56px "Great Vibes", cursive';
      ctx.fillText('Dounia', cx + 102, cardTop + 590 + quoteShiftY);
      ctx.restore();
    }

    ctx.restore(); // end scalloped card clip

    // Layer 3: Navy Envelope Front Pocket
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(envX, envY);
    ctx.quadraticCurveTo(envX + envW / 2, envY + 54 * envelopeScale, envX + envW, envY);
    ctx.lineTo(envX + envW, envY + envH);
    ctx.lineTo(envX, envY + envH);
    ctx.closePath();

    const envGrad = ctx.createLinearGradient(envX, envY, envX + envW, envY + envH);
    envGrad.addColorStop(0, '#162A52');
    envGrad.addColorStop(0.55, '#101F3F');
    envGrad.addColorStop(1, '#0A152C');
    ctx.fillStyle = envGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(213, 175, 99, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();

    if (!flapIsPastVertical) {
      drawFlap();
    }

    // Layer 4: Bottom-left Navy Satin Drape & Ribbon Closing Line
    const sashReveal = easeOutCubic(progressIn(time, 11.8, 13.4));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-20, 1605);
    ctx.bezierCurveTo(145, 1675, 295, 1750, 475, 1825);
    ctx.bezierCurveTo(585, 1870, 675, 1905, 745, 1940);
    ctx.lineTo(-20, 1940);
    ctx.closePath();
    const sashGrad = ctx.createLinearGradient(0, 1605, 650, 1920);
    sashGrad.addColorStop(0, '#1B305C');
    sashGrad.addColorStop(0.5, '#0E1B37');
    sashGrad.addColorStop(1, '#081124');
    ctx.fillStyle = sashGrad;
    ctx.fill();
    ctx.strokeStyle = '#DFBA6B';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.globalAlpha = sashReveal;
    ctx.translate(215, 1795);
    ctx.rotate(-0.05);
    ctx.fillStyle = '#FBF5E9';
    ctx.font = 'italic 400 23px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    drawWrappedCenteredText(ctx, `${INVITATION_COPY.closingSecond} ♥`, 0, -24, 330, 31);
    ctx.restore();

    // Bottom-right Blush & Ivory Roses accent
    ctx.save();
    const drawRose = (rx: number, ry: number, r: number, c1: string, c2: string) => {
      const rg = ctx.createRadialGradient(rx - r * 0.2, ry - r * 0.2, r * 0.1, rx, ry, r);
      rg.addColorStop(0, c1);
      rg.addColorStop(1, c2);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    };
    drawRose(862, 1752, 64, '#FBE7E6', '#C68488');
    drawRose(972, 1775, 54, '#FFFDF8', '#D6BE9F');
    drawRose(918, 1852, 52, '#FBE7E6', '#C68488');
    ctx.restore();

    // Layer 4.2: Navy-Gold Nautical Anchor Medallion
    const sealUnsealT = easeInOutCubic(progressIn(time, 2.1, 3.4));
    const sealLocalY = lerp(420, 464, sealUnsealT);
    const sealLiftPulse = 1 + Math.sin(sealUnsealT * Math.PI) * 0.04;
    const sealSize = 196 * envelopeScale * sealLiftPulse;
    drawNavyAnchorMedallion(
      ctx,
      envX + envW / 2,
      envY + sealLocalY * envelopeScale,
      sealSize
    );

    // Layer 4.5: Gold Particles
    const particles = computeGoldParticles(time);
    for (const p of particles) {
      const haloR = p.radius * 2.6;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
      grad.addColorStop(0, 'rgba(255, 248, 224, 0.98)');
      grad.addColorStop(0.36, 'rgba(227, 192, 114, 0.65)');
      grad.addColorStop(1, 'rgba(204, 166, 86, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Layer 5: Butterflies
    for (const spec of BUTTERFLY_SPECS) {
      const b = computeButterflyState(spec, time);
      if (!b) continue;
      drawCanvasButterfly(
        ctx,
        b.x,
        b.y,
        b.headingDeg,
        b.wingTiltDeg,
        b.lift,
        b.opacity,
        b.scale
      );
    }
  };

  for (let frame = 0; frame <= totalFrames; frame++) {
    if (signal?.aborted) {
      recorder.stop();
      throw new DOMException('Export cancelled', 'AbortError');
    }
    const t = Math.min(TOTAL_DURATION, frame / fps);
    renderFrame(t);
    onProgress({
      progress: 0.05 + (frame / totalFrames) * 0.9,
      phase: 'rendering',
    });
    await new Promise((r) => setTimeout(r, 1000 / fps));
  }

  onProgress({ progress: 0.96, phase: 'encoding' });
  recorder.stop();
  const blob = await stopPromise;
  onProgress({ progress: 1, phase: 'encoding' });

  return {
    blob,
    filename: `Mourad-et-Dounia-Invitation-9x16.${ext}`,
  };
}
