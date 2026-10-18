// Запуск игры и главный цикл.
(function (ZP) {
  const $ = (id) => document.getElementById(id);

  function init() {
    ZP.save.load();
    ZP.mastery.computeAll();
    ZP.world.init();
    ZP.heroAI.init();
    ZP.gear.init();
    ZP.enemies.init();
    ZP.ui.init();
    ZP.uiSkills.init();
    ZP.uiBag.init();
    ZP.uiChar.init();
    ZP.uiEnemies.init();
    ZP.uiDeath.init();
    ZP.uiDrop.init();
    ZP.uiMenu.init();
    ZP.pwa.init();
    ZP.render.layout();
    ZP.render.snapCamera();
    ZP.potions.autoBuy(true);
    ZP.ui.render();
    const s = ZP.save.data;
    ZP.ui.log(s.kills || s.deaths ? `С возвращением! ${ZP.HERO_NAME} снова в деревне. Побед: ${s.kills}.` : `${ZP.HERO_NAME} выходит из деревни на охоту в Звериные луга.`, 'sys');

    new ResizeObserver(() => ZP.render.layout()).observe($('game'));
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('700 12px Comfortaa'), document.fonts.load('600 10px Comfortaa')]).then(() => ZP.render.layout()).catch(() => {});

    // клавиатура
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { ['win-skills', 'win-char', 'win-menu', 'win-bag', 'win-enemies'].forEach((w) => ZP.ui.close(w)); return; }
      if (e.target.closest && e.target.closest('button,.node,[role="button"]') && (e.key === ' ' || e.key === 'Enter')) return;
      const i = ['1', '2', '3', '4'].indexOf(e.key);
      if (i >= 0) { ZP.heroAI.selectWeapon(ZP.ORDER[i]); ZP.ui.dirty(); }
      const key = e.key.toLowerCase();
      if (key === 'k' || key === 'л') ZP.ui.toggle('win-skills');
      if (key === 'c' || key === 'с') ZP.ui.toggle('win-char');
      if (key === 'm' || key === 'ь') ZP.ui.toggle('win-enemies');
      if (key === 'tab') { e.preventDefault(); ZP.heroAI.switchTarget(); }
      if (key === 'i' || key === 'ш' || key === 'b' || key === 'и') ZP.ui.toggle('win-bag');
      if (e.key === ' ') { e.preventDefault(); ZP.uiMenu.setPause(!ZP.paused); }
    });

    // сохранение: периодически и при сворачивании
    setInterval(() => ZP.save.write(), 5000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) ZP.save.write(); else { last = performance.now(); keepAwake(); } });
    window.addEventListener('pagehide', () => ZP.save.write());
    window.addEventListener('pointerdown', keepAwake);

    requestAnimationFrame(frame);
  }

  // экран не гаснет во время игры
  let wakeLock = null;
  async function keepAwake() { try { if ('wakeLock' in navigator && !wakeLock && !document.hidden) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) {} }

  function step(dt) {
    ZP.time.clock += dt;
    ZP.world.update(dt);
    ZP.heroAI.updateTimers(dt);
    ZP.heroAI.update(dt);
    ZP.enemies.update(dt);
    ZP.combat.update(dt);
    ZP.inventory.update(dt);
    ZP.potions.update(dt);
    ZP.fx.update(dt);
    const d = ZP.world.dummy(); if (d && d.shake > 0) d.shake = Math.max(0, d.shake - dt);
  }

  let last = performance.now(), lastSlow = 0;
  function frame(now) {
    const raw = Math.min(0.05, (now - last) / 1000); last = now;
    if (!ZP.paused) for (let i = 0; i < ZP.speed; i++) step(raw);
    ZP.render.updateCamera(raw);
    ZP.render.draw();
    ZP.ui.renderFast();
    ZP.uiDeath.tick(now);
    ZP.uiDrop.tick(now);
    if (now - lastSlow > 150) {
      lastSlow = now;
      ZP.render.drawMinimap($('minimap'));
      ZP.sprites.drawPortrait($('portrait').getContext('2d'), 32, ZP.hero, ZP.time.clock);
      ZP.ui.render();
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window.ZP);
