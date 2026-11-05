/* ============================================================
 * WaveLab — UI 交互层
 * 工具状态机、指针交互、波源卡片、场景加载、测量工具、HUD
 * ============================================================ */
(function () {
  'use strict';
  const WL = (window.WL = window.WL || {});
  const t = WL.t;                 // i18n 取词快捷方式(i18n.js 先于本文件加载)
  const i18n = WL.i18n;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  /* 波源识别色:遵守「暗房」色域 — 琥珀/银白/冷暖中性,按明度与色相族拉开,不与波场数据色(青-琥珀)争抢 */
  const SRC_COLORS = [
    [1.00, 0.69, 0.33], [0.49, 0.83, 0.99], [0.91, 0.91, 0.89], [0.37, 0.91, 0.83],
    [0.99, 0.90, 0.54], [0.72, 0.76, 0.82], [0.98, 0.57, 0.24], [1.00, 0.65, 0.65],
  ];
  const SRC_COLORS_HEX = ['#ffb054', '#7dd3fc', '#e8e8e3', '#5ee8d4', '#fde68a', '#b8c2d1', '#fb923c', '#ffa6a6'];

  const ICON_EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const ICON_EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 16M9.9 5.9A9.9 9.9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.4 17.4 0 0 1-3.2 3.8M6.1 8.3A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.7 9.7 0 0 0 3.4-.6"/></svg>';
  const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z"/></svg>';
  const ICON_RESET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 2.6-6.3"/><path d="M3 4v5h5"/></svg>';
  const ICON_CAMERA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5h3l1.6-2.4a1 1 0 0 1 .84-.6h5.12a1 1 0 0 1 .84.6L17 8.5h3a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.2"/></svg>';
  const ICON_STEP = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 5 5.5Z"/><rect x="18.2" y="5" width="2.3" height="14" rx="1"/></svg>';

  /* 提示文案 key,经 i18n 按当前语言取词 */
  const HINTS = {
    source: 'hint.source',
    pulse: 'hint.pulse',
    wall: 'hint.wall',
    erase: 'hint.erase',
    probe: 'hint.probe',
  };

  const state = {
    tool: 'source',
    brush: 8,
    newFreq: 5,
    newAmp: 0.5,
    paused: false,
    selected: -1,
    scene: 'slit2',
    speed: 1,
    wallMat: 0,
  };

  let sim = null;
  let drag = null;
  let fpsEma = 60;
  let hudAcc = 1;

  const el = {};
  const handles = {};

  /* 探针采样缓冲:同时记录模拟时间戳,频率估计与帧率解耦
   * 时间戳用 Float64:长时间运行(数小时)后 Float32 的相对误差会污染过零测频 */
  const PROBE_N = 512;
  const probeBuf = new Float32Array(PROBE_N);
  const probeTime = new Float64Array(PROBE_N);
  let probeHead = 0, probeCount = 0;
  const probePixel = new Float32Array(4);
  let probePeak = 0.3;

  /* 观察屏回读缓冲 */
  let screenBuf = null;
  let screenPeak = 0.2;
  let frameNo = 0;

  /* ---------------- 基础组件 ---------------- */

  function toast(msg, ms = 2600) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    el.toastWrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 350);
    }, ms);
  }

  function toGrid(e) {
    const r = el.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * sim.w,
      y: ((e.clientY - r.top) / r.height) * sim.h,
    };
  }

  function bindRange(sel, set, fmt) {
    const r = $(sel);
    const vEl = r.closest('.ctl').querySelector('.val');
    const upd = () => {
      const p = ((r.value - r.min) / (r.max - r.min)) * 100;
      r.style.setProperty('--fill', p + '%');
      if (vEl) vEl.textContent = fmt(+r.value);
    };
    r.addEventListener('input', () => { set(+r.value); upd(); });
    upd();
    return {
      sync(val) { r.value = val; upd(); },
      get: () => +r.value,
    };
  }

  /* ---------------- 波源管理 ---------------- */

  function addSource(g, opts = {}) {
    const idx = sim.sources.length % SRC_COLORS.length;
    const s = {
      nx: g.x / sim.w,
      ny: g.y / sim.h,
      freq: opts.freq != null ? opts.freq : state.newFreq,
      amp: opts.amp != null ? opts.amp : state.newAmp,
      type: opts.type != null ? opts.type : 0,
      phase0: opts.phase0 || 0,
      motion: opts.motion || null,
      on: true,
      sel: false,
      phase: 0,
      color: SRC_COLORS[idx],
      colorHex: SRC_COLORS_HEX[idx],
    };
    sim.sources.push(s);
    return s;
  }

  function select(i) {
    state.selected = i;
    sim.sources.forEach((s, k) => { s.sel = k === i; });
    const cards = el.srcList.querySelectorAll('.src-card');
    cards.forEach((c, k) => c.classList.toggle('sel', k === i));
  }

  function pickSource(g) {
    let best = -1, bd = 15;
    sim.sources.forEach((s, i) => {
      const dx = g.x - s.nx * sim.w;
      const dy = g.y - s.ny * sim.h;
      const d = s.type === 0 ? Math.hypot(dx, dy) : Math.abs(dx);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  function refreshCards() {
    const list = el.srcList;
    list.innerHTML = '';
    if (!sim.sources.length) {
      const d = document.createElement('div');
      d.className = 'src-empty';
      d.textContent = t('src.empty');
      list.appendChild(d);
      return;
    }
    sim.sources.forEach((s, i) => {
      const card = document.createElement('div');
      card.className = 'src-card' + (s.sel ? ' sel' : '') + (s.on ? '' : ' off');
      const phaseDeg = Math.round(((s.phase0 || 0) + Math.PI * 8) % (Math.PI * 2) * 180 / Math.PI);
      card.innerHTML = `
        <div class="src-head">
          <span class="src-dot" style="background:${s.colorHex};color:${s.colorHex}"></span>
          <span class="src-name">${t('src.card_name', { n: i + 1 })}</span>
          ${s.type === 1 ? `<span class="src-tag">${t('src.tag_plane')}</span>` : ''}
          ${s.motion ? `<span class="src-tag">${t('src.tag_moving')}</span>` : ''}
          <button class="mini-btn mute" title="${s.on ? t('src.mute') : t('src.unmute')}">${s.on ? ICON_EYE : ICON_EYE_OFF}</button>
          <button class="mini-btn del" title="${t('src.del')}">${ICON_X}</button>
        </div>
        <div class="ctl"><span class="lab">${t('src.freq')}</span>
          <input type="range" class="f" min="0.5" max="8" step="0.1" value="${s.freq}">
          <span class="val">${s.freq.toFixed(1)} Hz</span></div>
        <div class="ctl"><span class="lab">${t('src.amp')}</span>
          <input type="range" class="a" min="0.1" max="1.5" step="0.05" value="${s.amp}">
          <span class="val">${s.amp.toFixed(2)}</span></div>
        <div class="ctl"><span class="lab">${t('src.phase')}</span>
          <input type="range" class="p" min="0" max="360" step="5" value="${phaseDeg}">
          <span class="val">${phaseDeg}°</span></div>`;
      const fill = (inp, pct) => inp.style.setProperty('--fill', pct + '%');
      const fr = card.querySelector('.f'), frv = card.querySelector('.ctl .val');
      fr.addEventListener('input', () => {
        s.freq = +fr.value;
        frv.textContent = s.freq.toFixed(1) + ' Hz';
        fill(fr, ((fr.value - fr.min) / (fr.max - fr.min)) * 100);
      });
      fill(fr, ((s.freq - 0.5) / 7.5) * 100);
      const ar = card.querySelector('.a'), arv = card.querySelectorAll('.ctl .val')[1];
      ar.addEventListener('input', () => {
        s.amp = +ar.value;
        arv.textContent = s.amp.toFixed(2);
        fill(ar, ((ar.value - ar.min) / (ar.max - ar.min)) * 100);
      });
      fill(ar, ((s.amp - 0.1) / 1.4) * 100);
      const pr = card.querySelector('.p'), prv = card.querySelectorAll('.ctl .val')[2];
      pr.addEventListener('input', () => {
        s.phase0 = (+pr.value) * Math.PI / 180;
        prv.textContent = pr.value + '°';
        fill(pr, ((pr.value - pr.min) / (pr.max - pr.min)) * 100);
      });
      fill(pr, (phaseDeg / 360) * 100);
      list.appendChild(card);
    });
  }

  /* ---------------- 探针与示波器 ---------------- */

  function setProbe(nx, ny) {
    sim.probe = { nx, ny };
    el.scopePanel.hidden = false;
    syncOverlaySize();
  }

  function clearProbe() {
    sim.probe = null;
    probeCount = 0; probeHead = 0; probePeak = 0.3;
    el.scopePanel.hidden = true;
  }

  function sampleProbe(force) {
    if (!sim.probe) return;
    if (state.paused && !force) return; // 单步推进时以 force 采样,保持示波器连续
    sim.readProbe(probePixel);
    const u = probePixel[0];
    probeBuf[probeHead] = u;
    probeTime[probeHead] = sim.t;
    probeHead = (probeHead + 1) % PROBE_N;
    if (probeCount < PROBE_N) probeCount++;
  }

  function drawScope() {
    if (!sim.probe) return;
    const cv = el.scopeCanvas, ctx = el.scopeCtx;
    const w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    // 基线
    ctx.fillStyle = 'rgba(154,160,168,0.25)';
    ctx.fillRect(0, h / 2 - 0.5, w, 1);
    const n = Math.min(probeCount, 360);
    if (n < 2) return;
    // 自适应幅度
    let mx = 0.05, mean = 0;
    for (let k = 0; k < n; k++) {
      const v = probeBuf[(probeHead - 1 - k + PROBE_N * 2) % PROBE_N];
      mx = Math.max(mx, Math.abs(v)); mean += v;
    }
    mean /= n;
    probePeak += (mx - probePeak) * 0.05;
    const scale = (h / 2 - 6) / probePeak;
    // 波形
    ctx.beginPath();
    for (let k = n - 1; k >= 0; k--) {
      const v = probeBuf[(probeHead - 1 - k + PROBE_N * 2) % PROBE_N];
      const x = (1 - k / (n - 1)) * w;
      const y = h / 2 - (v - mean) * scale;
      k === n - 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#e9e7e2';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // 实测频率:按模拟时间戳取 ≥2 模拟秒窗口,过零计数/2 ÷ 时长(与帧率无关)
    let win = 1, tEnd = 0, tStart = 0;
    for (win = 1; win < n; win++) {
      const idx = (probeHead - 1 - win + PROBE_N * 2) % PROBE_N;
      tEnd = probeTime[(probeHead - 1 + PROBE_N) % PROBE_N];
      tStart = probeTime[idx];
      if (tEnd - tStart >= 2.0) break;
    }
    let cross = 0;
    let prev = probeBuf[(probeHead - 1 + PROBE_N) % PROBE_N] - mean;
    for (let k = 1; k < win; k++) {
      const v = probeBuf[(probeHead - 1 - k + PROBE_N * 2) % PROBE_N] - mean;
      if ((prev < 0 && v >= 0) || (prev >= 0 && v < 0)) cross++;
      prev = v;
    }
    const span = Math.max(0.2, tEnd - tStart);
    const fMeas = cross / 2 / span;
    const cur = probeBuf[(probeHead - 1 + PROBE_N) % PROBE_N];
    el.scopeRead.textContent = `u = ${(cur >= 0 ? '+' : '')}${cur.toFixed(3)} · ${t('scope.fmeas')} ≈ ${fMeas.toFixed(2)} Hz`;
  }

  /* ---------------- 观察屏 ---------------- */

  function syncScreenControls() {
    const on = sim.screen.on;
    el.btnScreen.setAttribute('aria-pressed', on ? 'true' : 'false');
    el.btnScreen.textContent = on ? t('screen.on') : t('screen.off');
    el.screenX.disabled = !on;
    el.screenX.closest('.ctl').style.opacity = on ? '1' : '0.4';
  }

  function ensureScreenBuf() {
    if (!screenBuf || screenBuf.length !== sim.h * 2) screenBuf = new Float32Array(sim.h * 2);
  }

  /* 观察屏几何复用缓冲:避免每 2 帧分配 3 个 JS 数组 + 3 个 Float32Array 的 GC 压力 */
  const ovlGeom = { dash: null, dashN: 0, curve: null, curveN: 0, fill: null, fillN: 0 };
  let ovlCapH = 0;
  function ensureOverlayBufs(h) {
    if (ovlCapH === h) return;
    ovlGeom.dash = new Float32Array((Math.ceil(h / 7) + 2) * 4);   // 每段 2 顶点 × 2 分量
    const pts = Math.ceil(h / 2) + 4;
    ovlGeom.curve = new Float32Array(pts * 2);
    ovlGeom.fill = new Float32Array((pts + 2) * 2 * 2);            // 基线/曲线交错 + 收底
    ovlCapH = h;
  }

  function updateScreenOverlay() {
    const on = sim.screen.on;
    el.screenLabel.hidden = !on;
    if (!on) { sim.setOverlayGeometry(null); return; }
    const cssW = el.canvas.clientWidth || sim.w;
    const sx = sim.screen.nx * cssW;
    const dir = sx > cssW - 150 ? -1 : 1;
    const room = dir === 1 ? Math.min(120, cssW - sx - 12) : Math.min(120, sx - 12);

    ensureScreenBuf();
    sim.readScreenProfile(screenBuf);
    const h = sim.h;
    let mx = 0.02;
    for (let i = 0; i < h; i++) mx = Math.max(mx, screenBuf[h + i]);
    screenPeak += (mx - screenPeak) * 0.04;

    ensureOverlayBufs(h);

    // 格坐标(y 向下):虚线屏线 LINES 顶点对(4 格实 + 3 格空)
    const gx = (sx / cssW) * sim.w;
    let di = 0;
    for (let y = 0; y < h - 4; y += 7) {
      ovlGeom.dash[di++] = gx;
      ovlGeom.dash[di++] = y;
      ovlGeom.dash[di++] = gx;
      ovlGeom.dash[di++] = Math.min(y + 4, h);
    }
    ovlGeom.dashN = di;

    // 曲线 + 曲线下柔和填充:基线(屏线旁 2 格)与曲线按同一 y 交错成 TRIANGLE_STRIP,
    // 修复旧实现基线只有首尾两点导致条带三角几乎全部退化、填充不可见的问题
    const baseX = gx + 2 * dir;
    let ci = 0, fi = 0, lastX = gx;
    for (let i = 0; i < h; i += 2) {
      const I = screenBuf[h + i];
      const len = (I / screenPeak) * (room / cssW) * sim.w;
      const cx = gx + dir * (2 + len);
      ovlGeom.curve[ci++] = cx; ovlGeom.curve[ci++] = i;
      ovlGeom.fill[fi++] = baseX; ovlGeom.fill[fi++] = i;
      ovlGeom.fill[fi++] = cx; ovlGeom.fill[fi++] = i;
      lastX = cx;
    }
    ovlGeom.curveN = ci;
    ovlGeom.fill[fi++] = baseX; ovlGeom.fill[fi++] = h; // 收拢到底边,闭合填充区域
    ovlGeom.fill[fi++] = lastX; ovlGeom.fill[fi++] = h;
    ovlGeom.fillN = fi;
    sim.setOverlayGeometry(ovlGeom);

    // DOM 标签(琥珀,12px)
    const lw = 106;
    el.screenLabel.style.left = Math.max(4, Math.min(cssW - lw - 4,
      dir === 1 ? sx + 8 : sx - 8 - lw)) + 'px';
    el.screenLabel.style.top = '10px';
  }

  function syncOverlaySize() {
    updateScreenOverlay(); // 画布尺寸/位置变化后立即同步几何与标签
  }

  /* ---------------- 截图 ---------------- */

  function takeScreenshot() {
    // 正确性依据:未开 preserveDrawingBuffer 时,画布绘图缓冲在"合成之后、下一帧之前"
    // 才会被清空;本函数在同一个同步任务内先 render 再 drawImage 拷贝到 2D 画布,
    // 像素必然完整,之后的异步 toBlob 也只读取 2D 副本,与 GL 画布无关。
    WL.sim.render(performance.now() / 1000);
    const c = el.canvas;
    const t = document.createElement('canvas');
    t.width = c.width; t.height = c.height;
    const tc = t.getContext('2d');
    tc.drawImage(c, 0, 0);
    t.toBlob((b) => {
      if (!b) { toast(t('toast.shot_fail')); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'WaveLab-' + new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-') + '.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
      toast(t('toast.shot_ok'));
    });
  }

  /* ---------------- 场景加载 ---------------- */

  function barrierGaps(x, w, gaps) {
    const H = sim.h;
    const gs = gaps
      .map((g) => ({ a: Math.round(g.y - g.h / 2), b: Math.round(g.y + g.h / 2) }))
      .sort((p, q) => p.a - q.a);
    let y = 0;
    for (const g of gs) {
      if (g.a > y) sim.wallRect(x, y, w, g.a - y);
      y = Math.max(y, g.b);
    }
    if (y < H) sim.wallRect(x, y, w, H - y);
  }

  function loadScene(id, quiet) {
    const sc = WL.SCENES[id];
    if (!sc || !sim) return;
    sim.sources.length = 0;
    sim.clearWalls();
    sim.resetField();
    sim.view = sc.view != null ? sc.view : 0;
    sim.bound = sc.bound != null ? sc.bound : 0;
    if (sc.gain != null) { sim.gain = sc.gain; handles.gain.sync(sc.gain); }
    if (sc.screen) { sim.screen.nx = sc.screen.nx; sim.screen.on = sc.screen.on; }
    else { sim.screen.on = false; }
    syncScreenControls();
    handles.screenX.sync(sim.screen.nx);
    if (sc.probe) { setProbe(sc.probe.nx, sc.probe.ny); probeCount = 0; probeHead = 0; }
    else clearProbe();

    const api = {
      W: sim.w, H: sim.h,
      addSource(o) { return addSource({ x: o.nx * sim.w, y: o.ny * sim.h }, o); },
      barrierGaps,
      wallRect: (x, y, w, h) => sim.wallRect(x, y, w, h),
      wallStroke: (x0, y0, x1, y1, r) => sim.wallStroke(x0, y0, x1, y1, r),
    };
    sc.build(api);

    state.scene = id;
    select(-1);
    syncSeg('view', sim.view);
    syncSeg('bound', sim.bound);
    $$('#sceneTabs .scene-tab').forEach((b) => b.classList.toggle('active', b.dataset.scene === id));
    refreshCards();
    if (!quiet) {
      const name = i18n.sceneName(sc);
      toast(t('toast.scene_loaded', { name }) + (sc.desc ? ' — ' + i18n.sceneDesc(sc) : ''));
    }
  }

  /* ---------------- 工具与指针交互 ---------------- */

  function setTool(tool) {
    state.tool = tool;
    $$('#toolbar .tool-btn').forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
    el.hint.textContent = t(HINTS[tool]);
    const showBrush = tool === 'wall' || tool === 'erase';
    el.brushCursor.style.display = showBrush ? 'block' : 'none';
  }

  function onDown(e) {
    if (e.button !== 0 && e.button !== 2) return;
    const g = toGrid(e);
    try { el.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    if (e.button === 2 || state.tool === 'erase') {
      drag = { mode: 'erase', lx: g.x, ly: g.y };
      sim.eraseDot(g.x, g.y, state.brush);
    } else if (state.tool === 'wall') {
      drag = { mode: 'wall', lx: g.x, ly: g.y };
      sim.wallDot(g.x, g.y, state.brush);
    } else if (state.tool === 'pulse') {
      drag = { mode: 'pulse', px: g.x, py: g.y };
      sim.impulse(g.x, g.y, 1.0, 5.5);
    } else if (state.tool === 'probe') {
      drag = { mode: 'probe' };
      setProbe(g.x / sim.w, g.y / sim.h);
      probeCount = 0; probeHead = 0;
    } else {
      const i = pickSource(g);
      if (i >= 0) {
        select(i);
        drag = { mode: 'src', idx: i };
      } else {
        if (sim.sources.length >= 8) {
          toast(t('toast.src_limit'));
          drag = null;
          return;
        }
        addSource(g);
        select(sim.sources.length - 1);
        drag = { mode: 'src', idx: sim.sources.length - 1 };
      }
    }
  }

  function onMove(e) {
    const showBrush = el.brushCursor.style.display === 'block';
    if (showBrush) {
      const r = el.canvas.getBoundingClientRect();
      el.brushCursor.style.left = e.clientX - r.left + 'px';
      el.brushCursor.style.top = e.clientY - r.top + 'px';
      const d = (state.brush * 2 / sim.w) * r.width;
      el.brushCursor.style.width = d + 'px';
      el.brushCursor.style.height = d + 'px';
    }
    if (!drag) return;
    const g = toGrid(e);
    if (drag.mode === 'wall') {
      sim.wallStroke(drag.lx, drag.ly, g.x, g.y, state.brush);
      drag.lx = g.x; drag.ly = g.y;
    } else if (drag.mode === 'erase') {
      sim.eraseStroke(drag.lx, drag.ly, g.x, g.y, state.brush);
      drag.lx = g.x; drag.ly = g.y;
    } else if (drag.mode === 'pulse') {
      if (Math.hypot(g.x - drag.px, g.y - drag.py) > 20) {
        sim.impulse(g.x, g.y, 0.75, 5.5);
        drag.px = g.x; drag.py = g.y;
      }
    } else if (drag.mode === 'src') {
      const s = sim.sources[drag.idx];
      if (s) { s.nx = Math.min(Math.max(g.x / sim.w, 0), 1); s.ny = Math.min(Math.max(g.y / sim.h, 0), 1); }
    } else if (drag.mode === 'probe') {
      setProbe(g.x / sim.w, g.y / sim.h);
    }
  }

  function onUp() { drag = null; }

  /* ---------------- 暂停 / 单步 ---------------- */

  function setPaused(p) {
    state.paused = p;
    el.btnPause.innerHTML = p ? ICON_PLAY : ICON_PAUSE;
    el.btnPause.title = p ? t('btn.resume_title') : t('btn.pause_title');
    el.btnPause2.innerHTML = (p ? ICON_PLAY : ICON_PAUSE) + `<span>${p ? t('btn.resume') : t('btn.pause')}</span>`;
  }

  /** 单步推进:自动暂停后前进 3 个时间步(1/60 模拟秒),便于逐帧观察干涉/衍射过程 */
  function stepOnce() {
    if (!state.paused) setPaused(true);
    const DT = WL.DT || (1 / 180);
    for (let n = 0; n < 3; n++) sim.step(DT);
    sampleProbe(true); // 暂停状态下主动采样一次,示波器与单步保持同步
  }

  /* ---------------- HUD ---------------- */

  function hud(dt) {
    fpsEma += (1 / Math.max(dt, 1e-3) - fpsEma) * 0.06;
    hudAcc += dt;
    if (hudAcc < 0.4) return;
    hudAcc = 0;
    el.chipGrid.textContent = `${t('hud.grid')} ${sim.w}×${sim.h}`;
    // 波速读数:v = c = C·Δx/Δt = C × 180 格/秒(Δx = 1 格,Δt = 1/180)
    const v = sim.C * (WL.DT_RATE || 180);
    el.chipV.textContent = `v ≈ ${Math.round(v)} ${t('hud.cells_ps')}`;
    const s0 = sim.sources.find((s) => s.on);
    if (s0) {
      const lam = v / s0.freq;
      el.chipLambda.textContent = `f = ${s0.freq.toFixed(1)} Hz · λ ≈ ${lam.toFixed(0)} ${t('hud.cells')}`;
    } else {
      el.chipLambda.textContent = 'λ —';
    }
    el.chipC.textContent = `C = ${sim.C.toFixed(2)}`;
    el.chipFps.textContent = `${Math.round(fpsEma)} FPS`;
  }

  /* ---------------- 分段控件 ---------------- */

  function syncSeg(group, v) {
    const seg = document.querySelector(`.seg[data-group="${group}"]`);
    if (!seg) return;
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('active', +b.dataset.val === v));
  }

  function bindSegs() {
    $$('.seg').forEach((seg) => {
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
        const v = +b.dataset.val;
        const g = seg.dataset.group;
        if (g === 'view') sim.view = v;
        else if (g === 'pal') sim.pal = v;
        else if (g === 'bound') sim.bound = v;
        else if (g === 'wallmat') { sim.wallMaterial = v; state.wallMat = v; }
        else if (g === 'speed') state.speed = v;
      });
    });
  }

  /* ---------------- 每帧调用(main.js) ---------------- */

  function perFrame() {
    frameNo++;
    sampleProbe();
    drawScope();
    if (frameNo % 2 === 0) updateScreenOverlay();
  }

  /* ---------------- 初始化 ---------------- */

  function init() {
    sim = WL.sim;
    el.canvas = $('#glcanvas');
    el.screenLabel = $('#screenLabel');
    el.hint = $('#hint');
    el.brushCursor = $('#brushCursor');
    el.srcList = $('#srcList');
    el.toastWrap = $('#toastWrap');
    el.chipGrid = $('#chipGrid');
    el.chipLambda = $('#chipLambda');
    el.chipV = $('#chipV');
    el.chipC = $('#chipC');
    el.chipFps = $('#chipFps');
    el.btnPause = $('#btnPause');
    el.btnStep = $('#btnStep');
    el.btnPause2 = $('#btnPause2');
    el.scopePanel = $('#scopePanel');
    el.scopeCanvas = $('#scopeCanvas');
    el.scopeCtx = el.scopeCanvas.getContext('2d');
    el.scopeRead = $('#scopeRead');
    el.btnScreen = $('#btnScreen');
    el.screenX = $('#screenX');

    // 场景标签
    buildSceneTabs();

    // 工具栏
    $$('#toolbar .tool-btn').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
    setTool('source');

    // 指针事件
    el.canvas.addEventListener('pointerdown', onDown);
    el.canvas.addEventListener('pointermove', onMove);
    el.canvas.addEventListener('pointerup', onUp);
    el.canvas.addEventListener('pointercancel', onUp);
    el.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    el.canvas.addEventListener('pointerleave', () => { if (!drag) el.brushCursor.style.opacity = '0'; });
    el.canvas.addEventListener('pointerenter', () => { el.brushCursor.style.opacity = '1'; });

    // 波源卡片事件委托
    el.srcList.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.src-card');
      if (!card) return;
      const i = Array.prototype.indexOf.call(el.srcList.querySelectorAll('.src-card'), card);
      if (i < 0) return;
      if (e.target.closest('.del')) {
        e.stopPropagation();
        sim.sources.splice(i, 1);
        state.selected = -1;
        sim.sources.forEach((s) => { s.sel = false; });
        refreshCards();
        return;
      }
      if (e.target.closest('.mute')) {
        e.stopPropagation();
        const s = sim.sources[i];
        if (s) s.on = !s.on;
        refreshCards();
        return;
      }
      if (e.target.closest('input')) return;
      select(i);
    });

    // 顶栏
    setPaused(false);
    el.btnPause.addEventListener('click', () => setPaused(!state.paused));
    el.btnStep.innerHTML = ICON_STEP;
    el.btnStep.addEventListener('click', stepOnce);
    $('#btnStep2').addEventListener('click', stepOnce);
    $('#btnResetField').innerHTML = ICON_RESET;
    $('#btnShot').innerHTML = ICON_CAMERA;
    $('#btnShot').addEventListener('click', takeScreenshot);

    // 侧栏控件
    handles.newFreq = bindRange('#newFreq', (v) => { state.newFreq = v; }, (v) => v.toFixed(1) + ' Hz');
    handles.newAmp = bindRange('#newAmp', (v) => { state.newAmp = v; }, (v) => v.toFixed(2));
    handles.speed = bindRange('#speed', (v) => { sim.C = v / 100; }, (v) => (v / 100).toFixed(2));
    handles.gain = bindRange('#gain', (v) => { sim.gain = v; }, (v) => v.toFixed(2));
    handles.brush = bindRange('#brush', (v) => { state.brush = v; }, (v) => v + ' ' + t('hud.cells'));
    handles.screenX = bindRange('#screenX', (v) => { sim.screen.nx = v; syncOverlaySize(); }, (v) => (v * 100).toFixed(0) + '%');
    el.btnScreen.addEventListener('click', () => {
      sim.screen.on = !sim.screen.on;
      syncScreenControls();
      syncOverlaySize();
      if (sim.screen.on) toast(t('toast.screen_on'), 2200);
    });
    bindSegs();

    // 语言切换
    $('#btnLang').addEventListener('click', () => {
      i18n.set(i18n.lang() === 'zh' ? 'en' : 'zh');
    });

    $('#btnPause2').addEventListener('click', () => setPaused(!state.paused));
    $('#btnResetField2').addEventListener('click', () => { sim.resetField(); toast(t('toast.field_reset')); });
    $('#btnResetField').addEventListener('click', () => { sim.resetField(); toast(t('toast.field_reset')); });
    $('#btnClearWalls').addEventListener('click', () => { sim.clearWalls(); toast(t('toast.walls_cleared')); });
    $('#btnClearSrcs').addEventListener('click', () => {
      sim.sources.length = 0;
      select(-1);
      toast(t('toast.srcs_cleared'));
    });
    $('#scopeClose').addEventListener('click', clearProbe);

    // 键盘
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPaused(!state.paused);
      } else if (e.key >= '1' && e.key <= '5') {
        setTool(['source', 'pulse', 'wall', 'erase', 'probe'][+e.key - 1]);
      } else if (e.key === 'r' || e.key === 'R') {
        sim.resetField();
      } else if (e.key === 's' || e.key === 'S') {
        stepOnce();
      }
    });

    // 科学说明弹窗
    const modal = $('#aboutModal');
    $('#btnAbout').addEventListener('click', () => { modal.hidden = false; });
    $('#btnCloseAbout').addEventListener('click', () => { modal.hidden = true; });
    modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.hidden = true; });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.hidden = true; });

    refreshCards();
    syncScreenControls();
    syncOverlaySize();
    toast(t('toast.welcome'), 5200);
  }

  /* 场景标签构建(语言切换时需要按当前语言重建) */
  function buildSceneTabs() {
    const nav = $('#sceneTabs');
    nav.innerHTML = '';
    Object.entries(WL.SCENES).forEach(([id, sc]) => {
      const b = document.createElement('button');
      b.className = 'scene-tab';
      b.dataset.scene = id;
      b.textContent = i18n.sceneName(sc);
      b.title = i18n.sceneDesc(sc) || '';
      b.addEventListener('click', () => loadScene(id));
      nav.appendChild(b);
    });
    $$('#sceneTabs .scene-tab').forEach((b) => b.classList.toggle('active', b.dataset.scene === state.scene));
  }

  /** 语言切换后重绘全部动态文案(静态节点由 i18n.applyAll 处理) */
  function onLanguageChange() {
    buildSceneTabs();
    setTool(state.tool);       // 更新底部提示
    setPaused(state.paused);   // 更新暂停/继续按钮
    syncScreenControls();      // 更新观察屏开关
    refreshCards();            // 重建波源卡片
    hud(1);                    // 强制刷新 HUD 读数
  }

  WL.ui = {
    init, loadScene, setTool, setPaused, hud, toast, refreshCards,
    perFrame, updateScreenOverlay, syncOverlaySize, takeScreenshot, state, sampleProbe,
    onLanguageChange,
    get ready() { return !!sim; },
  };
})();
