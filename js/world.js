// Локации: Деревня (бывший тренировочный двор) и Звериные луга (в 3×3 раза больше деревни).
// Здесь же переходы между локациями, препятствия и обход препятствий.
(function (ZP) {
  const U = ZP.util;
  const W = (ZP.world = { maps: {}, cur: null, pending: null });
  const fadeEl = () => document.getElementById('fade');

  function addFence(props, map, gaps) {
    const { W: w, H: h } = map;
    const inGap = (side, v) => gaps.some((g) => g.side === side && Math.abs(v - g.at) < 44);
    for (let x = 0; x <= w; x += 26) { if (!inGap('n', x)) props.push({ k: 'post', x, y: -4 }); if (!inGap('s', x)) props.push({ k: 'post', x, y: h + 4 }); }
    for (let y = 22; y < h; y += 26) { if (!inGap('w', y)) props.push({ k: 'post', x: -4, y }); if (!inGap('e', y)) props.push({ k: 'post', x: w + 4, y }); }
  }
  function addGateProps(props, g) {
    if (g.side === 's' || g.side === 'n') {
      const y = g.side === 's' ? g.y + 16 : g.y - 14;
      props.push({ k: 'gatePost', x: g.x - 40, y }, { k: 'gatePost', x: g.x + 40, y }, { k: 'gateBar', x: g.x, y: y + 0.5, x1: g.x - 40, x2: g.x + 40 });
      props.push({ k: 'torch', x: g.x - 64, y: y + 12 }, { k: 'torch', x: g.x + 64, y: y + 12 });
    } else {
      const x = g.side === 'e' ? g.x + 16 : g.x - 16;
      props.push({ k: 'gatePost', x, y: g.y - 40 }, { k: 'gatePost', x, y: g.y + 40 });
      props.push({ k: 'torch', x: x + (g.side === 'e' ? 12 : -12), y: g.y - 64 }, { k: 'torch', x: x + (g.side === 'e' ? 12 : -12), y: g.y + 66 });
    }
    props.push({ k: 'sign', x: g.x + g.signDx, y: g.y + g.signDy, dir: g.arrow });
  }
  // лес вокруг локации (за её границей), с просеками у ворот
  function addBorderForest(props, map, seed) {
    const r = U.seeded(seed), M = map.M;
    for (let gy = -M + 20; gy < map.H + M; gy += 54) {
      for (let gx = -M + 20; gx < map.W + M; gx += 56) {
        const x = gx + (r() - 0.5) * 40, y = gy + (r() - 0.5) * 34;
        if (x > -40 && x < map.W + 40 && y > -50 && y < map.H + 60) continue;
        let skip = false;
        for (const g of Object.values(map.gates)) {
          if ((g.side === 's' && y > map.H && Math.abs(x - g.x) < 70) || (g.side === 'n' && y < 0 && Math.abs(x - g.x) < 70) ||
              (g.side === 'e' && x > map.W && Math.abs(y - g.y) < 70) || (g.side === 'w' && x < 0 && Math.abs(y - g.y) < 70)) skip = true;
        }
        if (skip || r() < 0.12) continue;
        props.push({ k: 'tree', x, y, sz: 0.85 + r() * 0.45, kind: r() < 0.62 ? 'pine' : 'oak' });
      }
    }
  }
  function finalize(map) {
    map.obst = map.props.filter((o) => o.solid);
    map.torches = map.props.filter((o) => o.k === 'torch' || o.k === 'campfire');
  }

  function buildVillage() {
    const map = { id: 'village', name: 'Деревня', W: 960, H: 640, M: 360, props: [], safe: true };
    map.gates = {
      south: { id: 'south', side: 's', x: 480, y: 626, nx: 0, ny: -1, to: 'field', toGate: 'north', label: 'Звериные луга', signDx: 92, signDy: -8, arrow: 's' },
      east: { id: 'east', side: 'e', x: 946, y: 320, nx: -1, ny: 0, to: 'field', toGate: 'west', label: 'Звериные луга', signDx: -26, signDy: 78, arrow: 'e' },
    };
    map.respawn = { x: 480, y: 392 };
    const P = map.props;
    addFence(P, map, [{ side: 's', at: 480 }, { side: 'e', at: 320 }]);
    for (const g of Object.values(map.gates)) addGateProps(P, g);
    P.push({ k: 'house', x: 170, y: 190, r: 54, solid: true, roof: '#a5432a' });
    P.push({ k: 'house', x: 790, y: 170, r: 54, solid: true, roof: '#4a6aa5', flip: true });
    P.push({ k: 'well', x: 480, y: 170, r: 20, solid: true });
    P.push({ k: 'dummy', x: 300, y: 410, r: 18, solid: true, shake: 0 });
    P.push({ k: 'stone', x: 480, y: 360 });
    P.push({ k: 'barrel', x: 650, y: 470, r: 16, solid: true }, { k: 'barrel', x: 686, y: 486, r: 14, solid: true }, { k: 'barrel', x: 92, y: 300, r: 15, solid: true });
    P.push({ k: 'hay', x: 230, y: 540, r: 26, solid: true });
    P.push({ k: 'rock', x: 820, y: 520, r: 22, solid: true }, { k: 'rock', x: 610, y: 300, r: 14, solid: true });
    P.push({ k: 'tree', x: 900, y: 590, sz: 1, kind: 'oak', fruit: true, r: 14, solid: true });
    P.push({ k: 'bush', x: 300, y: 250, sz: 1, berries: true }, { k: 'bush', x: 660, y: 220, sz: 0.9 }, { k: 'bush', x: 60, y: 560, sz: 1 });
    addBorderForest(P, map, 91);
    finalize(map);
    return map;
  }

  function buildField() {
    const map = { id: 'field', name: 'Звериные луга', W: 2880, H: 1920, M: 360, props: [], safe: false };
    map.gates = {
      north: { id: 'north', side: 'n', x: 720, y: 14, nx: 0, ny: 1, to: 'village', toGate: 'south', label: 'Деревня', signDx: 92, signDy: 44, arrow: 'n' },
      west: { id: 'west', side: 'w', x: 14, y: 614, nx: 1, ny: 0, to: 'village', toGate: 'east', label: 'Деревня', signDx: 34, signDy: 80, arrow: 'w' },
    };
    const P = map.props, r = U.seeded(4242);
    for (const g of Object.values(map.gates)) addGateProps(P, g);
    const solids = [];
    const nearGate = (x, y, d) => Object.values(map.gates).some((g) => Math.hypot(x - g.x, y - g.y) < d);
    const place = (n, minGap, make) => {
      let tries = 0;
      while (n > 0 && tries++ < n * 40) {
        const x = 50 + r() * (map.W - 100), y = 60 + r() * (map.H - 100);
        if (nearGate(x, y, 240)) continue;
        if (solids.some((o) => Math.hypot(x - o.x, y - o.y) < minGap + o.r)) continue;
        const o = make(x, y); P.push(o); if (o.solid) solids.push(o); n--;
      }
    };
    // рощи: несколько скоплений деревьев
    for (let i = 0; i < 9; i++) {
      const cx = 200 + r() * (map.W - 400), cy = 200 + r() * (map.H - 400);
      if (nearGate(cx, cy, 380)) continue;
      for (let j = 0; j < 7; j++) {
        const x = cx + (r() - 0.5) * 260, y = cy + (r() - 0.5) * 200;
        if (x < 40 || y < 50 || x > map.W - 40 || y > map.H - 40) continue;
        if (solids.some((o) => Math.hypot(x - o.x, y - o.y) < 46 + o.r)) continue;
        const o = { k: 'tree', x, y, sz: 0.9 + r() * 0.4, kind: r() < 0.55 ? 'pine' : 'oak', r: 15, solid: true }; P.push(o); solids.push(o);
      }
    }
    place(55, 70, (x, y) => ({ k: 'tree', x, y, sz: 0.85 + r() * 0.45, kind: r() < 0.5 ? 'pine' : 'oak', fruit: r() < 0.2, r: 15, solid: true }));
    place(30, 70, (x, y) => ({ k: 'rock', x, y, r: 14 + r() * 14, solid: true }));
    place(70, 10, (x, y) => ({ k: 'bush', x, y, sz: 0.8 + r() * 0.5, berries: r() < 0.25 }));
    // приметы зон: гнёзда у птиц, лагеря гуманоидов, кристаллы у элементалей
    const zoneSpot = (cat, tries = 200) => { for (let i = 0; i < tries; i++) { const x = 80 + r() * (map.W - 160), y = 90 + r() * (map.H - 160); if (ZP.catForBase(W.baseLevel(map, x, y)) === cat && !nearGate(x, y, 260) && !solids.some((o) => Math.hypot(x - o.x, y - o.y) < 60 + o.r)) return { x, y }; } return null; };
    for (let i = 0; i < 10; i++) { const s = zoneSpot('bird'); if (s) P.push({ k: 'nest', x: s.x, y: s.y }); }
    for (let i = 0; i < 4; i++) {
      const s = zoneSpot('humanoid'); if (!s) continue;
      const fire = { k: 'campfire', x: s.x, y: s.y + 30 }, t1 = { k: 'tent', x: s.x - 40, y: s.y, r: 26, solid: true }, t2 = { k: 'tent', x: s.x + 44, y: s.y - 10, r: 26, solid: true };
      P.push(fire, t1, t2); solids.push(t1, t2);
    }
    for (let i = 0; i < 16; i++) { const s = zoneSpot('elemental'); if (s) { const o = { k: 'crystal', x: s.x, y: s.y, r: 14, solid: true, hue: r() < 0.5 ? 'p' : 'b' }; P.push(o); solids.push(o); } }
    addBorderForest(P, map, 777);
    finalize(map);
    return map;
  }

  // «базовый уровень» точки: 1 у ворот, ~10 в дальнем углу лугов
  W.baseLevel = (map, x, y) => {
    let dmin = 1e9;
    for (const g of Object.values(map.gates)) dmin = Math.min(dmin, Math.hypot(x - g.x, y - g.y));
    return 1 + (dmin / (Math.hypot(map.W, map.H) * 0.8)) * 9;
  };

  W.init = () => {
    W.maps.village = buildVillage();
    W.maps.field = buildField();
    W.cur = W.maps.village;
  };
  W.setMap = (id) => { W.cur = W.maps[id]; ZP.ui.mapChanged(); };
  W.dummy = () => W.maps.village.props.find((o) => o.k === 'dummy');

  // направление движения к цели с обходом препятствий
  W.steer = (p, gx, gy, rad) => {
    let dx = gx - p.x, dy = gy - p.y;
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    for (const o of W.cur.obst) {
      const vx = p.x - o.x, vy = p.y - o.y, lim = o.r + rad + 26;
      if (Math.abs(vx) > lim || Math.abs(vy) > lim) continue;
      const od = Math.hypot(vx, vy);
      if (od < lim && od > 0.01) {
        const f = ((lim - od) / 26) * 1.6, nx = vx / od, ny = vy / od, side = nx * dy - ny * dx > 0 ? 1 : -1;
        dx += nx * f + -ny * side * f * 0.8; dy += ny * f + nx * side * f * 0.8;
      }
    }
    const n = Math.hypot(dx, dy) || 1;
    return [dx / n, dy / n];
  };
  // вытолкнуть из препятствий и удержать в границах локации
  W.collide = (p, rad) => {
    for (const o of W.cur.obst) {
      const vx = p.x - o.x, vy = p.y - o.y, lim = o.r + rad;
      if (Math.abs(vx) > lim || Math.abs(vy) > lim) continue;
      const od = Math.hypot(vx, vy);
      if (od < lim && od > 0.01) { p.x = o.x + (vx / od) * lim; p.y = o.y + (vy / od) * lim; }
    }
    p.x = U.clamp(p.x, 12, W.cur.W - 12); p.y = U.clamp(p.y, 14, W.cur.H - 12);
  };
  W.segBlocked = (a, b, pad) => {
    for (const o of W.cur.obst) {
      const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy || 1;
      let t = ((o.x - a.x) * dx + (o.y - a.y) * dy) / L; t = U.clamp(t, 0, 1);
      if (Math.hypot(a.x + dx * t - o.x, a.y + dy * t - o.y) < o.r + pad) return true;
    }
    return false;
  };
  W.isFree = (x, y, rad) => W.cur.obst.every((o) => Math.hypot(x - o.x, y - o.y) > o.r + rad);
  W.nearestGate = (p) => { let best = null, bd = 1e9; for (const g of Object.values(W.cur.gates)) { const d = Math.hypot(p.x - g.x, p.y - g.y); if (d < bd) { bd = d; best = g; } } return best; };

  // переход через ворота и воскрешение — с затемнением экрана
  W.travel = (gate) => { if (W.pending) return; W.pending = { type: 'travel', gate, t: 0, switched: false }; fadeEl().classList.add('on'); };
  W.respawnHero = () => { if (W.pending) return; W.pending = { type: 'respawn', t: 0, switched: false }; fadeEl().classList.add('on'); };
  W.update = (dt) => {
    const p = W.pending; if (!p) return;
    p.t += dt;
    if (!p.switched && p.t >= 0.35) {
      p.switched = true;
      const H = ZP.hero;
      if (p.type === 'travel') {
        const to = W.maps[p.gate.to], tg = to.gates[p.gate.toGate];
        W.setMap(to.id);
        H.map = to.id; H.x = tg.x + tg.nx * 60; H.y = tg.y + tg.ny * 60; H.face = Math.atan2(tg.ny, tg.nx);
        ZP.ui.log(`${ZP.HERO_NAME} входит в локацию «${to.name}».`, 'sys');
      } else {
        W.setMap('village');
        ZP.heroAI.revive();
      }
      const keep = p.type === 'travel' && H.forced && H.target && !H.target.dead;
      if (!keep) { H.target = null; H.forced = false; }
      H.attacker = null; H.lastD = 1e9;
      ZP.combat.projectiles.length = 0; ZP.fx.clear();
      ZP.render.snapCamera();
      fadeEl().classList.remove('on');
    }
    if (p.t >= 0.75) W.pending = null;
  };
})(window.ZP);
