// Окно воскрешения: открывается само при гибели героини. Здесь можно выбрать зелья для автозакупки.
// Воскрешение — по кнопке или через 8 секунд; если игрок меняет зелья, таймер ждёт кнопку.
// Если в момент гибели открыто любое другое окно, окно воскрешения не показывается — таймер идёт сам.
(function (ZP) {
  const $ = (id) => document.getElementById(id);
  const Dw = (ZP.uiDeath = { openAt: 0, deadAt: 0, hold: false, killer: null });

  Dw.render = () => {
    $('death-autobuy').innerHTML = ZP.uiBag.autobuyHTML();
    const cost = ZP.potions.setCost(), coins = ZP.save.data.coins;
    $('death-cost').textContent = cost ? `Нужно ${cost} коин., у вас ${coins}.` + (cost > coins ? ' Хватит не на всё.' : '') : `Набор собран или не выбран. Коинов: ${coins}.`;
  };
  Dw.open = (killer) => {
    Dw.killer = killer;
    $('death-sub').textContent = killer ? `Её одолел враг: ${killer.name}, ур. ${killer.L}. После воскрешения она выберет другую цель.` : '';
    Dw.render();
    $('win-death').hidden = false;
  };
  Dw.close = () => { $('win-death').hidden = true; };
  Dw.revive = () => { if (!ZP.hero.dead) return; Dw.close(); ZP.world.respawnHero(); };
  // вызывается каждый кадр
  Dw.tick = (now) => {
    const H = ZP.hero, el = $('win-death');
    if (!H.dead) { Dw.deadAt = 0; Dw.hold = false; if (!el.hidden) Dw.close(); return; }
    if (!Dw.deadAt) Dw.deadAt = now;
    // открыто другое окно (сумка, меню, навыки…) — окно воскрешения не показываем
    const busy = ZP.ui.anyOpen();
    if (busy && !el.hidden) Dw.close();
    if (!busy && el.hidden && H.deathT > 0.6) Dw.open(Dw.killer);
    if (Dw.hold && !el.hidden) { $('death-timer').textContent = 'Таймер остановлен — нажмите «Воскреснуть», когда будете готовы.'; return; }
    if (Dw.hold) return;
    const left = ZP.RESPAWN_TIME - (now - Dw.deadAt) / 1000;
    if (left <= 0) { Dw.revive(); return; }
    if (!el.hidden) $('death-timer').textContent = `Воскрешение через ${Math.ceil(left)} с. Измените набор — и таймер подождёт.`;
  };
  Dw.init = () => {
    $('death-autobuy').addEventListener('click', (e) => {
      const b = e.target.closest('[data-ab]'); if (!b) return;
      Dw.hold = true; ZP.uiBag.stepAutobuy(b); Dw.render();
    });
    $('revive-btn').addEventListener('click', Dw.revive);
  };
})(window.ZP);
