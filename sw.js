// Сервис-воркер: игра работает без интернета, а при наличии сети сразу получает обновления.
const VERSION = 'zp-v0.3.0.2';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/config.js', 'js/changelog.js', 'js/skills-data.js', 'js/items-data.js', 'js/potions-data.js', 'js/gear-data.js', 'js/save.js', 'js/stats.js', 'js/mastery.js', 'js/fx.js',
  'sprites/base.js', 'sprites/items.js', 'sprites/props.js', 'sprites/hero.js', 'sprites/enemies.js',
  'js/world.js', 'js/ground.js', 'js/enemies.js', 'js/combat.js', 'js/inventory.js', 'js/potions.js', 'js/gear.js', 'js/hero-ai.js', 'js/render.js',
  'js/ui-hud.js', 'js/ui-skills.js', 'js/ui-character.js', 'js/ui-bag.js', 'js/ui-enemies.js', 'js/ui-death.js', 'js/ui-drop.js', 'js/ui-menu.js', 'js/pwa.js', 'js/main.js',
  'sprites/icons/icon-192.png', 'sprites/icons/icon-512.png', 'sprites/icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  // удаляем только старые кэши этой игры
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('zp-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // сначала сеть (свежая версия), без сети — из кэша
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
    );
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    // шрифт: из кэша, если уже скачан
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })));
  }
});
