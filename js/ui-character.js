// Окно «Персонаж»: характеристики с описаниями, боевые показатели, владение каждым оружием и его бонусы.
(function (ZP) {
  const U = ZP.util, M = ZP.mastery;
  const $ = (id) => document.getElementById(id);
  const C = (ZP.uiChar = { last: 0, sel: null, sig: '' });
  const DOLL_L = ['helm', 'shoulders', 'chest', 'bracers', 'gloves', 'left'], DOLL_R = ['belt', 'pants', 'greaves', 'boots', 'right'];

  // кукла: слоты вокруг портрета; нажатие — карточка надетого и подходящие вещи из сумки
  // двуручное оружие из правой руки показывается и в левой (занимает обе)
  const twoHandR = () => { const r = ZP.gear.at('right'); return r && r.twoHand ? r : null; };
  const slotBtn = (slot) => {
    const both = slot === 'left' && twoHandR(), g = both || ZP.gear.at(slot), Q = g && ZP.QUALITY[g.q], off = g && !ZP.gear.works(g);
    const key = both ? 'right' : slot;
    return `<button class="dslot${C.sel === key ? ' on' : ''}${off ? ' off' : ''}${both ? ' both' : ''}" type="button" data-slot="${key}" aria-label="${ZP.SLOT_NAMES[slot]}${g ? ': ' + g.name : ''}" ${g ? `style="--rc:${Q.color}"` : ''}>${g ? `<img src="${ZP.uiDrop.icon(g)}" alt="">` : `<span>${ZP.SLOT_NAMES[slot]}</span>`}</button>`;
  };
  const fits = (slot, g) => (slot === 'left' ? g.slot === 'hand' && !g.twoHand && (!ZP.gear.at('right') || ZP.gear.at('right').twoHand || ZP.gear.at('right').weapon === g.weapon) : slot === 'right' ? g.slot === 'hand' : g.slot === slot);
  function renderDoll() {
    const d = ZP.save.data, sig = JSON.stringify([d.equip, d.gear.length, C.sel, ZP.hero.weapon]);
    if (sig === C.sig) return;
    C.sig = sig;
    const b = ZP.gear.bonus(), bl = ZP.STAT_ORDER.filter((k) => b[k]).map((k) => `<span>${ZP.STAT_NAMES[k]} <b>+${b[k]}</b></span>`).join('');
    $('doll').innerHTML = `<div class="dcol">${DOLL_L.map(slotBtn).join('')}</div>
      <div class="dmid"><canvas id="doll-portrait" width="32" height="32"></canvas><div class="dbonus">${bl || '<span>Снаряжение не надето</span>'}</div></div>
      <div class="dcol">${DOLL_R.map(slotBtn).join('')}</div>`;
    const card = $('doll-card');
    if (!C.sel) { card.innerHTML = '<p class="hint">Нажмите на слот, чтобы посмотреть предмет или надеть вещь из сумки. Лук и посох занимают обе руки. Мечи и кинжалы носятся только парой одного вида. Оружие действует, только когда героиня держит такое же оружие.</p>'; return; }
    const g = ZP.gear.at(C.sel);
    const list = d.gear.map((id, i) => [ZP.gearDef(id), i]).filter(([x]) => fits(C.sel, x)).sort((a, z) => z[0].q - a[0].q || z[0].t - a[0].t).slice(0, 12);
    card.innerHTML = `<h4>${g && g.twoHand ? 'Обе руки' : ZP.SLOT_NAMES[C.sel]}</h4>` +
      (g ? `<div class="inset">${ZP.uiDrop.card(g)}${ZP.gear.works(g) ? '' : `<p class="hint warn">Сейчас не действует: в руках ${ZP.WEAPONS[ZP.hero.weapon].acc4}.</p>`}<div class="sell-row"><button class="gbtn" type="button" data-act="off">Снять</button></div></div>` : '<p class="hint">Слот пуст.</p>') +
      (list.length ? `<div class="fit-list"><b class="cmp-t">Из сумки</b>${list.map(([x, i]) => `<div class="fit-row"><img src="${ZP.uiDrop.icon(x)}" alt=""><span><i style="color:${ZP.QUALITY[x.q].color}">${x.name}</i><small>${ZP.STAT_ORDER.filter((k) => x.stats[k]).map((k) => ZP.STAT_NAMES[k] + ' +' + x.stats[k]).join(', ')}</small></span><button class="tbtn" type="button" data-wear="${i}">Надеть</button></div>`).join('')}</div>` : '<p class="hint">В сумке нет подходящих вещей.</p>');
  }
  C.init = () => {
    $('doll').addEventListener('click', (e) => { const b = e.target.closest('[data-slot]'); if (!b) return; C.sel = C.sel === b.dataset.slot ? null : b.dataset.slot; C.render(true); });
    $('doll-card').addEventListener('click', (e) => {
      const b = e.target.closest('[data-act],[data-wear]'); if (!b || !C.sel) return;
      if (b.dataset.act === 'off') ZP.gear.unequip(C.sel);
      else ZP.gear.equipFromBag(+b.dataset.wear, C.sel === 'left' ? 'left' : 'right');
      C.render(true);
    });
  };
  const row = (name, value, desc) => `<div class="srow"><b>${name}</b><span class="v">${value}</span>${desc ? `<small>${desc}</small>` : ''}</div>`;

  C.render = (force) => {
    const now = performance.now();
    if (!force && now - C.last < 800 && !$('win-char').hidden && C.last) return;
    C.last = now;
    const H = ZP.hero, p = ZP.pstats(), base = ZP.PLAYER_BASE, k = H.weapon, w = ZP.WEAPONS[k], s = ZP.save.data;
    ZP.sprites.drawPortrait($('char-portrait').getContext('2d'), 32, H, ZP.time.clock);
    renderDoll();
    ZP.sprites.drawPortrait($('doll-portrait').getContext('2d'), 32, H, ZP.time.clock);
    $('char-sub').textContent = `Оружие в руках: ${w.acc4}. Сейчас: ${H.dead ? 'погибла, ждёт воскрешения' : ZP.world.cur.name}.`;

    $('char-stats').innerHTML = ZP.STAT_ORDER.map((st) => row(ZP.STAT_NAMES[st], (st === 'hp' ? `${Math.max(0, Math.ceil(H.hp))} / ${p.hp}` : p[st]) + (p[st] > base[st] ? ` <em class="gplus">(+${p[st] - base[st]})</em>` : ''), ZP.STAT_DESC[st])).join('');

    const raw = ZP.stats.playerRaw(k);
    $('char-combat-title').textContent = 'В бою: ' + w.name.toLowerCase();
    $('char-combat').innerHTML =
      row('Урон за удар', `${Math.round(raw * 0.85)}–${Math.round(raw * 1.15)}`, `Атака ${p.atk} + оружие ${w.base} + ${ZP.STAT_NAMES[w.attr].toLowerCase()} ×${U.n1(w.attrK)}. Защита цели снижает урон.`) +
      row('Точность', U.accTxt(M.baseAcc(k)), 'Шанс попасть. Растёт с владением оружием и навыками точности. Цель ещё может увернуться.') +
      row('Атак в секунду', U.n1(M.attacksPerSec(k)), 'Зависит от оружия, владения, ловкости и навыков скорости.') +
      (w.type === 'melee' ? '' : row('Дальность', `${w.range[0]}–${w.range[1]}`, 'Дистанция стрельбы в пикселях мира.')) +
      row('Шанс уворота', U.accTxt(ZP.stats.dodgeChance(p)), 'Шанс избежать удара зверя (от уворота и ловкости).') +
      row('Снижение урона', Math.round((1 - ZP.stats.reduction(p)) * 100) + '%', 'Сколько урона поглощает защита.') +
      row('Скорость бега', Math.round(ZP.heroAI.speed()) + ' px/с', '');

    $('char-mastery').innerHTML = ZP.ORDER.map((wk) => {
      const sk = s.skills[wk], ww = ZP.WEAPONS[wk], on = wk === k, list = M.bonusList(wk), fp = M.freePts(wk);
      return `<div class="mcard${on ? ' on' : ''}">
        <div class="mcard-head">${ZP.ICONS[wk]}<b>${ww.name}</b>${on ? '<span class="tag">в руках</span>' : ''}<span class="pctv">${U.pctTxt(sk.m)}</span></div>
        <div class="pbar gold"><i style="width:${(sk.m / ZP.MAX) * 100}%"></i></div>
        <div class="mline"><span>Точность</span><span>${U.accTxt(M.baseAcc(wk))}</span></div>
        <div class="mline"><span>Урон / атак в сек.</span><span>${Math.round(ZP.stats.playerRaw(wk))} / ${U.n1(M.attacksPerSec(wk))}</span></div>
        <div class="mline"><span>Навыки</span><span>${sk.learned.length}/${ZP.SKILL_NODE_COUNT}${fp > 0 ? ` · свободно ${fp}` : ''}</span></div>
        <div class="mline"><span>Попаданий</span><span>${sk.hits} из ${sk.shots}</span></div>
        <ul class="bonus-list">${list.length ? list.map((b) => `<li>${b.key ? `<b>${b.label}</b>: ${b.desc}` : `${b.label} ${b.value}`}</li>`).join('') : '<li class="none">Бонусов от навыков пока нет</li>'}</ul>
      </div>`;
    }).join('');

    const byCat = ZP.CAT_ORDER.map((cat) => `${ZP.CATS[cat].name}: ${Object.keys(ZP.ENEMY_TYPES).filter((t) => ZP.ENEMY_TYPES[t].cat === cat).reduce((a, t) => a + (s.killsByType[t] || 0), 0)}`).join(' · ');
    $('char-record').innerHTML = row('Побеждено врагов', s.kills, byCat) + row('Коины', s.coins, `Всего заработано: ${s.coinsEarned || 0}`) + row('Самый сильный побеждённый', s.bestLevel ? 'ур. ' + s.bestLevel : '—', '') + row('Гибелей', s.deaths, '');
  };
})(window.ZP);
