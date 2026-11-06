/* ============================================================
 * WaveLab — 启动与主循环
 * 固定时间步长累加器:物理与显示帧率解耦(Δt = 1/180,与 CFL 说明一致)
 * ============================================================ */
(function () {
  'use strict';
  const WL = (window.WL = window.WL || {});
  WL.DT = 1 / 180;
  WL.DT_RATE = 180;

  const BASE_H = 540;      // 网格高度(格),宽度按画布纵横比推算
  const MAX_W = 1280;
  const MIN_W = 320;
  const MAX_SUBSTEPS = 14; // 单帧最多子步数,防止卡顿时螺旋累积(2× 流速时约需 12)

  function fatal(msg) {
    const f = document.getElementById('fatal');
    f.hidden = false;
    f.querySelector('.fatal-msg').textContent = msg;
  }
  const t = WL.t; // i18n 取词快捷方式

  /** 计算画布 CSS 尺寸与网格尺寸(stage 可用区域保持纵横比) */
  function fit(immediate) {
    const stage = document.getElementById('stage');
    const canvas = document.getElementById('glcanvas');
    const aw = stage.clientWidth - 40;
    const ah = stage.clientHeight - 40;
    if (aw < 60 || ah < 60) return;

    const sim = WL.sim;
    if (!sim) return;

    // CSS 尺寸:按当前网格纵横比在可用区域内最大化
    const ar = sim.w / sim.h || 16 / 9;
    let dw = Math.min(aw, ah * ar);
    let dh = dw / ar;
    canvas.style.width = dw + 'px';
    canvas.style.height = dh + 'px';
    if (WL.ui.ready) WL.ui.syncOverlaySize();

    // 网格重建(去抖,避免拖拽窗口时频繁搬运纹理)
    const rebuild = () => {
      const aw2 = stage.clientWidth - 40;
      const ah2 = stage.clientHeight - 40;
      if (aw2 < 60 || ah2 < 60) return;
      let W = Math.round(BASE_H * aw2 / ah2);
      W = Math.max(MIN_W, Math.min(MAX_W, W));
      if (W !== sim.w || BASE_H !== sim.h) {
        sim.setSize(W, BASE_H);
        fitCssOnly();
      }
      WL.ui.syncOverlaySize();
    };
    const fitCssOnly = () => {
      const aw2 = stage.clientWidth - 40;
      const ah2 = stage.clientHeight - 40;
      if (aw2 < 60 || ah2 < 60) return;
      const ar2 = sim.w / sim.h;
      let dw2 = Math.min(aw2, ah2 * ar2);
      canvas.style.width = dw2 + 'px';
      canvas.style.height = (dw2 / ar2) + 'px';
    };
    if (immediate) rebuild();
    else {
      clearTimeout(fit._t);
      fit._t = setTimeout(rebuild, 160);
    }
  }

  function boot() {
    const canvas = document.getElementById('glcanvas');
    try {
      WL.sim = new WL.WaveSim(canvas);
    } catch (err) {
      fatal(t('fatal.init', { msg: err.message }));
      return;
    }

    let contextLost=false;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      contextLost=true;
      fatal(t('fatal.ctxlost'));
    });

    WL.ui.init();
    fit(true);
    WL.ui.loadScene('slit2', true);

    window.addEventListener('resize', () => fit(false));

    /* ---- 主循环: rAF 驱动 + 饥饿看门狗 ----
     * 部分环境(窗口被遮挡/虚拟显示)会挂起 rAF 但页面仍标记可见,
     * 此时以 16ms 定时器接管,避免"打开页面却冻结"。?autodrive 为自动化测试钩子。 */
    const AUTODRIVE = new URLSearchParams(location.search).has('autodrive');
    let last = performance.now();
    let acc = 0;
    let usingTimer = false;
    let timerId = 0;
    let rafPending = false;

    function tick(now) {
      if (document.hidden || contextLost) { last=now; acc=0; return; }
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (!WL.ui.state.paused) {
        if (AUTODRIVE) {
          // 测试钩子:限流环境下每 tick 推进固定步数,接近实时演化;
          // 每 5 子步采样一次探针,保证示波器按模拟时间密度采样(避免混叠)
          for (let n = 0; n < 40; n++) {
            WL.sim.step(WL.DT);
            if (n % 5 === 4) WL.ui.sampleProbe();
          }
        } else {
          acc += dt * (WL.ui.state.speed || 1);
          let n = 0;
          while (acc >= WL.DT && n < MAX_SUBSTEPS) {
            WL.sim.step(WL.DT);
            acc -= WL.DT;
            n++;
          }
          if (acc > WL.DT) acc = 0; // 帧率过低时丢弃积压,保持实时
        }
      } else {
        acc = 0;
      }

      WL.sim.render(now / 1000);
      WL.ui.perFrame();
      WL.ui.hud(dt);
    }

    function scheduleRaf() {
      if (rafPending || usingTimer) return;
      rafPending = true;
      requestAnimationFrame(rafStep);
    }
    function rafStep(now) {
      rafPending = false;
      tick(now);
      if (usingTimer) { usingTimer = false; clearTimeout(timerId); } // rAF 复活,收回定时器
      scheduleRaf();
    }
    function startTimer() {
      if (usingTimer) return;
      usingTimer = true;
      const loop = () => {
        if (!usingTimer) return;
        tick(performance.now());
        timerId = setTimeout(loop, 16);
      };
      loop();
    }

    if (AUTODRIVE) {
      startTimer();
    } else {
      scheduleRaf();
      setInterval(() => {
        if (!usingTimer && performance.now() - last > 800 &&
            document.visibilityState === 'visible') {
          startTimer();
        }
      }, 800);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
