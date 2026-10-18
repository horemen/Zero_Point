// ИИ героини: из деревни идёт к воротам на луга, выбирает цель, бьёт её, ищет следующую.
// При смерти воскресает в деревне и снова отправляется на охоту.
(function (ZP) {
  const U = ZP.util;
  const H = (ZP.hero = {
    map: 'village', x: 480, y: 392, r: 13, face: 0, hp: 200, max: 200,
    dead: false, deathT: 0, state: 'go', swap: 0,
    weapon: 'sword', cd: 0.5, cdTotal: 1, anim: 0, animDur: 0, resolved: true, swingSign: 1, attackNo: 0, spin: false,
    bob: 0, moving: false, hurtFlash: 0,
    target: null, attacker: null, lastHurt: -99, lastAttack: -99,
    attacksLeft: 3, strafe: null, kite: 0, wander: null,
    forced: false, ignore: {}, avoidId: 0, avoidUntil: 0, kiteDir: null, kiteDirT: 0,
    stuck: 0, lastD: 1e9, goalX: 0, goalY: 0, unstick: 0, unstickDir: 1,
  });
  const AI = (ZP.heroAI = {});
  const B = () => ZP.mastery.BONUS[H.weapon];

  AI.init = () => {
    H.weapon = ZP.save.data.current;
    H.max = ZP.pstats().hp; H.hp = H.max;
    const sp = ZP.world.maps.village.respawn; H.x = sp.x; H.y = sp.y; H.map = 'village';
  };
  AI.speed = () => { const b = B(), shadow = H.weapon === 'dagger' && b.keys.has('shadowstep'); return ZP.HERO_SPEED * (1 + b.move) * (shadow ? 1.8 : 1); };
  AI.attacksPerPos = () => (ZP.WEAPONS[H.weapon].type === 'melee' ? U.irnd(3, 6) : U.irnd(2, 4)) + B().focus;

  AI.moveTo = (gx, gy, dt) => {
    const d = Math.hypot(gx - H.x, gy - H.y);
    if (d < 3) return true;
    if (Math.hypot(gx - H.goalX, gy - H.goalY) > 40) { H.goalX = gx; H.goalY = gy; H.lastD = 1e9; H.stuck = 0; }
    let [dx, dy] = ZP.world.steer(H, gx, gy, H.r);
    if (H.unstick > 0) { H.unstick -= dt; const a = Math.atan2(dy, dx) + H.unstickDir * Math.PI / 2; dx = Math.cos(a); dy = Math.sin(a); }
    const sp = AI.speed(), step = Math.min(d, sp * dt);
    H.x += dx * step; H.y += dy * step;
    ZP.world.collide(H, H.r);
    H.face = U.lerpAng(H.face, Math.atan2(dy, dx), dt * 12);
    H.bob += dt * 14 * (sp / ZP.HERO_SPEED); H.moving = true;
    if (H.weapon === 'dagger' && B().keys.has('shadowstep') && Math.random() < 0.5) ZP.fx.ghost(H.x, H.y);
    if (d < H.lastD - 0.4) { H.lastD = d; H.stuck = 0; }
    else if ((H.stuck += dt) > 0.9) { H.stuck = 0; H.lastD = 1e9; H.unstick = 0.6; H.unstickDir = Math.random() < 0.5 ? -1 : 1; }
    return false;
  };

  AI.update = (dt) => {
    H.moving = false; H.hurtFlash = Math.max(0, H.hurtFlash - dt);
    if (ZP.world.pending) return;
    // воскрешением управляет окно воскрешения (ui-death.js) — по кнопке или по таймеру
    if (H.dead) { H.deathT += dt; return; }
    H.cd -= dt;
    if (H.animDur) { H.anim += dt; if (!H.resolved && H.anim >= H.animDur * 0.55) AI.resolveAttack(); if (H.anim >= H.animDur) H.animDur = 0; }
    const now = ZP.time.clock;
    if (H.map === 'village') H.hp = Math.min(H.max, H.hp + H.max * 0.25 * dt);
    else if (now - H.lastHurt > 5 && now - H.lastAttack > 3) H.hp = Math.min(H.max, H.hp + H.max * 0.025 * dt);
    if (H.state === 'swap') { H.swap -= dt; if (H.swap <= 0) H.state = 'go'; return; }

    if (H.map === 'village') {
      const g = ZP.world.nearestGate(H);
      if (AI.moveTo(g.x, g.y, dt) || U.dist(H, g) < 24) ZP.world.travel(g);
      return;
    }
    AI.pickTarget();
    if (H.target) { H.wander = null; AI.engage(H.target, dt); return; }
    // никого рядом нет — бродит по лугам
    const map = ZP.world.cur;
    if (!H.wander || AI.moveTo(H.wander.x, H.wander.y, dt)) H.wander = { x: U.rnd(100, map.W - 100), y: U.rnd(100, map.H - 100) };
  };

  // цели, которые ИИ сейчас не выбирает сам: брошенная кнопкой «Сменить цель» и зверь, убивший героиню
  const now = () => ZP.time.clock;
  const skipAuto = (e) => e.dead || e.returning || (H.ignore[e.id] || 0) > now() || (e.id === H.avoidId && H.avoidUntil > now());

  AI.pickTarget = () => {
    let t = H.target;
    if (t && t.dead) { t = H.target = null; H.forced = false; }
    // цель, выбранная игроком, не меняется сама
    if (t && H.forced) return;
    // если кто-то бьёт героиню — сначала разобраться с ним
    const att = H.attacker;
    if (att && !att.dead && att.aggro && !skipAuto(att) && now() - H.lastHurt < 3 && t !== att) {
      if (!t || !t.aggro || U.dist(H, att) < U.dist(H, t) - 40) { AI.setTarget(att); return; }
    }
    if (t) return;
    const st = ZP.save.data.settings;
    let best = null, bs = 1e9;
    // «похожие по уровню»: только враги ±1 уровень от выбранного, ближайшие, точный уровень в приоритете
    if (st.similar) {
      for (const e of ZP.enemies.list) {
        if (skipAuto(e) || Math.abs(e.L - st.similarLevel) > 1) continue;
        const sc = U.dist(H, e) + Math.abs(e.L - st.similarLevel) * 150 - (e.aggro ? 300 : 0);
        if (sc < bs) { bs = sc; best = e; }
      }
      if (best) { AI.setTarget(best, false, `Похожая цель (ур. ${st.similarLevel})`); H.similarMiss = false; return; }
      if (!H.similarMiss) { H.similarMiss = true; ZP.ui.log(`Врагов ${st.similarLevel}±1 уровня рядом нет — героиня бьёт кого найдёт.`, 'miss'); }
    }
    for (const e of ZP.enemies.list) {
      if (skipAuto(e)) continue;
      const sc = U.dist(H, e) + (e.L - 1) * 220 - (e.aggro ? 400 : 0);
      if (sc < bs) { bs = sc; best = e; }
    }
    if (best) AI.setTarget(best);
  };
  AI.setTarget = (e, forced, why) => {
    H.target = e; H.forced = !!forced; H.attacksLeft = AI.attacksPerPos(); H.strafe = null; H.kite = 0; H.wander = null;
    ZP.ui.log(`${why || 'Новая цель'}: ${e.name}, ур. ${e.L}.`, forced ? 'sys' : 'miss');
    ZP.ui.dirty();
  };
  // игрок указал цель: тапом по врагу или из списка врагов
  AI.forceTarget = (e) => { if (!e || e.dead || H.dead) return; ZP.save.data.settings.similarLevel = e.L; AI.setTarget(e, true, 'Игрок выбрал цель'); };
  // кнопка «Сменить цель»: бросить текущую и идти к ближайшей другой
  AI.switchTarget = () => {
    if (H.dead) return;
    const cur = H.target;
    if (cur) H.ignore[cur.id] = now() + 20;
    let best = null, bd = 1e9;
    for (const e of ZP.enemies.list) {
      if (e.dead || e === cur || (e.id === H.avoidId && H.avoidUntil > now())) continue;
      const d = H.map === 'field' ? U.dist(H, e) : Math.hypot(e.x - ZP.world.maps.field.gates.north.x, e.y - ZP.world.maps.field.gates.north.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (best) { ZP.save.data.settings.similarLevel = best.L; AI.setTarget(best, true, 'Смена цели'); }
    else { H.target = null; H.forced = false; ZP.ui.log('Других врагов рядом нет.', 'miss'); }
  };

  // направление отступления: прочь от цели, а если там стена или край карты — в обход
  AI.retreatDir = (t, dt) => {
    H.kiteDirT = (H.kiteDirT || 0) - dt;
    if (H.kiteDirT > 0 && H.kiteDir != null) return H.kiteDir;
    const map = ZP.world.cur, base = Math.atan2(H.y - t.y, H.x - t.x);
    const inMap = (x, y) => x > 24 && y > 28 && x < map.W - 24 && y < map.H - 24;
    let best = null, bs = -1e9;
    for (const off of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2, 2.6, -2.6]) {
      const a = base + off;
      let ok = true;
      for (const step of [30, 60, 90]) { const x = H.x + Math.cos(a) * step, y = H.y + Math.sin(a) * step; if (!inMap(x, y) || !ZP.world.isFree(x, y, H.r + 4)) { ok = false; break; } }
      if (!ok) continue;
      const px = H.x + Math.cos(a) * 90, py = H.y + Math.sin(a) * 90;
      const sc = Math.hypot(px - t.x, py - t.y) - Math.abs(off) * 12;
      if (sc > bs) { bs = sc; best = a; }
    }
    H.kiteDir = best != null ? best : base + Math.PI / 2;
    H.kiteDirT = 0.35;
    return H.kiteDir;
  };

  AI.engage = (t, dt) => {
    const w = ZP.WEAPONS[H.weapon], d = U.dist(H, t), ang = Math.atan2(t.y - H.y, t.x - H.x);
    if (w.type === 'melee') {
      const reach = t.r + H.r + w.reach;
      if (H.strafe != null) {
        const gx = t.x + Math.cos(H.strafe) * reach * 0.8, gy = t.y + Math.sin(H.strafe) * reach * 0.8;
        if (AI.moveTo(gx, gy, dt) || Math.hypot(gx - H.x, gy - H.y) < 6) H.strafe = null;
        return;
      }
      if (d > reach) { if (!H.animDur) AI.moveTo(t.x, t.y, dt); return; }
    } else {
      const [r0, r1] = w.range;
      if (H.kite > 0) {
        H.kite -= dt;
        const a = AI.retreatDir(t, dt);
        AI.moveTo(H.x + Math.cos(a) * 60, H.y + Math.sin(a) * 60, dt);
        if (H.kite <= 0) H.kiteDir = null;
        return;
      }
      if (d > r1 || ZP.world.segBlocked(H, t, 6)) { if (!H.animDur) AI.moveTo(t.x, t.y, dt); return; }
      if (d < r0 * 0.5 && H.attacksLeft <= 0) { H.kite = 0.8; H.attacksLeft = AI.attacksPerPos(); return; }
    }
    H.face = U.lerpAng(H.face, ang, dt * 14);
    if (H.cd <= 0 && !H.animDur && Math.abs(U.angDiff(H.face, ang)) < 0.25) {
      if (H.attacksLeft <= 0) {
        H.attacksLeft = AI.attacksPerPos();
        if (w.type === 'melee') { H.strafe = ang + Math.PI + U.rnd(0.8, 1.6) * (Math.random() < 0.5 ? -1 : 1); return; }
      }
      AI.startAttack();
    }
  };

  AI.startAttack = () => {
    const k = H.weapon, w = ZP.WEAPONS[k], b = B();
    H.attackNo++;
    H.anim = 0; H.animDur = w.anim; H.resolved = false;
    H.spin = k === 'sword' && b.keys.has('whirl') && H.attackNo % 5 === 0;
    H.cd = ZP.mastery.cooldown(k) + w.anim; H.cdTotal = H.cd;
    H.swingSign *= -1;
    H.lastAttack = ZP.time.clock;
  };

  AI.resolveAttack = () => {
    H.resolved = true;
    const k = H.weapon, w = ZP.WEAPONS[k], b = B(), t = H.target;
    if (!t || t.dead) return;
    if (w.type === 'melee') {
      if (H.spin) {
        // вихрь: по всем рядом, всегда попадает
        for (const e of ZP.enemies.list) if (!e.dead && U.dist(H, e) < e.r + H.r + w.reach + 20) ZP.combat.apply(k, e, ZP.combat.roll(k, e, { auto: true, label: 'Вихрь!' }));
      } else {
        const res = ZP.combat.roll(k, t);
        ZP.combat.apply(k, t, res);
        if (res.type === 'hit' && Math.random() < b.dbl) setTimeoutGame(0.13, () => { if (H.weapon === k && H.target === t && !t.dead) ZP.combat.apply(k, t, ZP.combat.roll(k, t, { label: 'Двойной удар' })); });
      }
    } else {
      if (k === 'bow' && b.keys.has('volley') && H.attackNo % 4 === 0) { ZP.combat.shoot(k, t, -1); ZP.combat.shoot(k, t, 0); ZP.combat.shoot(k, t, 1); ZP.fx.float(H.x, H.y - ZP.HERO_FX, 'Залп!', ZP.fx.COL.accent); }
      else ZP.combat.shoot(k, t, 0);
      if (Math.random() < b.dbl) setTimeoutGame(0.16, () => { if (H.weapon === k && !t.dead) { ZP.combat.shoot(k, t, 0); ZP.fx.float(H.x, H.y - ZP.HERO_FX, k === 'bow' ? 'Вторая стрела' : 'Вторая сфера', ZP.fx.COL.fg); } });
    }
    H.attacksLeft--;
  };

  // таймеры в игровом времени (учитывают паузу и ускорение)
  const timers = [];
  function setTimeoutGame(t, fn) { timers.push({ t, fn }); }
  AI.updateTimers = (dt) => { for (let i = timers.length - 1; i >= 0; i--) { timers[i].t -= dt; if (timers[i].t <= 0) { const f = timers[i].fn; timers.splice(i, 1); f(); } } };
  AI.clearTimers = () => { timers.length = 0; };

  AI.die = (killer) => {
    if (H.dead) return;
    H.dead = true; H.deathT = 0; H.hp = 0; H.animDur = 0; H.target = null; H.attacker = null; H.forced = false;
    // после воскрешения не идти снова к тому, кто убил (5 минут или пока он жив)
    H.avoidId = killer.id; H.avoidUntil = ZP.time.clock + 300;
    if (ZP.uiDeath) ZP.uiDeath.killer = killer;
    AI.clearTimers();
    ZP.save.data.deaths++;
    ZP.ui.log(`${ZP.HERO_NAME} погибает. Её одолел враг: ${killer.name}, ур. ${killer.L}. Воскрешение в деревне…`, 'bad');
    ZP.enemies.calmAll();
    ZP.save.write();
  };
  AI.revive = () => {
    const sp = ZP.world.maps.village.respawn;
    H.map = 'village'; H.x = sp.x; H.y = sp.y; H.hp = H.max; H.dead = false; H.deathT = 0; H.face = Math.PI / 2;
    H.cd = 0.5; H.state = 'go';
    ZP.fx.ring(H.x, H.y);
    ZP.ui.log(`${ZP.HERO_NAME} воскресает у камня в деревне и снова идёт на охоту.`, 'sys');
    ZP.potions.autoBuy();
  };

  AI.selectWeapon = (k) => {
    if (k === H.weapon) return;
    H.weapon = k; ZP.save.data.current = k;
    H.state = H.dead ? H.state : 'swap'; H.swap = 0.6; H.animDur = 0; H.resolved = true; H.cd = 0.3; H.cdTotal = 0.3; H.attackNo = 0; H.strafe = null; H.kite = 0;
    H.attacksLeft = AI.attacksPerPos();
    ZP.combat.projectiles = ZP.combat.projectiles.filter((p) => p.k === k);
    AI.clearTimers();
    ZP.gear.refresh();
    if (!H.dead) ZP.fx.float(H.x, H.y - ZP.HERO_FX, 'Берёт ' + ZP.WEAPONS[k].acc4, ZP.fx.COL.fg);
    ZP.ui.log(`${ZP.HERO_NAME} меняет оружие: ${ZP.WEAPONS[k].acc4}.`, 'sys');
    ZP.save.write();
  };
})(window.ZP);
