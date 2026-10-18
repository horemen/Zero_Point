// Окно «Меню», кнопки паузы и скорости, сброс прогресса.
(function (ZP) {
  const $ = (id) => document.getElementById(id);
  const Mn = (ZP.uiMenu = {});
  ZP.paused = false; ZP.speed = 1;

  Mn.setPause = (v) => { ZP.paused = v; $('pause').innerHTML = v ? ZP.ICONS.play : ZP.ICONS.pause; $('pause').setAttribute('aria-label', v ? 'Продолжить' : 'Пауза'); ZP.ui.dirty(); };
  Mn.setSpeed = (v) => { ZP.speed = v; $('speed').textContent = '×' + v; $('speed-row').querySelectorAll('[data-speed]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.speed === v)); };

  function drinkText() {
    const v = ZP.save.data.settings.drinkAt;
    $('drink-label').textContent = v > 0 ? `Пить, когда здоровье ≤ ${v}%` : 'Не пить зелья автоматически (0%)';
    $('drink-hint').textContent = `Героиня выпивает самое маленькое зелье, которого хватит на недостающее здоровье, а если такого нет — самое большое из имеющихся. Пьёт только на лугах, не чаще раза в 1,5 с. Сейчас в сумке зелий: ${ZP.potions.total()}.`;
  }
  Mn.render = () => {
    $('drink-at').value = ZP.save.data.settings.drinkAt; drinkText();
    const p = ZP.pwa;
    const btn = $('install-btn'), hint = $('install-hint');
    if (p.installed()) { btn.hidden = true; hint.textContent = 'Игра установлена на этом устройстве. Её можно запускать с главного экрана, прогресс общий.'; }
    else if (p.canPrompt()) { btn.hidden = false; hint.textContent = 'Игра появится на главном экране как отдельное приложение и будет запускаться без интернета.'; }
    else { btn.hidden = true; hint.textContent = 'В Chrome на Android: меню ⋮ → «Установить приложение» (или «Добавить на главный экран»). Кнопка установки появится здесь, когда браузер разрешит.'; }
    $('save-hint').textContent = ZP.save.available
      ? 'Прогресс сохраняется на этом устройстве автоматически: после побед, изучения навыков и при сворачивании игры.'
      : 'Браузер запретил сохранение (например, в режиме инкогнито). Прогресс пропадёт после закрытия страницы.';
  };

  Mn.init = () => {
    $('pause').addEventListener('click', () => Mn.setPause(!ZP.paused));
    $('drink-at').addEventListener('input', (e) => { ZP.save.data.settings.drinkAt = +e.target.value; drinkText(); });
    $('drink-at').addEventListener('change', () => ZP.save.write());
    $('speed').addEventListener('click', () => Mn.setSpeed(ZP.SPEEDS[(ZP.SPEEDS.indexOf(ZP.speed) + 1) % ZP.SPEEDS.length]));
    $('menu-btn').addEventListener('click', () => ZP.ui.open('win-menu'));
    $('speed-row').innerHTML = ZP.SPEEDS.map((v) => `<button class="ibtn ol" type="button" data-speed="${v}" aria-pressed="${v === 1}">×${v}</button>`).join('');
    $('speed-row').addEventListener('click', (e) => { const b = e.target.closest('[data-speed]'); if (b) Mn.setSpeed(+b.dataset.speed); });
    $('install-btn').addEventListener('click', () => ZP.pwa.prompt().then(() => Mn.render()));
    const touch = matchMedia('(pointer:coarse)').matches;
    $('controls-hint').textContent = touch
      ? 'Героиня охотится сама. Нажмите на оружие в нижней панели, чтобы сменить его. «Навыки» — паутина, «Герой» или портрет — окно персонажа. Нажатие на чат разворачивает его.'
      : 'Героиня охотится сама. Клавиши 1–4 меняют оружие, K — паутина навыков, C — персонаж, пробел — пауза, Esc закрывает окна.';
    // версия внизу меню: по нажатию — список изменений
    const vb = $('version-btn'), cl = $('changelog');
    vb.textContent = `Zero Point · версия ${ZP.VERSION} ▾`;
    cl.innerHTML = ZP.CHANGELOG.map((r) => `<div class="cl-ver"><b>${r.v}</b>${r.v === ZP.VERSION ? ' <span class="tag">текущая</span>' : ''}</div><ul class="bonus-list">${r.items.map((i) => `<li>${i}</li>`).join('')}</ul>`).join('');
    vb.addEventListener('click', () => { cl.hidden = !cl.hidden; vb.setAttribute('aria-expanded', !cl.hidden); vb.textContent = `Zero Point · версия ${ZP.VERSION} ${cl.hidden ? '▾' : '▴'}`; if (!cl.hidden) cl.scrollIntoView({ block: 'nearest' }); });
    const rb = $('reset'); let armT = null;
    rb.addEventListener('click', () => {
      if (rb.dataset.armed !== 'true') { rb.dataset.armed = 'true'; rb.textContent = 'Нажмите ещё раз для сброса'; clearTimeout(armT); armT = setTimeout(() => { rb.dataset.armed = 'false'; rb.textContent = 'Сбросить прогресс'; }, 3000); return; }
      clearTimeout(armT); rb.dataset.armed = 'false'; rb.textContent = 'Сбросить прогресс';
      ZP.save.wipe(); M_reset();
      ZP.ui.log('Прогресс сброшен: владение, навыки и счётчики обнулены.', 'gold');
    });
    function M_reset() { ZP.mastery.computeAll(); ZP.heroAI.selectWeapon('sword'); ZP.ui.dirty(); }
    Mn.setPause(false);
  };
})(window.ZP);
