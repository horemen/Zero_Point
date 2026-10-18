// Отрисовка: камера следует за героиней, сцена рисуется в маленький буфер и растягивается крупными пикселями.
// Подписи (имена, урон) рисуются поверх чётким шрифтом.
(function (ZP) {
  const U = ZP.util;
  const R = (ZP.render = { cam: { x: 480, y: 320 } });
  const game = document.getElementById('game');
  const cv = document.getElementById('arena'), vctx = cv.getContext('2d');
  const lb = document.createElement('canvas'), lctx = lb.getContext('2d');
  let dpr = 1, s = 1, P = 2, g = 1, cw = 0, ch = 0, viewCX = 0, viewCY = 0, vcxB = 0, vcyB = 0, topEdge = 0, botEdge = 0;

  R.unit = ZP.SPRITE_PX; R.g = 1;
  R.snap = (v) => Math.round(v / R.g) * R.g;
  R.layout = () => {
    dpr = Math.min(3, window.devicePixelRatio || 1);
    cw = game.clientWidth; ch = game.clientHeight;
    if (!cw || !ch) return;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    const top = document.getElementById('hud-top'), bar = document.getElementById('actionbar');
    const topH = top.offsetTop + top.offsetHeight, barH = bar.offsetHeight;
    game.style.setProperty('--bar-h', barH + 'px');
    const usableH = Math.max(200, ch - topH - barH - 24);
    topEdge = topH; botEdge = ch - barH - 16;
    s = U.clamp(Math.min(cw, usableH * 1.5) / 560, 0.6, 1.6);
    viewCX = cw / 2; viewCY = topH + 4 + usableH / 2;
    P = Math.max(2, Math.round(2 * dpr)); g = P / (s * dpr);
    // пиксель спрайта = целое число пикселей экрана (около 3 пикселей мира)
    R.unit = g * Math.max(1, Math.round(ZP.SPRITE_PX / g));
    R.g = g;
    lb.width = Math.ceil(cv.width / P); lb.height = Math.ceil(cv.height / P);
    vcxB = (viewCX * dpr) / P; vcyB = (viewCY * dpr) / P;
    R.snapCamera();
  };

  function camTarget() {
    const H = ZP.hero, map = ZP.world.cur;
    // край карты может заходить в кадр не больше чем на 120 px; по вертикали считаем от панелей интерфейса,
    // чтобы героиня у края карты не пряталась под портретом или панелью оружия
    const ax = (v, size, before, after, M) => { const lo = before - M, hi = size + M - after; return lo > hi ? (lo + hi) / 2 : U.clamp(v, lo, hi); };
    return { x: ax(H.x, map.W, viewCX / s, (cw - viewCX) / s, 120), y: ax(H.y - 30, map.H, (viewCY - topEdge) / s, (botEdge - viewCY) / s, 90) };
  }
  // экран (CSS-пиксели) → мир
  R.screenToWorld = (sx, sy) => { const o = R.lastO || { ox: 0, oy: 0 }; return { x: ((sx * dpr) / P - o.ox) * g, y: ((sy * dpr) / P - o.oy) * g }; };
  // враг под пальцем/курсором (с запасом для пальца)
  R.enemyAt = (sx, sy) => {
    if (ZP.world.cur.id !== 'field') return null;
    const w = R.screenToWorld(sx, sy), pad = 12 + 10 / s;
    let best = null, bd = 1e9;
    for (const e of ZP.enemies.list) {
      if (e.dead) continue;
      if (w.x < e.x - e.r - pad || w.x > e.x + e.r + pad || w.y < e.y - e.h - pad || w.y > e.y + pad) continue;
      const d = Math.hypot(w.x - e.x, w.y - (e.y - e.h / 2));
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  };
  R.snapCamera = () => { if (!ZP.world.cur) return; const t = camTarget(); R.cam.x = t.x; R.cam.y = t.y; };
  R.updateCamera = (dt) => { const t = camTarget(), k = Math.min(1, dt * 6); R.cam.x += (t.x - R.cam.x) * k; R.cam.y += (t.y - R.cam.y) * k; };

  R.draw = () => {
    const map = ZP.world.cur, H = ZP.hero, clock = ZP.time.clock;
    if (!map || !cv.width) return;
    const camBx = Math.round(R.cam.x / g), camBy = Math.round(R.cam.y / g);
    const ox = vcxB - camBx, oy = vcyB - camBy;
    R.lastO = { ox, oy };
    const c = lctx;
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
    c.fillStyle = '#22401c'; c.fillRect(0, 0, lb.width, lb.height);
    c.drawImage(ZP.ground.get(map, g), Math.round(ox - map.M / g), Math.round(oy - map.M / g));
    c.setTransform(1 / g, 0, 0, 1 / g, ox, oy);
    const vx0 = -ox * g, vy0 = -oy * g, vx1 = (lb.width - ox) * g, vy1 = (lb.height - oy) * g;
    const inView = (x, y, m) => x > vx0 - m && x < vx1 + m && y > vy0 - m && y < vy1 + m + 60;

    // круги дальности стрельбы и отметка цели
    const w = ZP.WEAPONS[H.weapon], t = H.target;
    if (t && !t.dead && map.id === 'field') {
      c.strokeStyle = 'rgba(255,90,70,.9)'; c.lineWidth = 2; c.setLineDash([5, 4]);
      c.beginPath(); c.ellipse(t.x, t.y + 1, t.r + 7, (t.r + 7) * 0.4, 0, 0, 7); c.stroke(); c.setLineDash([]);
      if (w.type !== 'melee') { c.strokeStyle = 'rgba(255,215,120,.18)'; c.setLineDash([6, 8]); c.beginPath(); c.arc(H.x, H.y, w.range[1], 0, 7); c.stroke(); c.setLineDash([]); }
    }
    for (const p of ZP.fx.particles) if (p.ghost) { c.globalAlpha = p.life * 2; c.fillStyle = p.c; c.beginPath(); c.ellipse(p.x, p.y - 30, 9, 22, 0, 0, 7); c.fill(); }
    c.globalAlpha = 1;

    // объекты, звери и героиня — по глубине
    const ents = [];
    for (const o of map.props) if (inView(o.x, o.y, 140)) ents.push({ y: o.k === 'gateBar' ? o.y : o.y + (o.r ? o.r * 0.45 : 0), o });
    if (map.id === 'field') for (const e of ZP.enemies.list) if (inView(e.x, e.y, 60)) ents.push({ y: e.y, e });
    for (const l of ZP.inventory.loot) if (l.map === map.id) ents.push({ y: l.y, l });
    ents.push({ y: H.y + 2, h: true });
    ents.sort((a, b) => a.y - b.y);
    for (const it of ents) {
      if (it.o) ZP.sprites.drawProp(c, it.o, clock);
      else if (it.e) ZP.sprites.drawEnemy(c, it.e, clock);
      else if (it.l) ZP.inventory.drawLoot(c, it.l);
      else ZP.sprites.drawHero(c, H, clock);
    }
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const o of map.torches) if (inView(o.x, o.y, 100)) ZP.sprites.torchLight(c, o, clock);
    c.restore();

    // снаряды
    for (const p of ZP.combat.projectiles) {
      if (p.kind === 'arrow') {
        const a = Math.atan2(p.vy, p.vx); c.save(); c.translate(p.x, p.y); c.rotate(a);
        c.fillStyle = '#cbb58a'; c.fillRect(-22, -1.2, 22, 2.4);
        c.fillStyle = '#dfe5ea'; c.beginPath(); c.moveTo(5, 0); c.lineTo(-2, -3.5); c.lineTo(-2, 3.5); c.fill();
        c.fillStyle = '#c4503a'; c.fillRect(-23, -3, 6, 6); c.restore();
      } else {
        p.trail.forEach((q, i) => { c.fillStyle = `rgba(143,182,255,${(i / p.trail.length) * 0.5})`; c.fillRect(q.x - 2 - i * 0.4, q.y - 2 - i * 0.4, 4 + i * 0.8, 4 + i * 0.8); });
        const gr = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, 12); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.4, '#9fc2ff'); gr.addColorStop(1, 'rgba(143,182,255,0)');
        c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, 12, 0, 7); c.fill();
      }
    }
    for (const p of ZP.fx.particles) { if (p.ghost) continue; c.globalAlpha = Math.min(1, p.life * 1.6); c.fillStyle = p.c; c.fillRect(p.x, p.y, p.sz, p.sz); }
    c.globalAlpha = 1;
    for (const r of ZP.fx.rings) { c.strokeStyle = `rgba(255,210,100,${1 - r.t / 0.9})`; c.lineWidth = 4; c.beginPath(); c.ellipse(r.x, r.y + 10, 20 + r.t * 80, (20 + r.t * 80) * 0.4, 0, 0, 7); c.stroke(); }

    // вывод с крупными пикселями
    vctx.setTransform(1, 0, 0, 1, 0, 0); vctx.imageSmoothingEnabled = false;
    vctx.drawImage(lb, 0, 0, lb.width * P, lb.height * P);

    // подписи поверх
    const scr = (x, y) => [(x / g + ox) * P, (y / g + oy) * P];
    vctx.textAlign = 'center'; vctx.lineJoin = 'round';
    const label = (text, x, y, size, color, weight) => {
      const [sx, sy] = scr(x, y);
      vctx.font = `${weight || 600} ${size * dpr}px Comfortaa, "Segoe UI", sans-serif`;
      vctx.lineWidth = 3 * dpr; vctx.strokeStyle = 'rgba(0,0,0,.9)'; vctx.strokeText(text, sx, sy);
      vctx.fillStyle = color; vctx.fillText(text, sx, sy);
    };
    const bar = (x, y, wpx, frac, color) => {
      const [sx, sy] = scr(x, y), W = wpx * dpr, Hh = 4 * dpr;
      vctx.fillStyle = '#000'; vctx.fillRect(Math.round(sx - W / 2 - dpr), Math.round(sy - dpr), Math.round(W + 2 * dpr), Math.round(Hh + 2 * dpr));
      vctx.fillStyle = '#3a1410'; vctx.fillRect(Math.round(sx - W / 2), Math.round(sy), Math.round(W), Math.round(Hh));
      vctx.fillStyle = color; vctx.fillRect(Math.round(sx - W / 2), Math.round(sy), Math.round(W * U.clamp(frac, 0, 1)), Math.round(Hh));
    };
    for (const gt of Object.values(map.gates)) if (inView(gt.x, gt.y, 80)) label('Выход: ' + gt.label,gt.x + gt.nx * 6 + (gt.side === 'e' ? -40 : gt.side === 'w' ? 44 : 0), gt.y + (gt.side === 's' ? -48 : gt.side === 'n' ? 70 : -60), 10, '#ffd36a', 700);
    if (map.id === 'village') { const d = ZP.world.dummy(); if (d) label('Манекен', d.x, d.y - 54, 10, '#f0d78a', 600); label('Камень воскрешения', map.respawn.x, map.respawn.y - 76, 10, '#a8dcff', 600); }
    if (map.id === 'field') {
      for (const e of ZP.enemies.list) {
        if (e.dead || !inView(e.x, e.y, 40)) continue;
        const isT = e === H.target;
        if (isT || e.aggro || e.hp < e.st.hp) bar(e.x, e.y - e.h - 9, 26, e.hp / e.st.hp, '#e2463a');
        label(`${e.name} ${e.L}`, e.x, e.y - e.h - 12, isT ? 12 : 10, ZP.levelColor(e.L), isT ? 700 : 600);
      }
    }
    if (!H.dead) { label(ZP.HERO_NAME, H.x, H.y - 66, 12, ZP.fx.COL.name, 700); if (map.id === 'field' || H.hp < H.max) bar(H.x, H.y - 62, 30, H.hp / H.max, '#4ad66a'); }
    for (const f of ZP.fx.floats) { vctx.globalAlpha = Math.min(1, f.life * 1.5); label(f.text, f.x, f.y, f.big ? 12 : 10, f.c, 700); }
    vctx.globalAlpha = 1;
  };

  // миникарта: локация, звери, ворота, героиня
  R.drawMinimap = (mcv) => {
    const map = ZP.world.cur, H = ZP.hero, m = mcv.getContext('2d');
    const w = mcv.width, h = mcv.height, sx = (w - 6) / map.W, sy = (h - 6) / map.H;
    m.fillStyle = '#22401c'; m.fillRect(0, 0, w, h);
    m.fillStyle = map.id === 'village' ? '#7d5f3d' : '#3e6e2e'; m.fillRect(3, 3, w - 6, h - 6);
    if (map.id === 'village') { m.fillStyle = '#4a2f17'; m.fillRect(2, 2, w - 4, 1); m.fillRect(2, h - 3, w - 4, 1); m.fillRect(2, 2, 1, h - 4); m.fillRect(w - 3, 2, 1, h - 4); }
    m.fillStyle = map.id === 'village' ? '#3a2a1a' : '#24451f';
    for (const o of map.obst) m.fillRect(Math.round(3 + o.x * sx), Math.round(3 + o.y * sy), map.id === 'village' ? 2 : 1, map.id === 'village' ? 2 : 1);
    m.fillStyle = '#ffd36a';
    for (const gt of Object.values(map.gates)) m.fillRect(Math.round(3 + gt.x * sx - 1), Math.round(3 + gt.y * sy - 1), 3, 3);
    if (map.id === 'field') for (const e of ZP.enemies.list) { if (e.dead) continue; m.fillStyle = e === H.target ? '#ffffff' : ZP.levelColor(e.L); m.fillRect(Math.round(3 + e.x * sx), Math.round(3 + e.y * sy), 1, 1); }
    if (Math.floor(ZP.time.clock * 3) % 2 === 0 || ZP.paused) { m.fillStyle = '#9fe8ff'; m.fillRect(Math.round(3 + H.x * sx - 1), Math.round(3 + H.y * sy - 1), 3, 3); }
  };
})(window.ZP);
