// Окно «Паутина навыков»: отдельная паутина для каждого оружия.
(function (ZP) {
  const U = ZP.util, M = ZP.mastery;
  const $ = (id) => document.getElementById(id);
  const S = (ZP.uiSkills = { tab: 'sword', sel: null });
  const RADII = [64, 114, 162, 208];
  const ang = (s) => ((-90 + s * 60) * Math.PI) / 180, pos = (s, r) => ({ x: Math.cos(ang(s)) * r, y: Math.sin(ang(s)) * r }), f1 = (n) => Math.round(n * 10) / 10;
  function sag(p, q, r, k) {
    const ma = (Math.atan2(p.y, p.x) + Math.atan2(q.y, q.x)) / 2 + (Math.abs(Math.atan2(p.y, p.x) - Math.atan2(q.y, q.x)) > Math.PI ? Math.PI : 0);
    const c = { x: Math.cos(ma) * r * k, y: Math.sin(ma) * r * k };
    return `M${f1(p.x)} ${f1(p.y)}Q${f1(c.x)} ${f1(c.y)} ${f1(q.x)} ${f1(q.y)}`;
  }
  const IC = {
    acc: '<circle class="ic" r="5"/><circle class="ic fill" r="1.7"/>',
    spd: '<path class="ic" d="M-5 -4L-1 0L-5 4M1 -4L5 0L1 4"/>',
    dbl: '<path class="ic" d="M-5 4L-1 -4M1 4L5 -4"/>',
    move: '<path class="ic" d="M-5 0H4M1 -3.5L4.5 0L1 3.5"/>',
    focus: '<path class="ic" d="M0 -5L5 0L0 5L-5 0Z"/>',
    key: '<path class="ic fill" d="M0 -7L2 -2.2L7 -2.2L3 1L4.4 6L0 3.1L-4.4 6L-3 1L-7 -2.2L-2 -2.2Z"/>',
  };

  S.open = () => { S.tab = ZP.hero.weapon; S.sel = null; S.render(); };
  S.render = () => {
    const k = S.tab, sk = ZP.save.data.skills[k];
    $('tabs').innerHTML = ZP.ORDER.map((w) => { const fp = M.freePts(w); return `<button class="tab" role="tab" type="button" data-k="${w}" aria-selected="${w === k}">${ZP.WEAPONS[w].name}${fp > 0 ? `<b>${fp}</b>` : ''}</button>`; }).join('');
    $('pts-line').innerHTML = `<span>Владение: <b>${U.pctTxt(sk.m)}</b></span><span>Свободных очков: <b>${M.freePts(k)}</b></span><span>Изучено: <b>${sk.learned.length}/${ZP.SKILL_NODE_COUNT}</b></span><span>${sk.m >= ZP.MAX ? 'Все 20 очков получены' : 'Следующее очко при <b>' + U.pctTxt((M.earned(k) + 1) * ZP.STEP) + '</b>'}</span>`;
    let g = '';
    for (const rr of [38, 89, 138, 186, 232]) for (let s = 0; s < 6; s++) g += `<path class="thread faint" d="${sag(pos(s, rr), pos((s + 1) % 6, rr), rr, 0.86)}"/>`;
    for (let s = 0; s < 6; s++) { const e = pos(s, 240); g += `<path class="thread" d="M0 0L${f1(e.x)} ${f1(e.y)}"/>`; }
    for (const rr of RADII) for (let s = 0; s < 6; s++) g += `<path class="thread" d="${sag(pos(s, rr), pos((s + 1) % 6, rr), rr, 0.86)}"/>`;
    for (let s = 0; s < 6; s++) for (let r = 1; r <= 4; r++) {
      const id = s + '-' + r; if (!M.isLearned(k, id)) continue;
      const p = pos(s, RADII[r - 1]), inner = r === 1 ? { x: 0, y: 0 } : M.isLearned(k, s + '-' + (r - 1)) ? pos(s, RADII[r - 2]) : null;
      if (inner) g += `<path class="lit" d="M${f1(inner.x)} ${f1(inner.y)}L${f1(p.x)} ${f1(p.y)}"/>`;
      if (M.isLearned(k, ((s + 1) % 6) + '-' + r)) g += `<path class="lit" d="${sag(p, pos((s + 1) % 6, RADII[r - 1]), RADII[r - 1], 0.86)}"/>`;
    }
    g += `<g class="core"><circle r="20"/>${ZP.ICONS[k].replace('<svg ', '<svg x="-13" y="-13" width="26" height="26" ')}</g>`;
    for (const n of Object.values(ZP.SKILL_NODES[k])) {
      const p = pos(n.s, RADII[n.r - 1]), st = M.nodeState(k, n);
      const shape = n.key ? '<path class="b" d="M0 -17L15 -8.5L15 8.5L0 17L-15 8.5L-15 -8.5Z"/>' : `<circle class="b" r="${n.r === 4 ? 15 : 12.5}"/>`;
      const sel = S.sel === n.id ? (n.key ? '<path class="sel" d="M0 -23L20 -11.5L20 11.5L0 23L-20 11.5L-20 -11.5Z"/>' : `<circle class="sel" r="${n.r === 4 ? 21 : 18}"/>`) : '';
      g += `<g class="node ${st}" data-id="${n.id}" tabindex="0" role="button" aria-label="${n.name}" transform="translate(${f1(p.x)} ${f1(p.y)})"><circle class="hit" r="24"/>${sel}${shape}${IC[n.key ? 'key' : n.stat]}<title>${n.name}</title></g>`;
    }
    $('web').innerHTML = g;
    // карточка узла
    const card = $('node-card');
    if (!S.sel) {
      card.innerHTML = '<span class="kind">Как это работает</span><h3 class="ol">Выберите узел паутины</h3><div class="eff">Начинайте с ближнего к центру кольца. Новый узел можно изучить, если он соседствует с изученным: по нити к центру или по кругу.</div><div class="state">Узел стоит 1 очко. За 100% владения выдаётся 20 очков, а узлов 24, поэтому всю паутину не закрыть.</div>';
    } else {
      const n = ZP.SKILL_NODES[k][S.sel], st = M.nodeState(k, n);
      const stTxt = { learned: 'Изучено.', avail: 'Можно изучить за 1 очко.', reach: `Нет свободных очков. Следующее при владении ${U.pctTxt((M.earned(k) + 1) * ZP.STEP)}.`, locked: 'Сначала изучите соседний узел ближе к центру или рядом по кругу.' }[st];
      card.innerHTML = `<span class="kind">${n.key ? 'Ключевой навык' : 'Навык · кольцо ' + n.r}</span><h3 class="ol">${n.name}</h3><div class="eff">${M.effectText(k, n)}</div><div class="state">${stTxt}</div><button class="gbtn" type="button" id="learn" ${st === 'avail' ? '' : 'disabled'}>Изучить</button>`;
      $('learn').addEventListener('click', () => { if (M.learn(k, n.id)) { S.render(); ZP.ui.dirty(); } });
    }
    // итог бонусов
    const list = M.bonusList(k);
    $('totals').innerHTML = `<h4>Бонусы: ${ZP.WEAPONS[k].acc4}</h4><div><span>Точность от владения</span><span>${U.accTxt(M.masteryAcc(k))}</span></div><div><span>Итоговая точность</span><span>${U.accTxt(M.baseAcc(k))}</span></div>` +
      (list.length ? list.map((b) => `<div><span>${b.label}</span><span>${b.value}</span></div>`).join('') : '<div><span>Навыки пока не изучены</span><span>—</span></div>');
  };

  S.init = () => {
    const web = $('web');
    const focusSel = () => { const el = web.querySelector(`[data-id="${S.sel}"]`); if (el) el.focus({ preventScroll: true }); };
    web.addEventListener('click', (e) => { const g = e.target.closest('.node'); if (!g) return; S.sel = g.dataset.id; S.render(); focusSel(); });
    web.addEventListener('dblclick', (e) => { const g = e.target.closest('.node'); if (g && M.learn(S.tab, g.dataset.id)) { S.render(); ZP.ui.dirty(); } });
    web.addEventListener('keydown', (e) => {
      const g = e.target.closest('.node'); if (!g || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault(); e.stopPropagation();
      if (S.sel === g.dataset.id) { if (M.learn(S.tab, S.sel)) { S.render(); ZP.ui.dirty(); } } else { S.sel = g.dataset.id; S.render(); focusSel(); }
    });
    $('tabs').addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (!t) return; S.tab = t.dataset.k; S.sel = null; S.render(); });
    $('web-legend').innerHTML = [['acc', 'Точность'], ['spd', 'Скорость атаки'], ['dbl', 'Повтор'], ['move', 'Бег'], ['focus', 'Атаки с позиции'], ['key', 'Ключевой']]
      .map(([k, l]) => `<span><svg viewBox="-9 -9 18 18" style="color:var(--muted)">${IC[k].replaceAll('class="ic fill"', 'fill="currentColor"').replaceAll('class="ic"', 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"')}</svg>${l}</span>`).join('');
  };
})(window.ZP);
