// Спрайты врагов в чиби-пиксель-арте: звери, птицы, гуманоиды, элементали.
// Рисуются «пикселями спрайта» (S.begin), смотрят вправо; face = −1 отражает.
(function (ZP) {
  const S = (ZP.sprites = ZP.sprites || {});
  const W = '#ffffff', K = '#120a04';

  // r — радиус тела, h — высота, fly — высота полёта (всё в пикселях спрайта)
  const SIZE = {
    rabbit: { r: 4, h: 11 }, fox: { r: 5, h: 10 }, boar: { r: 6, h: 10 }, wolf: { r: 5, h: 11 },
    crow: { r: 4, h: 11, fly: 9 }, owl: { r: 4, h: 13, fly: 8 }, hawk: { r: 5, h: 12, fly: 10 },
    goblin: { r: 4, h: 18 }, bandit: { r: 4, h: 19 }, orc: { r: 5, h: 19 },
    fire: { r: 4, h: 13, fly: 4 }, water: { r: 4, h: 13, fly: 4 }, golem: { r: 6, h: 16 },
  };
  S.enemySize = (type) => { const s = SIZE[type], p = ZP.SPRITE_PX; return { r: s.r * p, h: (s.h + (s.fly || 0)) * p, fly: (s.fly || 0) * p }; };

  // ---------- звери ----------
  const Q = {
    rabbit: { body: '#a89880', shade: '#7a6c5a', light: '#d2c4ae', belly: '#efe6d8', bw: 6, bh: 4, hw: 6, hh: 5, leg: 2, legH: 2, ears: 'long', tail: 'puff', tailC: '#f6f0e6', legC: '#8a7c68' },
    fox: { body: '#e07a2e', shade: '#a04e18', light: '#f6a050', belly: '#f8ecd8', bw: 8, bh: 4, hw: 6, hh: 5, leg: 2, legH: 3, ears: 'point', tail: 'bushy', tailC: '#e07a2e', tailTip: '#f8f2e8', legC: '#3a2414', snout: 'long', nose: K },
    boar: { body: '#6a4a36', shade: '#463020', light: '#8a6a50', belly: '#5a3e2c', bw: 10, bh: 5, hw: 7, hh: 6, leg: 2, legH: 2, ears: 'small', tail: 'thin', tailC: '#463020', tusks: true, mane: '#3a281a', snout: 'pig', nose: '#c08a7a', legC: '#3a281a' },
    wolf: { body: '#8a9098', shade: '#5e646c', light: '#b8bec4', belly: '#d8dcdf', bw: 9, bh: 4, hw: 6, hh: 5, leg: 2, legH: 3, ears: 'point', tail: 'bushy', tailC: '#7a8088', tailTip: '#4a4e54', legC: '#555a60', snout: 'long', nose: K },
  };
  function beast(t, frame) {
    const P = [], { bw, bh, hw, hh, leg, legH } = t, top = -legH - bh, half = Math.floor(bw / 2);
    const a = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    P.push([-half + 1 - a, -legH, leg, legH, t.shade], [half - leg + a, -legH, leg, legH, t.shade]);
    if (t.tail === 'puff') P.push([-half - 2, top, 3, 3, t.tailC]);
    if (t.tail === 'bushy') P.push([-half - 5, top, 6, 2, t.tailC], [-half - 6, top + 1, 2, 2, t.tailTip]);
    if (t.tail === 'thin') P.push([-half - 2, top + 1, 2, 1, t.tailC]);
    P.push([-half, top, bw, bh, t.body], [-half + 1, top, bw - 3, 1, t.light, true], [-half + 1, top + bh - 1, bw - 3, 1, t.belly, true]);
    if (t.mane) P.push([-half + 2, top - 1, bw - 4, 1, t.mane]);
    P.push([-half + a, -legH, leg, legH, t.legC], [half - leg - 1 - a, -legH, leg, legH, t.legC]);
    const hx = half - 3, hy = top - hh + 2;
    if (t.ears === 'long') P.push([hx + 1, hy - 5, 1, 5, t.body], [hx + 3, hy - 4, 1, 4, t.shade], [hx + 1, hy - 4, 1, 3, '#f0b0a8', true]);
    if (t.ears === 'point') P.push([hx + 1, hy - 2, 2, 2, t.shade], [hx + hw - 3, hy - 2, 2, 2, t.body]);
    if (t.ears === 'small') P.push([hx + 1, hy - 1, 2, 1, t.shade]);
    P.push([hx, hy, hw, hh, t.body], [hx + 1, hy, hw - 2, 1, t.light, true]);
    if (t.snout === 'long') P.push([hx + hw, hy + hh - 3, 2, 2, t.body], [hx + hw + 1, hy + hh - 3, 1, 1, t.nose, true]);
    if (t.snout === 'pig') P.push([hx + hw, hy + hh - 3, 2, 2, t.nose]);
    if (t.tusks) P.push([hx + hw, hy + hh - 1, 1, 1, '#f6efe0', true]);
    P.push([hx + hw - 2, hy + 1, 1, 2, K, true]);
    if (t.ears === 'long') P.push([hx + hw, hy + hh - 2, 1, 1, '#e88a8a', true]);
    return P;
  }

  // ---------- птицы ----------
  const BIRD = {
    crow: { body: '#33334a', shade: '#1e1e2e', belly: '#50506a', beak: '#e8a33a', eye: '#ffd84a' },
    owl: { body: '#9a6a3a', shade: '#6a4626', belly: '#ecd8ac', beak: '#e8a33a', eye: W },
    hawk: { body: '#8a5a2e', shade: '#5a3a1e', belly: '#f4e6cc', beak: '#f0c84a', eye: K },
  };
  function bird(type, flap) {
    const t = BIRD[type], up = flap > 0, P = [];
    if (type === 'owl') {
      P.push([-4, -7, 7, 6, t.body], [-2, -4, 3, 3, t.belly, true]);
      P.push(up ? [-6, -9, 3, 3, t.shade] : [-6, -4, 3, 3, t.shade]);
      P.push([-3, -13, 7, 6, t.body], [-3, -14, 1, 1, t.body], [3, -14, 1, 1, t.body]);
      P.push([-2, -11, 2, 2, W, true], [1, -11, 2, 2, W, true], [-1, -10, 1, 1, K, true], [2, -10, 1, 1, K, true], [0, -9, 1, 1, t.beak, true]);
      return P;
    }
    const big = type === 'hawk' ? 1 : 0;
    P.push([-6 - big, -6, 2, 2, t.shade]);
    P.push([-4 - big, -7, 7 + big * 2, 5, t.body], [-2, -4, 4 + big, 2, t.belly, true]);
    P.push([2 + big, -11, 5, 5, t.body], [7 + big, -9, 2, 1, t.beak], [5 + big, -10, 1, 1, t.eye, true]);
    if (type === 'hawk') P.push([2 + big, -8, 5, 1, t.belly, true]);
    P.push(up ? [-3 - big, -11 - big, 5 + big, 3, t.shade] : [-3 - big, -4, 5 + big, 3, t.shade]);
    return P;
  }

  // ---------- гуманоиды ----------
  const HUM = {
    goblin: { skin: '#7ac84a', skinD: '#4f9a35', tunic: '#9a6234', tunicD: '#6a4220', eye: '#ffd84a', leg: '#5a3a1e' },
    bandit: { skin: '#e8b48a', skinD: '#c08a62', tunic: '#4a3a5a', tunicD: '#2e2438', eye: K, leg: '#2e2438', hood: '#a83a3a', mask: '#3a2a2a' },
    orc: { skin: '#7aa05a', skinD: '#55783e', tunic: '#8a929a', tunicD: '#5e666e', eye: '#ff6a3a', leg: '#4a3a2a' },
  };
  function humanoid(type, frame, swing) {
    const t = HUM[type], P = [], big = type === 'orc' ? 1 : 0;
    const l1 = frame === 1 ? -1 : 0, l2 = frame === 2 ? -1 : 0;
    P.push([-2 - big, -3 + l1, 2, 3, t.leg], [1, -3 + l2, 2, 3, t.leg]);
    P.push([-4 - big, -7, 1, 3, t.skinD]);
    P.push([-3 - big, -7, 6 + big * 2, 4, t.tunic], [-3 - big, -5, 6 + big * 2, 1, t.tunicD, true]);
    if (type === 'goblin') P.push([-5, -13, 1, 2, t.skinD], [5, -13, 2, 1, t.skin]);
    P.push([-4 - big, -15, 9 + big, 8, t.skin], [-4 - big, -15, 2, 8, t.skinD, true]);
    if (type === 'bandit') P.push([-5, -16, 10, 3, t.hood], [-5, -13, 2, 5, t.hood], [0, -10, 5, 2, t.mask, true]);
    if (type === 'orc') P.push([-5, -16, 10, 1, '#3a2a1a'], [3, -9, 1, 1, W, true], [1, -9, 1, 1, W, true]);
    P.push([1, -12, 1, 2, t.eye, true], [3, -12, 1, 2, t.eye, true]);
    // рука и оружие
    const sw = swing ? -2 : 0;
    P.push([2, -7, 2, 2, t.skin]);
    if (type === 'goblin') P.push([4 + sw * -1, -12 + (swing ? 2 : 0), 2, 6, '#9a6234'], [3 + sw * -1, -13 + (swing ? 2 : 0), 4, 3, '#6a4220']);
    if (type === 'bandit') P.push([4, -7, 1, 1, '#7a4a24'], [5 - sw, -7, 3, 1, '#e6ecf1']);
    if (type === 'orc') P.push([4, -13 + (swing ? 3 : 0), 1, 8, '#6a4220'], [5, -13 + (swing ? 3 : 0), 3, 3, '#c3ccd6']);
    return P;
  }

  // ---------- элементали ----------
  function fire(clock, seed) {
    const P = [], rows = [[7, -2], [7, -4], [6, -6], [5, -8], [3, -10], [1, -12]];
    rows.forEach(([w, y], i) => { const dx = Math.round(Math.sin(clock * 10 + seed + i) * (i > 2 ? 1 : 0)); P.push([-Math.floor(w / 2) + dx, y, w, 2, i < 2 ? '#e8462a' : '#ff7a2a']); });
    P.push([-2, -6, 4, 4, '#ffd84a', true], [-1, -8, 2, 2, '#fff2a0', true]);
    P.push([-2, -7, 1, 1, K, true], [1, -7, 1, 1, K, true]);
    return P;
  }
  function water() {
    const P = [], rows = [[1, -13], [3, -12], [5, -10], [7, -8], [7, -6], [7, -4], [5, -2]];
    rows.forEach(([w, y]) => P.push([-Math.floor(w / 2), y, w, 2, '#4aa8f0']));
    P.push([-3, -6, 2, 4, '#2a78c8', true], [-1, -10, 1, 2, '#eafaff', true]);
    P.push([0, -6, 1, 1, K, true], [2, -6, 1, 1, K, true]);
    return P;
  }
  function golem(frame) {
    const l1 = frame === 1 ? -1 : 0, l2 = frame === 2 ? -1 : 0;
    return [
      [-4, -2 + l1, 3, 2, '#6a707a'], [1, -2 + l2, 3, 2, '#6a707a'],
      [-7, -10, 2, 6, '#7a828a'],
      [-5, -11, 10, 9, '#9aa2aa'], [-5, -11, 10, 1, '#5cbf45', true], [-5, -5, 10, 1, '#7a828a', true],
      [-3, -15, 6, 4, '#a8b0b8'], [-3, -15, 6, 1, '#5cbf45', true],
      [-1, -13, 1, 1, '#ff9a3a', true], [1, -13, 1, 1, '#ff9a3a', true],
      [5, -10, 2, 6, '#8a929a'],
    ];
  }

  S.drawEnemy = (c, e, clock) => {
    const p = ZP.SPRITE_PX, info = ZP.ENEMY_TYPES[e.type], sz = SIZE[e.type];
    const fly = sz.fly ? sz.fly + Math.round(Math.sin(clock * 4 + e.id) * 1) : 0;
    S.shadow(c, e.x, e.y + 1, sz.r * p * 1.2, sz.r * p * 0.4);
    const shake = e.shake > 0 ? Math.round(Math.sin(clock * 80) * 1) : 0;
    const lunge = e.atkAnim > 0 ? Math.round(Math.sin((1 - e.atkAnim / 0.3) * Math.PI) * 2) : 0;
    const frame = e.moving && !e.dead ? (Math.floor(e.walk) % 2) + 1 : 0;
    c.save();
    if (e.dead) c.globalAlpha = Math.max(0, 1 - e.deadT / 1.8);
    S.begin(c, e.x, e.y, e.face);
    if (e.dead) c.rotate(-Math.min(1, e.deadT * 4) * Math.PI / 2);
    c.translate(lunge + shake, -fly);
    let P;
    if (info.cat === 'beast') P = beast(Q[e.type], frame);
    else if (info.cat === 'bird') P = bird(e.type, e.dead ? 0 : Math.sin(clock * 14 + e.id));
    else if (info.cat === 'humanoid') P = humanoid(e.type, frame, e.atkAnim > 0.12);
    else P = e.type === 'fire' ? fire(clock, e.id) : e.type === 'water' ? water() : golem(frame);
    S.parts(c, P, e.hitFlash > 0);
    c.restore(); c.restore();
    if (e.type === 'fire' && !e.dead) {
      const g = c.createRadialGradient(e.x, e.y - 8 * p, 1, e.x, e.y - 8 * p, 26);
      g.addColorStop(0, 'rgba(255,140,60,.35)'); g.addColorStop(1, 'rgba(255,120,40,0)');
      c.fillStyle = g; c.beginPath(); c.arc(e.x, e.y - 8 * p, 26, 0, 7); c.fill();
    }
  };
})(window.ZP);
