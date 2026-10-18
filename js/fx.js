// Эффекты: всплывающие надписи, частицы, кольца.
(function (ZP) {
  const U = ZP.util;
  const F = (ZP.fx = { floats: [], particles: [], rings: [] });
  F.COL = { fg: '#f4e4bd', muted: '#d8c69c', accent: '#ffd36a', xp: '#9cf07a', miss: '#ff8a70', name: '#a8dcff', dmg: '#ffffff', hurt: '#ff5a4a' };

  F.float = (x, y, text, c, big) => { if (F.floats.length < 50) F.floats.push({ x, y, text, c: c || F.COL.fg, life: 1.3, big: !!big }); };
  F.burst = (x, y, n, colors, spd) => {
    if (F.particles.length > 400) return;
    for (let i = 0; i < n; i++) {
      const a = U.rnd(0, Math.PI * 2), s = U.rnd(spd * 0.3, spd);
      F.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rnd(0.4, 0.9), c: colors[i % colors.length], sz: U.rnd(2, 4) });
    }
  };
  F.ghost = (x, y) => F.particles.push({ x, y, vx: 0, vy: 0, life: 0.35, c: 'rgba(40,36,60,.7)', sz: 9, ghost: true });
  F.ring = (x, y) => F.rings.push({ x, y, t: 0 });
  F.clear = () => { F.floats.length = 0; F.particles.length = 0; F.rings.length = 0; };
  F.update = (dt) => {
    F.particles = F.particles.filter((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; return (p.life -= dt) > 0; });
    F.floats = F.floats.filter((f) => { f.y -= 26 * dt; return (f.life -= dt) > 0; });
    F.rings = F.rings.filter((r) => (r.t += dt) < 0.9);
  };
})(window.ZP);
