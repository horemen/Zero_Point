// Бой: броски попадания и уворота, урон с учётом защиты, снаряды, убийства и рост владения.
(function (ZP) {
  const U = ZP.util;
  const C = (ZP.combat = { projectiles: [] });
  const COL = () => ZP.fx.COL;

  // шанс попасть по цели (до уворота цели)
  C.hitChance = (k, d) => {
    const w = ZP.WEAPONS[k], b = ZP.mastery.BONUS[k];
    let a = ZP.mastery.baseAcc(k);
    if (w.type !== 'melee' && !b.keys.has('eagle')) a *= 1 - Math.max(0, (d - w.range[0]) / (w.range[1] - w.range[0])) * 0.15;
    return U.clamp(a, 0.02, 1);
  };

  // бросок атаки героини: промах / уворот / попадание с уроном
  C.roll = (k, t, opt = {}) => {
    const H = ZP.hero, b = ZP.mastery.BONUS[k];
    ZP.save.data.skills[k].shots++;
    const dmg = () => ZP.stats.rollDamage(ZP.stats.playerRaw(k), t.st);
    if (opt.auto) return { type: 'hit', dmg: dmg(), label: opt.label };
    let hit = Math.random() < C.hitChance(k, U.dist(H, t)), label = opt.label || null;
    if (!hit && ZP.WEAPONS[k].type === 'melee' && b.keys.has('riposte') && Math.random() < 0.25) { hit = true; label = 'Ответный удар'; }
    if (!hit && k === 'staff' && b.keys.has('homing') && Math.random() < 0.3) { hit = true; label = 'Самонаведение'; }
    if (!hit) return { type: 'miss' };
    if (Math.random() < ZP.stats.dodgeChance(t.st)) return { type: 'dodge' };
    return { type: 'hit', dmg: dmg(), label };
  };

  // применить результат к зверю
  C.apply = (k, t, res) => {
    if (!t || t.dead) return;
    const H = ZP.hero;
    t.aggro = true; t.hunt = true; t.returning = false;
    const top = t.y - t.h - 8;
    if (res.type === 'miss') { ZP.fx.float(t.x, top, 'Промах', COL().miss); return; }
    if (res.type === 'dodge') { ZP.fx.float(t.x, top, 'Уворот', COL().muted); return; }
    t.hp -= res.dmg; t.hitFlash = 0.15; t.shake = 0.25;
    ZP.fx.burst(t.x, t.y - t.h * 0.5, 8, k === 'staff' ? ['#9fc2ff', '#d6e4ff', '#f0b94e'] : ['#e8d4a8', '#c43a2a', '#efd9a3'], 120);
    ZP.fx.float(t.x + U.rnd(-8, 8), top, (res.label ? res.label + ' ' : '') + '−' + res.dmg, res.label ? COL().accent : COL().dmg, !!res.label);
    // каждое попадание: +0,01% владения
    ZP.save.data.skills[k].hits++;
    ZP.mastery.gain(k, 1);
    if (k === 'dagger' && ZP.mastery.BONUS.dagger.keys.has('flurry') && Math.random() < 0.35 && H.weapon === 'dagger') H.cd = Math.min(H.cd, 0.05);
    if (t.hp <= 0) C.kill(t, k);
    ZP.ui.dirty();
  };

  // убийство: +0,01% × уровень зверя к владению текущим оружием
  C.kill = (e, k) => {
    e.dead = true; e.deadT = 0; e.hp = 0; e.aggro = false;
    const s = ZP.save.data;
    s.kills++; s.killsByType[e.type] = (s.killsByType[e.type] || 0) + 1; s.bestLevel = Math.max(s.bestLevel, e.L);
    const got = ZP.mastery.gain(k, e.L);
    ZP.fx.float(e.x, e.y - e.h - 28, got ? '+' + U.pctTxt(got) + ' владения' : 'Повержен', COL().xp, true);
    ZP.ui.log(`${ZP.HERO_NAME} побеждает: ${e.name}, ур. ${e.L}.` + (got ? ` ${ZP.WEAPONS[k].name}: +${U.pctTxt(got)} за победу.` : ''), 'gold');
    ZP.inventory.onKill(e);
    ZP.gear.onKill(e);
    const H = ZP.hero;
    if (H.target === e) H.target = null;
    if (H.attacker === e) H.attacker = null;
    ZP.enemies.scheduleRespawn();
    ZP.save.write();
  };

  // атака зверя по героине
  C.enemyAttack = (e) => {
    const H = ZP.hero;
    if (H.dead || H.map !== 'field') return;
    e.atkAnim = 0.3;
    const head = H.y - ZP.HERO_FX + 12;
    const ps = ZP.pstats();
    if (Math.random() > ZP.stats.enemyHitChance) { ZP.fx.float(H.x + U.rnd(-6, 6), head, 'Мимо', COL().muted); return; }
    if (Math.random() < ZP.stats.dodgeChance(ps)) { ZP.fx.float(H.x + U.rnd(-6, 6), head, 'Уворот', COL().name); return; }
    const dmg = ZP.stats.rollDamage(ZP.stats.enemyRaw(e.st), ps);
    H.hp -= dmg; H.lastHurt = ZP.time.clock; H.attacker = e; H.hurtFlash = 0.2;
    ZP.fx.float(H.x + U.rnd(-8, 8), head, '−' + dmg, COL().hurt, true);
    ZP.fx.burst(H.x, H.y - 40, 5, ['#ff7a6a', '#c8392b', '#ffd0c8'], 90);
    if (H.hp <= 0) ZP.heroAI.die(e);
    ZP.ui.dirty();
  };

  // выпустить снаряд: исход уже решён броском, снаряд только долетает
  C.shoot = (k, t, offset) => {
    const H = ZP.hero, w = ZP.WEAPONS[k], hp = ZP.sprites.handPos(H);
    const res = C.roll(k, t);
    const base = Math.atan2(t.y - t.h * 0.5 - hp.y, t.x - hp.x);
    const miss = res.type === 'miss';
    const ang = miss ? base + (Math.random() < 0.5 ? -1 : 1) * U.rnd(0.18, 0.35) : base + (offset || 0) * 0.12;
    const sp = w.speed * (k === 'staff' && ZP.mastery.BONUS.staff.keys.has('arcane') ? 1.4 : 1);
    C.projectiles.push({ k, kind: w.type, t, res, x: hp.x + Math.cos(ang) * 6, y: hp.y + Math.sin(ang) * 6, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, sp, life: miss ? Math.min(1.2, U.dist(hp, t) / sp + 0.25) : 2.5, trail: [], bend: offset || 0 });
    if (w.type === 'orb') ZP.fx.burst(hp.x, hp.y, 6, ['#9fc2ff', '#d6e4ff'], 60);
  };

  C.update = (dt) => {
    C.projectiles = C.projectiles.filter((p) => {
      p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > (p.kind === 'orb' ? 10 : 5)) p.trail.shift();
      p.life -= dt;
      if (p.res.type !== 'miss') {
        if (p.t.dead) return false;
        // летит прямо в цель, даже если она бежит
        const tx = p.t.x, ty = p.t.y - p.t.h * 0.5, d = Math.hypot(tx - p.x, ty - p.y);
        if (d < Math.max(8, p.sp * dt)) { C.apply(p.k, p.t, p.res); return false; }
        const cur = Math.atan2(p.vy, p.vx), want = Math.atan2(ty - p.y, tx - p.x), na = cur + U.clamp(U.angDiff(cur, want), -8 * dt, 8 * dt);
        p.vx = Math.cos(na) * p.sp; p.vy = Math.sin(na) * p.sp;
        if (p.life <= 0) { C.apply(p.k, p.t, p.res); return false; }
      } else if (p.life <= 0) { C.apply(p.k, p.t, p.res); return false; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      return true;
    });
  };
})(window.ZP);
