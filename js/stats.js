// Характеристики героини и зверей, формулы боя.
(function (ZP) {
  const U = ZP.util;

  ZP.STAT_ORDER = ['hp', 'atk', 'dodge', 'def', 'agi', 'int', 'str'];
  ZP.STAT_NAMES = { hp: 'Здоровье', atk: 'Атака', dodge: 'Уворот', def: 'Защита', agi: 'Ловкость', int: 'Интеллект', str: 'Сила' };
  ZP.STAT_DESC = {
    hp: 'Сколько урона можно выдержать. На нуле героиня погибает и воскресает в деревне.',
    atk: 'Базовый урон каждого удара любым оружием.',
    dodge: 'Повышает шанс полностью избежать удара.',
    def: 'Снижает весь получаемый урон.',
    agi: 'Ускоряет атаки, немного повышает уворот, усиливает кинжал и лук.',
    int: 'Усиливает удары посохом.',
    str: 'Усиливает удары мечом.',
  };

  ZP.PLAYER_BASE = { hp: 200, atk: 12, dodge: 6, def: 6, agi: 10, int: 10, str: 10 };

  ZP.stats = {
    // шанс увернуться: уворот + треть ловкости, с потолком 50%
    dodgeChance(s) { const v = s.dodge + s.agi * 0.3; return Math.min(0.5, v / (v + 60)); },
    // множитель входящего урона от защиты
    reduction(s) { return 50 / (50 + s.def); },
    attackSpeedMul(s) { return 1 + s.agi * 0.01; },
    playerRaw(k) { const w = ZP.WEAPONS[k], p = ZP.pstats(); return p.atk + w.base + p[w.attr] * w.attrK; },
    enemyRaw(s) { return s.atk + s.str * 0.5; },
    rollDamage(raw, target) { return Math.max(1, Math.round(raw * U.rnd(0.85, 1.15) * this.reduction(target))); },
    enemyHitChance: 0.85,
  };

  // Типы врагов и их зоны на лугах: у входа звери, дальше птицы и гуманоиды, в глубине элементали.
  ZP.CATS = {
    beast:     { name: 'Звери',      one: 'зверь',     lv: [1, 4] },
    bird:      { name: 'Птицы',      one: 'птица',     lv: [3, 6] },
    humanoid:  { name: 'Гуманоиды',  one: 'гуманоид',  lv: [5, 8] },
    elemental: { name: 'Элементали', one: 'элементаль', lv: [8, 10] },
  };
  ZP.CAT_ORDER = ['beast', 'bird', 'humanoid', 'elemental'];
  // зона по «базовому уровню» места (растёт с удалением от ворот)
  ZP.catForBase = (b) => (b < 3.5 ? 'beast' : b < 5.5 ? 'bird' : b < 7.6 ? 'humanoid' : 'elemental');

  // Виды врагов. lv — уровни вида; остальные числа — множители к базовым характеристикам.
  ZP.ENEMY_TYPES = {
    rabbit: { cat: 'beast', name: 'Заяц',  lv: [1, 2], hp: 0.6, atk: 0.6, dod: 1.6, def: 0.5, agi: 1.4, str: 0.5, speed: 120 },
    fox:    { cat: 'beast', name: 'Лиса',  lv: [2, 3], hp: 0.8, atk: 0.9, dod: 1.4, def: 0.7, agi: 1.3, str: 0.8, speed: 130 },
    boar:   { cat: 'beast', name: 'Кабан', lv: [3, 4], hp: 1.3, atk: 1.1, dod: 0.6, def: 1.4, agi: 0.8, str: 1.3, speed: 105 },
    wolf:   { cat: 'beast', name: 'Волк',  lv: [3, 4], hp: 1.1, atk: 1.2, dod: 1.2, def: 1.0, agi: 1.3, str: 1.1, speed: 140 },
    crow:   { cat: 'bird', name: 'Ворона', lv: [3, 4], hp: 0.6, atk: 0.9, dod: 1.8, def: 0.5, agi: 1.6, str: 0.6, speed: 150, fly: true },
    owl:    { cat: 'bird', name: 'Сова',   lv: [4, 5], hp: 0.8, atk: 1.0, dod: 1.5, def: 0.7, agi: 1.3, str: 0.8, speed: 125, fly: true },
    hawk:   { cat: 'bird', name: 'Ястреб', lv: [5, 6], hp: 0.9, atk: 1.3, dod: 1.6, def: 0.8, agi: 1.6, str: 1.0, speed: 165, fly: true },
    goblin: { cat: 'humanoid', name: 'Гоблин',    lv: [5, 6], hp: 0.9, atk: 1.0, dod: 1.1, def: 0.9, agi: 1.2, str: 0.9, speed: 125 },
    bandit: { cat: 'humanoid', name: 'Разбойник', lv: [6, 7], hp: 1.0, atk: 1.2, dod: 1.2, def: 1.0, agi: 1.2, str: 1.1, speed: 130 },
    orc:    { cat: 'humanoid', name: 'Орк',       lv: [7, 8], hp: 1.5, atk: 1.4, dod: 0.7, def: 1.4, agi: 0.8, str: 1.5, speed: 105 },
    fire:   { cat: 'elemental', name: 'Огненный дух', lv: [8, 10], hp: 1.1, atk: 1.6, dod: 1.1, def: 0.8, agi: 1.2, str: 1.0, speed: 120, fly: true },
    water:  { cat: 'elemental', name: 'Водный дух',   lv: [8, 10], hp: 1.4, atk: 1.2, dod: 1.0, def: 1.2, agi: 1.0, str: 1.0, speed: 110, fly: true },
    golem:  { cat: 'elemental', name: 'Каменный голем', lv: [9, 10], hp: 2.0, atk: 1.5, dod: 0.4, def: 1.8, agi: 0.6, str: 1.7, speed: 85 },
  };

  ZP.makeEnemyStats = (type, L) => {
    const t = ZP.ENEMY_TYPES[type];
    return {
      hp: Math.round((30 + L * 20) * t.hp),
      atk: Math.round((3 + L * 1.7) * t.atk),
      dodge: Math.round((2 + L * 0.9) * t.dod),
      def: Math.round((1 + L * 1.3) * t.def),
      agi: Math.round((4 + L * 1.4) * t.agi),
      int: Math.round(1 + L * 0.5),
      str: Math.round((3 + L * 1.6) * t.str),
    };
  };

  // вид для категории и уровня (если точного нет — ближайший по уровню)
  ZP.typeFor = (cat, L) => {
    const all = Object.keys(ZP.ENEMY_TYPES).filter((k) => ZP.ENEMY_TYPES[k].cat === cat);
    const c = all.filter((k) => L >= ZP.ENEMY_TYPES[k].lv[0] && L <= ZP.ENEMY_TYPES[k].lv[1]);
    if (c.length) return c[(Math.random() * c.length) | 0];
    return all.sort((a, b) => Math.abs(ZP.ENEMY_TYPES[a].lv[0] - L) - Math.abs(ZP.ENEMY_TYPES[b].lv[0] - L))[0];
  };

  // цвет подписи уровня — насколько зверь опасен
  ZP.levelColor = (L) => (L <= 2 ? '#9cf07a' : L <= 4 ? '#e8f07a' : L <= 6 ? '#ffd36a' : L <= 8 ? '#ff9a5a' : '#ff6a5a');
})(window.ZP);
