(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const stage = byId('stage');
  const toolbar = byId('toolbar');
  const scenes = byId('sceneTabs');
  const controls = document.createElement('div');
  const workspace = document.createElement('div');
  const status = document.createElement('footer');
  controls.className = 'desktop-wave-tools';
  workspace.className = 'desktop-wave-workspace';
  status.className = 'desktop-wave-status';

  scenes.parentElement.append(scenes);
  stage.before(workspace);
  workspace.append(controls, stage, status);
  controls.append(toolbar, byId('hint'));
  status.append(byId('chips'));

  const foot = document.querySelector('.foot-note');
  foot.removeAttribute('data-i18n');
  const language = byId('btnLang');
  const lang = () => document.documentElement.lang.startsWith('zh');

  function syncLabels() {
    foot.textContent = lang() ? 'FDTD · WebGL2 · 本地模拟' : 'FDTD · WebGL2 · Local simulation';
    const text = language.textContent.replace('🌐', '').trim();
    if (text !== language.textContent) language.textContent = text;
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', lang() ? '波场工具' : 'Wave field tools');
    status.setAttribute('aria-label', lang() ? '波场读数' : 'Wave field readings');
  }

  function labelSliders(root) {
    for (const input of root.querySelectorAll('.ctl input[type="range"]')) {
      const row = input.closest('.ctl');
      const label = row.querySelector('.lab')?.textContent.trim();
      if (label) input.setAttribute('aria-label', label);
    }
  }

  function syncPressed(root, selector) {
    for (const button of root.querySelectorAll(selector)) {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    }
  }

  const panel = document.querySelector('.panel');
  new MutationObserver(syncLabels).observe(language, { childList: true });
  new MutationObserver(() => {
    syncLabels();
    labelSliders(panel);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  new MutationObserver(() => syncPressed(scenes, '.scene-tab')).observe(scenes, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['class'],
  });
  new MutationObserver(() => syncPressed(toolbar, '.tool-btn')).observe(toolbar, {
    subtree: true, attributes: true, attributeFilter: ['class'],
  });
  new MutationObserver(() => syncPressed(panel, '.seg button')).observe(panel, {
    subtree: true, attributes: true, attributeFilter: ['class'],
  });
  const sources = byId('srcList');
  new MutationObserver(() => labelSliders(sources)).observe(sources, { childList: true });
  syncLabels();
  labelSliders(panel);
  syncPressed(toolbar, '.tool-btn');
  syncPressed(panel, '.seg button');
})();
