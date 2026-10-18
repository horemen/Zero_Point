// Земля из плиток 32×32 в минималистичном пиксельном стиле: трава, земля, тропы, цвет травы по зонам.
// Буфер строится один раз на локацию и масштаб, потом копируется на экран.
(function (ZP) {
  const U = ZP.util;
  const G = (ZP.ground = { cache: {} });
  const TS = 32;

  G.get = (map, g) => {
    const key = map.id + '|' + g.toFixed(4);
    if (!G.cache[key]) { for (const k in G.cache) if (k.startsWith(map.id + '|')) delete G.cache[k]; G.cache[key] = build(map, g); }
    return G.cache[key];
  };

  // палитры травы: [плитка A, плитка B, пучки, цветы]
  const GRASS = {
    beast: ['#6cc24a', '#66ba46', '#4f9a35'],
    bird: ['#9ccd4c', '#95c547', '#76a036'],
    humanoid: ['#5c9e3e', '#57963b', '#3f7a2c'],
    elemental: ['#52aa94', '#4ca28c', '#357a6a'],
    village: ['#6cc24a', '#66ba46', '#4f9a35'],
    forest: ['#4a9a3c', '#469438', '#357a2c'],
  };
  const DIRT = ['#d8a868', '#d0a062', '#a8763d'];
  const FLOWERS = ['#ffe36a', '#ff9ab8', '#ffffff', '#9fd6ff'];

  function build(map, g) {
    const M = map.M, cols = Math.ceil((map.W + 2 * M) / TS), rows = Math.ceil((map.H + 2 * M) / TS);
    const cw = Math.ceil((map.W + 2 * M) / g), ch = Math.ceil((map.H + 2 * M) / g);
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const c = cv.getContext('2d');
    c.setTransform(1 / g, 0, 0, 1 / g, M / g, M / g);
    const r = U.seeded(map.id === 'village' ? 7 : 17);
    const px = g; // один пиксель экрана в мире
    c.fillStyle = GRASS.forest[0]; c.fillRect(-M, -M, map.W + 2 * M, map.H + 2 * M);

    // тип каждой плитки: 'g' трава, 'd' земля
    const tileAt = (tx, ty) => {
      const x = -M + tx * TS + TS / 2, y = -M + ty * TS + TS / 2;
      const inside = x > 0 && x < map.W && y > 0 && y < map.H;
      if (map.id === 'village') {
        if (inside) return 'd';
        for (const gt of Object.values(map.gates)) {
          if (gt.side === 's' && y > map.H && Math.abs(x - gt.x) < 34) return 'd';
          if (gt.side === 'e' && x > map.W && Math.abs(y - gt.y) < 34) return 'd';
        }
        return 'g';
      }
      for (const gt of Object.values(map.gates)) {
        // тропа от ворот наружу и немного вглубь лугов
        const along = (x - gt.x) * gt.nx + (y - gt.y) * gt.ny, across = Math.abs((x - gt.x) * gt.ny - (y - gt.y) * gt.nx);
        if (along < 260 && along > -M - 40 && across < 30) return 'd';
      }
      return 'g';
    };
    const zoneOf = (x, y) => {
      const inside = x > -10 && x < map.W + 10 && y > -10 && y < map.H + 10;
      if (!inside) return 'forest';
      if (map.id === 'village') return 'village';
      return ZP.catForBase(ZP.world.baseLevel(map, x, y));
    };
    const T = [];
    for (let ty = 0; ty < rows; ty++) { T[ty] = []; for (let tx = 0; tx < cols; tx++) T[ty][tx] = tileAt(tx, ty); }

    for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
      const x = -M + tx * TS, y = -M + ty * TS, t = T[ty][tx], odd = (tx + ty) % 2;
      if (t === 'd') {
        c.fillStyle = DIRT[odd]; c.fillRect(x, y, TS + px, TS + px);
        // тёмная кромка там, где земля граничит с травой
        c.fillStyle = DIRT[2];
        if (T[ty - 1] && T[ty - 1][tx] === 'g') c.fillRect(x, y, TS, px * 2);
        if (T[ty][tx - 1] === 'g') c.fillRect(x, y, px * 2, TS);
        if (T[ty][tx + 1] === 'g') c.fillRect(x + TS - px * 2, y, px * 2, TS);
        if (T[ty + 1] && T[ty + 1][tx] === 'g') c.fillRect(x, y + TS - px * 2, TS, px * 2);
        if (r() < 0.18) { c.fillStyle = '#bfa080'; c.fillRect(x + r() * 24 + 2, y + r() * 24 + 2, px * 3, px * 2); }
      } else {
        const z = GRASS[zoneOf(x + TS / 2, y + TS / 2)];
        c.fillStyle = z[odd]; c.fillRect(x, y, TS + px, TS + px);
        const k = r();
        if (k < 0.32) {
          // пучок травы: три пикселя «галочкой»
          const gx = x + 4 + r() * 22, gy = y + 6 + r() * 20;
          c.fillStyle = z[2]; c.fillRect(gx, gy, px, px * 2); c.fillRect(gx + px * 2, gy - px, px, px * 3); c.fillRect(gx + px * 4, gy, px, px * 2);
        } else if (k < 0.39 && zoneOf(x, y) !== 'village') {
          const fx = x + 6 + r() * 18, fy = y + 6 + r() * 18;
          c.fillStyle = FLOWERS[(r() * FLOWERS.length) | 0];
          c.fillRect(fx, fy - px, px, px); c.fillRect(fx - px, fy, px, px); c.fillRect(fx + px, fy, px, px); c.fillRect(fx, fy + px, px, px);
          c.fillStyle = '#ffd84a'; c.fillRect(fx, fy, px, px);
        }
      }
    }
    if (map.id === 'village') {
      // плитки площади у камня воскрешения
      const sp = map.respawn;
      for (let i = -2; i <= 1; i++) for (let j = -2; j <= 0; j++) { c.fillStyle = (i + j) % 2 ? '#c8ccd0' : '#bcc0c6'; c.fillRect(sp.x + i * TS, sp.y - 40 + j * TS, TS, TS); }
      c.fillStyle = '#9aa0a8'; c.fillRect(sp.x - 2 * TS, sp.y - 40 + TS - px * 2, 4 * TS, px * 2);
      // жерди частокола
      c.fillStyle = '#7a4a24';
      const gs = map.gates.south;
      c.fillRect(0, -12, map.W, px * 2);
      c.fillRect(0, map.H - 5, gs.x - 44, px * 2); c.fillRect(gs.x + 44, map.H - 5, map.W - gs.x - 44, px * 2);
    }
    return cv;
  }
})(window.ZP);
