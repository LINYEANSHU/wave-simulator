/* ============================================================
 * WaveLab — 实验场景预设
 * 场景通过 api 在网格上放置波源与障碍(坐标支持归一化 nx/ny 与格数)
 * 可选:screen 观察屏默认位置 / probe 默认探针 / motion 运动波源
 * name/desc 为中文;nameEn/descEn 为英文,由 i18n 按当前语言取用
 * ============================================================ */
(function () {
  'use strict';
  const WL = (window.WL = window.WL || {});

  WL.SCENES = {
    slit2: {
      name: '双缝干涉',
      desc: '平面波穿过双缝,观察屏上形成时均强度条纹',
      nameEn: 'Double-Slit Interference',
      descEn: 'Plane waves pass through two slits; time-averaged fringes form on the screen',
      view: 0, bound: 0,
      screen: { nx: 0.70, on: true },
      probe: { nx: 0.70, ny: 0.5 },
      build(api) {
        const { W, H } = api;
        api.addSource({ nx: 0.10, ny: 0.5, freq: 5.0, amp: 0.15, type: 1 });
        const bx = Math.round(W * 0.34), bw = 8;
        const cy = H >> 1, sep = 150, gap = 16;
        api.barrierGaps(bx, bw, [
          { y: cy - sep / 2, h: gap },
          { y: cy + sep / 2, h: gap },
        ]);
      },
    },

    slit1: {
      name: '单缝衍射',
      desc: '平面波穿过窄缝,向两侧展开衍射',
      nameEn: 'Single-Slit Diffraction',
      descEn: 'A plane wave spreads out after passing through a narrow slit',
      view: 0, bound: 0,
      screen: { nx: 0.70, on: true },
      probe: { nx: 0.70, ny: 0.5 },
      build(api) {
        const { W, H } = api;
        api.addSource({ nx: 0.10, ny: 0.5, freq: 5.0, amp: 0.15, type: 1 });
        const bx = Math.round(W * 0.34), bw = 8;
        api.barrierGaps(bx, bw, [{ y: H >> 1, h: 26 }]);
      },
    },

    huygens: {
      name: '惠更斯原理',
      desc: '平面波穿过多缝阵列,每条狭缝都成为新的子波源',
      nameEn: "Huygens' Principle",
      descEn: 'Plane waves pass through a multi-slit array — every slit becomes a new secondary source',
      view: 0, bound: 0,
      screen: { nx: 0.70, on: true },
      probe: { nx: 0.70, ny: 0.5 },
      build(api) {
        const { W, H } = api;
        api.addSource({ nx: 0.10, ny: 0.5, freq: 5.0, amp: 0.15, type: 1 });
        const bx = Math.round(W * 0.34), bw = 8;
        const cy = H >> 1, n = 5, gap = 14, period = 70;
        const gaps = [];
        for (let i = 0; i < n; i++) {
          gaps.push({ y: cy + (i - (n - 1) / 2) * period, h: gap });
        }
        api.barrierGaps(bx, bw, gaps);
      },
    },

    standing: {
      name: '对向驻波',
      desc: '两列相向同频平面波叠加,形成位置固定的波节与波腹',
      nameEn: 'Standing Wave',
      descEn: 'Two identical plane waves travelling in opposite directions form fixed nodes and antinodes',
      view: 0, bound: 0,
      probe: { nx: 0.5, ny: 0.5 },
      build(api) {
        const { W, H } = api;
        const cy = H >> 1;
        api.addSource({ nx: 0.16, ny: cy / H, freq: 4.0, amp: 0.22, type: 1 });
        api.addSource({ nx: 0.84, ny: cy / H, freq: 4.0, amp: 0.22, type: 1 });
      },
    },

    lloyd: {
      name: '劳埃德镜',
      desc: '点源的直射波与镜面反射波干涉,近镜面处出现暗纹',
      nameEn: "Lloyd's Mirror",
      descEn: 'Direct and mirror-reflected waves from a point source interfere; dark fringes hug the mirror',
      view: 0, bound: 0,
      build(api) {
        const { W, H } = api;
        api.addSource({ nx: 0.18, ny: 0.78, freq: 5.0, amp: 0.30, type: 0 });
        // 底部刚性镜面:自波源正下方延伸到右边界(超出画布部分由 fillRect 裁剪)
        api.wallRect(Math.round(W * 0.18), H - 14, Math.round(W * 0.82) + 20, 14);
      },
    },

    focus: {
      name: '抛物面聚焦',
      desc: '平面波经抛物面反射汇聚于焦点,探针已放在焦点处',
      nameEn: 'Parabolic Focusing',
      descEn: 'A plane wave reflects off a parabola and converges at the focus — a probe is already placed there',
      view: 0, bound: 0,
      probe: { nx: 0.48, ny: 0.5 },
      build(api) {
        const { W, H } = api;
        api.addSource({ nx: 0.08, ny: 0.5, freq: 5.0, amp: 0.15, type: 1 });
        const cy = H >> 1;
        const vx = Math.round(W * 0.62);          // 抛物面顶点(最右点)
        const f = Math.max(40, Math.round(W * 0.14)); // 焦距(格),焦点在 vx - f
        const dyMax = Math.min(cy - 6, Math.floor(Math.sqrt(4 * f * Math.max(8, vx - 8))));
        let px = vx, py = cy - dyMax;
        for (let y = cy - dyMax + 6; y <= cy + dyMax; y += 6) {
          const x = vx - (y - cy) * (y - cy) / (4 * f);
          api.wallStroke(px, py, x, y, 5);
          px = x; py = y;
        }
      },
    },

    multi: {
      name: '多波源干涉',
      desc: '五个等距同相波源,形成定向波束',
      nameEn: 'Multi-Source Interference',
      descEn: 'Five evenly spaced in-phase sources form a directional beam',
      view: 0, bound: 0,
      build(api) {
        const { W, H } = api;
        const cy = H >> 1, spacing = 90, n = 5;
        const x0 = Math.round(W * 0.15);
        for (let i = 0; i < n; i++) {
          api.addSource({
            nx: x0 / W,
            ny: (cy + (i - (n - 1) / 2) * spacing) / H,
            freq: 5.0, amp: 0.18, type: 0,
          });
        }
      },
    },

    doppler: {
      name: '多普勒效应',
      desc: '运动波源:前方波前压缩、后方疏张,往复运动',
      nameEn: 'Doppler Effect',
      descEn: 'A moving source: wavefronts bunch up ahead and stretch out behind',
      view: 0, bound: 0,
      build(api) {
        api.addSource({
          nx: 0.20, ny: 0.5, freq: 4.0, amp: 0.30, type: 0,
          motion: { ux: 0.075, uy: 0, minX: 0.16, maxX: 0.84 },
        });
      },
    },

    beats: {
      name: '拍频干涉',
      desc: '两个频率接近的波源叠加,空间上形成缓慢拍动的水包',
      nameEn: 'Beat Interference',
      descEn: 'Two close frequencies add up to a slowly throbbing spatial beat',
      view: 0, bound: 0,
      probe: { nx: 0.5, ny: 0.5 },
      build(api) {
        const { H } = api;
        const cy = H >> 1;
        api.addSource({ nx: 0.36, ny: cy / H, freq: 4.0, amp: 0.28, type: 0 });
        api.addSource({ nx: 0.64, ny: cy / H, freq: 4.6, amp: 0.28, type: 0 });
      },
    },

    dipole: {
      name: '偶极辐射',
      desc: '两个反相波源:连线方向增强,中垂线相消',
      nameEn: 'Dipole Radiation',
      descEn: 'Two out-of-phase sources: reinforced along the line joining them, cancelled on the perpendicular bisector',
      view: 0, bound: 0,
      build(api) {
        const { W, H } = api;
        const cy = H >> 1, d = 16;
        api.addSource({ nx: 0.5, ny: (cy - d) / H, freq: 4.0, amp: 0.30, type: 0, phase0: 0 });
        api.addSource({ nx: 0.5, ny: (cy + d) / H, freq: 4.0, amp: 0.30, type: 0, phase0: Math.PI });
      },
    },

    cavity: {
      name: '反射腔驻波',
      desc: '刚性边界内,圆形波与反射波叠加成腔内驻波',
      nameEn: 'Cavity Standing Wave',
      descEn: 'Inside rigid boundaries, circular waves and their reflections build a standing pattern',
      view: 0, bound: 1,
      build(api) {
        api.addSource({ nx: 0.5, ny: 0.5, freq: 3.0, amp: 0.25, type: 0 });
      },
    },

    free: {
      name: '自由实验',
      desc: '空白场地,自由放置波源与障碍(墙体可切换吸波材质)',
      nameEn: 'Sandbox',
      descEn: 'A blank field — place sources and obstacles freely (walls can be made absorbing)',
      view: 0, bound: 0,
      build(api) {
        api.addSource({ nx: 0.30, ny: 0.5, freq: 3.0, amp: 0.30, type: 0 });
      },
    },
  };
})();
