// Пиксельные иконки предметов и монеты (рисунки 10×10 из строк: каждый символ — пиксель, «.» — пусто).
(function (ZP) {
  const PIX = (ZP.pix = { cache: {} });
  const O = '#2a1e14';

  PIX.canvas = (rows, pal) => {
    const h = rows.length, w = rows[0].length, cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.' || !pal[ch]) continue;
      c.fillStyle = pal[ch]; c.fillRect(x, y, 1, 1);
    }
    return cv;
  };
  // картинка с полями и масштабом — для <img> в интерфейсе
  PIX.url = (key, rows, pal, scale = 4) => {
    if (PIX.cache[key]) return PIX.cache[key];
    const src = PIX.canvas(rows, pal), cv = document.createElement('canvas');
    cv.width = (src.width + 2) * scale; cv.height = (src.height + 2) * scale;
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    c.drawImage(src, scale, scale, src.width * scale, src.height * scale);
    return (PIX.cache[key] = cv.toDataURL());
  };

  const feather = ['..........', '......ooo.', '.....owwo.', '....owwso.', '...owwso..', '..owwso...', '..owso....', '.obo......', 'ob........', '..........'];
  const ICON = {
    fur: { rows: ['..........', '...ooo....', '..obbbo...', '.obcbbboo.', '.obbbcbbbo', 'obbcbbbcbo', 'obbbbbbbo.', '.oaabaao..', '..oooo....', '..........'], pal: { o: O, a: '#8a6440', b: '#c89a6a', c: '#ecd2a8' } },
    bone: { rows: ['..........', '..........', '.oo....oo.', 'owwoooowwo', 'owwwwwwwwo', 'owssssssso', 'owwoooowso', '.oo....oo.', '..........', '..........'], pal: { o: O, w: '#f6efe0', s: '#cbbfa8' } },
    hide: { rows: ['..........', '.o......o.', '.obo..obo.', '..obbbbo..', '.obbccbbo.', '.obccccbo.', '.obbccbbo.', '..obbbbo..', '.obo..obo.', '.o......o.'], pal: { o: O, b: '#9a6a3a', c: '#c8925a' } },
    fang: { rows: ['..........', '...oooo...', '..owwwwo..', '..owwwso..', '...owwso..', '...owwso..', '....owso..', '....owo...', '.....o....', '..........'], pal: { o: O, w: '#fbf6ea', s: '#cfc6b2' } },
    feather: { rows: feather, pal: { o: O, w: '#f6f6f6', s: '#b8c2cc', b: '#8a6a4a' } },
    egg: { rows: ['..........', '...oooo...', '..owwwwo..', '.owwwwwwo.', '.owwwwwso.', '.owwswwso.', '.owwwwsso.', '..owssso..', '...oooo...', '..........'], pal: { o: O, w: '#f8f0de', s: '#d8c6a2' } },
    talon: { rows: ['..........', '..oooo....', '.occdo....', '.odddoo...', '..oddddo..', '...ooddo..', '.....odo..', '.....odo..', '......o...', '..........'], pal: { o: O, c: '#9a9a9a', d: '#545454' } },
    goldfeather: { rows: ['x.........', '......ooo.', '.....owwo.', '....owwso.', '...owwso.x', '..owwso...', '..owso....', '.obo......', 'ob........', '..........'], pal: { o: O, w: '#ffe27a', s: '#e0a43a', b: '#a06a2a', x: '#ffffff' } },
    cloth: { rows: ['..........', '.oooooo...', '.orrrrro..', '.orrkrrro.', '.orrrrrro.', '..orrrkro.', '..orrrro..', '...oro.o..', '....o.....', '..........'], pal: { o: O, r: '#c8463a', k: '#ec7a62' } },
    rustknife: { rows: ['..........', '........oo', '.......oso', '......osso', '.....osso.', '..o.osso..', '..ogsso...', '..oggo....', '.ohoo.....', 'oho.......'], pal: { o: O, s: '#b39c86', g: '#c2a14a', h: '#6a4626' } },
    belt: { rows: ['..........', '..........', 'oooooooooo', 'obbbyyybbo', 'obbby.ybbo', 'obbbyyybbo', 'oooooooooo', '..........', '..........', '..........'], pal: { o: O, b: '#8a5a2e', y: '#e2b14f' } },
    amulet: { rows: ['..o....o..', '...o..o...', '....oo....', '...oyyo...', '..oyggyo..', '..oyglyo..', '...oyyo...', '....oo....', '..........', '..........'], pal: { o: O, y: '#e2b14f', g: '#2fbf7a', l: '#9cf0c4' } },
    ember: { rows: ['..........', '...oooo...', '..okrrko..', '.okrffrko.', '.orffyfro.', '.okrffrko.', '..okrrko..', '...oooo...', '..........', '..........'], pal: { o: O, k: '#3a2a2a', r: '#d8502a', f: '#ff9a3a', y: '#ffe07a' } },
    shard: { rows: ['..........', '....oo....', '...osso...', '..osllso..', '.osllssso.', '.osssssdo.', '..osssddo.', '...osddo..', '....ooo...', '..........'], pal: { o: O, l: '#d2d6d0', s: '#9aa09a', d: '#6a706a' } },
    crystal: { rows: ['....oo....', '...ocwo...', '..occwco..', '..occcco..', '.occccbbo.', '.occcbbbo.', '..occbbo..', '..ocbbbo..', '...obbo...', '....oo....'], pal: { o: O, c: '#7fd0ff', w: '#eafaff', b: '#3a8ad8' } },
    core: { rows: ['...oooo...', '..ozzzzo..', '.ozxzzzzo.', '.ozzpzzzo.', '.ozzppzzo.', '.ozzzzzpo.', '.ozzzzppo.', '..ozzppo..', '...oooo...', '..........'], pal: { o: O, z: '#b884ff', p: '#7a4ad8', x: '#ffffff' } },
  };
  const COIN = { rows: ['..oooo..', '.oyyyyo.', 'oyywwyko', 'oywyyyko', 'oyyyyyko', 'oyyyykko', '.okkkko.', '..oooo..'], pal: { o: O, y: '#ffd84a', w: '#fff4b0', k: '#d89a2a' } };


  // эликсиры
  const CORK = '#a8763d';
  const POT = {
    dew: { rows: ['..........', '....oo....', '...okko...', '....oo....', '...owro...', '...orro...', '...orro...', '...oddo...', '....oo....', '..........'], pal: { o: O, k: CORK, w: '#ffd8d8', r: '#e8463a', d: '#a82a2a' } },
    herbal: { rows: ['....oo....', '...okko...', '....oo....', '...owro...', '..owrrro..', '..orrrro..', '..orrrro..', '..odddro..', '...oddo...', '....oo....'], pal: { o: O, k: CORK, w: '#e0f8d0', r: '#5cc24e', d: '#3a8a34' } },
    scarlet: { rows: ['...oooo...', '...okko...', '....oo....', '..owrrro..', '.owrrrrro.', '.orrrrrro.', '.orrrrrro.', '.odrrrrdo.', '..oddddo..', '...oooo...'], pal: { o: O, k: CORK, w: '#ffd0d0', r: '#e0303a', d: '#9a1a24' } },
    heart: { rows: ['..oooooo..', '..okkkko..', '...oooo...', '.owrrrrro.', 'owrrhrhrro', 'orrrhhhrro', 'orrrrhrrro', 'orrrrrrrro', 'oddrrrrddo', '.oooooooo.'], pal: { o: O, k: CORK, w: '#ffe0e8', r: '#d83a6a', h: '#ff9ab0', d: '#8a1a3a' } },
    phoenix: { rows: ['....x.....', '....oo....', '...okko...', '..oooooo..', '.owyyyyyo.', 'owyyfyyyyo', 'oyyfffyyyo', 'oyyyfyyyyo', 'oddyyyyddo', '.oooooooo.'], pal: { o: O, k: CORK, w: '#fff4b0', y: '#ffd84a', f: '#ff7a2a', d: '#d89a2a', x: '#ffffff' } },
  };
  PIX.potionUrl = (id) => PIX.url('pot:' + id, POT[id].rows, POT[id].pal, 4);

  // снаряжение: один рисунок на вид, цвет — по качеству (a — основной, b — тень, c — блик)
  const GEAR = {
    helm: ['..........', '...oooo...', '..occaao..', '.ocaaaaao.', '.oaaaaaao.', '.oabbbbao.', '.oao..oao.', '.obo..obo.', '..o....o..', '..........'],
    shoulders: ['..........', '..........', '.ooo..ooo.', 'occaooacco', 'oaaaooaaao', 'obbaooabbo', '.obo..obo.', '..o....o..', '..........', '..........'],
    chest: ['..oo..oo..', '.occooaco.', 'occaaaaaco', 'obaaaaaabo', '.oaacaaao.', '.oaaaaaao.', '.obbhhbbo.', '.oaaaaaao.', '..oooooo..', '..........'],
    bracers: ['..........', '...oooo...', '..ocaaao..', '..obbbbo..', '..ocaaao..', '..oaaaao..', '..obbbbo..', '..ocaaao..', '...oooo...', '..........'],
    gloves: ['..........', '.o.o.o....', 'oaoaoao...', 'oaoaoaooo.', 'oaaaaaoco.', 'oaaaaaaao.', '.oaaaaao..', '.obbbbbo..', '.occccco..', '..ooooo...'],
    belt: ['..........', '..........', '..........', 'oooooooooo', 'oaaasssaao', 'oaaas.saao', 'oaaasssaao', 'oooooooooo', '..........', '..........'],
    pants: ['..........', '.oooooooo.', '.obbhhbbo.', '.oaaaaaao.', '.oaaooaao.', '.oao..oao.', '.oao..oao.', '.oco..oco.', '.ooo..ooo.', '..........'],
    greaves: ['...oooo...', '..occaao..', '..oaaaao..', '..obbbbo..', '..oaaaao..', '..oaaaao..', '..obbbbo..', '..oaaaao..', '...oaao...', '....oo....'],
    boots: ['..........', '..oooo....', '..ocao....', '..oaao....', '..oaao....', '..oaaooo..', '..oaaaaao.', '.oaaaaaco.', '.obbbbbbo.', '..oooooo..'],
    dagger: ['..........', '.......oo.', '......osco', '.....osso.', '....osso..', '..o.oso...', '..ooso....', '..oaao....', '.ohoo.....', 'oho.......'],
    sword: ['........oo', '.......oco', '......osco', '.....osso.', '....osso..', '.o.osso...', '.oaoso....', '..oao.....', '.oho.o....', 'oho.......'],
    staff: ['.....oooo.', '....occao.', '....ocaao.', '....oaabo.', '.....oho..', '....oho...', '...oho....', '..oho.....', '.oho......', 'oho.......'],
    bow: ['.oo.......', '.oaoo.....', '.os.ao....', '.os..ao...', '.os..co...', '.os..ao...', '.os..ao...', '.os.ao....', '.oaoo.....', '.oo.......'],
  };
  const QPAL = [
    { a: '#9a8a78', b: '#6a5c4c', c: '#c8b8a2' },
    { a: '#5cae4e', b: '#3a7a34', c: '#a8e08a' },
    { a: '#4a8ae0', b: '#2a5aa8', c: '#a8d0ff' },
    { a: '#b07aff', b: '#7a4ad8', c: '#ffd84a' },
  ];
  PIX.gearUrl = (type, q) => PIX.url(`gear:${type}:${q}`, GEAR[type], Object.assign({ o: O, h: '#8a5a2e', s: '#dfe6ec' }, QPAL[q]), 4);

  PIX.itemUrl = (id) => PIX.url('item:' + id, ICON[id].rows, ICON[id].pal, 4);
  PIX.itemCanvas = (id) => PIX.cache['cv:' + id] || (PIX.cache['cv:' + id] = PIX.canvas(ICON[id].rows, ICON[id].pal));
  PIX.coinUrl = () => PIX.url('coin', COIN.rows, COIN.pal, 3);
  PIX.coinCanvas = () => PIX.cache['cv:coin'] || (PIX.cache['cv:coin'] = PIX.canvas(COIN.rows, COIN.pal));
})(window.ZP);
