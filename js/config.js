// Общие константы, оружие, иконки и вспомогательные функции.
window.ZP = window.ZP || {};
(function (ZP) {
  ZP.VERSION = '0.3.0.2';
  ZP.HERO_NAME = 'Аэлис';

  ZP.MAX = 10000;          // владение хранится в сотых долях процента: 10000 = 100,00%
  ZP.STEP = 500;           // каждые 5% — одно очко навыка
  ZP.START_ACC = 0.10;     // стартовая точность любого оружия
  ZP.AGGRO = 100;          // радиус агро зверей, пиксели мира
  ZP.RESPAWN_TIME = 8;     // секунд до автоматического воскрешения (реальное время; окно воскрешения)
  ZP.ENEMY_COUNT = 44;     // сколько врагов одновременно на лугах
  ZP.ENEMY_RESPAWN = [60, 300]; // новый враг появляется через 1–5 минут после гибели прежнего
  ZP.CHASE_DIST = 600;     // враг, заметивший героиню (но не атакованный ею), не уходит дальше этого от своего места
  ZP.HERO_SPEED = 150;
  ZP.HERO_FX = 80;         // высота над ступнями для всплывающих надписей героини
  ZP.SPRITE_PX = 3;        // размер пикселя спрайта в пикселях мира (номинальный)

  // reach — дальность ближнего удара (от края цели), range — дистанция стрельбы
  ZP.WEAPONS = {
    sword:  { name: 'Меч',    acc4: 'меч',    type: 'melee', reach: 22, cd: 0.95, anim: 0.32, base: 12, attr: 'str', attrK: 1.0 },
    dagger: { name: 'Кинжал', acc4: 'кинжал', type: 'melee', reach: 16, cd: 0.55, anim: 0.2,  base: 7,  attr: 'agi', attrK: 0.8 },
    bow:    { name: 'Лук',    acc4: 'лук',    type: 'arrow', range: [140, 300], cd: 1.35, anim: 0.45, speed: 560, base: 11, attr: 'agi', attrK: 0.9 },
    staff:  { name: 'Посох',  acc4: 'посох',  type: 'orb',   range: [110, 240], cd: 1.7,  anim: 0.55, speed: 330, base: 15, attr: 'int', attrK: 1.2 },
  };
  ZP.ORDER = ['sword', 'dagger', 'bow', 'staff'];
  ZP.SPEEDS = [1, 2, 4, 8, 16];

  const sv = (body) => '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter">' + body + '</svg>';
  ZP.ICONS = {
    sword: sv('<path d="M36 6h6v6L20 34l-6-6z"/><path d="M11 25l12 12M14 34l-6 6M8 36l4 4"/>'),
    dagger: sv('<path d="M38 10l-14 18-4-4z"/><path d="M17 23l8 8M21 27l-8 8M11 37l2 2"/>'),
    bow: sv('<path d="M12 6c18 4 30 16 30 36"/><path d="M12 6l30 36" stroke-width="1.5"/><path d="M8 40l26-26M30 12h5v5"/>'),
    staff: sv('<path d="M12 42l20-24"/><circle cx="35" cy="13" r="6"/><path d="M35 3v3M44 13h-2M41 6l-2 2"/>'),
    web: sv('<circle cx="24" cy="24" r="4" fill="currentColor"/><path d="M24 6v36M8 15l32 18M8 33l32-18"/><path d="M24 14l9 5v10l-9 5-9-5V19z" stroke-width="2"/>'),
    bag: sv('<path d="M17 14v-3a7 7 0 0 1 14 0v3"/><path d="M9 16h30l-3 26H12z"/><path d="M19 24h10"/>'),
    person: sv('<circle cx="24" cy="15" r="7"/><path d="M10 42c0-9 6-15 14-15s14 6 14 15z"/>'),
    pause: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor"><rect x="3" y="2" width="4" height="12"/><rect x="9" y="2" width="4" height="12"/></svg>',
    play: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor"><path d="M4 2h2v12H4zM6 4h2v8H6zM8 5h2v6H8zM10 7h2v2h-2z"/></svg>',
    close: '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" fill="currentColor"><path d="M3 3h2v2H3zM5 5h2v2H5zM7 7h2v2H7zM9 9h2v2H9zM11 11h2v2h-2zM11 3h2v2h-2zM9 5h2v2H9zM5 9h2v2H5zM3 11h2v2H3z"/></svg>',
  };

  ZP.time = { clock: 0 };

  ZP.util = {
    rnd: (a, b) => a + Math.random() * (b - a),
    irnd: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; },
    lerpAng(a, b, t) { return a + this.angDiff(a, b) * Math.min(1, t); },
    seeded(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); },
    easeOut: (t) => 1 - Math.pow(1 - t, 3),
    pctTxt: (m) => (m / 100).toFixed(2).replace('.', ',') + '%',
    accTxt: (v) => String(Math.round(v * 1000) / 10).replace('.', ',') + '%',
    pc: (v) => (Math.round(v * 1000) / 10).toString().replace('.', ','),
    n1: (v) => String(Math.round(v * 10) / 10).replace('.', ','),
  };
})(window.ZP);
