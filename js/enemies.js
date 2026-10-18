// Враги на Звериных лугах: четыре типа по зонам, уровни 1–10, агро 100 px, погоня, атака, возврат домой.
(function (ZP) {
  const U = ZP.util;
  const E = (ZP.enemies = { list: [], queue: [] });
  let nextId = 1;

  E.spawnOne = () => {
    const map = ZP.world.maps.field, H = ZP.hero;
    for (let i = 0; i < 60; i++) {
      const x = U.rnd(60, map.W - 60), y = U.rnd(70, map.H - 60);
      if (Object.values(map.gates).some((g) => Math.hypot(x - g.x, y - g.y) < 260)) continue;
      if (H.map === 'field' && Math.hypot(x - H.x, y - H.y) < 380) continue;
      if (!map.obst.every((o) => Math.hypot(x - o.x, y - o.y) > o.r + 30)) continue;
      if (E.list.some((e) => !e.dead && Math.hypot(x - e.x, y - e.y) < 60)) continue;
      const base = ZP.world.baseLevel(map, x, y), cat = ZP.catForBase(base), cr = ZP.CATS[cat].lv;
      const L = U.clamp(Math.round(base + U.rnd(-0.8, 0.8)), cr[0], cr[1]), type = ZP.typeFor(cat, L), st = ZP.makeEnemyStats(type, L), sz = ZP.sprites.enemySize(type);
      const e = {
        id: nextId++, type, L, cat, name: ZP.ENEMY_TYPES[type].name, st, hp: st.hp,
        x, y, home: { x, y }, r: sz.r, h: sz.h, face: Math.random() < 0.5 ? -1 : 1,
        speed: ZP.ENEMY_TYPES[type].speed, fly: sz.fly, state: 'idle', t: U.rnd(0.5, 3), goal: null,
        aggro: false, hunt: false, returning: false, chaseT: 0, cd: U.rnd(0.3, 1), atkAnim: 0, hitFlash: 0, shake: 0,
        walk: 0, moving: false, dead: false, deadT: 0,
      };
      E.list.push(e);
      return e;
    }
    return null;
  };

  E.init = () => { E.list.length = 0; E.queue.length = 0; for (let i = 0; i < ZP.ENEMY_COUNT; i++) E.spawnOne(); };
  E.scheduleRespawn = () => E.queue.push(U.rnd(ZP.ENEMY_RESPAWN[0], ZP.ENEMY_RESPAWN[1]));
  E.calmAll = () => { for (const e of E.list) if (e.aggro) { e.aggro = false; e.hunt = false; e.returning = true; e.chaseT = 0; } };

  function moveTo(e, gx, gy, sp, dt) {
    const d = Math.hypot(gx - e.x, gy - e.y);
    if (d < 2) return true;
    const [dx, dy] = ZP.world.cur === ZP.world.maps.field ? ZP.world.steer(e, gx, gy, e.r) : [(gx - e.x) / d, (gy - e.y) / d];
    const step = Math.min(d, sp * dt);
    e.x += dx * step; e.y += dy * step;
    if (Math.abs(dx) > 0.15) e.face = dx > 0 ? 1 : -1;
    e.moving = true; e.walk += dt * sp * 0.12;
    return false;
  }

  E.update = (dt) => {
    const H = ZP.hero, map = ZP.world.maps.field, inField = ZP.world.cur === map;
    // очередь появления новых зверей
    for (let i = E.queue.length - 1; i >= 0; i--) { E.queue[i] -= dt; if (E.queue[i] <= 0) { if (E.spawnOne()) E.queue.splice(i, 1); else E.queue[i] = 2; } }
    const heroHere = H.map === 'field' && !H.dead && !ZP.world.pending;
    for (let i = E.list.length - 1; i >= 0; i--) {
      const e = E.list[i];
      e.hitFlash = Math.max(0, e.hitFlash - dt); e.shake = Math.max(0, e.shake - dt); e.atkAnim = Math.max(0, e.atkAnim - dt);
      if (e.dead) { e.deadT += dt; if (e.deadT > 2) E.list.splice(i, 1); continue; }
      e.moving = false; e.cd -= dt;
      const dh = heroHere ? Math.hypot(e.x - H.x, e.y - H.y) : 1e9;
      // агро: героиня ближе 100 px — враг замечает её и держит 2 с после ухода из радиуса;
      // после удара героини враг преследует её без ограничений — пока она не погибнет или не уйдёт с локации
      if (!e.returning && dh < ZP.AGGRO + H.r) { e.aggro = true; e.chaseT = Math.max(e.chaseT, 2); }
      e.chaseT -= dt;
      if (e.aggro && (!heroHere || (!e.hunt && (e.chaseT <= 0 || Math.hypot(e.x - e.home.x, e.y - e.home.y) > ZP.CHASE_DIST)))) { e.aggro = false; e.hunt = false; e.returning = true; e.chaseT = 0; }
      const sp = e.speed;
      if (e.returning) {
        e.hp = Math.min(e.st.hp, e.hp + e.st.hp * 0.5 * dt);
        if (moveTo(e, e.home.x, e.home.y, sp * 1.1, dt)) { e.returning = false; e.hp = e.st.hp; e.state = 'idle'; e.t = U.rnd(1, 3); }
      } else if (e.aggro) {
        const reach = e.r + H.r + 6;
        if (dh > reach) moveTo(e, H.x, H.y, sp, dt);
        else {
          e.face = H.x > e.x ? 1 : -1;
          if (e.cd <= 0) { e.cd = 1.8 / (1 + e.st.agi * 0.01); ZP.combat.enemyAttack(e); }
        }
      } else {
        e.t -= dt;
        if (e.state === 'idle' && e.t <= 0) {
          for (let k = 0; k < 6; k++) {
            const a = U.rnd(0, Math.PI * 2), d = U.rnd(30, 120), gx = e.home.x + Math.cos(a) * d, gy = e.home.y + Math.sin(a) * d;
            if (gx > 40 && gy > 50 && gx < map.W - 40 && gy < map.H - 40) { e.goal = { x: gx, y: gy }; e.state = 'walk'; break; }
          }
          e.t = U.rnd(2, 4);
        } else if (e.state === 'walk') {
          if (moveTo(e, e.goal.x, e.goal.y, sp * 0.35, dt) || e.t <= 0) { e.state = 'idle'; e.t = U.rnd(1.5, 4); }
        }
      }
      // столкновения с препятствиями (только когда луга на экране — иначе дешёвая проверка границ)
      if (inField) {
        for (const o of map.obst) {
          const vx = e.x - o.x, vy = e.y - o.y, lim = o.r + e.r;
          if (Math.abs(vx) > lim || Math.abs(vy) > lim) continue;
          const od = Math.hypot(vx, vy); if (od < lim && od > 0.01) { e.x = o.x + (vx / od) * lim; e.y = o.y + (vy / od) * lim; }
        }
      }
      e.x = U.clamp(e.x, 20, map.W - 20); e.y = U.clamp(e.y, 30, map.H - 20);
    }
    // звери не налезают друг на друга
    const L = E.list;
    for (let a = 0; a < L.length; a++) {
      const p = L[a]; if (p.dead) continue;
      for (let b = a + 1; b < L.length; b++) {
        const q = L[b]; if (q.dead) continue;
        const dx = q.x - p.x, dy = q.y - p.y, lim = p.r + q.r;
        if (Math.abs(dx) > lim || Math.abs(dy) > lim) continue;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d < lim) { const push = (lim - d) / 2, nx = dx / d, ny = dy / d; p.x -= nx * push; p.y -= ny * push; q.x += nx * push; q.y += ny * push; }
      }
    }
  };
})(window.ZP);
