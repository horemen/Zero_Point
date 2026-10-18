// Общие помощники для спрайтов: контур, тень, рисование «пикселями» спрайта с привязкой к сетке экрана.
(function (ZP) {
  const S = (ZP.sprites = ZP.sprites || {});
  S.OUT = '#2a1e14';
  S.shadow = (c, x, y, rx, ry) => { c.fillStyle = 'rgba(20,30,10,.28)'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); };
  // размер пикселя спрайта в мире: кратен пикселю экрана, чтобы рисунок был чётким
  S.u = () => (ZP.render && ZP.render.unit) || ZP.SPRITE_PX;
  S.snap = (v) => (ZP.render && ZP.render.snap ? ZP.render.snap(v) : Math.round(v));
  // начать рисование спрайта: ступни в (x, y), 1 единица = 1 пиксель спрайта, face = 1 вправо / −1 влево
  S.begin = (c, x, y, face) => { const u = S.u(); c.save(); c.translate(S.snap(x), S.snap(y)); c.scale((face || 1) * u, u); return u; };
  // список частей [x, y, w, h, цвет, безКонтура] → сначала общий контур, потом заливка
  S.parts = (c, P, flash) => {
    c.fillStyle = S.OUT;
    for (const p of P) if (!p[5]) c.fillRect(p[0] - 1, p[1] - 1, p[2] + 2, p[3] + 2);
    for (const p of P) { c.fillStyle = flash && !p[6] ? '#ffffff' : p[4]; c.fillRect(p[0], p[1], p[2], p[3]); }
  };
})(window.ZP);
