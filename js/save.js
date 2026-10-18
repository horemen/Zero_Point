// Сохранение прогресса в памяти браузера телефона (localStorage).
// При первом запуске версии 0.8 старые сохранения удаляются у всех игроков.
(function (ZP) {
  const KEY = 'zp-save-v1';
  const RESET_FLAG = 'zp-reset-0.8';
  // Старые ключи этой игры. Чужие ключи (другие игры на том же адресе github.io) не трогаем.
  const OLD_KEYS = ['training-yard-v1', 'training-yard-v2'];

  const fresh = () => ({
    v: 1,
    current: 'sword',
    skills: Object.fromEntries(ZP.ORDER.map((k) => [k, { m: 0, hits: 0, shots: 0, learned: [] }])),
    kills: 0,
    deaths: 0,
    killsByType: {},
    bestLevel: 0,
    inventory: {},
    coins: 0,
    coinsEarned: 0,
    potions: {},
    equip: {},
    gear: [],
    gearQueue: [],
    settings: { drinkAt: 30, autobuy: {}, autosellOn: false, autosellRar: [true, false, false, false], similar: false, similarLevel: 1 },
    savedAt: 0,
  });

  ZP.save = {
    data: fresh(),
    available: true,
    load() {
      let raw = null;
      try {
        if (!localStorage.getItem(RESET_FLAG)) {
          OLD_KEYS.forEach((k) => localStorage.removeItem(k));
          localStorage.removeItem(KEY);
          localStorage.setItem(RESET_FLAG, '1');
        }
        raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      } catch (e) { this.available = false; }
      const d = fresh();
      if (raw && raw.v === 1) {
        for (const k of ZP.ORDER) {
          const s = raw.skills && raw.skills[k];
          if (!s) continue;
          d.skills[k] = {
            m: Math.max(0, Math.min(ZP.MAX, s.m | 0)),
            hits: s.hits | 0,
            shots: s.shots | 0,
            learned: (s.learned || []).filter((id) => ZP.SKILL_NODES[k][id]),
          };
          // не больше изученных узлов, чем заработано очков
          const pts = Math.floor(d.skills[k].m / ZP.STEP);
          if (d.skills[k].learned.length > pts) d.skills[k].learned.length = pts;
        }
        if (ZP.WEAPONS[raw.current]) d.current = raw.current;
        d.kills = raw.kills | 0;
        d.deaths = raw.deaths | 0;
        d.bestLevel = raw.bestLevel | 0;
        d.killsByType = typeof raw.killsByType === 'object' && raw.killsByType ? raw.killsByType : {};
        d.savedAt = raw.savedAt || 0;
        if (raw.inventory && typeof raw.inventory === 'object') for (const [id, n] of Object.entries(raw.inventory)) if (ZP.ITEMS[id] && n > 0) d.inventory[id] = n | 0;
        d.coins = Math.max(0, raw.coins | 0);
        d.coinsEarned = Math.max(0, raw.coinsEarned | 0);
        if (raw.potions && typeof raw.potions === 'object') for (const [id, n] of Object.entries(raw.potions)) if (ZP.POTIONS[id] && n > 0) d.potions[id] = n | 0;
        // снаряжение: только существующие предметы и подходящие слоты
        if (raw.equip && typeof raw.equip === 'object') for (const [slot, id] of Object.entries(raw.equip)) {
          const g = ZP.gearDef(id); if (!g || !ZP.EQUIP_SLOTS.includes(slot)) continue;
          const ok = g.slot === 'hand' ? (slot === 'right' || (slot === 'left' && !g.twoHand)) : g.slot === slot;
          if (ok) d.equip[slot] = id;
        }
        if (Array.isArray(raw.gear)) d.gear = raw.gear.filter((id) => ZP.gearDef(id));
        // двуручное в правой или разные виды оружия в руках — левое в сумку
        if (d.equip.left && d.equip.right) { const r = ZP.gearDef(d.equip.right); if (r.twoHand || r.weapon !== ZP.gearDef(d.equip.left).weapon) { d.gear.push(d.equip.left); delete d.equip.left; } }
        // невыбранные при закрытии игры предметы — в сумку
        if (Array.isArray(raw.gearQueue)) d.gear.push(...raw.gearQueue.filter((id) => ZP.gearDef(id)));
        const rs = raw.settings || {};
        if (typeof rs.drinkAt === 'number') d.settings.drinkAt = Math.max(0, Math.min(100, Math.round(rs.drinkAt)));
        if (rs.autobuy && typeof rs.autobuy === 'object') for (const [id, n] of Object.entries(rs.autobuy)) if (ZP.POTIONS[id]) d.settings.autobuy[id] = Math.max(0, Math.min(ZP.POTION_MAX_AUTOBUY, n | 0));
        d.settings.autosellOn = !!rs.autosellOn;
        if (Array.isArray(rs.autosellRar) && rs.autosellRar.length === 4) d.settings.autosellRar = rs.autosellRar.map(Boolean);
        d.settings.similar = !!rs.similar;
        if (rs.similarLevel >= 1 && rs.similarLevel <= 10) d.settings.similarLevel = rs.similarLevel | 0;
      }
      this.data = d;
      return d;
    },
    write() {
      this.data.savedAt = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); this.available = true; } catch (e) { this.available = false; }
    },
    wipe() {
      this.data = fresh();
      this.write();
    },
  };

  // Просим браузер не удалять данные игры при нехватке места.
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
})(window.ZP);
