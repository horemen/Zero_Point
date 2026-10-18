// Владение оружием: проценты, очки навыков, бонусы паутины.
(function (ZP) {
  const U = ZP.util;
  const M = (ZP.mastery = { BONUS: {} });
  const sk = (k) => ZP.save.data.skills[k];

  M.earned = (k) => Math.floor(sk(k).m / ZP.STEP);
  M.freePts = (k) => M.earned(k) - sk(k).learned.length;
  M.totalFree = () => ZP.ORDER.reduce((a, k) => a + M.freePts(k), 0);

  M.computeBonus = (k) => {
    const b = { acc: 0, spd: 0, dbl: 0, move: 0, focus: 0, keys: new Set() };
    for (const id of sk(k).learned) {
      const n = ZP.SKILL_NODES[k][id];
      if (n.key) b.keys.add(n.key); else b[n.stat] += n.val;
    }
    M.BONUS[k] = b;
  };
  M.computeAll = () => ZP.ORDER.forEach(M.computeBonus);

  // точность от владения: 0% → 10%, 100% → 100%; бонусы навыков сверху
  M.masteryAcc = (k) => Math.min(1, ZP.START_ACC + 0.9 * (sk(k).m / ZP.MAX));
  M.baseAcc = (k) => Math.min(1, M.masteryAcc(k) + M.BONUS[k].acc);

  // перезарядка между атаками (без анимации замаха)
  M.cooldown = (k) => {
    const w = ZP.WEAPONS[k], b = M.BONUS[k];
    let cd = w.cd / (1 + 0.4 * (sk(k).m / ZP.MAX)) / (1 + b.spd) / ZP.stats.attackSpeedMul(ZP.pstats());
    if (k === 'staff' && b.keys.has('arcane')) cd *= 0.8;
    return cd;
  };
  M.attacksPerSec = (k) => 1 / (M.cooldown(k) + ZP.WEAPONS[k].anim);

  // начислить владение (в сотых долях процента)
  M.gain = (k, units) => {
    const s = sk(k);
    if (s.m >= ZP.MAX) return 0;
    const before = M.earned(k);
    const add = Math.min(units, ZP.MAX - s.m);
    s.m += add;
    if (M.earned(k) > before) {
      const H = ZP.hero;
      ZP.fx.ring(H.x, H.y);
      ZP.fx.float(H.x, H.y - ZP.HERO_FX, 'Новое очко навыка!', ZP.fx.COL.accent, true);
      ZP.ui.log(`${ZP.WEAPONS[k].name}: владение ${U.pctTxt(s.m)}. Получено очко навыка, свободно: ${M.freePts(k)}.`, 'gold');
      ZP.ui.skillsChanged();
    }
    if (s.m >= ZP.MAX) ZP.ui.log(`${ZP.WEAPONS[k].name}: владение 100%. Полное мастерство.`, 'gold');
    return add;
  };

  M.isLearned = (k, id) => sk(k).learned.includes(id);
  M.adjacent = (k, n) => {
    if (n.r === 1) return true;
    const L = (id) => M.isLearned(k, id);
    return L(n.s + '-' + (n.r - 1)) || L(((n.s + 1) % 6) + '-' + n.r) || L(((n.s + 5) % 6) + '-' + n.r);
  };
  M.nodeState = (k, n) => {
    if (M.isLearned(k, n.id)) return 'learned';
    if (M.adjacent(k, n)) return M.freePts(k) > 0 ? 'avail' : 'reach';
    return 'locked';
  };
  M.effectText = (k, n) => (n.key ? ZP.SKILL_KEYS[n.key] : ZP.SKILL_STAT[n.stat].txt(n.val, k));
  M.learn = (k, id) => {
    const n = ZP.SKILL_NODES[k][id];
    if (M.nodeState(k, n) !== 'avail') return false;
    sk(k).learned.push(id);
    M.computeBonus(k);
    ZP.ui.log(`${ZP.WEAPONS[k].name}: изучен навык «${n.name}».`, 'gold');
    ZP.save.write();
    return true;
  };
  // список бонусов оружия текстом (для окна персонажа)
  M.bonusList = (k) => {
    const b = M.BONUS[k], out = [];
    for (const st of ['acc', 'spd', 'dbl', 'move', 'focus']) if (b[st] > 0) out.push({ label: st === 'dbl' ? 'Шанс ' + ZP.dblWord(k) : ZP.SKILL_STAT[st].label, value: ZP.SKILL_STAT[st].fmt(b[st]) });
    for (const key of b.keys) { const n = Object.values(ZP.SKILL_NODES[k]).find((z) => z.key === key); out.push({ label: n.name, value: 'ключевой', key: true, desc: ZP.SKILL_KEYS[key] }); }
    return out;
  };
})(window.ZP);
