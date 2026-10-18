// Установка на телефон (PWA): сервис-воркер для работы без интернета и кнопка «Установить».
(function (ZP) {
  let deferred = null;
  const P = (ZP.pwa = {});
  P.installed = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  P.canPrompt = () => !!deferred;
  P.prompt = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { const r = await deferred.userChoice; if (r.outcome === 'accepted') ZP.ui.log('Игра устанавливается на главный экран.', 'sys'); } catch (e) {}
    deferred = null;
  };
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; if (ZP.uiMenu) ZP.uiMenu.render(); });
  window.addEventListener('appinstalled', () => { deferred = null; if (ZP.ui) ZP.ui.log('Готово: Zero Point установлена как приложение.', 'gold'); });
  P.init = () => {
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
    }
  };
})(window.ZP);
