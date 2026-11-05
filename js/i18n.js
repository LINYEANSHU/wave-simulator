/* ============================================================
 * WaveLab — 双语支持（zh / en）
 * 默认跟随浏览器语言,选择存入 localStorage;切换时重绘全部文案
 * 静态节点:data-i18n(文本) / data-i18n-html(富文本) / data-i18n-title(悬停提示)
 * 动态文案:JS 侧经 WL.t(key, params) 取词,语言切换时回调 ui.onLanguageChange
 * ============================================================ */
(function () {
  'use strict';
  const WL = (window.WL = window.WL || {});

  const STORE_KEY = 'wavelab.lang';

  const DICT = {
    /* ---------------- 中文 ---------------- */
    zh: {
      'doc.title': 'WaveLab · 交互式波动实验室',
      'app.subtitle': '交互式波动实验室',
      'nav.scenes': '实验场景',

      'btn.lang': '🌐 EN',
      'btn.about': '科学说明',
      'btn.close': '关闭',
      'btn.shot_title': '导出当前画面为图片',
      'btn.pause_title': '暂停 (空格)',
      'btn.resume_title': '继续 (空格)',
      'btn.pause': '暂停',
      'btn.resume': '继续',
      'btn.step_title_top': '单步推进 1/60 模拟秒 (S)',
      'btn.reset_title': '重置波场',
      'btn.step': '单步',
      'btn.step2_title': '暂停并前进 3 个时间步(1/60 模拟秒,快捷键 S)',
      'btn.reset': '重置波场',
      'btn.clear_walls': '清除障碍',
      'btn.clear_srcs': '清除波源',

      'tool.source_title': '波源：点击放置，拖动移动（快捷键 1）',
      'tool.pulse_title': '脉冲：点击激发涟漪（快捷键 2）',
      'tool.wall_title': '墙体：拖动绘制障碍（快捷键 3）',
      'tool.erase_title': '擦除：拖动清除障碍（快捷键 4）',
      'tool.probe_title': '探针：点击放置，读取该点波形与实测频率（快捷键 5）',

      'screen.label': '观察屏 · 时均强度',
      'scope.title': '探针读数',
      'scope.close_title': '移除探针',
      'scope.fmeas': '实测频率',

      'sec.view': '视图',
      'view.wave': '波形场',
      'view.intensity': '强度场 · 时均',
      'pal.lab': '配色',
      'pal.title': '波形显示的三套配色方案',
      'pal.0': '深空',
      'pal.1': '霓虹',
      'pal.2': '冰蓝',
      'bound.lab': '边界',
      'bound.title': '外边界:吸收(海绵阻尼,近似无反射)或反射(刚性壁,可观察驻波)',
      'bound.0': '吸收',
      'bound.1': '反射',
      'meas.lab': '测量',
      'meas.title': '沿屏线读取时均强度 |u|² 剖面,定量观察干涉条纹',
      'screen.on': '观察屏 · 开',
      'screen.off': '观察屏 · 关',
      'screen.pos': '屏位置',
      'screen.pos_title': '观察屏的竖直位置(占画布宽度的百分比)',

      'sec.sources': '波源',
      'src.defaults': '新波源默认参数',
      'src.freq': '频率',
      'src.freq_title': '新放置波源的频率 f;波长 λ = v/f,频率越高波长越短',
      'src.amp': '振幅',
      'src.amp_title': '新放置波源的振幅(影响条纹对比度与过载限幅)',
      'src.card_name': '波源 {n}',
      'src.tag_plane': '平面波',
      'src.tag_moving': '运动',
      'src.mute': '静音',
      'src.unmute': '开启',
      'src.del': '删除',
      'src.phase': '相位',
      'src.empty': '使用「波源」工具在画布上点击放置',

      'sec.field': '场参数',
      'field.speed': '波速 C',
      'field.speed_title': 'Courant 数 c·Δt/Δx(0.08–0.70),波速 v = C×180 格/秒;超过 0.707 数值不稳定',
      'field.playback': '时间流速',
      'field.playback_title': '快放/慢放倍率:不改变波形与频率,慢放便于观察衍射细节',
      'field.gain': '对比度',
      'field.gain_title': '显示增益:调高可看清弱条纹,过高会饱和',
      'field.brush': '画笔粗细',
      'field.brush_title': '墙体/擦除笔刷半径(格)',
      'field.wallmat': '墙体材质',
      'field.wallmat_title': '反射墙完全反弹波;吸波墙近似吸收(消声尖劈的一维类比)',
      'wallmat.0': '反射墙',
      'wallmat.1': '吸波墙',
      'field.note': 'C = c·Δt/Δx ≤ 1/√2 保证数值稳定；时间流速减慢可细看衍射过程。',

      'sec.actions': '操作',
      'foot.note': 'FDTD · WebGL2 · 全部计算在本地 GPU 完成',

      'hint.source': '点击空白处放置波源 · 拖动已有波源调整位置',
      'hint.pulse': '点击或拖动,激发涟漪脉冲',
      'hint.wall': '按住左键拖动绘制障碍墙 · 材质可在下方切换',
      'hint.erase': '按住拖动擦除障碍 · 任意工具下右键拖动也可擦除',
      'hint.probe': '点击放置探针,查看该点波形与实测频率',

      'hud.grid': '网格',
      'hud.cells': '格',
      'hud.cells_ps': '格/s',

      'toast.shot_fail': '截图失败',
      'toast.shot_ok': '已导出截图',
      'toast.scene_loaded': '已加载场景 · {name}',
      'toast.src_limit': '最多支持 8 个波源,请先删除一些',
      'toast.field_reset': '波场已重置',
      'toast.walls_cleared': '障碍已清除',
      'toast.srcs_cleared': '波源已清除',
      'toast.screen_on': '观察屏已开启 · 时均强度剖面',
      'toast.welcome': '欢迎来到 WaveLab · 五种工具:波源、脉冲、墙体、擦除、探针',

      'fatal.title': '无法启动模拟',
      'fatal.tip': '请使用最新版 Chrome / Edge / Firefox 打开本页面（需要支持 WebGL2 与浮点纹理渲染）。',
      'fatal.init': '初始化失败:{msg}',
      'fatal.ctxlost': 'WebGL 上下文丢失,请刷新页面。',
      'err.webgl2': '无法创建 WebGL2 上下文',
      'err.ext': '缺少 EXT_color_buffer_float 扩展(浮点渲染目标不可用)',
      'err.float': '不支持浮点渲染目标(RGBA32F / RGBA16F 均不可用)',

      /* ---- 科学说明弹窗 ---- */
      'about.title': '科学说明',
      'about.model.h': '物理模型',
      'about.model.p': '本页模拟求解<b>二维标量波动方程</b> ∂²u/∂t² = c²∇²u。u 可以理解为浅水槽表面波的位移，或声波某截面的声压。波源的叠加与干涉、遇到障碍的反射与衍射，都是方程解的自然结果，而非预设动画。',
      'about.fdm.h': '数值方法（FDTD）',
      'about.fdm.p1': '显式二阶中心差分：',
      'about.fdm.p2': '其中 C = c·Δt/Δx 为 <b>Courant 数</b>。二维格点上稳定性要求 C ≤ 1/√2 ≈ 0.707，本页限制在 0.08–0.70。空间步长 Δx = 1 格，Δt = 1/180；「时间流速」按倍率推进子步（¼× 慢放便于观察衍射），波形与频率在所有流速下保持一致。',
      'about.src.h': '波源',
      'about.src.p': '采用<b>软波源</b>：每步在源区叠加 A·sin(2πft + φ₀) 源项，对外行波近乎透明。点源为高斯窗（σ ≈ 2 格），平面波源为竖直高斯条带。每个波源可独立设定初相位 φ₀：两源反相（相差 180°）即偶极辐射。脉冲工具向场注入一次高斯位移。<b>多普勒场景</b>中的波源以恒定速度往复运动，可观察前方波前压缩、后方疏张。',
      'about.bound.h': '障碍与边界条件',
      'about.bound.p': '<b>反射墙</b>内部格点每步强制 u = 0（狄利克雷硬边界），完全反射；<b>吸波墙</b>对墙内格点施加强速度阻尼，近似无反射软材料（消声尖劈的一维类比），可用于建造"安静"的屏障。外边界两种近似：',
      'about.bound.absorb': '<b>吸收</b>：边缘约 11% 区域设置立方渐变的速度阻尼"海绵层"（能量单调耗散）；是完美匹配层（PML）的简化替代，存在微弱残余反射。',
      'about.bound.reflect': '<b>反射</b>：最外一圈格点 u = 0，等效刚性壁，可观察驻波与腔内共振。',
      'about.meas.h': '测量工具',
      'about.meas.p': '<b>探针</b>：读取放置点的瞬时 u 并绘制实时波形；「实测频率」由去均值后的过零计数估计，可与设定频率对照：短波长（小 λ）时两者差异正是数值色散的直接体现。<b>观察屏</b>：读取屏线一列的时均强度 |u|²，以剖面形式贴附显示，即经典双缝实验中"屏上光强分布"的数值版本。强度场为 |u|² 的指数滑动平均（时间常数约 1.4 模拟秒）。',
      'about.stab.h': '稳定性限制',
      'about.stab.p': '当局部振幅异常增大（如反射腔共振累积）时，施加轻微非线性阻尼"软限幅"防止数值发散；正常幅度 |u| &lt; 0.8 内严格线性。显示端采用 tanh 软压缩色调映射。',
      'about.limits.h': '已知近似与局限',
      'about.limits.1': '<b>数值色散</b>：波长接近格距时相速度略偏慢，建议 λ ≥ 10 格（信息栏实时显示当前波长）。',
      'about.limits.2': '二维点源振幅按 ~1/√r 衰减（能量在 1/r 圆周上扩散），与三维的 1/r 不同。',
      'about.limits.3': '吸波墙为强阻尼近似，垂直入射吸收良好，掠入射仍有部分反射。',
      'about.limits.4': '真实水面重力波是非线性色散系统，此处为线性、非色散近似；定性现象（干涉、衍射、多普勒、拍）一致。',
      'about.perf.h': '性能与隐私',
      'about.perf.p': '全部计算在浏览器本地完成：WebGL2 fragment shader 上运行 FDTD，约百万格点 × 180 子步/秒（1× 流速），无任何数据上传或外部依赖。',
    },

    /* ---------------- English ---------------- */
    en: {
      'doc.title': 'WaveLab · Interactive Wave Laboratory',
      'app.subtitle': 'Interactive wave laboratory',
      'nav.scenes': 'Experiments',

      'btn.lang': '🌐 中文',
      'btn.about': 'How it works',
      'btn.close': 'Close',
      'btn.shot_title': 'Export the current frame as PNG',
      'btn.pause_title': 'Pause (Space)',
      'btn.resume_title': 'Resume (Space)',
      'btn.pause': 'Pause',
      'btn.resume': 'Resume',
      'btn.step_title_top': 'Step forward 1/60 s of sim time (S)',
      'btn.reset_title': 'Reset the wave field',
      'btn.step': 'Step',
      'btn.step2_title': 'Pause, then advance 3 time steps (1/60 s of sim time, key S)',
      'btn.reset': 'Reset field',
      'btn.clear_walls': 'Clear walls',
      'btn.clear_srcs': 'Clear sources',

      'tool.source_title': 'Source: click to place, drag to move (key 1)',
      'tool.pulse_title': 'Pulse: click to launch a ripple (key 2)',
      'tool.wall_title': 'Wall: drag to draw obstacles (key 3)',
      'tool.erase_title': 'Eraser: drag to clear obstacles (key 4)',
      'tool.probe_title': 'Probe: click to read the waveform & measured frequency there (key 5)',

      'screen.label': 'Screen · time-avg intensity',
      'scope.title': 'Probe reading',
      'scope.close_title': 'Remove probe',
      'scope.fmeas': 'measured f',

      'sec.view': 'View',
      'view.wave': 'Wave field',
      'view.intensity': 'Intensity · time-avg',
      'pal.lab': 'Palette',
      'pal.title': 'Three color schemes for the wave-field view',
      'pal.0': 'Deep space',
      'pal.1': 'Neon',
      'pal.2': 'Ice blue',
      'bound.lab': 'Boundary',
      'bound.title': 'Outer boundary: absorbing (sponge damping, nearly reflection-free) or reflective (rigid wall — watch standing waves)',
      'bound.0': 'Absorbing',
      'bound.1': 'Reflective',
      'meas.lab': 'Measure',
      'meas.title': 'Read the time-averaged |u|² profile along the screen line to inspect fringes quantitatively',
      'screen.on': 'Screen · on',
      'screen.off': 'Screen · off',
      'screen.pos': 'Screen position',
      'screen.pos_title': 'Vertical position of the screen (percentage of canvas width)',

      'sec.sources': 'Sources',
      'src.defaults': 'Defaults for new sources',
      'src.freq': 'Frequency',
      'src.freq_title': 'Frequency f for newly placed sources; λ = v/f, so a higher frequency means a shorter wavelength',
      'src.amp': 'Amplitude',
      'src.amp_title': 'Amplitude for newly placed sources (affects fringe contrast and soft limiting)',
      'src.card_name': 'Source {n}',
      'src.tag_plane': 'plane wave',
      'src.tag_moving': 'moving',
      'src.mute': 'Mute',
      'src.unmute': 'Unmute',
      'src.del': 'Delete',
      'src.phase': 'Phase',
      'src.empty': 'Pick the source tool and click on the canvas',

      'sec.field': 'Field & physics',
      'field.speed': 'Wave speed C',
      'field.speed_title': 'Courant number c·Δt/Δx (0.08–0.70); wave speed v = C×180 cells/s. Above 0.707 the scheme goes unstable',
      'field.playback': 'Playback speed',
      'field.playback_title': 'Playback rate: does not change the waveform or frequencies; slow motion makes diffraction easier to study',
      'field.gain': 'Gain',
      'field.gain_title': 'Display gain: raise it to see faint fringes; too high saturates',
      'field.brush': 'Brush size',
      'field.brush_title': 'Wall/eraser brush radius (cells)',
      'field.wallmat': 'Wall material',
      'field.wallmat_title': 'Reflective walls bounce waves back completely; absorbing walls damp them approximately (a 1-D analogue of anechoic wedges)',
      'wallmat.0': 'Reflective',
      'wallmat.1': 'Absorbing',
      'field.note': 'C = c·Δt/Δx ≤ 1/√2 keeps the scheme stable; slow the playback down to watch diffraction up close.',

      'sec.actions': 'Actions',
      'foot.note': 'FDTD · WebGL2 · all computation runs on your local GPU',

      'hint.source': 'Click empty space to place a source · drag an existing one to move it',
      'hint.pulse': 'Click or drag to launch ripple pulses',
      'hint.wall': 'Hold and drag to draw walls · switch material below',
      'hint.erase': 'Hold and drag to erase · right-click drag erases with any tool',
      'hint.probe': 'Click to drop a probe and watch the waveform & measured frequency there',

      'hud.grid': 'Grid',
      'hud.cells': 'cells',
      'hud.cells_ps': 'cells/s',

      'toast.shot_fail': 'Screenshot failed',
      'toast.shot_ok': 'Screenshot saved',
      'toast.scene_loaded': 'Scene loaded · {name}',
      'toast.src_limit': 'Up to 8 sources — delete some first',
      'toast.field_reset': 'Wave field reset',
      'toast.walls_cleared': 'Walls cleared',
      'toast.srcs_cleared': 'Sources cleared',
      'toast.screen_on': 'Screen on · time-averaged intensity profile',
      'toast.welcome': 'Welcome to WaveLab · five tools: source, pulse, wall, eraser, probe',

      'fatal.title': 'The simulation cannot start',
      'fatal.tip': 'Open this page with an up-to-date Chrome, Edge or Firefox (WebGL2 and float-texture rendering are required).',
      'fatal.init': 'Initialization failed: {msg}',
      'fatal.ctxlost': 'WebGL context lost — please reload the page.',
      'err.webgl2': 'Could not create a WebGL2 context',
      'err.ext': 'Missing EXT_color_buffer_float extension (float render targets unavailable)',
      'err.float': 'Float render targets unsupported (neither RGBA32F nor RGBA16F works)',

      /* ---- Science notes modal ---- */
      'about.title': 'How it works',
      'about.model.h': 'The physical model',
      'about.model.p': 'This simulator numerically solves the <b>two-dimensional scalar wave equation</b> ∂²u/∂t² = c²∇²u. Think of u as the surface displacement of shallow water in a tank, or the acoustic pressure across a section of air. Superposition and interference of sources, and reflection and diffraction around obstacles, all emerge naturally as solutions of the equation — none of it is a scripted animation.',
      'about.fdm.h': 'Numerical method (FDTD)',
      'about.fdm.p1': 'Explicit second-order central differences:',
      'about.fdm.p2': 'where C = c·Δt/Δx is the <b>Courant number</b>. Stability on a two-dimensional grid requires C ≤ 1/√2 ≈ 0.707; this page keeps C between 0.08 and 0.70. The grid spacing is Δx = 1 cell and Δt = 1/180 s of simulation time; the playback-speed control advances substeps at a variable rate (¼× slow motion makes diffraction easy to watch), while the waveform and frequencies stay identical at every speed.',
      'about.src.h': 'Sources',
      'about.src.p': 'Sources are <b>soft</b>: at every step a term A·sin(2πft + φ₀) is added inside the source region, so outgoing waves pass through almost unreflected. A point source uses a Gaussian window (σ ≈ 2 cells); a plane-wave source is a vertical Gaussian strip. Each source has an independent initial phase φ₀ — two sources 180° out of phase make a dipole radiator. The pulse tool injects a single Gaussian displacement into the field. In the <b>Doppler scene</b> the source moves back and forth at constant speed: wavefronts compress ahead of it and stretch out behind.',
      'about.bound.h': 'Obstacles & boundary conditions',
      'about.bound.p': 'Inside a <b>reflective wall</b>, grid cells are forced to u = 0 every step (a hard Dirichlet boundary), giving perfect reflection. An <b>absorbing wall</b> applies strong velocity damping to the cells it covers — an approximate, reflection-free soft material (a 1-D analogue of anechoic wedge foam) — useful for building quiet barriers. The outer edge of the field is handled in one of two ways:',
      'about.bound.absorb': '<b>Absorbing</b>: roughly the outer 11% of the field is a sponge layer with a cubic velocity-damping ramp (energy is dissipated monotonically). It is a simplified stand-in for a perfectly matched layer (PML) and leaves a faint residual reflection.',
      'about.bound.reflect': '<b>Reflecting</b>: the outermost ring of cells is held at u = 0, equivalent to a rigid wall — good for watching standing waves and cavity resonances.',
      'about.meas.h': 'Measurement tools',
      'about.meas.p': '<b>Probe</b>: reads the instantaneous value of u at its location and plots the live waveform. The measured frequency is estimated by counting zero crossings (after removing the mean) over a window of simulation time — compare it with the set frequency: at short wavelengths (small λ) the mismatch is numerical dispersion made visible. <b>Screen</b>: reads the time-averaged intensity |u|² along a vertical line and draws the profile beside it — the numerical version of the intensity pattern on the screen of a classic double-slit experiment. The intensity field is an exponential moving average of |u|² (time constant ≈ 1.4 s of simulation time).',
      'about.stab.h': 'Stability limit',
      'about.stab.p': 'When the local amplitude grows abnormally (for example resonant build-up inside a reflective cavity), a mild nonlinear damping acts as a soft limiter and keeps the simulation from diverging; below |u| &lt; 0.8 the physics is strictly linear. Display uses a tanh soft-compression tone map.',
      'about.limits.h': 'Known approximations & limitations',
      'about.limits.1': '<b>Numerical dispersion</b>: near the grid scale, waves travel slightly slower than they should; keep λ ≥ 10 cells (the readout strip shows the current wavelength live).',
      'about.limits.2': 'A 2-D point source decays like ~1/√r (energy spreads over a circle of circumference 1/r), unlike the 1/r of three dimensions.',
      'about.limits.3': 'The absorbing wall is a strong-damping approximation: absorption is good at normal incidence, but grazing angles still reflect partially.',
      'about.limits.4': 'Real surface gravity waves are nonlinear and dispersive; this simulation is linear and dispersion-free. The qualitative phenomena (interference, diffraction, Doppler, beats) carry over.',
      'about.perf.h': 'Performance & privacy',
      'about.perf.p': 'Everything runs locally in your browser: the FDTD loop executes in a WebGL2 fragment shader at roughly one million cells × 180 substeps per second (at 1× speed). Nothing is uploaded, and there are no external dependencies.',
    },
  };

  function detect() {
    try {
      const s = localStorage.getItem(STORE_KEY);
      if (s === 'zh' || s === 'en') return s;
    } catch (_) { /* 隐私模式等场景下忽略 */ }
    const n = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return /^zh/i.test(n) ? 'zh' : 'en';
  }

  let lang = detect();

  /** 取词;支持 {name} 形式的占位符 */
  function t(key, params) {
    let s = DICT[lang][key];
    if (s == null) s = DICT.zh[key] != null ? DICT.zh[key] : key;
    if (params) s = s.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? params[k] : ''));
    return s;
  }

  /** 场景名称/简介按当前语言取用 */
  function sceneName(sc) { return lang === 'en' && sc.nameEn ? sc.nameEn : sc.name; }
  function sceneDesc(sc) { return lang === 'en' && sc.descEn ? sc.descEn : sc.desc; }

  /** 将当前语言应用到全部静态节点与文档属性 */
  function applyAll() {
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.title = t('doc.title');
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    const btn = document.getElementById('btnLang');
    if (btn) btn.textContent = t('btn.lang');
  }

  function set(l) {
    if (l !== 'zh' && l !== 'en') return;
    if (l === lang) return;
    lang = l;
    try { localStorage.setItem(STORE_KEY, l); } catch (_) {}
    applyAll();
    if (WL.ui && typeof WL.ui.onLanguageChange === 'function') WL.ui.onLanguageChange();
  }

  WL.i18n = { t, applyAll, set, sceneName, sceneDesc, lang: () => lang };
  WL.t = t; // 常用快捷方式
  applyAll(); // 首次应用(脚本位于 body 末尾,DOM 已就绪)
})();
