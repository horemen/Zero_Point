// Окно выпавшего снаряжения: карточка предмета, сравнение с надетым, «Надеть» / «Продать» / «В сумку».
// Если игрок ничего не выбрал за 10 секунд — предмет уходит в сумку. Новые находки ждут в очереди.
// Здесь же общие карточки снаряжения для сумки и окна персонажа.
(function (ZP) {
  const $ = (id) => document.getElementById(id);
  const Dr = (ZP.uiDrop = { shown: false, shownAt: 0, TIME: 10 });
  const sign = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v);

  Dr.icon = (g) => ZP.pix.gearUrl(g.type, g.q);
  // карточка предмета
  Dr.card = (g) => {
    const Q = ZP.QUALITY[g.q];
    return `<div class="icard-head"><img src="${Dr.icon(g)}" alt="" style="border-color:${Q.color}"><div><h3 class="ol" style="color:${Q.color}">${g.name}</h3><div class="hint">${Q.name} · ${g.typeName.toLowerCase()}${g.twoHand ? ' · двуручное' : ''} · ур. предмета ${g.t}</div></div></div>
      <div class="gstats">${ZP.STAT_ORDER.filter((k) => g.stats[k]).map((k) => `<div class="mline"><span>${ZP.STAT_NAMES[k]}</span><span>+${g.stats[k]}</span></div>`).join('')}</div>
      ${g.weapon ? `<p class="hint">Действует, когда в руках ${ZP.WEAPONS[g.weapon].acc4}. ${g.twoHand ? 'Двуручное — занимает обе руки.' : `Во второй руке — только ${ZP.WEAPONS[g.weapon].name.toLowerCase()}.`}</p>` : ''}
      <div class="mline"><span>Цена</span><span>${g.price} коин.</span></div>`;
  };
  // таблица сравнения с тем, что придётся снять
  const cmpTable = (g, hand, title) => {
    const off = ZP.gear.displaced(g, hand).map(ZP.gearDef), slot = ZP.gear.slotFor(g, hand);
    const head = title ? `<b class="cmp-t">${title}</b>` : '';
    if (!off.length) return `<div class="cmp-box">${head}<p class="hint">${ZP.SLOT_NAMES[slot]}: пусто — предмет просто наденется.</p></div>`;
    const old = {}; off.forEach((o) => { for (const k in o.stats) old[k] = (old[k] || 0) + o.stats[k]; });
    const keys = ZP.STAT_ORDER.filter((k) => old[k] || g.stats[k]);
    return `<div class="cmp-box">${head}
      <div class="cmp-off">${off.map((o) => `<span><img src="${Dr.icon(o)}" alt=""><i style="color:${ZP.QUALITY[o.q].color}">${o.name}</i></span>`).join('')}</div>
      <table class="cmp"><thead><tr><th></th><th>Надето</th><th>Новое</th><th></th></tr></thead><tbody>
      ${keys.map((k) => { const a = old[k] || 0, b = g.stats[k] || 0, d = b - a; return `<tr><td>${ZP.STAT_NAMES[k]}</td><td>${a}</td><td>${b}</td><td class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d ? sign(d) : '='}</td></tr>`; }).join('')}
      </tbody></table></div>`;
  };
  Dr.compare = (g) => {
    if (g.slot === 'hand' && !g.twoHand) return cmpTable(g, 'right', 'Правая рука') + cmpTable(g, 'left', 'Левая рука');
    return cmpTable(g, 'right', '');
  };
  // кнопки решения
  Dr.buttons = (g, withBag) => {
    const one = g.slot === 'hand' && !g.twoHand;
    return `<div class="sell-row"><button class="gbtn" type="button" data-act="equip">${one ? 'В правую руку' : 'Надеть'}</button>${one ? '<button class="gbtn" type="button" data-act="equipL">В левую руку</button>' : ''}<button class="gbtn" type="button" data-act="sell">Продать · ${g.price}</button></div>` +
      (withBag ? '<button class="tbtn drop-bag" type="button" data-act="bag">В сумку</button>' : '');
  };

  function show(id) {
    const g = ZP.gearDef(id);
    $('drop-body').innerHTML = `<div class="inset">${Dr.card(g)}</div>${Dr.compare(g)}${Dr.buttons(g, true)}`;
    $('win-drop').hidden = false;
    Dr.shown = true; Dr.shownAt = performance.now();
  }
  function afterChange() {
    Dr.shown = false;
    if (!$('win-bag').hidden) ZP.uiBag.render(true);
    if (!$('win-char').hidden) ZP.uiChar.render(true);
    ZP.ui.dirty();
  }
  Dr.act = (act) => {
    if (!Dr.shown) return;
    if (act === 'equip' || act === 'equipL') ZP.gear.resolve('equip', act === 'equipL' ? 'left' : 'right');
    else ZP.gear.resolve(act === 'sell' ? 'sell' : 'bag');
    afterChange();
  };
  Dr.isOpen = () => !$('win-drop').hidden;

  // вызывается каждый кадр
  Dr.tick = (now) => {
    const q = ZP.gear.queue(), el = $('win-drop');
    if (!q.length) { if (!el.hidden) el.hidden = true; Dr.shown = false; return; }
    if (!Dr.shown) show(q[0]);
    const left = Dr.TIME - (now - Dr.shownAt) / 1000;
    if (left <= 0) { ZP.gear.resolve('bag'); afterChange(); return; }
    $('drop-bar').style.width = (left / Dr.TIME) * 100 + '%';
    $('drop-timer').textContent = `В сумку через ${Math.ceil(left)} с` + (q.length > 1 ? ` · ещё в очереди: ${q.length - 1}` : '');
  };

  Dr.init = () => {
    $('drop-body').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) Dr.act(b.dataset.act); });
  };
})(window.ZP);
