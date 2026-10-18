// Окно «Сумка»: зелья, выпавшие предметы, продажа, автозакупка зелий и автопродажа добычи.
(function (ZP) {
  const $ = (id) => document.getElementById(id);
  const B = (ZP.uiBag = { sel: null, sig: '' }); // sel: 'i:<id>' — предмет, 'p:<id>' — зелье
  const SLOTS_MIN = 18;
  const D = () => ZP.save.data;

  function itemCard(id) {
    const inv = D().inventory, it = ZP.ITEMS[id], n = inv[id], rc = ZP.RARITY[it.rar];
    return `<div class="icard-head"><img src="${ZP.pix.itemUrl(id)}" alt=""><div><h3 class="ol" style="color:${rc.color}">${it.name}</h3><div class="hint">${rc.name} · добыча: ${ZP.CATS[it.cat].name.toLowerCase()}</div></div></div>
      <p class="idesc">${it.desc}</p>
      <div class="mline"><span>В сумке</span><span>${n} шт.</span></div>
      <div class="mline"><span>Цена</span><span>${it.price} коин. за шт.</span></div>
      <div class="sell-row"><button class="gbtn" type="button" data-act="sell1">Продать 1 · ${it.price}</button>${n > 1 ? `<button class="gbtn" type="button" data-act="sellN">Продать ${n} · ${it.price * n}</button>` : ''}</div>`;
  }
  function gearCard(idx) {
    const g = ZP.gearDef(D().gear[idx]);
    return ZP.uiDrop.card(g) + ZP.uiDrop.compare(g) + ZP.uiDrop.buttons(g, false);
  }
  function potionCard(id) {
    const p = ZP.POTIONS[id], n = ZP.potions.count(id), H = ZP.hero, can = n > 0 && !H.dead && H.hp < H.max;
    return `<div class="icard-head"><img src="${ZP.pix.potionUrl(id)}" alt=""><div><h3 class="ol" style="color:#ff9aa8">${p.name}</h3><div class="hint">Эликсир здоровья · +${p.heal} ОЗ</div></div></div>
      <p class="idesc">${p.desc}</p>
      <div class="mline"><span>В сумке</span><span>${n} шт.</span></div>
      <div class="mline"><span>Цена в деревне</span><span>${p.price} коин.</span></div>
      <div class="sell-row"><button class="gbtn" type="button" data-act="drink" ${can ? '' : 'disabled'}>Выпить${n ? '' : ' (нет в сумке)'}</button></div>`;
  }

  // строки автозакупки (общие для сумки и окна воскрешения)
  B.autobuyHTML = () => {
    const st = D().settings;
    return ZP.POTION_ORDER.map((id) => {
      const p = ZP.POTIONS[id], n = st.autobuy[id] || 0;
      return `<div class="abuy-row"><img src="${ZP.pix.potionUrl(id)}" alt=""><span class="abuy-name"><b>${p.name}</b><small>+${p.heal} ОЗ · ${p.price} коин. · есть ${ZP.potions.count(id)}</small></span>
        <span class="stepper"><button class="tbtn" type="button" data-ab="${id}" data-d="-1" aria-label="Меньше">−</button><b class="ol">${n}</b><button class="tbtn" type="button" data-ab="${id}" data-d="1" aria-label="Больше">+</button></span></div>`;
    }).join('');
  };
  B.stepAutobuy = (btn) => {
    const ab = D().settings.autobuy, id = btn.dataset.ab;
    ab[id] = Math.max(0, Math.min(ZP.POTION_MAX_AUTOBUY, (ab[id] || 0) + +btn.dataset.d));
    ZP.save.write();
  };
  B.render = (force) => {
    const d = D(), inv = d.inventory, ids = ZP.ITEM_ORDER.filter((id) => inv[id] > 0), st = d.settings;
    const sig = JSON.stringify([inv, d.gear, d.equip, ZP.hero.weapon, d.potions, d.coins, B.sel, st, ZP.hero.map, Math.round(ZP.hero.hp / 10), ZP.inventory.freshCount()]);
    if (!force && sig === B.sig) return;
    B.sig = sig;
    $('bag-coins').textContent = d.coins;
    $('bag-summary').textContent = ids.length ? `${ZP.inventory.totalItems()} предм. на ${ZP.inventory.totalValue()} коин.` : 'Добычи нет';
    $('sell-all').disabled = !ids.length;
    if (B.sel && B.sel.startsWith('i:') && !inv[B.sel.slice(2)]) B.sel = null;
    if (B.sel && B.sel.startsWith('g:') && !d.gear[+B.sel.slice(2)]) B.sel = null;

    // снаряжение — каждая вещь в своём слоте
    $('gear-count').textContent = `${d.gear.length}/${ZP.gear.BAG_MAX}`;
    $('gear-sell-all').disabled = !d.gear.length;
    const gc = d.gear.map((id, i) => { const g = ZP.gearDef(id); return `<button class="bslot gslot${B.sel === 'g:' + i ? ' on' : ''}" type="button" data-g="${i}" aria-label="${g.name}" style="--rc:${ZP.QUALITY[g.q].color}"><img src="${ZP.uiDrop.icon(g)}" alt=""><span class="n ol">${g.t}</span></button>`; });
    const gt = Math.max(6, Math.ceil(gc.length / 6) * 6);
    for (let i = gc.length; i < gt; i++) gc.push('<span class="bslot empty"></span>');
    $('gear-grid').innerHTML = gc.join('');

    // зелья — отдельный ряд слотов, всегда все пять
    $('potion-grid').innerHTML = ZP.POTION_ORDER.map((id) => {
      const n = ZP.potions.count(id), p = ZP.POTIONS[id];
      return `<button class="bslot pot${n ? '' : ' none'}${B.sel === 'p:' + id ? ' on' : ''}" type="button" data-p="${id}" aria-label="${p.name}, ${n} шт."><img src="${ZP.pix.potionUrl(id)}" alt=""><span class="n ol">${n}</span><span class="heal ol">+${p.heal}</span></button>`;
    }).join('');

    const cells = ids.map((id) => {
      const it = ZP.ITEMS[id];
      return `<button class="bslot${B.sel === 'i:' + id ? ' on' : ''}" type="button" data-id="${id}" aria-label="${it.name}, ${inv[id]} шт." style="--rc:${ZP.RARITY[it.rar].color}"><img src="${ZP.pix.itemUrl(id)}" alt="">${ZP.inventory.fresh.has(id) ? '<i class="new"></i>' : ''}<span class="n ol">${inv[id]}</span></button>`;
    });
    const total = Math.max(SLOTS_MIN, Math.ceil(cells.length / 6) * 6);
    for (let i = cells.length; i < total; i++) cells.push('<span class="bslot empty"></span>');
    $('bag-grid').innerHTML = cells.join('');

    const card = $('item-card');
    if (!B.sel) card.innerHTML = '<p class="hint">Нажмите на зелье, снаряжение или предмет, чтобы посмотреть его. Снаряжение выпадает из врагов: обычное 5%, необычное 1,5%, редкое 0,6%, ценное 0,2%. Предметы выпадают из врагов с шансом от 10% (1 уровень) до 30% (10 уровень).</p>';
    else card.innerHTML = B.sel.startsWith('p:') ? potionCard(B.sel.slice(2)) : B.sel.startsWith('g:') ? gearCard(+B.sel.slice(2)) : itemCard(B.sel.slice(2));

    // автозакупка
    $('autobuy').innerHTML = B.autobuyHTML();
    const cost = ZP.potions.setCost();
    $('autobuy-cost').textContent = cost ? `Докупить до набора: ${cost} коин.` : 'Набор собран или не выбран.';
    const bn = $('buy-now'); bn.disabled = !cost || ZP.hero.map !== 'village' || ZP.hero.dead;
    bn.title = ZP.hero.map === 'village' ? '' : 'Докупить можно, пока героиня в деревне';

    // автопродажа
    const on = $('autosell-on'); on.setAttribute('aria-pressed', st.autosellOn); on.textContent = st.autosellOn ? 'Автопродажа: включена' : 'Автопродажа: выключена';
    $('autosell-rar').innerHTML = ZP.RARITY.map((r, i) => `<button class="chip" type="button" data-rar="${i}" aria-pressed="${st.autosellRar[i]}" style="--rc:${r.color}">${r.name}</button>`).join('');
  };

  B.init = () => {
    $('bag-coin-ico').src = ZP.pix.coinUrl();
    $('bag-grid').addEventListener('click', (e) => { const b = e.target.closest('.bslot[data-id]'); if (!b) return; B.sel = 'i:' + b.dataset.id; ZP.inventory.fresh.delete(b.dataset.id); B.render(true); });
    $('gear-grid').addEventListener('click', (e) => { const b = e.target.closest('.bslot[data-g]'); if (!b) return; B.sel = 'g:' + b.dataset.g; B.render(true); });
    const gs = $('gear-sell-all'); let gArm = null;
    gs.addEventListener('click', () => {
      if (gs.dataset.armed !== 'true') { gs.dataset.armed = 'true'; gs.textContent = `Точно? +${ZP.gear.bagValue()} коин.`; clearTimeout(gArm); gArm = setTimeout(() => { gs.dataset.armed = 'false'; gs.textContent = 'Продать всё снаряжение'; }, 3000); return; }
      clearTimeout(gArm); gs.dataset.armed = 'false'; gs.textContent = 'Продать всё снаряжение';
      ZP.gear.sellAllBag(); if (B.sel && B.sel.startsWith('g:')) B.sel = null; B.render(true);
    });
    $('potion-grid').addEventListener('click', (e) => { const b = e.target.closest('.bslot[data-p]'); if (!b) return; B.sel = 'p:' + b.dataset.p; B.render(true); });
    $('item-card').addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b || !B.sel) return;
      const id = B.sel.slice(2);
      if (B.sel.startsWith('g:')) {
        const a = b.dataset.act;
        if (a === 'equip' || a === 'equipL') ZP.gear.equipFromBag(+id, a === 'equipL' ? 'left' : 'right');
        if (a === 'sell') ZP.gear.sellFromBag(+id);
        B.sel = null; B.render(true); return;
      }
      if (b.dataset.act === 'sell1') ZP.inventory.sell(id, 1);
      if (b.dataset.act === 'sellN') ZP.inventory.sell(id, D().inventory[id] || 0);
      if (b.dataset.act === 'drink') ZP.potions.drink(id, false);
      B.render(true);
    });
    $('autobuy').addEventListener('click', (e) => {
      const b = e.target.closest('[data-ab]'); if (!b) return;
      B.stepAutobuy(b); B.render(true);
    });
    $('buy-now').addEventListener('click', () => { ZP.potions.autoBuy(); B.render(true); });
    $('autosell-on').addEventListener('click', () => {
      const st = D().settings; st.autosellOn = !st.autosellOn;
      ZP.ui.log(st.autosellOn ? 'Автопродажа включена.' : 'Автопродажа выключена.', 'sys');
      ZP.inventory.applyAutosell(); ZP.save.write(); B.render(true);
    });
    $('autosell-rar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-rar]'); if (!b) return;
      const st = D().settings, i = +b.dataset.rar; st.autosellRar[i] = !st.autosellRar[i];
      ZP.inventory.applyAutosell(); ZP.save.write(); B.render(true);
    });
    const sa = $('sell-all'); let armT = null;
    sa.addEventListener('click', () => {
      if (sa.dataset.armed !== 'true') { sa.dataset.armed = 'true'; sa.textContent = `Точно? +${ZP.inventory.totalValue()} коин.`; clearTimeout(armT); armT = setTimeout(() => { sa.dataset.armed = 'false'; sa.textContent = 'Продать всё'; }, 3000); return; }
      clearTimeout(armT); sa.dataset.armed = 'false'; sa.textContent = 'Продать всё';
      ZP.inventory.sellAll(); B.sel = null; B.render(true);
    });
  };
  B.open = () => { B.sel = null; B.render(true); };
})(window.ZP);
