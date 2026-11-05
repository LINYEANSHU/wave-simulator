/* ============================================================
 * WaveLab — 波动模拟核心 (WebGL2 FDTD)
 *
 * 求解二维标量波动方程  ∂²u/∂t² = c²∇²u
 * 显式二阶中心差分,场量 (u_curr, u_prev, I) 打包在 RGBA 浮点纹理中,
 * 两个纹理 ping-pong。稳定性:C = c·Δt/Δx ≤ 1/√2。
 *
 * 坐标约定:所有 JS 侧坐标为"网格坐标"(= 障碍画布像素坐标,y 向下),
 * 着色器内部通过 st = vec2(vUV.x, 1 - vUV.y) 做了一次翻转以对齐该约定。
 * ============================================================ */
(function () {
  'use strict';
  const WL = (window.WL = window.WL || {});

  /* ---------------- 着色器源码 ---------------- */

  // 波场推进:u_next = 2u - u_prev + C²∇²u (+ 软波源,受障碍/边界/限幅约束)
  const FS_SIM = `#version 300 es
  precision highp float;
  precision highp int;
  uniform sampler2D uField;   // r = u_curr, g = u_prev, b = 时均强度
  uniform sampler2D uMask;    // r = 反射墙 / g = 吸波墙
  uniform vec2  uGrid;
  uniform float uC2;          // Courant 数平方
  uniform float uSpongeW;     // 海绵层宽度(格)
  uniform int   uBound;       // 0 吸收 / 1 反射
  uniform int   uCount;
  uniform vec4  uSrcA[16];    // x, y, 振幅, -
  uniform vec4  uSrcB[16];    // 相位, 类型(0点/1平面), 开启, 选中
  in vec2 vUV;
  out vec4 outColor;

  void main() {
    vec2 st = vec2(vUV.x, 1.0 - vUV.y);
    ivec2 N = ivec2(uGrid);
    ivec2 ij = ivec2(floor(st * uGrid));
    ivec2 c0 = clamp(ij, ivec2(0), N - ivec2(1));
    vec4 f0 = texelFetch(uField, c0, 0);
    float uc = f0.r, up = f0.g, I = f0.b;

    float l = texelFetch(uField, ivec2(clamp(ij.x - 1, 0, N.x - 1), c0.y), 0).r;
    float r = texelFetch(uField, ivec2(clamp(ij.x + 1, 0, N.x - 1), c0.y), 0).r;
    float d = texelFetch(uField, ivec2(c0.x, clamp(ij.y - 1, 0, N.y - 1)), 0).r;
    float u = texelFetch(uField, ivec2(c0.x, clamp(ij.y + 1, 0, N.y - 1)), 0).r;

    float next = 2.0 * uc - up + uC2 * (l + r + d + u - 4.0 * uc);

    // 软波源:叠加正弦源项,对外行波近乎透明
    vec2 p = vec2(c0) + 0.5;
    for (int i = 0; i < 16; i++) {
      if (i >= uCount) break;
      if (uSrcB[i].z < 0.5) continue;
      vec2 sp = uSrcA[i].xy;
      float amp = uSrcA[i].z;
      float ph  = uSrcB[i].x;
      float type = uSrcB[i].y;
      float w;
      if (type < 0.5) {
        vec2 dv = p - sp;
        w = exp(-dot(dv, dv) / 9.0);          // 点源高斯窗 σ≈2.1
      } else {
        float dx = p.x - sp.x;
        w = exp(-dx * dx / 4.0);              // 竖直平面波条带 σ≈1.4
      }
      next += amp * sin(ph) * w;
    }

    vec2 m = texelFetch(uMask, c0, 0).rg;
    float edge = min(min(float(ij.x), float(ij.y)),
                     min(float(N.x - 1 - ij.x), float(N.y - 1 - ij.y)));
    if (uBound == 0) {
      // 吸收:速度阻尼海绵层(能量单调耗散,不会向场泵入能量)
      float s = 1.0 - smoothstep(0.0, uSpongeW, edge);
      next = uc + (next - uc) * (1.0 - 0.45 * s * s * s);
      if (edge < 0.5) {
        // 角点额外强阻尼(单向波公式在双轴角点不成立)
        next *= 0.5;
      }
    } else if (edge < 0.5) {
      // 反射:最外一圈刚性壁
      next = 0.0;
    }
    if (m.r > 0.5) {
      next = 0.0;                             // 反射墙:狄利克雷硬反射
    } else if (m.g > 0.5) {
      next = uc + (next - uc) * 0.4;          // 吸波墙:强速度阻尼,近似无反射软材料
    }

    // 软限幅:仅当幅度异常大(共振累积)时引入非线性阻尼,正常幅度下严格线性
    float an = abs(next);
    next *= 1.0 - 0.10 * smoothstep(0.8, 2.4, an);
    next = clamp(next, -4.0, 4.0);

    I = mix(I, next * next, 0.0045);          // |u|² 指数滑动平均,τ≈1.4s
    outColor = vec4(next, uc, I, 1.0);
  }`;

  // 渲染:波形场(散度配色)/ 强度场(inferno),叠加障碍与波源标记
  const FS_RENDER = `#version 300 es
  precision highp float;
  precision highp int;
  uniform sampler2D uField;
  uniform sampler2D uMask;
  uniform vec2  uGrid;
  uniform float uGain;
  uniform int   uView;    // 0 波形 / 1 强度
  uniform int   uPal;     // 0 深空 / 1 霓虹 / 2 冰蓝
  uniform float uT;
  uniform int   uCount;
  uniform int   uProbeOn;
  uniform vec2  uProbe;   // 探针位置(格坐标)
  uniform vec4  uSrcA[16];
  uniform vec4  uSrcB[16];
  uniform vec3  uSrcCol[16];
  in vec2 vUV;
  out vec4 outColor;

  vec3 palDeep(float v) {
    float a = pow(abs(v), 0.85);
    vec3 bg = vec3(0.012, 0.020, 0.048);
    vec3 tc = v > 0.0 ? vec3(0.20, 0.80, 1.00) : vec3(1.00, 0.50, 0.15);
    vec3 c = mix(bg, tc, smoothstep(0.0, 1.0, a));
    c += vec3(0.85, 0.92, 1.0) * smoothstep(0.55, 1.0, abs(v)) * 0.45;
    return c;
  }
  vec3 palNeon(float v) {
    float a = pow(abs(v), 0.9);
    vec3 tc = v > 0.0 ? vec3(0.10, 1.00, 0.75) : vec3(1.00, 0.25, 0.80);
    vec3 c = mix(vec3(0.010, 0.010, 0.030), tc, smoothstep(0.0, 1.0, a));
    c += vec3(1.0) * smoothstep(0.6, 1.0, abs(v)) * 0.35;
    return c;
  }
  vec3 palIce(float v) {
    float a = abs(v);
    vec3 c = vec3(0.012, 0.022, 0.050);
    c += vec3(0.10, 0.35, 0.75) * smoothstep(0.0, 1.0, a);
    c += vec3(0.75, 0.90, 1.0) * smoothstep(0.45, 1.0, a) * 0.9;
    return c;
  }
  vec3 palInferno(float x) {
    vec3 c = mix(vec3(0.005, 0.005, 0.030), vec3(0.30, 0.06, 0.42), smoothstep(0.0, 0.35, x));
    c = mix(c, vec3(0.90, 0.30, 0.20), smoothstep(0.32, 0.68, x));
    c = mix(c, vec3(1.00, 0.75, 0.15), smoothstep(0.62, 0.90, x));
    c = mix(c, vec3(1.00, 0.98, 0.85), smoothstep(0.88, 1.00, x));
    return c;
  }

  void main() {
    vec2 st = vec2(vUV.x, 1.0 - vUV.y);
    ivec2 N = ivec2(uGrid);
    ivec2 ij = ivec2(floor(st * uGrid));
    ivec2 c0 = clamp(ij, ivec2(0), N - ivec2(1));
    vec4 f = texelFetch(uField, c0, 0);
    vec4 mTex = texelFetch(uMask, c0, 0);   // 一次取回本格掩码,供下文 wall/m0 复用
    float wall = mTex.r;
    vec2 p = vec2(c0) + 0.5;

    vec3 col;
    if (uView == 0) {
      // tanh 软压缩:强驻波区不会硬裁剪成色块,弱条纹仍保持近线性响应
      float v = tanh(f.r * uGain);
      if (uPal == 0)      col = palDeep(v);
      else if (uPal == 1) col = palNeon(v);
      else                col = palIce(v);
    } else {
      // 强度用指数饱和映射,避免波源附近过曝压暗条纹
      float x = 1.0 - exp(-f.b * uGain * 4.0);
      col = palInferno(x);
    }

    // 障碍:反射墙 = 深板岩 + 边缘高光;吸波墙 = 深青绿软材料
    // (4 次邻域采样同时取 .rg,替代原先 8 次采样,渲染结果不变)
    vec2 m0 = mTex.rg;
    if (m0.r > 0.5 || m0.g > 0.5) {
      vec4 nL = texelFetch(uMask, ivec2(clamp(c0.x - 1, 0, N.x - 1), c0.y), 0);
      vec4 nR = texelFetch(uMask, ivec2(clamp(c0.x + 1, 0, N.x - 1), c0.y), 0);
      vec4 nD = texelFetch(uMask, ivec2(c0.x, clamp(c0.y - 1, 0, N.y - 1)), 0);
      vec4 nU = texelFetch(uMask, ivec2(c0.x, clamp(c0.y + 1, 0, N.y - 1)), 0);
      float nbR = nL.r + nR.r + nD.r + nU.r;
      float nbG = nL.g + nR.g + nD.g + nU.g;
      float edgeR = 1.0 - smoothstep(3.2, 3.9, nbR);
      float edgeG = 1.0 - smoothstep(3.2, 3.9, nbG);
      vec3 hard = mix(vec3(0.075, 0.095, 0.130), vec3(0.30, 0.38, 0.50), edgeR * 0.85);
      vec3 soft = mix(vec3(0.055, 0.100, 0.088), vec3(0.20, 0.46, 0.38), edgeG * 0.8);
      col = m0.r > 0.5 ? hard : soft;
    }

    // 探针:银白十字标记
    if (uProbeOn == 1) {
      vec2 dv = p - uProbe;
      float d = length(dv);
      float armH = (1.0 - smoothstep(0.4, 1.0, abs(dv.y))) * (1.0 - smoothstep(7.0, 9.5, d));
      float armV = (1.0 - smoothstep(0.4, 1.0, abs(dv.x))) * (1.0 - smoothstep(7.0, 9.5, d));
      col += vec3(0.93, 0.94, 0.96) * clamp(armH + armV, 0.0, 1.0) * 0.9;
      float pring = 1.0 - smoothstep(0.9, 2.2, abs(d - 10.5));
      col += vec3(0.93, 0.94, 0.96) * pring * 0.55;
    }

    // 轻微暗角
    vec2 q = vUV - 0.5;
    col *= 1.0 - 0.35 * dot(q, q);

    // 波源标记:发光核心 + 脉动圆环 / 平面波条带
    for (int i = 0; i < 16; i++) {
      if (i >= uCount) break;
      vec2 sp = uSrcA[i].xy;
      float type = uSrcB[i].y;
      float on   = uSrcB[i].z;
      float sel  = uSrcB[i].w;
      vec3 sc = uSrcCol[i];
      float vis = on > 0.5 ? 1.0 : 0.35;
      if (type < 0.5) {
        float d = length(p - sp);
        col += sc * exp(-d * d / 30.0) * 0.5 * vis;
        float ring = 1.0 - smoothstep(1.2, 2.6, abs(d - 6.0));
        float pulse = 0.8 + 0.2 * sin(uT * 3.0 + float(i) * 1.7);
        col += sc * ring * 0.85 * vis * pulse;
        if (sel > 0.5) {
          float d2 = abs(d - 11.0);
          float ang = atan(p.y - sp.y, p.x - sp.x);
          float dash = step(0.5, fract(ang * 2.2 + uT * 0.9));
          col += vec3(0.95) * (1.0 - smoothstep(0.8, 2.0, d2)) * dash * 0.9;
        }
      } else {
        float dx = abs(p.x - sp.x);
        col += sc * exp(-dx * dx / 60.0) * 0.16 * vis;
        float line = 1.0 - smoothstep(0.6, 1.8, dx);
        col += sc * line * 0.5 * vis;
      }
    }

    outColor = vec4(col, 1.0);
  }`;

  // 脉冲注入:高斯位移写入当前场(单 pass 读旧写新,不依赖混合)
  const FS_IMPULSE = `#version 300 es
  precision highp float;
  uniform sampler2D uField;
  uniform vec2 uGrid;
  uniform vec2 uCenter;
  uniform float uAmp;
  uniform float uSigma;
  in vec2 vUV;
  out vec4 outColor;
  void main() {
    vec2 st = vec2(vUV.x, 1.0 - vUV.y);
    ivec2 N = ivec2(uGrid);
    ivec2 ij = ivec2(floor(st * uGrid));
    ivec2 c0 = clamp(ij, ivec2(0), N - ivec2(1));
    vec4 f = texelFetch(uField, c0, 0);
    vec2 p = vec2(c0) + 0.5;
    vec2 dv = p - uCenter;
    float g = uAmp * exp(-dot(dv, dv) / (2.0 * uSigma * uSigma));
    outColor = vec4(f.r + g, f.g + g * 0.45, f.b, f.a);
  }`;

  // 观察屏几何(虚线屏线 + 银白剖面曲线):直接绘入 GL 画布,不依赖独立 2D 层
  const VS_LINE = `#version 300 es
  uniform vec2 uGrid;
  layout(location = 0) in vec2 aPos;   // 网格像素坐标(y 向下)
  void main() {
    vec2 c = vec2(aPos.x / uGrid.x * 2.0 - 1.0, 1.0 - aPos.y / uGrid.y * 2.0);
    gl_Position = vec4(c, 0.0, 1.0);
  }`;

  const FS_LINE = `#version 300 es
  precision highp float;
  uniform vec4 uColor;
  out vec4 outColor;
  void main() { outColor = uColor; }`;

  // 尺寸变化时搬运旧场/障碍(uMode 0 场直拷 / 1 障碍阈值化)
  const FS_COPY = `#version 300 es
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uSrcSize;
  uniform int uMode;
  in vec2 vUV;
  out vec4 outColor;
  void main() {
    vec2 st = vec2(vUV.x, 1.0 - vUV.y);
    ivec2 N = ivec2(uSrcSize);
    ivec2 c0 = clamp(ivec2(floor(st * uSrcSize)), ivec2(0), N - ivec2(1));
    vec4 v = texelFetch(uTex, c0, 0);
    if (uMode == 1) {
      // 阈值化搬运需分别保留 R(反射墙)与 G(吸波墙)两个通道,
      // 否则 resize 后吸波墙(G=1,R=0)会被误清为空场
      float wr = v.r > 0.5 ? 1.0 : 0.0;
      float wg = v.g > 0.5 ? 1.0 : 0.0;
      outColor = vec4(wr, wg, 0.0, 1.0);
    } else {
      outColor = v;
    }
  }`;

  /* ---------------- 模拟器 ---------------- */

  const TAU = Math.PI * 2;

  class WaveSim {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', {
        antialias: false, alpha: false, depth: false, stencil: false,
        powerPreference: 'high-performance',
      });
      if (!gl) throw new Error(WL.t('err.webgl2'));
      this.gl = gl;
      if (!gl.getExtension('EXT_color_buffer_float')) {
        throw new Error(WL.t('err.ext'));
      }

      this.sources = [];        // 由 UI 维护:{nx, ny, freq, amp, type, on, sel, phase, phase0, motion, color}
      this.C = 0.62;            // Courant 数
      this.bound = 0;           // 0 吸收 / 1 反射
      this.view = 0;            // 0 波形 / 1 强度
      this.pal = 0;
      this.gain = 2.0;
      this.t = 0;               // 模拟时间
      this.w = 0; this.h = 0;
      this.maskDirty = false;
      this.wallMaterial = 0;    // 0 反射墙 / 1 吸波墙
      this.probe = null;        // {nx, ny} 探针
      this.screen = { nx: 0.72, on: false }; // 观察屏位置(归一化)
      this._spongeW = Math.max(14, 540 * 0.11); // 海绵层宽度,随网格尺寸在 setSize 中更新

      this._quadVao = gl.createVertexArray();
      this._buildPrograms();
      this._pickFieldFormat();

      this.maskCanvas = document.createElement('canvas');
      this.setSize(960, 540);
    }

    _buildPrograms() {
      const gl = this.gl;
      this.progSim = WL.makeProgram(gl, WL.VS_QUAD, FS_SIM);
      this.progRender = WL.makeProgram(gl, WL.VS_QUAD, FS_RENDER);
      this.progImpulse = WL.makeProgram(gl, WL.VS_QUAD, FS_IMPULSE);
      this.progCopy = WL.makeProgram(gl, WL.VS_QUAD, FS_COPY);
      this.progLine = WL.makeProgram(gl, VS_LINE, FS_LINE);
      // 线绘制的动态顶点缓冲
      this._lineVao = gl.createVertexArray();
      this._lineBuf = gl.createBuffer();
    }

    /** 探测可渲染的浮点纹理格式:优先 RGBA32F,退回 RGBA16F */
    _pickFieldFormat() {
      const gl = this.gl;
      const test = (internal, type) => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, gl.RGBA, type, null);
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(fb);
        gl.deleteTexture(tex);
        return ok;
      };
      if (test(gl.RGBA32F, gl.FLOAT)) { this._fi = gl.RGBA32F; this._ft = gl.FLOAT; }
      else if (test(gl.RGBA16F, gl.HALF_FLOAT)) { this._fi = gl.RGBA16F; this._ft = gl.HALF_FLOAT; }
      else throw new Error(WL.t('err.float'));
      while (gl.getError() !== gl.NO_ERROR) {} // 格式探测期间产生的错误码在此清空
    }

    _makeFieldTex(w, h) {
      const gl = this.gl;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, this._fi, w, h, 0, gl.RGBA, this._ft, null);
      return tex;
    }

    _fboFor(tex) {
      const gl = this.gl;
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return fb;
    }

    _blit(prog, srcTex, srcW, srcH, dstFbo, dstW, dstH, mode) {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, dstFbo);
      gl.viewport(0, 0, dstW, dstH);
      gl.useProgram(prog.handle);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, srcTex);
      prog.u1i('uTex', 0);
      prog.u2f('uSrcSize', srcW, srcH);
      prog.u1i('uMode', mode);
      gl.bindVertexArray(this._quadVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /** 调整网格尺寸:旧波场与障碍通过一次 blit 搬运,波源为归一化坐标无需变换 */
    setSize(w, h) {
      if (this.w === w && this.h === h) return;
      const gl = this.gl;
      const first = !this.texA;
      const oldTexA = this.texA || null;
      const oldTexB = this.texB || null;
      const oldMaskTex = this.maskTex || null;
      const oldW = this.w, oldH = this.h;

      // 若障碍画布上有尚未上传的笔迹,先上传,保证下方 GPU 搬运取到最新掩码
      this.flushMask();

      this.canvas.width = w;
      this.canvas.height = h;

      const texA = this._makeFieldTex(w, h);
      const texB = this._makeFieldTex(w, h);
      const fboA = this._fboFor(texA);
      const fboB = this._fboFor(texB);
      if (!first && oldTexA) {
        this._blit(this.progCopy, oldTexA, oldW, oldH, fboA, w, h, 0);
        gl.clearColor(0, 0, 0, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
        gl.clear(gl.COLOR_BUFFER_BIT);
      } else {
        gl.clearColor(0, 0, 0, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboA);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }

      // 障碍画布(CPU 侧绘制,上传为纹理)。
      // 旧掩码随后由阈值化 blit 逐格全量覆盖,故无需再在 CPU 侧缩放旧画布。
      const mc = document.createElement('canvas');
      mc.width = w; mc.height = h;
      const ctx = mc.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      this.maskCanvas = mc;
      this.maskCtx = ctx;

      this.maskTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, mc);

      // 注意顺序:先 blit 再删旧纹理。若先删后 blit,旧纹理名可能被
      // createTexture 立即复用,造成"采样自渲染目标"的反馈回路。
      if (!first && oldMaskTex) {
        const maskFbo = this._fboFor(this.maskTex);
        this._blit(this.progCopy, oldMaskTex, oldW, oldH, maskFbo, w, h, 1);
        gl.deleteFramebuffer(maskFbo);
      }

      // 释放上一尺寸的全部 GPU 资源(搬运完成后)
      if (oldMaskTex) gl.deleteTexture(oldMaskTex);
      if (oldTexA) gl.deleteTexture(oldTexA);
      if (oldTexB) gl.deleteTexture(oldTexB);
      if (this.fboA) gl.deleteFramebuffer(this.fboA);
      if (this.fboB) gl.deleteFramebuffer(this.fboB);
      this.texA = texA; this.texB = texB;
      this.fboA = fboA; this.fboB = fboB;

      this._spongeW = Math.max(14, Math.min(w, h) * 0.11);
      this.w = w; this.h = h;
      this.maskDirty = false;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      while (gl.getError() !== gl.NO_ERROR) {} // 清理尺寸迁移期间的残留错误码
    }

    /* ---------- 障碍绘制(CPU 画布 → 纹理) ---------- */
    _markMask() { this.maskDirty = true; }
    _wallColor() { return this.wallMaterial === 1 ? '#00ff00' : '#ffffff'; }
    wallDot(x, y, r) {
      const c = this.maskCtx;
      c.fillStyle = this._wallColor();
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      this._markMask();
    }
    wallStroke(x0, y0, x1, y1, r) {
      const c = this.maskCtx;
      c.strokeStyle = this._wallColor();
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.lineWidth = r * 2;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      this._markMask();
    }
    eraseStroke(x0, y0, x1, y1, r) {
      const c = this.maskCtx;
      c.strokeStyle = '#000';
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.lineWidth = r * 2;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      this._markMask();
    }
    eraseDot(x, y, r) {
      const c = this.maskCtx;
      c.fillStyle = '#000';
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      this._markMask();
    }
    wallRect(x, y, w, h) {
      this.maskCtx.fillStyle = '#fff';
      this.maskCtx.fillRect(x, y, w, h);
      this._markMask();
    }
    clearWalls() {
      this.maskCtx.fillStyle = '#000';
      this.maskCtx.fillRect(0, 0, this.w, this.h);
      this._markMask();
    }
    flushMask() {
      if (!this.maskDirty) return;
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, this.maskCanvas);
      this.maskDirty = false;
    }

    /* ---------- 波源打包 ---------- */
    _packSources() {
      const S = this.sources;
      const n = Math.min(S.length, 16);
      if (!this._sa) { this._sa = new Float32Array(64); this._sb = new Float32Array(64); this._sc = new Float32Array(48); }
      this._sa.fill(0); this._sb.fill(0); this._sc.fill(0);
      for (let i = 0; i < n; i++) {
        const s = S[i];
        this._sa[i * 4] = s.nx * this.w;
        this._sa[i * 4 + 1] = s.ny * this.h;
        this._sa[i * 4 + 2] = s.amp;
        this._sb[i * 4] = (s.phase + (s.phase0 || 0)) % TAU;
        this._sb[i * 4 + 1] = s.type;
        this._sb[i * 4 + 2] = s.on ? 1 : 0;
        this._sb[i * 4 + 3] = s.sel ? 1 : 0;
        const c = s.color || [1, 1, 1];
        this._sc[i * 3] = c[0]; this._sc[i * 3 + 1] = c[1]; this._sc[i * 3 + 2] = c[2];
      }
      return n;
    }

    _bindFieldUniforms(prog) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texA);
      prog.u1i('uField', 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
      prog.u1i('uMask', 1);
      prog.u2f('uGrid', this.w, this.h);
    }

    /* ---------- 推进一个时间步 ---------- */
    step(dt) {
      const gl = this.gl;
      this.flushMask();
      const n = this._packSources();

      gl.bindVertexArray(this._quadVao);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB);
      gl.viewport(0, 0, this.w, this.h);
      const P = this.progSim;
      gl.useProgram(P.handle);
      this._bindFieldUniforms(P);
      P.u1f('uC2', this.C * this.C);
      P.u1f('uSpongeW', this._spongeW != null ? this._spongeW : Math.max(14, Math.min(this.w, this.h) * 0.11));
      P.u1i('uBound', this.bound);
      P.u1i('uCount', n);
      gl.uniform4fv(P.loc('uSrcA'), this._sa);
      gl.uniform4fv(P.loc('uSrcB'), this._sb);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // ping-pong 交换(纹理与 FBO 同步换,配对关系保持不变)
      let t = this.texA; this.texA = this.texB; this.texB = t;
      let f = this.fboA; this.fboA = this.fboB; this.fboB = f;

      this.t += dt;
      const dph = TAU * dt;
      // 热路径:索引循环替代 for...of(避免每子步创建数组迭代器)
      const srcs = this.sources;
      for (let i = 0; i < srcs.length; i++) {
        const s = srcs[i];
        // 运动波源(多普勒演示):归一化速度,范围边界往复
        if (s.motion) {
          const m = s.motion;
          s.nx += (m.ux || 0) * dt;
          s.ny += (m.uy || 0) * dt;
          if (m.minX != null && s.nx < m.minX) { s.nx = m.minX; m.ux = Math.abs(m.ux || 0); }
          if (m.maxX != null && s.nx > m.maxX) { s.nx = m.maxX; m.ux = -Math.abs(m.ux || 0); }
          if (m.minY != null && s.ny < m.minY) { s.ny = m.minY; m.uy = Math.abs(m.uy || 0); }
          if (m.maxY != null && s.ny > m.maxY) { s.ny = m.maxY; m.uy = -Math.abs(m.uy || 0); }
        }
        s.phase = (s.phase + s.freq * dph) % TAU;
      }
    }

    /** 注入一次高斯脉冲(石子落水) */
    impulse(cx, cy, amp, sigma) {
      const gl = this.gl;
      gl.bindVertexArray(this._quadVao);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB);
      gl.viewport(0, 0, this.w, this.h);
      const P = this.progImpulse;
      gl.useProgram(P.handle);
      this._bindFieldUniforms(P);
      P.u2f('uCenter', cx, cy);
      P.u1f('uAmp', amp);
      P.u1f('uSigma', sigma);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      let t = this.texA; this.texA = this.texB; this.texB = t;
      let f = this.fboA; this.fboA = this.fboB; this.fboB = f;
    }

    resetField() {
      const gl = this.gl;
      gl.clearColor(0, 0, 0, 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboB); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.t = 0;
      for (const s of this.sources) s.phase = 0;
    }

    /** 渲染到画布(画布后备存储即网格尺寸,CSS 负责平滑缩放) */
    render(realTime) {
      const gl = this.gl;
      gl.bindVertexArray(this._quadVao);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.w, this.h);
      const P = this.progRender;
      gl.useProgram(P.handle);
      this._bindFieldUniforms(P);
      P.u1f('uGain', this.gain);
      P.u1i('uView', this.view);
      P.u1i('uPal', this.pal);
      P.u1f('uT', realTime);
      P.u1i('uCount', this._packSources());
      if (this.probe) {
        P.u1i('uProbeOn', 1);
        P.u2f('uProbe', this.probe.nx * this.w, this.probe.ny * this.h);
      } else {
        P.u1i('uProbeOn', 0);
        P.u2f('uProbe', -100, -100);
      }
      gl.uniform4fv(P.loc('uSrcA'), this._sa);
      gl.uniform4fv(P.loc('uSrcB'), this._sb);
      gl.uniform3fv(P.loc('uSrcCol'), this._sc);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this._drawOverlayGeom(); // 观察屏几何与场同帧完成,合成器不会采到"只有场"的中间态
    }

    /* ---------- 测量回读(CPU 侧) ---------- */

    /** 读回前解除场纹理的采样绑定,避免反馈回路导致的 GL_INVALID_OPERATION */
    _unbindFieldSamplers() {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /** 读取探针处 (u, 时均强度)。仅当前场纹理 fboA 有效。 */
    readProbe(out) {
      if (!this.probe) return null;
      const gl = this.gl;
      const x = Math.min(this.w - 1, Math.max(0, Math.round(this.probe.nx * this.w)));
      const y = Math.min(this.h - 1, Math.max(0, Math.round(this.probe.ny * this.h)));
      this._unbindFieldSamplers();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.FLOAT, out);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return out;
    }

    /** 读取观察屏一列的 (u, 时均强度)。out 为 Float32Array(h*2):[u..., I...] */
    readScreenProfile(out) {
      const gl = this.gl;
      this._ensureColBuf();
      const x = Math.min(this.w - 1, Math.max(0, Math.round(this.screen.nx * this.w)));
      this._unbindFieldSamplers();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA);
      gl.readPixels(x, 0, 1, this.h, gl.RGBA, gl.FLOAT, this._colBuf);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const h = this.h;
      for (let i = 0; i < h; i++) {
        out[i] = this._colBuf[i * 4];
        out[h + i] = this._colBuf[i * 4 + 2];
      }
      return out;
    }

    _ensureColBuf() {
      if (!this._colBuf || this._colBuf.length !== this.h * 4) this._colBuf = new Float32Array(this.h * 4);
    }

    /**
     * 存储观察屏几何(由 UI 按帧回读后构建),render() 在场绘制完成后同帧叠加,
     * 保证合成器采样到的每一帧都同时包含场与几何。
     * dash: LINES 顶点对; curve: LINE_STRIP; fill: TRIANGLE_STRIP。
     * 各数组可为复用缓冲,配合 fillN/dashN/curveN 给出实际使用的元素个数;
     * 未提供计数字段时退回数组长度(兼容一次性分配的数组)。
     */
    setOverlayGeometry(g) { this._overlayGeom = g; }

    _drawOverlayGeom() {
      const g = this._overlayGeom;
      if (!g) return;
      const gl = this.gl;
      gl.bindVertexArray(this._lineVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._lineBuf);
      gl.enableVertexAttribArray(0);
      gl.useProgram(this.progLine.handle);
      this.progLine.u2f('uGrid', this.w, this.h);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      const nOf = (arr, cnt) => (cnt != null ? cnt : arr.length);
      if (g.fill && nOf(g.fill, g.fillN) > 1) {
        const n = nOf(g.fill, g.fillN);
        gl.bufferData(gl.ARRAY_BUFFER, g.fill, gl.DYNAMIC_DRAW, 0, n);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.uniform4f(this.progLine.loc('uColor'), 0.91, 0.91, 0.89, 0.14);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n / 2);
      }
      if (g.dash && nOf(g.dash, g.dashN) > 0) {
        const n = nOf(g.dash, g.dashN);
        gl.bufferData(gl.ARRAY_BUFFER, g.dash, gl.DYNAMIC_DRAW, 0, n);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.uniform4f(this.progLine.loc('uColor'), 1.0, 0.69, 0.33, 0.8);
        gl.drawArrays(gl.LINES, 0, n / 2);
      }
      if (g.curve && nOf(g.curve, g.curveN) > 1) {
        const n = nOf(g.curve, g.curveN);
        gl.bufferData(gl.ARRAY_BUFFER, g.curve, gl.DYNAMIC_DRAW, 0, n);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.uniform4f(this.progLine.loc('uColor'), 0.93, 0.94, 0.96, 0.92);
        gl.drawArrays(gl.LINE_STRIP, 0, n / 2);
      }
      gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
    }
  }

  WL.WaveSim = WaveSim;
})();
