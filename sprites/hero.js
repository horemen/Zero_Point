// Спрайт героини Аэлис в чиби-стиле: большая серебряная голова с гребнем, светящиеся глаза,
// голубая энергия, когти на свободной руке. Оружие держит в вытянутой руке.
(function (ZP) {
  const S = (ZP.sprites = ZP.sprites || {});
  const U = ZP.util;
  const L = '#f2f6fa', M = '#c3ccd6', D = '#8d98a6', C = '#7fd8ff', B = '#3e9be8', W = '#ffffff';
  const PX = () => ZP.SPRITE_PX;

  S.heroAim = (H) => U.clamp(Math.atan2(Math.sin(H.face), Math.abs(Math.cos(H.face))), -1.1, 1.1);
  S.heroFlip = (H) => (Math.cos(H.face) < 0 ? -1 : 1);
  // точка ладони в мире (откуда вылетают стрелы и сферы)
  S.handPos = (H) => { const la = S.heroAim(H), f = S.heroFlip(H), p = PX(); return { x: H.x + f * p * (2 + Math.cos(la) * 4), y: H.y + p * (-6 + Math.sin(la) * 4) }; };

  function body(frame) {
    const l1 = frame === 1 ? -1 : 0, l2 = frame === 2 ? -1 : 0;
    return [
      [-2, -3 + l1, 2, 3, D], [1, -3 + l2, 2, 3, M],
      [-4, -7, 1, 3, D],
      [-3, -7, 6, 4, M], [-2, -7, 2, 3, L, true], [-3, -5, 6, 1, C, true],
      // гребень, зачёсанный назад
      [-5, -15, 3, 1, L], [-6, -16, 2, 1, L], [-7, -17, 2, 1, L],
      [-2, -15, 3, 1, L], [-3, -16, 2, 1, L], [-4, -17, 1, 1, L],
      [1, -15, 2, 1, L], [0, -16, 1, 1, L],
      // голова, тёмная маска и светящиеся глаза
      [-4, -14, 8, 7, L], [-4, -14, 2, 7, M, true], [-3, -8, 7, 1, M, true],
      [0, -12, 5, 2, '#3e4c5e', true], [1, -12, 1, 1, '#c8f6ff', true], [3, -12, 1, 1, '#c8f6ff', true], [1, -11, 1, 1, C, true], [3, -11, 1, 1, C, true],
      [-5, -4, 1, 1, W, true], [-4, -4, 1, 1, W, true],
    ];
  }
  function weapon(c, H, k, t) {
    let P;
    if (k === 'sword') P = [[-2, 0, 2, 1, '#7a4a24'], [0, -1, 1, 3, '#e2b14f'], [1, 0, 7, 1, '#eef2f6'], [8, 0, 1, 1, '#c3ccd6']];
    else if (k === 'dagger') P = [[-1, 0, 1, 1, '#7a4a24'], [0, -1, 1, 3, '#e2b14f'], [1, 0, 4, 1, '#eef2f6']];
    else if (k === 'bow') {
      const pull = H.animDur ? (t < 0.55 ? Math.round((t / 0.55) * 2) : 0) : 0;
      P = [[0, -5, 1, 1, '#9a6234'], [1, -4, 1, 2, '#9a6234'], [2, -2, 1, 4, '#9a6234'], [1, 2, 1, 2, '#9a6234'], [0, 4, 1, 1, '#9a6234'], [-pull, -4, 1, 8, '#efe6d0', true, true]];
      if (pull || !H.animDur) P.push([-pull, 0, 6, 1, '#d8c08a', true], [5 - pull, 0, 1, 1, '#eafaff', true]);
    } else {
      const glow = H.animDur ? Math.sin(t * Math.PI) : 0;
      P = [[-4, 0, 10, 1, '#9a6234'], [6, -1, 3, 3, C], [7, -1, 1, 1, W, true]];
      c.fillStyle = `rgba(127,216,255,${0.25 + glow * 0.4})`; c.beginPath(); c.arc(7.5, 0.5, 3 + glow * 3, 0, 7); c.fill();
    }
    S.parts(c, P);
  }

  S.drawHero = (c, H, clock) => {
    const k = H.weapon, flip = S.heroFlip(H), la = S.heroAim(H), t = H.animDur ? H.anim / H.animDur : 0;
    const frame = H.moving ? (Math.floor(H.bob / 3) % 2) + 1 : 0;
    const p = PX();
    S.shadow(c, H.x, H.y + 1, 5 * p, 1.8 * p);
    if (H.dead) {
      const pr = Math.min(1, H.deathT * 3);
      c.save(); c.globalAlpha = Math.max(0, 1 - H.deathT / 2.6);
      S.begin(c, H.x, H.y, flip); c.rotate(-pr * Math.PI / 2);
      S.parts(c, body(0)); c.restore(); c.restore();
      return;
    }
    // голубое свечение под ногами
    const ag = c.createRadialGradient(H.x, H.y, 1, H.x, H.y, 9 * p);
    ag.addColorStop(0, H.hurtFlash > 0 ? 'rgba(255,90,70,.5)' : 'rgba(79,179,255,.28)'); ag.addColorStop(1, 'rgba(79,179,255,0)');
    c.fillStyle = ag; c.beginPath(); c.ellipse(H.x, H.y, 9 * p, 3.5 * p, 0, 0, 7); c.fill();
    const bob = H.moving && frame ? -1 : 0;
    S.begin(c, H.x, H.y, flip);
    c.translate(0, bob);
    S.parts(c, body(frame), H.hurtFlash > 0.12);
    // рука с оружием
    c.save(); c.translate(2, -6); c.rotate(la);
    S.parts(c, [[0, -1, 3, 2, M]]);
    c.translate(4, 0);
    let swing = 0;
    if (k === 'sword' && H.animDur) swing = H.spin ? t * Math.PI * 2 : (-1.3 + 2.4 * U.easeOut(t)) * H.swingSign;
    if (k === 'sword' && !H.animDur) swing = -0.7;
    if (k === 'dagger' && H.animDur) c.translate(Math.round(Math.sin(t * Math.PI) * 3), 0);
    c.rotate(swing);
    weapon(c, H, k, t);
    c.restore();
    // энергия в ладони
    const pulse = 1.6 + Math.sin(clock * 5) * 0.4;
    c.fillStyle = 'rgba(127,216,255,.45)'; c.beginPath(); c.arc(2 + Math.cos(la) * 4, -6 + Math.sin(la) * 4, pulse + 1, 0, 7); c.fill();
    // след взмаха меча
    if (k === 'sword' && H.animDur && t > 0.15 && t < 0.85) {
      c.save(); c.translate(2, -6); c.rotate(la);
      c.strokeStyle = H.spin ? 'rgba(127,216,255,.75)' : 'rgba(255,255,255,.6)'; c.lineWidth = 1;
      c.beginPath();
      if (H.spin) c.arc(0, 0, 12, 0, t * Math.PI * 2);
      else c.arc(0, 0, 12, -1.3 * H.swingSign, (-1.3 + 2.4 * U.easeOut(t)) * H.swingSign, H.swingSign < 0);
      c.stroke(); c.restore();
    }
    c.restore();
  };

  // портрет: голова крупным планом
  S.drawPortrait = (c, size, H) => {
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
    c.fillStyle = H.dead ? '#5a2a2a' : '#2a5a86'; c.fillRect(0, 0, size, size);
    c.fillStyle = H.dead ? '#7a3a3a' : '#3a78aa'; c.fillRect(0, size * 0.6, size, size * 0.4);
    const k = Math.floor(size / 13);
    c.setTransform(k, 0, 0, k, Math.round(size / 2), Math.round(size / 2 + 11 * k));
    S.parts(c, body(0));
    c.setTransform(1, 0, 0, 1, 0, 0);
  };
})(window.ZP);
