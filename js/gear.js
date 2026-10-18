// Снаряжение героини: что надето, итоговые характеристики, надеть/снять/продать, выпадение с врагов и очередь показа.
// Лук и посох — двуручные (занимают обе руки). Меч и кинжал носятся только парой одного вида.
// Оружие в руках действует, только если совпадает с оружием, которое героиня держит сейчас (панель оружия).
(function (ZP) {
  const U = ZP.util;
  const D = () => ZP.save.data;
  const G = (ZP.gear = { BAG_MAX: 60, ver: 0 });

  // очередь выпавших предметов, ещё не показанных игроку (хранится в сохранении)
  G.queue = () => D().gearQueue;

  // надетый предмет в слоте (или null)
  G.at = (slot) => { const id = D().equip[slot]; return id ? ZP.gearDef(id) : null; };
  // действует ли надетый предмет сейчас
  G.works = (g) => !!g && (!g.weapon || g.weapon === ZP.hero.weapon);

  // прибавка от всего действующего снаряжения
  G.bonus = () => {
    const b = {};
    for (const s of ZP.EQUIP_SLOTS) { const g = G.at(s); if (!G.works(g)) continue; for (const k in g.stats) b[k] = (b[k] || 0) + g.stats[k]; }
    return b;
  };
  // итоговые характеристики героини: база + снаряжение
  ZP.pstats = () => {
    const p = Object.assign({}, ZP.PLAYER_BASE), b = G.bonus();
    for (const k in b) p[k] += b[k];
    return p;
  };

  // после смены снаряжения или оружия: обновить запас здоровья
  G.refresh = () => {
    const H = ZP.hero, max = ZP.pstats().hp;
    H.max = max;
    if (!H.dead) H.hp = Math.min(max, Math.max(1, H.hp));
    G.ver++;
    ZP.ui.dirty();
  };

  // в какой слот встанет предмет; hand — 'left' для одноручного оружия в левую руку
  G.slotFor = (g, hand) => (g.slot !== 'hand' ? g.slot : g.twoHand ? 'right' : hand === 'left' ? 'left' : 'right');
  // какие надетые предметы снимутся, если надеть g
  G.displaced = (g, hand) => {
    const e = D().equip, slot = G.slotFor(g, hand), out = [];
    if (e[slot]) out.push(e[slot]);
    // вторая рука: двуручное освобождает её; одноручное — только в паре с таким же оружием (меч + меч, кинжал + кинжал)
    if (slot === 'right' && e.left && (g.twoHand || ZP.gearDef(e.left).weapon !== g.weapon)) out.push(e.left);
    if (slot === 'left' && e.right) { const r = ZP.gearDef(e.right); if (r.twoHand || r.weapon !== g.weapon) out.push(e.right); }
    return out;
  };
  // разница характеристик: новый предмет против того, что снимется
  G.diff = (g, hand) => {
    const d = {};
    for (const k in g.stats) d[k] = (d[k] || 0) + g.stats[k];
    for (const id of G.displaced(g, hand)) { const o = ZP.gearDef(id); for (const k in o.stats) d[k] = (d[k] || 0) - o.stats[k]; }
    return d;
  };

  // надеть предмет (он уже убран из сумки/очереди); снятое кладётся в сумку
  G.equip = (id, hand) => {
    const g = ZP.gearDef(id); if (!g) return;
    const e = D().equip, slot = G.slotFor(g, hand), off = G.displaced(g, hand);
    for (const x of off) for (const s of ZP.EQUIP_SLOTS) if (e[s] === x) delete e[s];
    e[slot] = id;
    D().gear.push(...off);
    ZP.ui.log(`${ZP.HERO_NAME} надевает: ${g.name}.` + (off.length ? ` Снято в сумку: ${off.map((x) => ZP.gearDef(x).name).join(', ')}.` : ''), 'sys');
    // оружие в правой руке (или в левой при пустой правой) — героиня берёт его в руки
    if (g.weapon && (slot === 'right' || !e.right)) ZP.heroAI.selectWeapon(g.weapon);
    G.refresh(); ZP.save.write();
  };
  G.equipFromBag = (idx, hand) => {
    const bag = D().gear; if (!(idx >= 0 && idx < bag.length)) return;
    const id = bag.splice(idx, 1)[0];
    G.equip(id, hand);
  };
  G.unequip = (slot) => {
    const e = D().equip, id = e[slot]; if (!id) return;
    delete e[slot]; D().gear.push(id);
    ZP.ui.log(`${ZP.HERO_NAME} снимает: ${ZP.gearDef(id).name}.`, 'sys');
    G.refresh(); ZP.save.write();
  };

  G.sell = (id) => {
    const g = ZP.gearDef(id), d = D();
    d.coins += g.price; d.coinsEarned = (d.coinsEarned || 0) + g.price;
    ZP.ui.log(`Продано: ${g.name} за ${g.price} коин.`, 'gold');
    ZP.ui.dirty(); ZP.save.write();
  };
  G.sellFromBag = (idx) => { const bag = D().gear; if (idx >= 0 && idx < bag.length) G.sell(bag.splice(idx, 1)[0]); };
  G.sellAllBag = () => { const bag = D().gear; if (!bag.length) return; const sum = bag.reduce((a, id) => a + ZP.gearDef(id).price, 0), n = bag.length; const d = D(); d.coins += sum; d.coinsEarned = (d.coinsEarned || 0) + sum; bag.length = 0; ZP.ui.log(`Продано снаряжения: ${n} шт. за ${sum} коин.`, 'gold'); ZP.ui.dirty(); ZP.save.write(); };
  G.bagValue = () => D().gear.reduce((a, id) => a + ZP.gearDef(id).price, 0);

  // в сумку; если сумка полна — продаётся сразу
  G.toBag = (id) => {
    const bag = D().gear;
    if (bag.length >= G.BAG_MAX) { ZP.ui.log(`Сумка для снаряжения полна (${G.BAG_MAX}).`, 'sys'); G.sell(id); return false; }
    bag.push(id); ZP.ui.dirty(); ZP.save.write();
    return true;
  };

  // выпадение: шансы по качеству (5% / 1,5% / 0,6% / 0,2%), вид — любой, уровень предмета — около уровня врага
  G.roll = (L) => {
    const r = Math.random();
    let acc = 0, q = -1;
    for (let i = ZP.QUALITY.length - 1; i >= 0; i--) { acc += ZP.QUALITY[i].drop; if (r < acc) { q = i; break; } }
    if (q < 0) return null;
    const type = ZP.GEAR_TYPE_ORDER[(Math.random() * ZP.GEAR_TYPE_ORDER.length) | 0];
    const i = U.clamp(U.irnd(2 * L - 3, 2 * L), 0, 19);
    return `${type}.${q}.${i}`;
  };
  G.onKill = (e) => {
    const id = G.roll(e.L); if (!id) return;
    const g = ZP.gearDef(id), Q = ZP.QUALITY[g.q];
    ZP.fx.float(e.x, e.y - e.h - 44, g.name, Q.color, true);
    ZP.ui.log(`Выпало снаряжение: ${g.name} (${Q.name.toLowerCase()}).`, 'gold');
    G.queue().push(id);
    ZP.save.write();
  };

  // решение по первому предмету очереди
  G.resolve = (act, hand) => {
    const q = G.queue(); if (!q.length) return;
    const id = q.shift();
    if (act === 'equip') G.equip(id, hand);
    else if (act === 'sell') G.sell(id);
    else { if (G.toBag(id)) ZP.ui.log(`В сумку: ${ZP.gearDef(id).name}.`, 'sys'); }
    ZP.save.write();
  };

  G.init = () => { G.refresh(); };
})(window.ZP);
