// Спрайты окружения в минималистичном пиксельном стиле: плоские яркие цвета, тонкий тёмный контур.
// Точка (x, y) — основание предмета на земле.
(function (ZP) {
  const S = (ZP.sprites = ZP.sprites || {});
  const O = S.OUT;
  const rect = (c, x, y, w, h, col) => { c.fillStyle = O; c.fillRect(x - 1.5, y - 1.5, w + 3, h + 3); c.fillStyle = col; c.fillRect(x, y, w, h); };
  const circ = (c, x, y, r, col, outline) => { if (outline) { c.fillStyle = O; c.beginPath(); c.arc(x, y, r + 1.5, 0, 7); c.fill(); } c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };

  function tree(c, o) {
    const z = o.sz, x = o.x, y = o.y;
    S.shadow(c, x, y + 1, 18 * z, 6 * z);
    rect(c, x - 3 * z, y - 12 * z, 6 * z, 12 * z, '#9a6234');
    c.fillStyle = '#7a4a24'; c.fillRect(x + 1 * z, y - 12 * z, 2 * z, 12 * z);
    if (o.kind === 'pine') {
      const tri = (by, hw, h, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - hw, by); c.lineTo(x, by - h); c.lineTo(x + hw, by); c.fill(); };
      for (let i = 0; i < 2; i++) {
        const by = y - 10 * z - i * 16 * z, hw = (19 - i * 5) * z, h = 26 * z;
        c.fillStyle = O; c.beginPath(); c.moveTo(x - hw - 2, by + 1.5); c.lineTo(x, by - h - 2.5); c.lineTo(x + hw + 2, by + 1.5); c.fill();
        tri(by, hw, h, '#2f8a44'); c.fillStyle = '#4fb05a'; c.beginPath(); c.moveTo(x - hw, by); c.lineTo(x, by - h); c.lineTo(x - hw * 0.1, by); c.fill();
      }
    } else {
      const cy = y - 26 * z, r = 17 * z;
      circ(c, x, cy, r, '#3a9a3e', true);
      circ(c, x - 4 * z, cy - 5 * z, r * 0.62, '#5cc24e');
      c.fillStyle = '#8be06a'; c.fillRect(x - 9 * z, cy - 11 * z, 4 * z, 2 * z);
      if (o.fruit) { c.fillStyle = '#e8463a'; for (const [dx, dy] of [[6, -4], [-7, 4], [3, 7]]) c.fillRect(x + dx * z, cy + dy * z, 3 * z, 3 * z); }
    }
  }
  function bush(c, o) {
    const z = o.sz, x = o.x, y = o.y;
    S.shadow(c, x, y + 1, 12 * z, 4 * z);
    c.fillStyle = O; c.beginPath(); c.ellipse(x, y - 7 * z, 12 * z + 1.5, 8 * z + 1.5, 0, 0, 7); c.fill();
    c.fillStyle = '#44a83e'; c.beginPath(); c.ellipse(x, y - 7 * z, 12 * z, 8 * z, 0, 0, 7); c.fill();
    c.fillStyle = '#66c855'; c.beginPath(); c.ellipse(x - 3 * z, y - 10 * z, 6 * z, 4 * z, 0, 0, 7); c.fill();
    if (o.berries) { c.fillStyle = '#8a5ce8'; c.fillRect(x + 3 * z, y - 7 * z, 3 * z, 3 * z); c.fillRect(x - 6 * z, y - 5 * z, 3 * z, 3 * z); }
  }
  function rock(c, o) {
    const R = o.r, x = o.x, y = o.y;
    S.shadow(c, x, y + R * 0.3, R * 1.05, R * 0.35);
    c.fillStyle = O; c.beginPath(); c.ellipse(x, y - R * 0.35, R + 1.5, R * 0.75 + 1.5, 0, 0, 7); c.fill();
    c.fillStyle = '#9aa2aa'; c.beginPath(); c.ellipse(x, y - R * 0.35, R, R * 0.75, 0, 0, 7); c.fill();
    c.fillStyle = '#7a828a'; c.beginPath(); c.ellipse(x + R * 0.2, y - R * 0.1, R * 0.75, R * 0.4, 0, 0, Math.PI); c.fill();
    c.fillStyle = '#c8ccd0'; c.beginPath(); c.ellipse(x - R * 0.3, y - R * 0.65, R * 0.4, R * 0.2, 0, 0, 7); c.fill();
  }
  function barrel(c, o) {
    const w = o.r * 1.4, h = o.r * 1.6, x = o.x - w / 2, yb = o.y + o.r * 0.4;
    S.shadow(c, o.x, yb, o.r, o.r * 0.32);
    rect(c, x, yb - h, w, h, '#b0723e');
    c.fillStyle = '#6a4220'; c.fillRect(x, yb - h * 0.75, w, 2); c.fillRect(x, yb - h * 0.3, w, 2);
    c.fillStyle = '#d0945a'; c.fillRect(x, yb - h, w, h * 0.16);
  }
  function hay(c, o) {
    const w = o.r * 1.8, h = o.r * 1.2, x = o.x - w / 2, yb = o.y + o.r * 0.4;
    S.shadow(c, o.x, yb, o.r * 1.05, o.r * 0.32);
    rect(c, x, yb - h, w, h, '#e8c45a');
    c.fillStyle = '#f6de8e'; c.fillRect(x, yb - h, w, h * 0.25);
    c.fillStyle = '#c8a040'; c.fillRect(x + w * 0.3, yb - h, 2, h); c.fillRect(x + w * 0.68, yb - h, 2, h);
  }
  function post(c, o) { rect(c, o.x - 3, o.y - 15, 6, 15, '#b0723e'); c.fillStyle = '#d0945a'; c.fillRect(o.x - 3, o.y - 15, 6, 3); }
  function gatePost(c, o) { rect(c, o.x - 5, o.y - 42, 10, 42, '#9a6234'); c.fillStyle = '#e2b14f'; c.fillRect(o.x - 5, o.y - 42, 10, 4); }
  function gateBar(c, o) { rect(c, o.x1 - 7, o.y - 48, o.x2 - o.x1 + 14, 7, '#b0723e'); c.fillStyle = '#d0945a'; c.fillRect(o.x1 - 7, o.y - 48, o.x2 - o.x1 + 14, 2); }
  function sign(c, o) {
    rect(c, o.x - 1.5, o.y - 24, 3, 24, '#9a6234');
    rect(c, o.x - 12, o.y - 34, 24, 12, '#d0945a');
    c.fillStyle = '#5a3a1e';
    c.save(); c.translate(o.x, o.y - 28); c.rotate(o.dir === 'e' ? 0 : o.dir === 's' ? Math.PI / 2 : o.dir === 'w' ? Math.PI : -Math.PI / 2);
    c.fillRect(-6, -1, 8, 2); c.beginPath(); c.moveTo(6, 0); c.lineTo(1, -4); c.lineTo(1, 4); c.fill(); c.restore();
  }
  function torch(c, o, t) {
    rect(c, o.x - 2, o.y - 30, 4, 30, '#7a4a24');
    const f = Math.sin(t * 18 + o.x) * 1.5;
    c.fillStyle = '#ff7a2a'; c.beginPath(); c.ellipse(o.x, o.y - 36, 5, Math.max(4, 7 + f), 0, 0, 7); c.fill();
    c.fillStyle = '#ffe07a'; c.beginPath(); c.ellipse(o.x, o.y - 34, 2.5, 4, 0, 0, 7); c.fill();
  }
  S.torchLight = (c, o, t) => {
    const R = 64 + Math.sin(t * 9 + o.x) * 4, g = c.createRadialGradient(o.x, o.y - 30, 2, o.x, o.y - 30, R);
    g.addColorStop(0, 'rgba(255,180,80,.28)'); g.addColorStop(1, 'rgba(255,150,50,0)');
    c.fillStyle = g; c.beginPath(); c.arc(o.x, o.y - 30, R, 0, 7); c.fill();
  };
  function house(c, o) {
    const x = o.x, y = o.y, w = 104, wallH = 48;
    S.shadow(c, x + 4, y + 3, 60, 12);
    rect(c, x - w / 2, y - wallH, w, wallH, '#f4e0b4');
    c.fillStyle = '#dcc48e'; c.fillRect(x - w / 2, y - 8, w, 8);
    rect(c, x - 10, y - 30, 20, 30, '#9a6234'); c.fillStyle = '#ffd877'; c.fillRect(x + 4, y - 16, 3, 3);
    const wx = o.flip ? x - 40 : x + 22;
    rect(c, wx, y - 36, 18, 14, '#7fd0ff'); c.fillStyle = '#ffffff'; c.fillRect(wx + 2, y - 34, 4, 4);
    c.fillStyle = '#9a6234'; c.fillRect(wx + 8, y - 36, 2, 14);
    // крыша
    const roof = o.roof || '#e0583a', rH = 40;
    c.fillStyle = O; c.beginPath(); c.moveTo(x - w / 2 - 12, y - wallH + 3); c.lineTo(x - w / 2 + 14, y - wallH - rH - 2); c.lineTo(x + w / 2 - 14, y - wallH - rH - 2); c.lineTo(x + w / 2 + 12, y - wallH + 3); c.fill();
    c.fillStyle = roof; c.beginPath(); c.moveTo(x - w / 2 - 9, y - wallH + 1); c.lineTo(x - w / 2 + 15, y - wallH - rH); c.lineTo(x + w / 2 - 15, y - wallH - rH); c.lineTo(x + w / 2 + 9, y - wallH + 1); c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x - w / 2 + 6, y - wallH - rH * 0.62, w - 12, 3);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x - w / 2 - 6, y - wallH - 3, w + 12, 4);
    rect(c, x + 20, y - wallH - rH - 8, 10, 16, '#a8968a');
  }
  function well(c, o) {
    const x = o.x, y = o.y;
    S.shadow(c, x, y + 2, 20, 6);
    rect(c, x - 17, y - 16, 34, 16, '#a8b0b8'); c.fillStyle = '#868e96'; c.fillRect(x - 17, y - 8, 34, 2);
    c.fillStyle = '#2a4a6a'; c.fillRect(x - 13, y - 16, 26, 4);
    rect(c, x - 16, y - 44, 3, 28, '#9a6234'); rect(c, x + 13, y - 44, 3, 28, '#9a6234');
    c.fillStyle = O; c.beginPath(); c.moveTo(x - 24, y - 40); c.lineTo(x, y - 54); c.lineTo(x + 24, y - 40); c.fill();
    c.fillStyle = '#e0583a'; c.beginPath(); c.moveTo(x - 21, y - 41); c.lineTo(x, y - 52); c.lineTo(x + 21, y - 41); c.fill();
  }
  function stone(c, o, t) {
    const x = o.x, y = o.y, gl = 0.5 + Math.sin(t * 2.4) * 0.25;
    const g = c.createRadialGradient(x, y - 14, 2, x, y - 14, 42);
    g.addColorStop(0, `rgba(120,210,255,${0.35 * gl})`); g.addColorStop(1, 'rgba(120,210,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y - 14, 42, 0, 7); c.fill();
    rect(c, x - 12, y - 6, 24, 6, '#a8b0b8');
    c.fillStyle = O; c.beginPath(); c.moveTo(x, y - 36); c.lineTo(x + 9, y - 18); c.lineTo(x, y - 5); c.lineTo(x - 9, y - 18); c.fill();
    c.fillStyle = '#7fd8ff'; c.beginPath(); c.moveTo(x, y - 33); c.lineTo(x + 7, y - 18); c.lineTo(x, y - 7); c.lineTo(x - 7, y - 18); c.fill();
    c.fillStyle = '#eafaff'; c.fillRect(x - 3, y - 24, 2, 6);
  }
  function dummy(c, o, t) {
    const sh = o.shake > 0 ? Math.sin(t * 90) * o.shake * 6 : 0, x = o.x + sh, y = o.y;
    S.shadow(c, o.x, y + 1, 13, 4);
    rect(c, o.x - 2, y - 22, 4, 22, '#9a6234');
    rect(c, x - 15, y - 30, 30, 4, '#b0723e');
    rect(c, x - 8, y - 36, 16, 18, '#e8c45a');
    c.fillStyle = '#e0583a'; c.fillRect(x - 3, y - 30, 6, 6); c.fillStyle = '#f6de8e'; c.fillRect(x - 1, y - 28, 2, 2);
    circ(c, x, y - 42, 6, '#e8c45a', true);
  }
  function tent(c, o) {
    const x = o.x, y = o.y;
    S.shadow(c, x, y + 2, 34, 8);
    c.fillStyle = O; c.beginPath(); c.moveTo(x - 32, y + 1); c.lineTo(x, y - 40); c.lineTo(x + 32, y + 1); c.fill();
    c.fillStyle = '#c8946a'; c.beginPath(); c.moveTo(x - 29, y - 1); c.lineTo(x, y - 37); c.lineTo(x + 29, y - 1); c.fill();
    c.fillStyle = '#a87448'; c.beginPath(); c.moveTo(x, y - 37); c.lineTo(x + 29, y - 1); c.lineTo(x + 6, y - 1); c.fill();
    c.fillStyle = '#3a2416'; c.beginPath(); c.moveTo(x - 9, y - 1); c.lineTo(x, y - 20); c.lineTo(x + 9, y - 1); c.fill();
  }
  function campfire(c, o, t) {
    const x = o.x, y = o.y;
    rect(c, x - 12, y - 4, 24, 4, '#7a4a24'); rect(c, x - 4, y - 7, 8, 7, '#9a6234');
    const f = Math.sin(t * 16 + x) * 2;
    c.fillStyle = '#ff6a2a'; c.beginPath(); c.ellipse(x, y - 12, 7, 9 + f, 0, 0, 7); c.fill();
    c.fillStyle = '#ffd84a'; c.beginPath(); c.ellipse(x, y - 10, 3.5, 5 + f * 0.5, 0, 0, 7); c.fill();
  }
  function crystal(c, o, t) {
    const x = o.x, y = o.y, gl = 0.6 + Math.sin(t * 3 + x) * 0.2, cols = o.hue === 'p' ? ['#b884ff', '#7a4ad8', '#efe0ff'] : ['#7fd8ff', '#3a8ad8', '#eafaff'];
    S.shadow(c, x, y + 1, 16, 5);
    const shard = (dx, h, w) => {
      c.fillStyle = O; c.beginPath(); c.moveTo(x + dx - w - 1.5, y + 1); c.lineTo(x + dx, y - h - 2); c.lineTo(x + dx + w + 1.5, y + 1); c.fill();
      c.fillStyle = cols[0]; c.beginPath(); c.moveTo(x + dx - w, y); c.lineTo(x + dx, y - h); c.lineTo(x + dx + w, y); c.fill();
      c.fillStyle = cols[1]; c.beginPath(); c.moveTo(x + dx, y - h); c.lineTo(x + dx + w, y); c.lineTo(x + dx + w * 0.2, y); c.fill();
      c.fillStyle = cols[2]; c.globalAlpha = gl; c.fillRect(x + dx - w * 0.5, y - h * 0.6, 2, h * 0.35); c.globalAlpha = 1;
    };
    shard(-8, 18, 5); shard(7, 22, 6); shard(0, 32, 7);
  }
  function nest(c, o) {
    const x = o.x, y = o.y;
    c.fillStyle = O; c.beginPath(); c.ellipse(x, y - 3, 13.5, 6.5, 0, 0, 7); c.fill();
    c.fillStyle = '#9a6a3a'; c.beginPath(); c.ellipse(x, y - 3, 12, 5, 0, 0, 7); c.fill();
    c.fillStyle = '#c89a5a'; c.fillRect(x - 10, y - 5, 20, 2);
    c.fillStyle = '#f6eedc'; c.fillRect(x - 5, y - 9, 4, 5); c.fillRect(x + 1, y - 8, 4, 5);
  }

  const DRAW = { barrel, rock, hay, post, gatePost, gateBar, sign, torch, tree, bush, house, well, stone, dummy, tent, campfire, crystal, nest };
  S.drawProp = (c, o, t) => { const f = DRAW[o.k]; if (f) f(c, o, t); };
})(window.ZP);
