export function initMobileHud(options: {
  stop: () => void;
  save: () => { ok: boolean } | null;
  hasProgress: () => boolean;
  resetInput: () => void;
  dismissMenus: () => void;
}): void {
  const body = document.body;
  const media = window.matchMedia('(any-pointer: coarse)');
  let observedTouch = false;
  const setPanel = (panel: 'bag' | 'chat', open: boolean) => {
    body.classList.toggle(`touch-${panel}-open`, open);
    document.getElementById(`mobile-${panel}`)?.setAttribute('aria-expanded', String(open));
  };
  const sync = () => {
    body.classList.toggle('touch-ui', media.matches || observedTouch);
    document.documentElement.style.setProperty('--touch-viewport-height', `${window.visualViewport?.height || window.innerHeight}px`);
  };
  sync();
  const services = ['bank-interface', 'shop-interface'].map(id => document.getElementById(id)).filter((element): element is HTMLElement => !!element);
  const syncService = () => body.classList.toggle('touch-service-open', services.some(element => !element.classList.contains('hidden')));
  const observer = new MutationObserver(syncService);
  services.forEach(element => observer.observe(element, { attributes: true, attributeFilter: ['class'] }));
  syncService();
  media.addEventListener('change', sync);
  window.addEventListener('resize', sync);
  window.visualViewport?.addEventListener('resize', sync);
  // Some hybrid browsers under-report capability. Keep controls available once
  // touch is actually used, including after switching back to mouse/keyboard.
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || observedTouch) return;
    observedTouch = true;
    sync();
  }, true);
  document.addEventListener('game-open-chat', () => {
    if (!body.classList.contains('touch-ui')) return;
    setPanel('chat', true);
    setPanel('bag', false);
  });
  for (const panel of ['bag', 'chat'] as const) {
    document.getElementById(`mobile-${panel}`)?.addEventListener('click', () => {
      const open = !body.classList.contains(`touch-${panel}-open`);
      setPanel(panel, open);
      setPanel(panel === 'bag' ? 'chat' : 'bag', false);
    });
    document.getElementById(`mobile-${panel}-close`)?.addEventListener('click', () => setPanel(panel, false));
  }
  document.getElementById('mobile-stop')?.addEventListener('click', options.stop);
  document.addEventListener('pointerdown', event => {
    if (event.button === 0 && !(event.target as Element).closest('#context-menu, .context-submenu, #amount-modal')) options.dismissMenus();
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-game-exit]').forEach(link => {
    link.addEventListener('click', event => {
      if (!options.hasProgress()) return;
      options.stop();
      const result = options.save();
      if (!result?.ok) {
        event.preventDefault();
        const status = document.getElementById('mobile-save-status');
        if (status) { status.textContent = 'Could not save. Stay here and try Home again.'; status.classList.remove('hidden'); }
      }
    });
  });
  const release = () => { options.resetInput(); };
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    release();
    if (options.hasProgress()) { options.stop(); options.save(); }
  });
  window.addEventListener('resize', () => {
    options.resetInput();
    document.getElementById('context-menu')?.classList.add('hidden');
  });
  // Real keyboard users can still dismiss the touch drawers.
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    setPanel('bag', false); setPanel('chat', false);
  });
}
